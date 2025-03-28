const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const ResearchRepository = require('../../../utils/research-repository');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });

class WallStreetFeed {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not found in environment variables');
    }
    
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.category = 'wallstreet';
  }
  
  /**
   * Get Wall Street financial news and sentiment
   */
  async collectIntelligence() {
    try {
      console.log(`${this.category} Feed: Collecting financial markets intelligence...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'financial_markets,earnings,ipo,mergers_and_acquisitions,financial_indicators',
          sort: 'RELEVANCE',
          limit: 50,
          apikey: this.apiKey
        }
      });
      
      if (response.data['Error Message']) {
        throw new Error(`API error: ${response.data['Error Message']}`);
      }
      
      // Process the sentiment data
      const sentimentData = this._processSentimentData(response.data);
      
      // Store in repository
      const filePath = this.repository.storeResearch(
        `Wall Street Financial Intelligence`,
        'analysis',
        sentimentData,
        {
          type: 'news_feed',
          feed_category: this.category,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage_intelligence'
        }
      );
      
      console.log(`${this.category} Feed: Collected ${sentimentData.articles.length} financial news items`);
      
      return {
        category: this.category,
        data: sentimentData,
        path: filePath
      };
    } catch (error) {
      console.error(`${this.category} Feed error:`, error.message);
      throw error;
    }
  }
  
  /**
   * Process raw sentiment data
   * @private
   */
  _processSentimentData(rawData) {
    const result = {
      timestamp: new Date().toISOString(),
      category: this.category,
      overall_sentiment_score: 0,
      overall_sentiment_label: '',
      bullish_articles: 0,
      bearish_articles: 0,
      neutral_articles: 0,
      articles: [],
      top_themes: [],
      entity_sentiments: {}
    };
    
    // Process articles
    if (rawData.feed && rawData.feed.length > 0) {
      let totalSentiment = 0;
      const topics = {};
      const entities = {};
      
      rawData.feed.forEach(article => {
        // Extract sentiment
        const sentimentScore = parseFloat(article.overall_sentiment_score || 0);
        totalSentiment += sentimentScore;
        
        // Count sentiment categories
        if (sentimentScore > 0.25) result.bullish_articles++;
        else if (sentimentScore < -0.25) result.bearish_articles++;
        else result.neutral_articles++;
        
        // Track topics
        if (article.topics) {
          article.topics.forEach(topic => {
            if (!topics[topic.topic]) topics[topic.topic] = 0;
            topics[topic.topic] += parseFloat(topic.relevance_score || 0);
          });
        }
        
        // Track entity sentiments
        if (article.ticker_sentiment) {
          article.ticker_sentiment.forEach(ticker => {
            const symbol = ticker.ticker;
            if (!entities[symbol]) {
              entities[symbol] = {
                count: 0,
                total_sentiment: 0,
                relevance: 0
              };
            }
            
            entities[symbol].count += 1;
            entities[symbol].total_sentiment += parseFloat(ticker.ticker_sentiment_score || 0);
            entities[symbol].relevance += parseFloat(ticker.relevance_score || 0);
          });
        }
        
        // Add to articles array
        result.articles.push({
          title: article.title,
          url: article.url,
          time_published: article.time_published,
          authors: article.authors,
          summary: article.summary,
          sentiment_score: sentimentScore,
          sentiment_label: this._getSentimentLabel(sentimentScore),
          tickers: article.ticker_sentiment ? 
            article.ticker_sentiment.map(t => ({
              symbol: t.ticker,
              sentiment: parseFloat(t.ticker_sentiment_score || 0),
              relevance: parseFloat(t.relevance_score || 0)
            })) : []
        });
      });
      
      // Calculate average sentiment
      result.overall_sentiment_score = totalSentiment / rawData.feed.length;
      result.overall_sentiment_label = this._getSentimentLabel(result.overall_sentiment_score);
      
      // Find top themes
      result.top_themes = Object.entries(topics)
        .map(([topic, score]) => ({ topic, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      // Process entity sentiments
      for (const [symbol, data] of Object.entries(entities)) {
        result.entity_sentiments[symbol] = {
          avg_sentiment: data.total_sentiment / data.count,
          mentions: data.count,
          avg_relevance: data.relevance / data.count,
          sentiment_label: this._getSentimentLabel(data.total_sentiment / data.count)
        };
      }
    }
    
    return result;
  }
  
  /**
   * Convert sentiment score to label
   * @private
   */
  _getSentimentLabel(score) {
    if (score >= 0.5) return 'Very Bullish';
    if (score >= 0.25) return 'Bullish';
    if (score > -0.25) return 'Neutral';
    if (score > -0.5) return 'Bearish';
    return 'Very Bearish';
  }
}

module.exports = WallStreetFeed;