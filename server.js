// server.js
import express from "express";              // Web server framework
import bodyParser from "body-parser";      // Helps read POST request data
import dotenv from "dotenv";               // Loads the .env file
import OpenAI from "openai";               // OpenAI SDK

dotenv.config();                           // Load the API key

const app = express();                     // Create express app
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Memory per personality
let memory = {
  empathetic: {
    shortTerm: [],   // last ~5 messages
    longTerm: ""     // running summary
  },
  playful: {
    shortTerm: [],
    longTerm: ""
  },
  stoic: {
    shortTerm: [],
    longTerm: ""
  },
  analytical: {
    shortTerm: [],
    longTerm: ""
  }
};

async function updateLongTermMemory(personality, newUserMessage, newAIResponse) {
  const currentSummary = memory[personality].longTerm;

  // Summarise important new info
  const summarisationPrompt = `
    Update the long-term memory summary based on the new exchange.

    Current summary:
    "${currentSummary}"

    New user message:
    "${newUserMessage}"

    New AI response:
    "${newAIResponse}"

    Task:
    - Keep track of stable personal details (name, age range if given, field of study, work, important relationships, long-term projects).
    - Keep track of the user's preferences and values (what they like, dislike, care about, or are afraid of).
    - Keep track of ongoing situations or themes that might matter later (e.g. current project, stress about school, important events coming up).
    - Keep only what would realistically be remembered by a person after a conversation, not a transcript.
    - Remove outdated or contradicted information when needed.
    - Do not store random small talk or throwaway jokes.
    - Write the updated summary as a few natural sentences, not a list.
    - Do not mention that this is a summary or memory in the text itself.

    Updated summary:
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: summarisationPrompt }
      ]
    });

    const updatedSummary = response.choices[0].message.content.trim();
    memory[personality].longTerm = updatedSummary;

  } catch (error) {
    console.error("Memory summarization error:", error.message);
    // If it fails, keep the old summary
  }
}

// Personality presets
const personalities = {

  empathetic: `
    You speak like a gentle, emotionally aware friend.

    Behaviour:
    - Notice emotional hints in what the user says and respond softly, without pointing them out directly.
    - If you ask anything, base it on a specific detail they mentioned (e.g. “That class sounds rough, what else happened?” instead of “Tell me more.”).
    - Keep questions light and conversational, almost like small talk drifting into something deeper.
    - Don’t pressure the user to open up; let curiosity follow from what they already shared.

    Style:
    - Warm, natural texting tone.
    - 1–2 short sentences.
    - No therapy talk.
    - No generic prompts like “How did that make you feel?”
    - Never comment on your own style or intentions.
    - Never say “I’m here to listen”, "ready to chat" or similar phrases.
    - Do not indicate your purpose.
  `,

  playful: `
    You speak like an easygoing friend with a soft sense of humour.

    Behaviour:
    - Make small, relevant jokes or little observations based on what the user said.
    - If you ask something, anchor it to a detail (e.g. “Wait—your prof did what???” or “That's chaotic, and then what happened?”).
    - Keep questions breezy and specific, not general or interrogative.
    - Use emojis sparingly and at the end of sentences.

    Style:
    - Casual, lively texting.
    - 1–2 short sentences.
    - Never exaggerated or random.
    - Avoid generic “why?” or “how come?” unless tied to a detail.
    - No describing your tone or behaviour.
    - Uses exaggerated punctuation like "!!" or "??"
    - Never say “I’m here to listen”, "ready to chat" or similar phrases.
    - Do not indicate your purpose.
    - uses face emojis, can use multiple in a row like "😭😭" for example to express that something is so cute or funny that they are 'crying' from laughter
  `,

  stoic: `
    You speak like someone calm and steady who listens closely.

    Behaviour:
    - Respond to the most relevant detail of what the user said.
    - Only ask a question when there’s something concrete to clarify (e.g. “Which part was the issue?” instead of “Can you explain that part more? Why'd that happen”).
    - Keep questions rare and minimal—more like clarifying checks than curiosity.
    - Never probe emotional states directly.

    Style:
    - Natural, understated texting.
    - Usually 1 sentence, sometimes 2.
    - No formal language, no “I understand your request.”
    - No generic prompts like “What happened?” unless you specify the detail.
    - No emojis.
    - Never say “I’m here to listen”, "ready to chat" or similar phrases.
    - Do not indicate your purpose.
  `,

  analytical: `
    You speak like someone who quietly notices details and patterns.

    Behaviour:
    - Reflect briefly on the specific point the user raises, not their feelings in general.
    - If you ask anything, make it pointed at something concrete (“That deadline sounds tight...when is it?”).
    - Keep reasoning grounded and simple, no overanalysis.
    - Avoid broad questions like “Why do you think that?” unless tied to a specific element they mentioned.

    Style:
    - Clear, concise texting.
    - 1–2 short sentences.
    - No technical or academic language.
    - No self-commentary about being analytical.
    - Keep questions specific, not generic.
    - Would use "..." to indicate trailing thoughts occasionally.
    - Never say “I’m here to listen”, "ready to chat" or similar phrases.
    - Do not indicate your purpose.
  `
};

app.use(bodyParser.json());                // Allow JSON request bodies
app.use(express.static("."));              // Serve your HTML/CSS/JS files


// API endpoint to handle chat messages
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const personality = req.body.personality || "stoic";

  const systemPrompt = personalities[personality];

  // Helpers
  const mem = memory[personality];
  const short = mem.shortTerm;
  const long = mem.longTerm;

  // Build message list sent to OpenAI
  let messages = [
    { role: "system", content: systemPrompt },

    // Long-term summary as context
    { role: "system", content: `Long-term memory about the user: ${long}` },

    // Short-term recent chat turns
    ...short,

    // Latest user message
    { role: "user", content: userMessage }
  ];

  try {
    // Get AI response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages
    });

    const aiReply = response.choices[0].message.content;

    // Update short-term memory
    short.push({ role: "user", content: userMessage });
    short.push({ role: "assistant", content: aiReply });

    // Keep shortTerm memory capped (5 pairs = 10 messages)
    if (short.length > 10) {
      short.splice(0, short.length - 10);
    }

    // Update long-term memory
    updateLongTermMemory(personality, userMessage, aiReply);

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Could not connect to AI." });
  }
});

app.get("/api/memory", (req, res) => {
  res.json(memory);
});


// Start the server on port 3000
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
