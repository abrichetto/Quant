// Update any references from ws:// to wss://
document.getElementById('open-dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3030' });
});

// If you have any direct WebSocket connections in the popup
function connectDirectly() {
  const socket = new WebSocket('wss://localhost:3030');
  // Rest of your code...
}