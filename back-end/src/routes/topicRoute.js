// routes/topicRoute.js
import express from "express";
import { getAllTopicsForUser } from "../controllers/topicController.js";
import { getFlashcardsForTopic } from "../controllers/topicController.js";
const router = express.Router();
router.get("/", getAllTopicsForUser);
router.get("/:id/flashcards", getFlashcardsForTopic);
export default router;