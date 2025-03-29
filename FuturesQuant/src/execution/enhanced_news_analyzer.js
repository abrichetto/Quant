const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const NGrams = natural.NGrams;
const BayesClassifier = natural.BayesClassifier;

class EnhancedNewsAnalyzer {
    constructor() {
        this.tfidf = new TfIdf();
        this.sentimentAnalyzer = new natural.SentimentAnalyzer();
        this.classifier = new BayesClassifier();
        this.topicModel = new Map();
        this.entityCache = new Map();
        this.marketImpactModel = new Map();
        
        // Enhanced keyword categories
        this.keywords = {
            positive: ['surge', 'jump', 'rise', 'gain', 'up', 'higher', 'positive', 'growth', 'profit', 'success', 'breakout', 'rally', 'bullish', 'outperform', 'upgrade', 'buy', 'breakthrough', 'milestone', 'record', 'surpass', 'exceed'],
            negative: ['drop', 'fall', 'decline', 'down', 'lower', 'negative', 'loss', 'risk', 'concern', 'warning', 'crash', 'selloff', 'bearish', 'underperform', 'downgrade', 'sell', 'plunge', 'collapse', 'crisis', 'default', 'bankruptcy'],
            technical: ['support', 'resistance', 'breakout', 'breakdown', 'trend', 'momentum', 'volume', 'volatility', 'correlation', 'divergence', 'fibonacci', 'moving average', 'rsi', 'macd', 'bollinger', 'pivot', 'level'],
            fundamental: ['earnings', 'revenue', 'profit', 'loss', 'guidance', 'dividend', 'split', 'merger', 'acquisition', 'regulation', 'quarterly', 'annual', 'report', 'forecast', 'outlook', 'guidance', 'margin', 'growth'],
            market: ['trading', 'market', 'session', 'volume', 'liquidity', 'spread', 'bid', 'ask', 'order', 'position', 'leverage', 'margin', 'funding', 'interest', 'rate'],
            regulatory: ['sec', 'regulation', 'law', 'compliance', 'enforcement', 'investigation', 'fine', 'penalty', 'ban', 'restriction', 'approval', 'license', 'permit', 'oversight'],
            geopolitical: ['government', 'policy', 'election', 'vote', 'legislation', 'bill', 'law', 'sanction', 'embargo', 'trade', 'tariff', 'diplomatic', 'tension', 'conflict', 'crisis']
        };

        // Market impact categories
        this.impactCategories = {
            high: ['earnings', 'guidance', 'merger', 'acquisition', 'regulation', 'crisis', 'bankruptcy', 'breakthrough'],
            medium: ['upgrade', 'downgrade', 'forecast', 'outlook', 'report', 'investigation', 'fine', 'penalty'],
            low: ['announcement', 'update', 'change', 'modification', 'adjustment', 'minor', 'small', 'slight']
        };

        this.trainClassifier();
    }

    trainClassifier() {
        // Train the classifier with known market impact patterns
        Object.entries(this.impactCategories).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                this.classifier.addDocument(keyword, category);
            });
        });
        this.classifier.train();
    }

    analyze(text) {
        const tokens = tokenizer.tokenize(text);
        const ngrams = NGrams.bigrams(tokens);
        
        // Comprehensive analysis pipeline
        const analysis = {
            sentiment: this.analyzeSentiment(tokens),
            entities: this.extractEntities(tokens),
            topics: this.identifyTopics(tokens, ngrams),
            impact: this.predictMarketImpact(text),
            tfidf: this.analyzeTfIdf(text),
            categories: this.categorizeNews(tokens, ngrams)
        };

        // Calculate composite scores
        analysis.impactScore = this.calculateImpactScore(analysis);
        analysis.signal = this.generateSignal(analysis);

        return analysis;
    }

    analyzeSentiment(tokens) {
        return this.sentimentAnalyzer.getSentiment(tokens);
    }

    extractEntities(tokens) {
        const entities = {
            companies: [],
            currencies: [],
            indices: [],
            commodities: [],
            people: [],
            organizations: []
        };

        tokens.forEach(token => {
            if (token.match(/^[A-Z][a-z]+$/) && token.length > 2) {
                entities.companies.push(token);
            }
            if (token.match(/^[A-Z]{3}$/)) {
                entities.currencies.push(token);
            }
            if (token.match(/^[A-Z]{1,3}$/)) {
                entities.indices.push(token);
            }
            if (['GOLD', 'SILVER', 'OIL', 'COPPER', 'PLATINUM'].includes(token)) {
                entities.commodities.push(token);
            }
        });

        return entities;
    }

    identifyTopics(tokens, ngrams) {
        const topics = new Map();
        
        tokens.forEach(token => {
            Object.entries(this.keywords).forEach(([category, keywords]) => {
                if (keywords.includes(token.toLowerCase())) {
                    topics.set(category, (topics.get(category) || 0) + 1);
                }
            });
        });

        const total = Array.from(topics.values()).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            topics.forEach((value, key) => {
                topics.set(key, value / total);
            });
        }

        return Object.fromEntries(topics);
    }

    predictMarketImpact(text) {
        const prediction = this.classifier.classify(text);
        const confidence = this.classifier.getClassifications(text)
            .find(c => c.label === prediction)?.value || 0;

        return {
            category: prediction,
            confidence,
            score: this.getImpactScore(prediction)
        };
    }

    analyzeTfIdf(text) {
        this.tfidf.addDocument(text);
        return this.tfidf.listTerms(0);
    }

    categorizeNews(tokens, ngrams) {
        const categories = {
            technical: 0,
            fundamental: 0,
            market: 0,
            regulatory: 0,
            geopolitical: 0
        };

        tokens.forEach(token => {
            if (this.keywords.technical.includes(token)) categories.technical++;
            if (this.keywords.fundamental.includes(token)) categories.fundamental++;
            if (this.keywords.market.includes(token)) categories.market++;
            if (this.keywords.regulatory.includes(token)) categories.regulatory++;
            if (this.keywords.geopolitical.includes(token)) categories.geopolitical++;
        });

        const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(categories).forEach(key => {
                categories[key] = categories[key] / total;
            });
        }

        return categories;
    }

    calculateImpactScore(analysis) {
        const { sentiment, impact, topics } = analysis;
        
        let score = 0;
        score += sentiment * 0.3;
        score += (impact.score - 0.5) * 0.3;
        
        const topicScore = this.calculateTopicScore(topics);
        score += topicScore * 0.4;

        return Math.max(0, Math.min(1, (score + 1) / 2));
    }

    calculateTopicScore(topics) {
        let score = 0;
        Object.entries(topics).forEach(([category, weight]) => {
            if (this.keywords.positive.includes(category)) score += weight;
            if (this.keywords.negative.includes(category)) score -= weight;
        });
        return score;
    }

    generateSignal(analysis) {
        const { sentiment, impactScore, impact, topics } = analysis;

        let action = 'HOLD';
        let score = 0;

        score += sentiment * 0.3;
        score += (impactScore - 0.5) * 0.3;
        score += (impact.score - 0.5) * 0.2;
        
        const topicScore = this.calculateTopicScore(topics);
        score += topicScore * 0.2;

        if (score > 0.3) action = 'BUY';
        else if (score < -0.3) action = 'SELL';

        return {
            action,
            confidence: this.calculateSignalConfidence(analysis),
            rationale: this.generateSignalRationale(analysis)
        };
    }

    calculateSignalConfidence(analysis) {
        const { sentiment, impactScore, impact } = analysis;
        
        let confidence = 0;
        confidence += Math.abs(sentiment) * 0.3;
        confidence += impactScore * 0.3;
        confidence += impact.confidence * 0.4;

        return Math.min(1, confidence);
    }

    generateSignalRationale(analysis) {
        const { sentiment, impactScore, impact, topics } = analysis;
        const rationales = [];

        if (Math.abs(sentiment) > 0.5) {
            rationales.push(`Strong ${sentiment > 0 ? 'positive' : 'negative'} sentiment`);
        }

        if (impactScore > 0.7) {
            rationales.push('High market impact expected');
        }

        const dominantTopics = Object.entries(topics)
            .filter(([_, weight]) => weight > 0.3)
            .map(([topic]) => topic);
        
        if (dominantTopics.length > 0) {
            rationales.push(`Key topics: ${dominantTopics.join(', ')}`);
        }

        return rationales.join(' | ');
    }

    getImpactScore(category) {
        const scores = {
            high: 1.0,
            medium: 0.6,
            low: 0.2
        };
        return scores[category] || 0;
    }
}

module.exports = EnhancedNewsAnalyzer; 