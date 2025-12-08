import express from "express";
import {
  deleteAccount,
  updateUserProfile,
  submitAppRating,
  updateUserStreak
} from "../controllers/userController.js";

const router = express.Router();

router.delete("/me/delete", deleteAccount);
router.patch("/me/update", updateUserProfile);
router.post("/rate-app", submitAppRating);
router.post("/streak", updateUserStreak);
export default router;