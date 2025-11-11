import express from "express";
import {
  deleteAccount,
  updateUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.delete("/me", deleteAccount);

router.patch("/me", updateUserProfile);

export default router;