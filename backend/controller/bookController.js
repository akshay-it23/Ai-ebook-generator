// controller/aiController.js

import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
});

// Generate Chapter Content using Grok
export const generateChapterContent = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Chapter title is required" });
        }

        const prompt = `
            Write a detailed book chapter:
            Title: ${title}
            Description: ${description || "Not provided"}
            Style: Clear, structured, engaging, with headings.
        `;

        const response = await client.chat.completions.create({
            model: "grok-beta",
            messages: [
                { role: "user", content: prompt }
            ],
        });

        const text = response.choices[0].message.content;

        res.json({
            title,
            description,
            content: text,
        });

    } catch (error) {
        console.error("Grok Error:", error);
        res.status(500).json({ message: "AI generation failed" });
    }
};
