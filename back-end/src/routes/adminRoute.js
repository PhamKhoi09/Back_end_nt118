// routes/adminRoute.js
import express from "express";
import {
  getDashboardStats,
  getTopQuizzes,
  getCompletionRate,
  getDailyTraffic,
  updateAppVersion,
  getAllUsers,      
  updateUserStatus, 
  deleteUser,
  getUserActivityStats
} from "../controllers/adminController.js";
import {
  getAllQuizzes,
  getQuizDetail,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from "../controllers/adminQuizController.js";

const router = express.Router();
router.get("/stats/general", getDashboardStats); // Tổng quan
router.get("/stats/top-quizzes", getTopQuizzes); // Top quiz
router.get("/stats/completion-rate", getCompletionRate); // Biểu đồ tròn
router.get("/stats/traffic", getDailyTraffic); // Biểu đồ cột
router.post("/config/version", updateAppVersion);
router.get("/users", getAllUsers);           
router.patch("/users/:id", updateUserStatus); 
router.delete("/users/:id", deleteUser);
router.get("/users/activity-24h", getUserActivityStats);

router.get("/quizzes", getAllQuizzes);          // Lấy list quiz + stats
router.get("/quizzes/:id", getQuizDetail);      // Lấy chi tiết quiz + questions
router.post("/quizzes", createQuiz);            // Tạo quiz mới
router.patch("/quizzes/:id", updateQuiz);       // Sửa quiz
router.delete("/quizzes/:id", deleteQuiz);      // Xóa quiz

router.post("/questions", createQuestion);          // Tạo câu hỏi (kèm options/pairs)
router.put("/questions/:id", updateQuestion);       // Sửa câu hỏi (replace options)
router.delete("/questions/:id", deleteQuestion);    // Xóa câu hỏi
export default router;