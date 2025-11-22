// DOCX + PDF export controller
// Requires: docx, pdfkit, markdown-it, sharp, fs, path
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
} = require("docx");

const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const sharp = require("sharp");

const Book = require("../models/Book");
const fs = require("fs");
const path = require("path");

const md = new MarkdownIt();

// Helpers -----------------------------------------------------------------

/**
 * Safely read file as Buffer. Returns null if not found.
 */
const safeReadFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch (err) {
    // ignore
  }
  return null;
};

/**
 * Convert simple markdown string to an array of docx Paragraphs.
 */
const markdownToDocxParagraphs = (markdownText = "") => {
  const tokens = md.parse(markdownText || "", {});
  const paragraphs = [];

  const pushParagraph = (text, opts = {}) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: text || "", ...opts })],
        spacing: { after: 200 },
      })
    );
  };

  tokens.forEach((t) => {
    if (t.type === "heading_open") {
      // handled in next inline token
    } else if (t.type === "inline") {
      const text = t.content || "";
      if (!text) return;
      pushParagraph(text);
    } else if (t.type === "fence" || t.type === "code_block") {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: t.content || "",
              font: "Courier New",
              size: 20,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ text: "" }));
  }

  return paragraphs;
};

/**
 * Convert simple markdown to plain text (for PDF).
 */
const markdownToPlainText = (mdText = "") => {
  let text = mdText || "";
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/(\*\*|__|\*|_)/g, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
};

// DOCX Export --------------------------------------------------------------

/**
 * Export book as DOCX and stream buffer to client.
 */
exports.exportAsDocx = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);

    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.userID.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doc = new Document({
      sections: [],
    });

    // Cover section
    const coverChildren = [];

    if (
      book.coverImage &&
      (book.coverImage.startsWith("/") ||
        book.coverImage.startsWith("./") ||
        book.coverImage.startsWith("uploads"))
    ) {
      const localPath = path.join(
        process.cwd(),
        book.coverImage.startsWith("/")
          ? book.coverImage.substring(1)
          : book.coverImage
      );
      const imgBuf = safeReadFile(localPath);
      if (imgBuf) {
        coverChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBuf,
                transformation: { width: 400, height: 400 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
      }
    }

    coverChildren.push(
      new Paragraph({
        children: [new TextRun({ text: book.title, bold: true, size: 56 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    if (book.subtitle) {
      coverChildren.push(
        new Paragraph({
          children: [new TextRun({ text: book.subtitle, italics: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
    }

    coverChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `By ${book.author}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    doc.addSection({
      children: coverChildren.concat([
        new Paragraph({ children: [new PageBreak()] }),
      ]),
    });

    // Chapters
    const chapterChildren = [];
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];

      chapterChildren.push(
        new Paragraph({
          text: ch.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      const pgs = markdownToDocxParagraphs(ch.description || "");
      pgs.forEach((p) => chapterChildren.push(p));

      if (i < book.chapters.length - 1) {
        chapterChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    doc.addSection({ children: chapterChildren });

    const buffer = await Packer.toBuffer(doc);

    const safeFileName =
      book.title.replace(/[^\w\-_. ]/g, "_").slice(0, 200) || "book";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}.docx"`
    );
    return res.send(buffer);
  } catch (error) {
    console.error("DOCX Export error:", error);
    return res.status(500).json({ message: "Export failed" });
  }
};

// PDF Export ---------------------------------------------------------------

/**
 * Export book as PDF and stream to client.
 */
exports.exportAsPdf = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);

    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.userID.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doc = new PDFDocument({ autoFirstPage: false });
    const filename = `${
      book.title.replace(/[^\w\-_. ]/g, "_").slice(0, 200) || "book"
    }.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Title page
    doc.addPage({ size: "A4", margin: 72 });
    doc.fontSize(28).text(book.title, { align: "center" });
    doc.moveDown(0.5);
    if (book.subtitle)
      doc.fontSize(18).text(book.subtitle, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`By ${book.author}`, { align: "center" });

    // Chapters
    doc.addPage();
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      doc.fontSize(18).fillColor("black").text(ch.title, { underline: true });
      doc.moveDown(0.5);

      const plain = markdownToPlainText(ch.description || "");
      doc
        .fontSize(12)
        .fillColor("black")
        .text(plain, { align: "left", paragraphGap: 6 });

      if (i < book.chapters.length - 1) doc.addPage();
    }

    doc.end();
  } catch (error) {
    console.error("PDF Export error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Export failed" });
    } else {
      try {
        res.end();
      } catch (_) {}
    }
  }
};
