require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");

const aiRoutes = require("./routes/aiRoute.js");
const exportRoutes = require("./routes/exportRoute.js");
const authRoutes = require("./routes/authRoute.js");
const bookRoutes = require("./routes/bookRoute.js");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/backend/uploads", express.static(path.join(__dirname, "uploads")));


connectDB();


app.use("/api/ai", aiRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/book", bookRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server is running on port ${PORT}`)
);
