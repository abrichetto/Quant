let socket;
const webSocketURL = "wss://localhost:5010"; // Correct WebSocket URL
let reconnectAttempts = 0;
const maxReconnectAttempts = 0;
const reconnectInterval = 1000; // 1 second

/**
 * Connect to the WebSocket server.
 */
function connectWebSocket() {
  try {
    socket = new WebSocket("wss://localhost:5010");
    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };
  } catch (error) {
    console.error("WebSocket connection failed:", error);
  }
}

/**
 * Send a message to the WebSocket server.
 * @param {string} message - The message to send.
 */
function sendMessageToWebSocket(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    console.log("Message sent to WebSocket:", message);
  } else {
    console.error("WebSocket is not connected.");
  }
}

// Add a listener for the button click
chrome.action.onClicked.addListener(() => {
  console.log("Button clicked. Sending message to WebSocket...");
  sendMessageToWebSocket(JSON.stringify({ type: "buttonClick", payload: "User clicked the button" }));
});

/**
 * Handle messages from the options page.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "connect") {
        const websocketUrl = message.websocketUrl;
        sendResponse({ status: "WebSocket URL received" });
      }
    });