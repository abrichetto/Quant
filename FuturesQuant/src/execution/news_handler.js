const EventEmitter = require('events');
const EnhancedNewsAnalyzer = require('./enhanced_news_analyzer');

class NewsHandler extends EventEmitter {
    constructor(config = {}) {
        super();
        this.ibkr = config.ibkr;
        this.subscriptions = new Map();
        this.newsCache = new Map();
        this.analyzer = new EnhancedNewsAnalyzer();
        this.visualizationData = new Map();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Listen for news from IBKR
        this.ibkr.on('news', (news) => {
            this.processNews(news);
        });
    }

    async subscribeToNews(symbols = [], sources = []) {
        try {
            // Subscribe to news for each symbol
            for (const symbol of symbols) {
                await this.ibkr.subscribeNews(symbol);
                this.subscriptions.set(symbol, {
                    sources,
                    lastUpdate: Date.now()
                });
            }
            console.log(`Subscribed to news for ${symbols.join(', ')}`);
        } catch (error) {
            console.error('Failed to subscribe to news:', error);
            throw error;
        }
    }

    async unsubscribeFromNews(symbol) {
        try {
            await this.ibkr.unsubscribeNews(symbol);
            this.subscriptions.delete(symbol);
            console.log(`Unsubscribed from news for ${symbol}`);
        } catch (error) {
            console.error('Failed to unsubscribe from news:', error);
            throw error;
        }
    }

    processNews(news) {
        const { symbol, headline, body, source, timestamp } = news;

        // Skip if we're not subscribed to this symbol
        if (!this.subscriptions.has(symbol)) return;

        // Use enhanced analyzer
        const analysis = this.analyzer.analyze(`${headline} ${body}`);
        
        // Create processed news object
        const processedNews = {
            ...news,
            analysis
        };
        
        // Cache the news
        this.cacheNews(symbol, processedNews);

        // Generate signal if significant
        if (this.isSignificantNews(processedNews)) {
            this.generateSignal(symbol, processedNews);
        }

        // Emit processed news
        this.emit('newsUpdate', symbol, processedNews.analysis.visualizationData);
    }

    isSignificantNews(news) {
        const { analysis } = news;
        return analysis.impactScore > 0.7 || 
               analysis.impact.category === 'high' ||
               Math.abs(analysis.sentiment) > 0.7;
    }

    generateSignal(symbol, news) {
        const { analysis } = news;
        const signal = {
            type: 'NEWS',
            symbol,
            ...analysis.signal,
            metadata: {
                source: news.source,
                timestamp: news.timestamp,
                sentiment: analysis.sentiment,
                impactScore: analysis.impactScore,
                impact: analysis.impact,
                topics: analysis.topics,
                entities: analysis.entities
            }
        };

        this.emit('signal', signal);
    }

    cacheNews(symbol, news) {
        if (!this.newsCache.has(symbol)) {
            this.newsCache.set(symbol, []);
        }
        
        const cache = this.newsCache.get(symbol);
        cache.push(news);
        
        // Keep only last 100 news items
        if (cache.length > 100) {
            cache.shift();
        }
    }

    getNewsHistory(symbol, limit = 10) {
        return this.newsCache.get(symbol)?.slice(-limit) || [];
    }

    getNewsSummary(symbol) {
        const news = this.getNewsHistory(symbol);
        if (!news.length) return null;

        const recentNews = news.slice(-5);
        const sentimentTrend = recentNews.reduce((sum, n) => sum + n.analysis.sentiment, 0) / recentNews.length;
        const impactTrend = recentNews.reduce((sum, n) => sum + n.analysis.impactScore, 0) / recentNews.length;

        return {
            sentimentTrend,
            impactTrend,
            recentNews: recentNews.map(n => ({
                headline: n.headline,
                timestamp: n.timestamp,
                impactScore: n.analysis.impactScore,
                sentiment: n.analysis.sentiment,
                topics: n.analysis.topics
            }))
        };
    }

    getNewsSignals(symbol) {
        const news = this.getNewsHistory(symbol);
        return news
            .filter(n => this.isSignificantNews(n))
            .map(n => ({
                type: 'NEWS',
                symbol,
                ...n.analysis.signal,
                timestamp: n.timestamp,
                headline: n.headline
            }));
    }

    generateVisualizationData(news, analysis) {
        const { symbol, timestamp } = news;
        const { sentiment, impactScore, categories, topics, entities } = analysis;

        if (!this.visualizationData.has(symbol)) {
            this.visualizationData.set(symbol, {
                sentimentHistory: [],
                impactHistory: [],
                categoryHistory: [],
                lastUpdate: timestamp
            });
        }

        const data = this.visualizationData.get(symbol);
        
        // Add new data points
        data.sentimentHistory.push({ timestamp, value: sentiment });
        data.impactHistory.push({ timestamp, value: impactScore });
        data.categoryHistory.push({ timestamp, ...categories });
        
        // Keep only last 100 data points
        if (data.sentimentHistory.length > 100) {
            data.sentimentHistory.shift();
            data.impactHistory.shift();
            data.categoryHistory.shift();
        }

        // Calculate trends
        const trends = this.calculateTrends(data);

        return {
            current: {
                sentiment,
                impactScore,
                categories,
                topics,
                entities
            },
            history: {
                sentiment: data.sentimentHistory,
                impact: data.impactHistory,
                categories: data.categoryHistory
            },
            trends
        };
    }

    calculateTrends(data) {
        const calculateTrend = (history) => {
            if (history.length < 2) return 0;
            const recent = history.slice(-5);
            const oldest = recent[0].value;
            const newest = recent[recent.length - 1].value;
            return (newest - oldest) / oldest;
        };

        return {
            sentiment: calculateTrend(data.sentimentHistory),
            impact: calculateTrend(data.impactHistory),
            categories: Object.keys(data.categoryHistory[0] || {}).reduce((acc, category) => {
                acc[category] = calculateTrend(data.categoryHistory.map(h => ({ value: h[category] })));
                return acc;
            }, {})
        };
    }

    getVisualizationData(symbol) {
        return this.visualizationData.get(symbol) || {
            sentimentHistory: [],
            impactHistory: [],
            categoryHistory: [],
            lastUpdate: null
        };
    }

    generateNewsReport(symbol) {
        const data = this.getVisualizationData(symbol);
        const recentNews = this.getNewsHistory(symbol, 5);

        return {
            summary: {
                averageSentiment: this.calculateAverage(data.sentimentHistory),
                averageImpact: this.calculateAverage(data.impactHistory),
                categoryDistribution: this.calculateCategoryDistribution(data.categoryHistory)
            },
            trends: {
                sentiment: this.calculateTrend(data.sentimentHistory),
                impact: this.calculateTrend(data.impactHistory),
                categories: this.calculateCategoryTrends(data.categoryHistory)
            },
            recentNews: recentNews.map(news => ({
                headline: news.headline,
                timestamp: news.timestamp,
                sentiment: news.analysis.sentiment,
                impactScore: news.analysis.impactScore,
                categories: news.analysis.categories
            }))
        };
    }

    calculateAverage(history) {
        if (history.length === 0) return 0;
        return history.reduce((sum, item) => sum + item.value, 0) / history.length;
    }

    calculateCategoryDistribution(history) {
        if (history.length === 0) return {};
        
        const distribution = {};
        history.forEach(item => {
            Object.entries(item).forEach(([category, value]) => {
                distribution[category] = (distribution[category] || 0) + value;
            });
        });

        // Normalize
        const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        Object.keys(distribution).forEach(key => {
            distribution[key] = distribution[key] / total;
        });

        return distribution;
    }

    calculateCategoryTrends(history) {
        if (history.length < 2) return {};

        const trends = {};
        Object.keys(history[0]).forEach(category => {
            const values = history.map(h => h[category]);
            const oldest = values[0];
            const newest = values[values.length - 1];
            trends[category] = (newest - oldest) / oldest;
        });

        return trends;
    }
}

module.exports = NewsHandler; 