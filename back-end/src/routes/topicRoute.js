// routes/topicRoute.js
import express from "express";
import { 
  getAllTopicsForUser, 
  getFlashcardsForTopic,
  getWordsForTopic // 👈 THÊM DÒNG NÀY
} from "../controllers/topicController.js";
const router = express.Router();
router.get("/", getAllTopicsForUser);
router.get("/:id/flashcards", getFlashcardsForTopic);
router.get("/:id/words", getWordsForTopic);
export default router;