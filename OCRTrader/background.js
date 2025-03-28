let socket;

/**
 * Handle messages from the options page.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "connect") {
    const websocketUrl = message.websocketUrl;

    try {
      // Initialize WebSocket connection
      socket = new WebSocket(websocketUrl);

      // Handle WebSocket open event
      socket.onopen = () => {
        console.log("WebSocket connection established.");
        sendResponse({ success: true });
      };

      // Handle WebSocket message event
      socket.onmessage = (event) => {
        console.log("Message from server:", event.data);
      };

      // Handle WebSocket error event
      socket.onerror = () => {
        console.error("WebSocket error.");
        sendResponse({ success: false });
      };

      // Handle WebSocket close event
      socket.onclose = () => {
        console.log("WebSocket connection closed.");
      };

      // Required to keep the message channel open for async responses
      return true;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      sendResponse({ success: false });
    }
  }
});