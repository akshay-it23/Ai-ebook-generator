const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { exportAsDocx, exportAsPdf } = require("../controller/exportController");

const router = express.Router();

// Export book as DOCX
// GET /api/export/docx/:id
router.get("/docx/:id", protect, exportAsDocx);

// Export book as PDF
// GET /api/export/pdf/:id
router.get("/pdf/:id", protect, exportAsPdf);

module.exports = router;


