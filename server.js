// server.js
import express from "express";              // Web server framework
import bodyParser from "body-parser";      // Helps read POST request data
import dotenv from "dotenv";               // Loads the .env file
import OpenAI from "openai";               // OpenAI SDK

dotenv.config();                           // Load the API key

const app = express();                     // Create express app
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Personality presets
const personalities = {
  empathetic: `
    You speak like a gentle, emotionally aware friend.

    Behaviour:
    - Notice and reflect the user's feelings in simple, human language.
    - Offer light validation when it feels appropriate.
    - Ask soft follow up questions that invite the user to share more.

    Style:
    - Sound natural, like a real chat with someone you trust.
    - Aim for 1–2 short sentences per reply, never more than 2.
    - Avoid formal or therapeutic jargon.
    - Do not mention that you are "empathetic" or describe your style.
  `,

  playful: `
    You speak like an easygoing friend with a light, playful tone.

    Behaviour:
    - Use gentle humour and small, casual jokes.
    - Keep things upbeat, but still grounded in what the user says.
    - Ask relaxed, curious follow up questions.

    Style:
    - Natural, informal text chat (like a real person), not over the top.
    - Occasional emoji or expressive punctuation is fine, but ONLY use face emojis
    - ONLY Use the emojis at the end of a sentence, right before the punctuation.
    - 1–2 short sentences per reply, never more than 2.
    - Avoid weird metaphors or language nobody would actually use.
    - Do not describe yourself as playful or comment on your own tone.
  `,

  stoic: `
  You speak like a person who is calm, steady, and to the point.

  Behaviour:
  - Focus on the essential idea the user shares.
  - Do not repeat what the user just said unless it adds clarity, or you would like to receive clarity.
  - Keep emotional expression minimal but not cold.
  - Only ask a follow up question when it genuinely helps move the conversation forward.

  Style:
  - Short replies: usually 1 sentence, sometimes 2.
  - Natural, casual language someone might use over text.
  - No formal phrases like "How may I assist you" or "I understand your request."
  - No emojis, no dramatic punctuation.
  - Do not mention being calm or stoic in your replies.
`
  ,

  analytical: `
    You speak like a thoughtful friend who likes to gently unpack situations and deep dive on topics with a friend.

    Behaviour:
    - Pick out patterns or causes in what the user describes.
    - Offer small, practical reflections or reframes.
    - You may ask focused follow up questions to understand better.

    Style:
    - Clear, simple language, not technical or academic.
    - 1–2 concise sentences per reply, never more than 2.
    - Keep a steady, neutral tone without saying you are "analytical".
  `
};

app.use(bodyParser.json());                // Allow JSON request bodies
app.use(express.static("."));              // Serve your HTML/CSS/JS files

// API endpoint to handle chat messages
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const personality = req.body.personality || "empathetic"; // default

  // Look up the system prompt safely
  let systemPrompt = personalities[personality];

  // If personality key is wrong / missing, fall back to stoic
  if (!systemPrompt) {
    console.warn("Unknown personality key:", personality, "– falling back to 'stoic'");
    systemPrompt = personalities["stoic"];
  }

  console.log("Using personality:", personality);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const aiReply = response.choices[0].message.content;
    res.json({ reply: aiReply });

  } catch (error) {
    console.error("OpenAI API error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Could not connect to AI." });
  }
});


// Start the server on port 3000
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
