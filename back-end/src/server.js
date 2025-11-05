import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import topicRoute from "./routes/topicRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { connectSQLite } from "./libs/sqlite.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Cấu hình CORS (nên đặt trước các routes)
// app.use(cors({
//   origin: [
//   process.env.CLIENT_URL,
//     //"http://localhost:5001",
// // IP này rất QUAN TRỌNG cho Android Emulator
//     // Bạn có thể cần thêm IP LAN của máy bạn, ví dụ: "http://192.168.1.10:5001"
//   ],
//   credentials: true 
//   // credentials: true vẫn có thể giữ lại, 
//   // dù không dùng cookie nhưng nó cần cho một số cấu hình CORS phức tạp.
//   // Nếu bạn không dùng cookie, có thể set là false.
// }));

// middlewares
app.use(express.json()); // kiểm tra xem dữ liệu gửi qua có phải là json không


// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute); // Bất kỳ route nào khai báo SAU dòng này sẽ được bảo vệ

// app.use("/api/users", userRoute); // <-- THAY ĐỔI: Bỏ comment dòng này
app.use("/api/users", userRoute); // <-- THAY ĐỔI: Bỏ comment dòng này
app.use("/api/topics", topicRoute);
connectDB().then(() => {
  connectSQLite().then(() => { // 👈 Sửa dòng này
    app.listen(PORT, "0.0.0.0", () => { // "0.0.0.0" là đúng để máy ảo có thể truy cập
      console.log(`server bắt đầu trên cổng ${PORT}`);
    });
  });
});