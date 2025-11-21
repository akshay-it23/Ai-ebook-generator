//ai related all information sb store hote
// controller/aiController.js

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// Generate basic chapter
export const generateChapter = async (req, res) => {
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

    const result = response.choices[0].message.content;

    res.json({
      success: true,
      content: result,
    });

  } catch (error) {
    console.log("AI Error:", error);
    res.status(500).json({ message: "AI Failed" });
  }
};
