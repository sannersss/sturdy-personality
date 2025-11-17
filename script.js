let currentPersonality = "empathetic"; // default personality

// Select HTML elements
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

// Define personality system text timings
const personalityTiming = {
  empathetic: 1200,     // slow, warm
  playful: 500,         // fast, energetic
  stoic: 200,           // very fast, almost instant
  analytical: 700       // steady, medium
};

// How many ms per character for each personality
const perCharTiming = {
  empathetic: 40,   // slower, like careful typing
  playful: 20,      // quick, energetic
  stoic: 15,        // efficient, minimal
  analytical: 30    // measured, thoughtful
};



// Listen for send button click
sendButton.addEventListener("click", sendMessage);

// Also send message when pressing Enter
userInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Function to send message to backend
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "") return;

  displayMessage(message, "user");
  userInput.value = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        personality: currentPersonality
      })
    });

    // If the server responded with an error (like 500)
    if (!response.ok) {
      console.error("Server error:", response.status);
      let errorData;
      try {
        errorData = await response.json();
        console.error("Server error body:", errorData);
      } catch (e) {
        console.error("Could not parse error body");
      }

      displayMessage("Error: server problem, no reply from AI.", "ai");
      return;
    }

    const data = await response.json();

    // Extra safety: make sure reply exists
    if (!data.reply) {
      console.error("No reply field in response:", data);
      displayMessage("Error: AI did not send a reply.", "ai");
      return;
    }

    handleAIResponse(data.reply);

  } catch (error) {
    displayMessage("Error: Could not connect to AI.", "ai");
    console.error(error);
  }
}

// Function to display messages in the chat box
function displayMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}

function setPersonality(p) {
  currentPersonality = p;
  console.log("Personality set to:", p);
}


// splits the text into smaller bubbles based on punctuation
function splitIntoBubbles(text) {
  // 1) Protect emojis so we don't split before them
  // We temporarily wrap punctuation+emoji in a token
  const protected = text.replace(/([.!?]+)\s*([😀-🙏])/gu, "$1§$2");

  // 2) Split on sentence endings:
  // - one or more punctuation marks that typically end a sentence
  // - followed by a space OR the end of string
  const parts = protected.split(/(?<=[.!?]+)\s+(?!§)/g);

  // 3) Restore tokens back to normal
  const restored = parts.map(part => part.replace(/§/g, " "));

  // 4) Trim and clean
  return restored
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function getDelayForBubble(bubbleText) {
  const base = personalityTiming[currentPersonality] || 500;
  const perChar = perCharTiming[currentPersonality] || 25;
  const length = bubbleText.length;

  // Total delay in ms
  return base + length * perChar;
}


async function handleAIResponse(replyText) {
  const bubbles = splitIntoBubbles(replyText);

  // If for some reason there is no text, do nothing
  if (bubbles.length === 0) return;

  // For each bubble:
  // - show typing
  // - wait based on text length and personality
  // - then show the bubble
  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];

    showTyping();

    const delay = getDelayForBubble(bubble);
    await new Promise(resolve => setTimeout(resolve, delay));

    hideTyping();
    displayMessage(bubble, "ai");
  }
}



// shows typing indicator
function showTyping() {
  document.getElementById("typingIndicator").classList.remove("hidden");
}

function hideTyping() {
  document.getElementById("typingIndicator").classList.add("hidden");
}

