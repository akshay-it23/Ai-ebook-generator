const express = require("express");
const router = express.Router();

const {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    updateBookCover,
} = require("../controller/bookController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMIddleware");

// Create + Get all books (User-specific)
router.route("/")
    .post(protect, createBook)
    .get(protect, getBooks);

// Get one book / Update / Delete
router.route("/:id")
    .get(protect, getBookById)
    .put(protect, updateBook)
    .delete(protect, deleteBook);

// Update book cover (upload)
router.route("/cover/:id")
    .put(protect, upload, updateBookCover);

module.exports = router;
