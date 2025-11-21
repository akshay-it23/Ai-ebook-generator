import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { generateChapter } from "../controller/aiController.js";

const router = express.Router();

router.post("/generate", protect, generateChapter);

export default router;
