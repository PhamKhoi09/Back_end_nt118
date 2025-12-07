import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/mongoDB.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import topicRoute from "./routes/topicRoute.js";
import { protectedRoute, adminAuthen } from "./middlewares/authMiddleware.js";
import { connectsupabase } from "./libs/posgre.js";
import wordRoute from "./routes/wordRoute.js";
import quizRoute from "./routes/quizRoute.js";
import adminRoute from "./routes/adminRoute.js"
import pronunciationRoute from "./routes/pronunciationRoute.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Updated for demo deployment
// middlewares
app.use(express.json()); // kiểm tra xem dữ liệu gửi qua có phải là json không
// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute); // Bất kỳ route nào khai báo SAU dòng này sẽ được bảo vệ

app.use("/api/users", userRoute);
app.use("/api/topics", topicRoute);
app.use("/api/words", wordRoute);
app.use("/api/topics", quizRoute);
app.use("/api/pronun",pronunciationRoute);
app.use(adminAuthen);
app.use("/api/admin", adminRoute);
connectDB().then(() => {
  // Thêm từ khóa 'async' vào đầu hàm này 👇
  connectsupabase().then(async () => {

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`server bắt đầu trên cổng ${PORT}`);
    });

  });
});