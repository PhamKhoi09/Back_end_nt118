// routes/adminRoute.js
import express from "express";
import {
  getDashboardStats,
  getTopQuizzes,
  getCompletionRate,
  getDailyTraffic,
  updateAppVersion
} from "../controllers/adminController.js";

const router = express.Router();

// Middleware kiểm tra quyền Admin (bạn có thể viết sau, tạm thời để trống)
// const verifyAdmin = (req, res, next) => { /* Logic check req.user.role === 'admin' */ next(); }

// router.use(verifyAdmin); // Áp dụng cho tất cả route bên dưới

router.get("/stats/general", getDashboardStats); // Tổng quan
router.get("/stats/top-quizzes", getTopQuizzes); // Top quiz
router.get("/stats/completion-rate", getCompletionRate); // Biểu đồ tròn
router.get("/stats/traffic", getDailyTraffic); // Biểu đồ cột
router.post("/config/version", updateAppVersion);

export default router;