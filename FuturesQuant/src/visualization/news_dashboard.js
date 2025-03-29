const Chart = require('chart.js');

class NewsDashboard {
    constructor(containerId, newsHandler) {
        this.container = document.getElementById(containerId);
        this.newsHandler = newsHandler;
        this.charts = new Map();
        this.setupLayout();
    }

    setupLayout() {
        this.container.innerHTML = `
            <div class="news-dashboard">
                <div class="news-overview">
                    <div class="sentiment-chart-container">
                        <canvas id="sentimentChart"></canvas>
                    </div>
                    <div class="impact-chart-container">
                        <canvas id="impactChart"></canvas>
                    </div>
                </div>
                <div class="news-details">
                    <div class="category-distribution">
                        <canvas id="categoryChart"></canvas>
                    </div>
                    <div class="news-list">
                        <h3>Recent News</h3>
                        <div id="newsList"></div>
                    </div>
                </div>
            </div>
        `;

        this.setupCharts();
        this.setupEventListeners();
    }

    setupCharts() {
        // Sentiment Chart
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        this.charts.set('sentiment', new Chart(sentimentCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sentiment',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: -1,
                        max: 1
                    }
                }
            }
        }));

        // Impact Chart
        const impactCtx = document.getElementById('impactChart').getContext('2d');
        this.charts.set('impact', new Chart(impactCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Impact Score',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 0,
                        max: 1
                    }
                }
            }
        }));

        // Category Distribution Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        this.charts.set('category', new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Technical', 'Fundamental', 'Market', 'Regulatory'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        }));
    }

    setupEventListeners() {
        this.newsHandler.on('newsUpdate', (symbol, data) => {
            this.updateCharts(symbol, data);
        });
    }

    updateCharts(symbol, data) {
        const { history, current } = data;

        // Update Sentiment Chart
        const sentimentChart = this.charts.get('sentiment');
        sentimentChart.data.labels = history.sentiment.map(item => 
            new Date(item.timestamp).toLocaleTimeString()
        );
        sentimentChart.data.datasets[0].data = history.sentiment.map(item => item.value);
        sentimentChart.update();

        // Update Impact Chart
        const impactChart = this.charts.get('impact');
        impactChart.data.labels = history.impact.map(item => 
            new Date(item.timestamp).toLocaleTimeString()
        );
        impactChart.data.datasets[0].data = history.impact.map(item => item.value);
        impactChart.update();

        // Update Category Chart
        const categoryChart = this.charts.get('category');
        categoryChart.data.datasets[0].data = [
            current.categories.technical,
            current.categories.fundamental,
            current.categories.market,
            current.categories.regulatory
        ];
        categoryChart.update();

        // Update News List
        this.updateNewsList(symbol);
    }

    updateNewsList(symbol) {
        const newsList = document.getElementById('newsList');
        const report = this.newsHandler.generateNewsReport(symbol);
        
        newsList.innerHTML = report.recentNews.map(news => `
            <div class="news-item ${news.sentiment > 0 ? 'positive' : news.sentiment < 0 ? 'negative' : 'neutral'}">
                <div class="news-header">
                    <span class="timestamp">${new Date(news.timestamp).toLocaleString()}</span>
                    <span class="sentiment">${news.sentiment.toFixed(2)}</span>
                    <span class="impact">${news.impactScore.toFixed(2)}</span>
                </div>
                <div class="headline">${news.headline}</div>
                <div class="categories">
                    ${Object.entries(news.categories)
                        .filter(([_, value]) => value > 0)
                        .map(([category, value]) => `
                            <span class="category ${category}">${category} (${value.toFixed(2)})</span>
                        `).join('')}
                </div>
            </div>
        `).join('');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .news-dashboard {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 20px;
            }

            .news-overview {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            .news-details {
                display: grid;
                grid-template-rows: 1fr 1fr;
                gap: 20px;
            }

            .news-item {
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                background: #f5f5f5;
            }

            .news-item.positive {
                border-left: 4px solid #4CAF50;
            }

            .news-item.negative {
                border-left: 4px solid #f44336;
            }

            .news-item.neutral {
                border-left: 4px solid #9e9e9e;
            }

            .news-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.9em;
                color: #666;
            }

            .headline {
                font-weight: bold;
                margin-bottom: 10px;
            }

            .categories {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }

            .category {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                background: #e0e0e0;
            }

            .category.technical { background: #ffcdd2; }
            .category.fundamental { background: #bbdefb; }
            .category.market { background: #c8e6c9; }
            .category.regulatory { background: #fff9c4; }
        `;
        document.head.appendChild(style);
    }
}

module.exports = NewsDashboard; 