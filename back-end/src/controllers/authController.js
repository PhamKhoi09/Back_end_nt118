// @ts-nocheck
import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

// ... hàm signUp không đổi ...
export const signUp = async (req, res) => {
  try {
    const { username, password, email} = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, email",
      });
    }

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username });

    if (duplicate) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); 
    // salt = 10.. số lần bcrypt sẽ thực hiện việc mã hóa việc lặp đi lặp lại để tạo ra kết quả cuối cùng,
    // trước khi tiến hành mã hóa, bcrypt sẽ tạo ra một chuỗi ngẫu nhiên gọi là salt, 
    // trộm salt này với pw gốc sau đó mới bắt đầu quá trình mã hóa nhiều vòng, 
    // nhờ có salt mà kể cả khi 2 user có cùng pw thì chuỗi hash cuối cùng vẫn khác nhau,
    // salt=10 là thực hiện 2 mũ 10 lần (thường là 10 hoặc 12) 200ms cho 1 lần mã hóa, vs 12 thì gấp 4 lần

    // tạo user mới
    await User.create({
      username,
      hashedPassword,
      email,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


export const signIn = async (req, res) => {
  try {
    // ... (phần kiểm tra username, password không đổi) ...
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      // @ts-ignore
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // Xoá cookie
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "none",
    //   maxAge: REFRESH_TOKEN_TTL,
    // });

    // Trả cả 2 token về trong JSON body
    return res
      .status(200)
      .json({ 
        message: `User ${user.username} đã logged in!`, // Sửa thành username cho nhất quán
        accessToken,
        refreshToken // <-- THAY ĐỔI: Thêm refreshToken vào đây
      });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    // Lấy refresh token từ JSON body thay vì cookie
    const { refreshToken } = req.body; // <-- THAY ĐỔI

    if (refreshToken) {
      // xoá refresh token trong Session
      await Session.deleteOne({ refreshToken: refreshToken }); // <-- THAY ĐỔI

      // xoá cookie (không cần nữa)
      // res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ JSON body thay vì cookie
    const { refreshToken: token } = req.body; // <-- THAY ĐỔI

    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // so với refresh token trong db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // kiểm tra hết hạn chưa
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ refreshToken: token }); // Xoá session hết hạn
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // tạo access token mới
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};