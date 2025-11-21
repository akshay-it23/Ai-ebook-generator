// controller/exportController.js
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
  ImageRun
} = require("docx");

const PDFDocument = require("pdfkit");
const MarkdownIt = require("markdown-it");
const sharp = require("sharp");

const Book = require("../models/Book");
const fs = require("fs");
const path = require("path");
const os = require("os");

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
    // fallthrough
  }
  return null;
};

/**
 * Convert simple markdown string to an array of docx Paragraphs.
 * - Handles headings (#, ##, ###), paragraphs and simple lists.
 * - Keeps it minimal but robust.
 */
const markdownToDocxParagraphs = (markdownText = "") => {
  const tokens = md.parse(markdownText || "", {});
  const paragraphs = [];

  let currentText = "";
  let currentStyle = null;

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
      // determine heading level in next token
      currentStyle = { heading: true, level: t.tag }; // e.g. h1/h2
    } else if (t.type === "heading_close") {
      currentStyle = null;
    } else if (t.type === "inline") {
      const text = t.content || "";
      if (currentStyle && currentStyle.heading) {
        // map h1/h2/h3 -> HeadingLevel
        const tag = currentStyle.level; // e.g. "h1"
        let headingLevel = HeadingLevel.HEADING_1;
        if (tag === "h2") headingLevel = HeadingLevel.HEADING_2;
        if (tag === "h3") headingLevel = HeadingLevel.HEADING_3;

        paragraphs.push(
          new Paragraph({
            text,
            heading: headingLevel,
            spacing: { after: 200 },
          })
        );
      } else {
        // normal paragraph or inline content
        pushParagraph(text);
      }
    } else if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
      // keep lists simple: collect list items until close
      // find following list items in tokens
      // (This minimal approach will print each list item in a paragraph prefixed)
    } else if (t.type === "list_item_open") {
      // next inline token will contain content
    } else if (t.type === "fence" || t.type === "code_block") {
      // code block -> monospaced run
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

  // Fallback: if markdown empty, return empty paragraph
  if (paragraphs.length === 0) paragraphs.push(new Paragraph({ text: "" }));

  return paragraphs;
};

/**
 * Convert simple markdown to plain text (for PDF).
 */
const markdownToPlainText = (mdText = "") => {
  // Using MarkdownIt to render HTML then stripping tags would be heavier.
  // Simpler: remove markdown markers and keep content lines.
  let text = mdText || "";
  // remove code fences
  text = text.replace(/```[\s\S]*?```/g, "");
  // strip headings markers
  text = text.replace(/^#{1,6}\s+/gm, "");
  // strip bold/italic markers
  text = text.replace(/(\*\*|__|\*|_)/g, "");
  // convert list markers to bullets
  text = text.replace(/^\s*[-*+]\s+/gm, "• ");
  // collapse multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/**
 * Prepare a temporary image buffer resized for embedding in PDF/DOCX.
 * Returns buffer or null.
 */
const prepareImageBuffer = async (imgPath, maxWidth = 800) => {
  try {
    const buf = safeReadFile(imgPath);
    if (!buf) return null;
    const resized = await sharp(buf).resize({ width: maxWidth, withoutEnlargement: true }).png().toBuffer();
    return resized;
  } catch (err) {
    return null;
  }
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

    // Build docx document
    const doc = new Document({
      sections: [],
    });

    // Cover section
    const coverChildren = [];

    // If coverImage exists and is a local path (starts with '/'), embed it
    if (book.coverImage && (book.coverImage.startsWith("/") || book.coverImage.startsWith("./") || book.coverImage.startsWith("uploads"))) {
      const localPath = path.join(process.cwd(), book.coverImage.startsWith("/") ? book.coverImage.substring(1) : book.coverImage);
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

    // Title, subtitle and author
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

    doc.addSection({ children: coverChildren.concat([new Paragraph({ children: [new PageBreak()] })]) });

    // Chapters section
    const chapterChildren = [];
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      // Chapter title
      chapterChildren.push(
        new Paragraph({
          text: ch.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      // If description contains an image link pointing to local file we attempt to embed first image
      // (simple heuristic)
      const imgRegex = /!\[.*?\]\((.*?)\)/;
      const match = (ch.description || "").match(imgRegex);
      if (match && match[1]) {
        let imgPath = match[1];
        // if path relative remove leading '/'
        if (imgPath.startsWith("/")) imgPath = imgPath.substring(1);
        const imgAbs = path.join(process.cwd(), imgPath);
        const imgBuf = safeReadFile(imgAbs);
        if (imgBuf) {
          chapterChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBuf,
                  transformation: { width: 350, height: 200 },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        }
      }

      // Convert description markdown to paragraphs
      const pgs = markdownToDocxParagraphs(ch.description || "");
      pgs.forEach((p) => chapterChildren.push(p));

      // Page break after each chapter except last
      if (i < book.chapters.length - 1) {
        chapterChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    doc.addSection({ children: chapterChildren });

    // Finalize and send buffer
    const buffer = await Packer.toBuffer(doc);

    const safeFileName = book.title.replace(/[^\w\-_. ]/g, "_").slice(0, 200) || "book";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}.docx"`);
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
    const filename = `${book.title.replace(/[^\w\-_. ]/g, "_").slice(0, 200) || "book"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Title page
    doc.addPage({ size: "A4", margin: 72 });
    doc.fontSize(28).text(book.title, { align: "center" });
    doc.moveDown(0.5);
    if (book.subtitle) doc.fontSize(18).text(book.subtitle, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`By ${book.author}`, { align: "center" });

    // Cover image if available and local
    if (book.coverImage && (book.coverImage.startsWith("/") || book.coverImage.startsWith("uploads") || book.coverImage.startsWith("./"))) {
      let imgPath = book.coverImage;
      if (imgPath.startsWith("/")) imgPath = imgPath.substring(1);
      const abs = path.join(process.cwd(), imgPath);
      const buf = safeReadFile(abs);
      if (buf) {
        // Prepare a resized buffer for pdfKit
        try {
          const resized = await sharp(buf).resize({ width: 400, withoutEnlargement: true }).png().toBuffer();
          // Put image centered
          const x = (doc.page.width - 400) / 2;
          doc.image(resized, x, doc.y + 10, { width: 400 });
          doc.moveDown(1.5);
        } catch (err) {
          // ignore image errors
        }
      }
    }

    // Add an empty page after cover
    doc.addPage();

    // For each chapter, write title and content
    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      doc.fontSize(18).fillColor("black").text(ch.title, { underline: true });
      doc.moveDown(0.5);

      const plain = markdownToPlainText(ch.description || "");
      // Write paragraph with line wrapping
      doc.fontSize(12).fillColor("black").text(plain, { align: "left", paragraphGap: 6 });

      if (i < book.chapters.length - 1) doc.addPage();
    }

    doc.end();
  } catch (error) {
    console.error("PDF Export error:", error);
    // If headers not sent, send error
    if (!res.headersSent) {
      return res.status(500).json({ message: "Export failed" });
    } else {
      // if streaming started, just destroy
      try { res.end(); } catch (e) {}
    }
  }
};

// Optional convenience: export both (zip) could be added later
