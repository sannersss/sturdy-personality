// Select HTML elements
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

// Listen for send button click
sendButton.addEventListener("click", sendMessage);

// Also send message when pressing Enter
userInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const message = userInput.value.trim(); // Get text from input
    if (message === "") return; // Stop if empty input

    // Display user's message
    displayMessage(message, "user");

    // Clear the input field
    userInput.value = "";

    // Simulate AI reply (for now)
    setTimeout(() => {
        const aiReply = generateAIReply(message);
        displayMessage(aiReply, "ai");
    }, 800); // 800ms delay to simulate thinking
}

// Function to display messages in the chat box
function displayMessage(text, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to latest message
}

// Placeholder AI logic — you’ll replace this later with a real AI API
function generateAIReply(userMessage) {
    // Very simple simulated responses
    const responses = [
        "Interesting! Tell me more.",
        "Why do you think that?",
        "That’s really cool!",
        "I see what you mean.",
        "Hmm… could you explain that a bit?"
    ];
    // Pick a random one
    return responses[Math.floor(Math.random() * responses.length)];
}
