// routes/wordRoute.js
import express from "express";
import { getWordDetails } from "../controllers/wordController.js";

const router = express.Router();

// API 3: GET /api/words/:id
router.get("/:id", getWordDetails);


export default router;