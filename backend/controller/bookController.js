const Book = require("../models/bookModel");

// Create a new book
exports.createBook = async (req, res) => {
  try {
    const { title, description, content } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const book = await Book.create({
      title,
      description,
      content,
      user: req.user._id, // from protect middleware
    });

    res.status(201).json(book);
  } catch (error) {
    console.error("Create Book Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all books for logged-in user
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get Books Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get a single book
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (error) {
    console.error("Get Book Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update book
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (error) {
    console.error("Update Book Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete Book Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Book Cover with Multer
exports.updateBookCover = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { coverImage: imagePath },
      { new: true }
    );

    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (error) {
    console.error("Update Cover Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
