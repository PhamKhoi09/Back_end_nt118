// routes/quizRoute.js
import express from "express";
import { getQuizByTopicId, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

// Endpoint: /api/topics/:id/quiz
// (Lưu ý: trong server.js chúng ta sẽ mount router này ở /api/topics)
router.get("/:id/quiz", getQuizByTopicId);
router.post("/:id/quiz/submit", submitQuiz);
export default router;