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
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    displayMessage(data.reply, "ai");
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
