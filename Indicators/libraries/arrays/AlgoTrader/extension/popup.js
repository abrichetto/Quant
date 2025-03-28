document.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connectButton");
  const statusDiv = document.getElementById("status");

  connectButton.addEventListener("click", () => {
    statusDiv.textContent = "Connecting to WebSocket...";
    const socket = new WebSocket("http://localhost:5010");

    socket.onerror = (error) => {
      statusDiv.textContent = `WebSocket error: ${error.message}`;
    };
  });
});