import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import topicRoute from "./routes/topicRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import { connectSQLite } from "./libs/sqlite.js";
import wordRoute from "./routes/wordRoute.js";
import quizRoute from "./routes/quizRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// middlewares
app.use(express.json()); // kiểm tra xem dữ liệu gửi qua có phải là json không
// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute); // Bất kỳ route nào khai báo SAU dòng này sẽ được bảo vệ

app.use("/api/users", userRoute); // <-- THAY ĐỔI: Bỏ comment dòng này
app.use("/api/topics", topicRoute);
app.use("/api/words", wordRoute);
app.use("/api/topics", quizRoute);
connectDB().then(() => {
  connectSQLite().then(() => {
    app.listen(PORT, "0.0.0.0", () => { // "0.0.0.0" là đúng để máy ảo có thể truy cập
      console.log(`server bắt đầu trên cổng ${PORT}`);
    });
  });
});