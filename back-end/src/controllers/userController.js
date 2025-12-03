// Thêm 2 import này ở đầu file
import bcrypt from "bcrypt";
import Session from "../models/Session.js";
// Import model User của bạn (đã có sẵn)
import User from "../models/User.js";
import AppRating from "../models/AppRating.js";

// --- THÊM HÀM MỚI SAU ĐÂY ---

export const deleteAccount = async (req, res) => {
  try {
    // 1. Lấy ID từ middleware và password từ body
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ message: "Cần cung cấp mật khẩu để xác nhận" });
    }

    // 2. Tìm user trong CSDL
    const user = await User.findById(userId);
    if (!user) {
      // Trường hợp hiếm gặp (token hợp lệ nhưng user đã bị xoá)
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    // 3. Xác thực lại mật khẩu
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Mật khẩu không chính xác." });
    }

    // 4. (Rất quan trọng) Xoá tất cả dữ liệu liên quan
    // NẾU BẠN LƯU AVATAR LÊN CLOUDINARY, HÃY XOÁ NÓ TRƯỚC
    // if (user.avatarId) {
    //   await cloudinary.uploader.destroy(user.avatarId);
    // }

    // Xoá tất cả các Session (refresh tokens) của user
    await Session.deleteMany({ userId: userId });

    // (QUAN TRỌNG) XOÁ TẤT CẢ DỮ LIỆU KHÁC CỦA USER
    // Ví dụ: Xoá tất cả flashcards, quiz... mà user này đã tạo
    // await Flashcard.deleteMany({ userId: userId });
    // await QuizResult.deleteMany({ userId: userId });
    // ... thêm các lệnh xoá khác tại đây ...

    // 5. Xoá chính user đó
    await User.findByIdAndDelete(userId);

    // 6. Trả về 204 No Content (Xoá thành công)
    return res.sendStatus(204);

  } catch (error) {
    console.error("Lỗi khi gọi deleteAccount", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    // 1. Lấy ID từ middleware và dữ liệu từ body
    const userId = req.user._id;
    const { currentPassword, newUsername, newPassword } = req.body;

    // 2. Kiểm tra bắt buộc: Phải có mật khẩu cũ
    if (!currentPassword) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp mật khẩu hiện tại để cập nhật" });
    }

    // 3. Kiểm tra xem có gì để cập nhật không
    if (!newUsername && !newPassword) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào cần cập nhật" });
    }

    // 4. Lấy user và xác thực mật khẩu cũ
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const passwordCorrect = await bcrypt.compare(
      currentPassword,
      user.hashedPassword
    );

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    let updated = false;

    // 5. Xử lý cập nhật Username (nếu có)
    if (newUsername && newUsername !== user.username) {
      // Kiểm tra username mới đã tồn tại chưa
      const duplicate = await User.findOne({ username: newUsername });
      if (duplicate && duplicate._id.toString() !== userId) {
        return res.status(409).json({ message: "Username này đã tồn tại" });
      }
      user.username = newUsername;
      updated = true;
    }

    // 6. Xử lý cập nhật Mật khẩu (nếu có)
    if (newPassword) {
      user.hashedPassword = await bcrypt.hash(newPassword, 10);
      updated = true;
    }

    // 7. Lưu thay đổi
    if (updated) {
      await user.save();
    }

    // 8. Trả về user object đã cập nhật (trừ password)
    const updatedUser = user.toObject();
    delete updatedUser.hashedPassword;

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Lỗi khi gọi updateUserProfile", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
// ❗️ API MỚI: Gửi đánh giá ứng dụng
export const submitAppRating = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rating, comment } = req.body;

    // Validate
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Vui lòng đánh giá từ 1 đến 5 sao." });
    }

    // Tìm và cập nhật (hoặc tạo mới nếu chưa có)
    const review = await AppRating.findOneAndUpdate(
      { userId: userId }, // Điều kiện tìm
      { rating: rating, comment: comment }, // Dữ liệu update
      { new: true, upsert: true } // Tùy chọn: trả về doc mới, tạo nếu chưa có
    );

    return res.status(200).json({ message: "Cảm ơn bạn đã đánh giá!", data: review });

  } catch (error) {
    console.error("Lỗi submitAppRating:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};