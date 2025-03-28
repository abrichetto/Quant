const BaseAgent = require('../base-agent');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });

/**
 * Wall Street Journal feed agent
 */
class WallStreetFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'Wall Street Journal',
      type: 'market_news',
      priority: 7
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching financial news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'financial_markets,economy_macro,finance',
          sort: 'LATEST',
          limit: 20,
          apikey: this.apiKey
        }
      });
      
      if (response.data['Error Message']) {
        throw new Error(`API error: ${response.data['Error Message']}`);
      }
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for Wall Street feed`);
        return [];
      }
      
      // Process articles into signals
      const signals = response.data.feed
        .filter(article => 
          article.authors && article.authors.toLowerCase().includes('wsj') ||
          article.source && article.source.toLowerCase().includes('wall street')
        )
        .map(article => {
          // Get the most relevant tickers
          const tickers = article.ticker_sentiment ? 
            article.ticker_sentiment
              .sort((a, b) => parseFloat(b.relevance_score) - parseFloat(a.relevance_score))
              .slice(0, 3) : [];
          
          // Determine the primary topic
          let topic = 'general_market';
          if (tickers.length > 0) {
            topic = tickers[0].ticker;
          } else if (article.topics && article.topics.length > 0) {
            topic = article.topics[0].topic;
          }
          
          return {
            title: article.title,
            topic,
            source: 'WSJ',
            url: article.url,
            timestamp: article.time_published,
            sentiment: parseFloat(article.overall_sentiment_score || 0),
            strength: Math.abs(parseFloat(article.overall_sentiment_score || 0)) * 0.7 + 0.3,
            confidence: parseFloat(article.overall_sentiment_score_definition === 'Somewhat' ? 0.6 : 0.8),
            keywords: article.topics ? article.topics.map(t => t.topic) : [],
            tickers: tickers.map(t => t.ticker),
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} articles into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
}

/**
 * SEC Filings feed agent
 */
class SECFilingsFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'SEC Filings Monitor',
      type: 'regulatory',
      priority: 8
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching SEC filing news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'financial_markets,regulations',
          sort: 'RELEVANCE',
          limit: 50,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for SEC filings`);
        return [];
      }
      
      // Filter for SEC-related news
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('sec') ||
          article.summary.toLowerCase().includes('filing') ||
          article.summary.toLowerCase().includes('filed') ||
          article.summary.toLowerCase().includes('form 8') ||
          article.summary.toLowerCase().includes('form 10')
        )
        .map(article => {
          // Get primary ticker
          const mainTicker = article.ticker_sentiment && article.ticker_sentiment.length > 0 ?
            article.ticker_sentiment.sort((a, b) => 
              parseFloat(b.relevance_score) - parseFloat(a.relevance_score)
            )[0].ticker : null;
          
          // Determine signal strength based on content
          let strength = 0.5;
          let priority = 6;
          
          // Adjust strength and priority based on filing type
          const lcSummary = article.summary.toLowerCase();
          if (lcSummary.includes('investigation')) {
            strength = 0.9;
            priority = 9;
          } else if (lcSummary.includes('enforcement')) {
            strength = 0.85;
            priority = 8;
          } else if (lcSummary.includes('form 8-k')) {
            strength = 0.7;
            priority = 7;
          }
          
          return {
            title: article.title,
            topic: mainTicker || 'SEC_filing',
            source: 'SEC Filing',
            url: article.url,
            timestamp: article.time_published,
            sentiment: parseFloat(article.overall_sentiment_score || 0),
            strength,
            priority,
            confidence: 0.75,
            filing_type: this._extractFilingType(article.summary),
            company: mainTicker,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} SEC filings into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
  
  /**
   * Extract filing type from article text
   * @private
   */
  _extractFilingType(text) {
    const lcText = text.toLowerCase();
    if (lcText.includes('form 8-k')) return '8-K';
    if (lcText.includes('form 10-q')) return '10-Q';
    if (lcText.includes('form 10-k')) return '10-K';
    if (lcText.includes('form s-1')) return 'S-1';
    if (lcText.includes('form 4')) return 'Form 4';
    return 'Other Filing';
  }
}

/**
 * Insider Trading feed agent
 */
class InsiderTradingFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'Insider Trading Monitor',
      type: 'market_activity',
      priority: 7
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching insider trading news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'financial_markets',
          sort: 'RELEVANCE',
          limit: 50,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for insider trading`);
        return [];
      }
      
      // Filter for insider trading news
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('insider') ||
          article.summary.toLowerCase().includes('insider') ||
          article.summary.toLowerCase().includes('ceo buys') ||
          article.summary.toLowerCase().includes('director buys')
        )
        .map(article => {
          // Get primary ticker
          const mainTicker = article.ticker_sentiment && article.ticker_sentiment.length > 0 ?
            article.ticker_sentiment.sort((a, b) => 
              parseFloat(b.relevance_score) - parseFloat(a.relevance_score)
            )[0].ticker : null;
          
          // Determine signal characteristics
          const isSellingActivity = 
            article.title.toLowerCase().includes('sell') ||
            article.title.toLowerCase().includes('sold') ||
            article.summary.toLowerCase().includes('sell') ||
            article.summary.toLowerCase().includes('sold');
          
          const isBuyingActivity = 
            article.title.toLowerCase().includes('buy') ||
            article.title.toLowerCase().includes('bought') ||
            article.summary.toLowerCase().includes('buy') ||
            article.summary.toLowerCase().includes('bought');
          
          let activity = 'unknown';
          let sentiment = parseFloat(article.overall_sentiment_score || 0);
          
          if (isSellingActivity) {
            activity = 'selling';
            sentiment = Math.min(sentiment, -0.2);
          } else if (isBuyingActivity) {
            activity = 'buying';
            sentiment = Math.max(sentiment, 0.2);
          }
          
          return {
            title: article.title,
            topic: mainTicker || 'insider_trading',
            source: 'Insider Activity',
            url: article.url,
            timestamp: article.time_published,
            sentiment,
            activity,
            strength: 0.7,
            confidence: 0.65,
            company: mainTicker,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} insider trading events into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
}

module.exports = {
  WallStreetFeed,
  SECFilingsFeed,
  InsiderTradingFeed
};