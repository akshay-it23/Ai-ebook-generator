const Book = require("../models/Book");

// @desc    Create a new book
// @route   POST /api/book
// @access  Private
exports.createBook = async (req, res) => {
  try {
    const { title, subtitle, author, description, chapters, status } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    const book = await Book.create({
      userID: req.user._id,
      title,
      subtitle: subtitle || "",
      author,
      coverImage: "",
      chapters: Array.isArray(chapters) ? chapters : [],
      status: status || "draft",
    });

    return res.status(201).json(book);
  } catch (error) {
    console.error("Create Book Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all books for logged-in user
// @route   GET /api/book
// @access  Private
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userID: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(books);
  } catch (error) {
    console.error("Get Books Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get a single book
// @route   GET /api/book/:id
// @access  Private
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      userID: req.user._id,
    });

    if (!book) return res.status(404).json({ message: "Book not found" });

    return res.json(book);
  } catch (error) {
    console.error("Get Book Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update book
// @route   PUT /api/book/:id
// @access  Private
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userID: req.user._id },
      req.body,
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    return res.json(book);
  } catch (error) {
    console.error("Update Book Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete book
// @route   DELETE /api/book/:id
// @access  Private
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      userID: req.user._id,
    });

    if (!book) return res.status(404).json({ message: "Book not found" });

    return res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete Book Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update Book Cover with Multer
// @route   PUT /api/book/cover/:id
// @access  Private
exports.updateBookCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, userID: req.user._id },
      { coverImage: imagePath },
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    return res.json(book);
  } catch (error) {
    console.error("Update Cover Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


