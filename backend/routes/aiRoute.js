const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { generateChapter } = require("../controller/aiController");

const router = express.Router();

// POST /api/ai/generate
router.post("/generate", protect, generateChapter);

module.exports = router;


