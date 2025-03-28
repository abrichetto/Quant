document.addEventListener("DOMContentLoaded", () => {
  const websocketUrlInput = document.getElementById("websocket-url");
  const connectButton = document.getElementById("connect-btn");
  // Initialize the page
  loadSettings();

  // Load saved settings from localStorage
  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem("algoTraderSettings")) || {};
    websocketUrlInput.value = settings.websocketUrl || "wss://localhost:5010";
  }

  // Save settings to localStorage
  function saveSettings() {
    const settings = {
      websocketUrl: websocketUrlInput.value,
    };
    localStorage.setItem("algoTraderSettings", JSON.stringify(settings));
  }

  // Connect button functionality
  connectButton.addEventListener("click", () => {
    const websocketUrl = websocketUrlInput.value;

    // Validate WebSocket URL
    if (!websocketUrl.startsWith("ws://") && !websocketUrl.startsWith("wss://")) {
      alert("Invalid WebSocket URL. Please use ws:// or wss://.");
      return;
    }

    chrome.runtime.sendMessage({ type: "connect", websocketUrl }, (response) => {
      if (response && response.success) {
        alert("Connected successfully!");
        saveSettings();
      } else {
        alert("Failed to connect. Check the WebSocket URL.");
      }
    });
  });
});