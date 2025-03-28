document.addEventListener("DOMContentLoaded", () => {
  const websocketUrlInput = document.getElementById("websocket-url");
  const autoConnectCheckbox = document.getElementById("auto-connect");
  const saveButton = document.getElementById("save-btn");
  const resetButton = document.getElementById("reset-btn");
  const investmentMemo = document.getElementById("investment-memo");

  // Load saved settings from localStorage
  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem("algoTraderSettings")) || {};
    websocketUrlInput.value = settings.websocketUrl || "wss://localhost:5010"; // Corrected WebSocket URL
    autoConnectCheckbox.checked = settings.autoConnect || false;
    investmentMemo.value = settings.investmentMemo || "AI-generated market insights will appear here...";
  }

  // Save settings to localStorage
  saveButton.addEventListener("click", () => {
    const settings = {
      websocketUrl: websocketUrlInput.value,
      autoConnect: autoConnectCheckbox.checked,
      investmentMemo: investmentMemo.value,
    };

    localStorage.setItem("algoTraderSettings", JSON.stringify(settings));
    alert("Settings saved successfully!");
  });

  // Reset settings to defaults
  resetButton.addEventListener("click", () => {
    websocketUrlInput.value = "wss://localhost:5010"; // Updated to match the correct WebSocket URL
    autoConnectCheckbox.checked = false;
    investmentMemo.value = "AI-generated market insights will appear here...";
    alert("Settings reset to defaults!");
  });

  // Initialize the page
  loadSettings();

  // Initialize charts using Chart.js
  const btcChart = new Chart(document.getElementById("btc-chart"), {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "BTC/USD",
        data: [40000, 42000, 41000, 43000, 45000],
        borderColor: "#4caf50",
        fill: false,
      }],
    },
  });

  const ethChart = new Chart(document.getElementById("eth-chart"), {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "ETH/USD",
        data: [3000, 3200, 3100, 3300, 3500],
        borderColor: "#2196f3",
        fill: false,
      }],
    },
  });

  const solChart = new Chart(document.getElementById("sol-chart"), {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [{
        label: "SOL/USD",
        data: [100, 120, 110, 130, 150],
        borderColor: "#ff9800",
        fill: false,
      }],
    },
  });
});