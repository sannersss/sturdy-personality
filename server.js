// server.js
import express from "express";              // Web server framework
import bodyParser from "body-parser";      // Helps read POST request data
import dotenv from "dotenv";               // Loads the .env file
import OpenAI from "openai";               // OpenAI SDK

dotenv.config();                           // Load the API key

const app = express();                     // Create express app
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(bodyParser.json());                // Allow JSON request bodies
app.use(express.static("."));              // Serve your HTML/CSS/JS files

// API endpoint to handle chat messages
app.post("/api/chat", async (req, res) => {
    const userMessage = req.body.message;    // Message from frontend

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",                // Fast and cheap model for chatting
            //   messages: [
            //     { role: "system", content: "You are a friendly chatbot." },
            //     { role: "user", content: userMessage }
            //   ]
            messages: [
                { role: "system", content: "You are a warm, emotionally intelligent friend who uses soft, human-like language." },
                { role: "user", content: userMessage }
            ]
        });

        const aiReply = response.choices[0].message.content;
        res.json({ reply: aiReply });          // Send reply back to frontend
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong." });
    }
});

// Start the server on port 3000
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
