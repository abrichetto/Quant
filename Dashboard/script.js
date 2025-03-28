document.addEventListener('DOMContentLoaded', (event) => {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Chart Initialization
    initializeCharts();

    // Fetch Predictive Indicators and News
    fetchPredictiveIndicators();
    fetchNews();
});

function initializeCharts() {
    // Example of initializing the main chart with BTC and overlaying ETH and DOW/SPY
    const mainChart = document.getElementById('main-chart').getContext('2d');
    const chart = new Chart(mainChart, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'BTC',
                    data: [], // Fill with BTC data
                    borderColor: 'rgba(255, 99, 132, 1)',
                },
                {
                    label: 'ETH',
                    data: [], // Fill with ETH data
                    borderColor: 'rgba(54, 162, 235, 1)',
                },
                {
                    label: 'DOW/SPY',
                    data: [], // Fill with DOW/SPY data
                    borderColor: 'rgba(75, 192, 192, 1)',
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

function fetchPredictiveIndicators() {
    // Example of fetching predictive indicators
    fetch('/api/predictive-indicators')
        .then(response => response.json())
        .then(data => {
            document.getElementById('predictive-indicators').innerText = JSON.stringify(data);
        });
}

function fetchNews() {
    // Example of fetching news
    fetch('/api/news')
        .then(response => response.json())
        .then(data => {
            document.getElementById('news').innerText = JSON.stringify(data);
        });
}
