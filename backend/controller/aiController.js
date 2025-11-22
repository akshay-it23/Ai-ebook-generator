// AI related controller for generating chapter content
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// @desc    Generate a chapter using AI
// @route   POST /api/ai/generate
// @access  Private (uses protect middleware)
exports.generateChapter = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const prompt = `Write a detailed book chapter on: ${title}`;

    const response = await client.chat.completions.create({
      model: "grok-beta",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.choices?.[0]?.message?.content || "";

    return res.json({
      success: true,
      content: result,
    });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ message: "AI Failed" });
  }
};


