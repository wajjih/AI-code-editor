import cors from "cors";
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(
  cors({
    origin: "http://localhost:8000", // Allow requests from this origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function sendMessageToAI(message, model) {
  try {
    let apiUrl, headers, body;

    if (model === "deepseek-chat" || model === "google/gemini-flash") {
      // OpenRouter API for DeepSeek, Gemini, and other OpenRouter models
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      };

      // Map model names to OpenRouter model IDs
      const modelMapping = {
        "deepseek-chat": "deepseek/deepseek-r1:free",
        "google/gemini-flash": "google/gemini-2.0-flash-thinking-exp:free",
      };

      body = JSON.stringify({
        model: modelMapping[model], // Use the mapped model ID
        messages: [
          {
            role: "system",
            content:
              "You are a helpful coding assistant. Explain code, debug, and provide suggestions.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
    } else {
      // OpenAI API (fallback for GPT-3.5 and GPT-4)
      apiUrl = "https://api.openai.com/v1/chat/completions";
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      };
      body = JSON.stringify({
        model: model, // e.g., "gpt-3.5-turbo" or "gpt-4"
        messages: [
          {
            role: "system",
            content:
              "You are a helpful coding assistant. Explain code, debug, and provide suggestions.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error communicating with AI:", error);
    return "Sorry, I couldn't process your request.";
  }
}

app.post("/api/ai", async (req, res) => {
  try {
    const { message, model } = req.body;
    const aiResponse = await sendMessageToAI(message, model);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in /api/ai endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
