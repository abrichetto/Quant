const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const ResearchRepository = require('../../../utils/research-repository');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });

class MacroFeed {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not found in environment variables');
    }
    
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.category = 'macro';
    
    // Define key macro indicators to track
    this.macroIndicators = [
      'GDP', 'CPI', 'INFLATION', 'FED', 'FOMC', 'INTEREST_RATES',
      'UNEMPLOYMENT', 'JOBS', 'NFP', 'TREASURY', 'YIELD'
    ];
  }
  
  /**
   * Get macroeconomic news and sentiment
   */
  async collectIntelligence() {
    try {
      console.log(`${this.category} Feed: Collecting macroeconomic intelligence...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'economy_macro,economy_fiscal,economy_monetary,finance',
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
      
      // Add macro-specific analysis
      sentimentData.macro_indicators = this._analyzeMacroIndicators(sentimentData);
      
      // Store in repository
      const filePath = this.repository.storeResearch(
        'Macroeconomic Intelligence',
        'analysis',
        sentimentData,
        {
          type: 'news_feed',
          feed_category: this.category,
          timestamp: new Date().toISOString(),
          source: 'alpha_vantage_intelligence'
        }
      );
      
      console.log(`${this.category} Feed: Collected ${sentimentData.articles.length} macroeconomic news items`);
      
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
   * Analyze macro indicators
   * @private
   */
  _analyzeMacroIndicators(sentimentData) {
    const indicators = {};
    
    // Initialize indicators
    for (const indicator of this.macroIndicators) {
      indicators[indicator] = {
        mentions: 0,
        articles: [],
        sentiment: 0,
        sentiment_label: 'Neutral'
      };
    }
    
    // Analyze each article
    for (const article of sentimentData.articles) {
      for (const indicator of this.macroIndicators) {
        // Search for indicator in title or summary
        const titleMatch = article.title && article.title.toUpperCase().includes(indicator);
        const summaryMatch = article.summary && article.summary.toUpperCase().includes(indicator);
        
        if (titleMatch || summaryMatch) {
          indicators[indicator].mentions++;
          indicators[indicator].articles.push({
            title: article.title,
            sentiment: article.sentiment_score,
            url: article.url,
            time_published: article.time_published
          });
          
          // Update sentiment
          indicators[indicator].sentiment += article.sentiment_score;
        }
      }
    }
    
    // Calculate average sentiment and set label
    for (const indicator in indicators) {
      if (indicators[indicator].mentions > 0) {
        indicators[indicator].sentiment = indicators[indicator].sentiment / indicators[indicator].mentions;
        indicators[indicator].sentiment_label = this._getSentimentLabel(indicators[indicator].sentiment);
      }
    }
    
    // Sort articles by recency
    for (const indicator in indicators) {
      indicators[indicator].articles.sort((a, b) => 
        new Date(b.time_published) - new Date(a.time_published)
      );
    }
    
    // Get top mentioned indicators
    const topIndicators = Object.entries(indicators)
      .filter(([_, data]) => data.mentions > 0)
      .sort((a, b) => b[1].mentions - a[1].mentions)
      .slice(0, 5)
      .map(([indicator, data]) => ({
        indicator,
        mentions: data.mentions,
        sentiment: data.sentiment,
        sentiment_label: data.sentiment_label
      }));
    
    return {
      indicators,
      top_indicators: topIndicators
    };
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

class InternationalFeed {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not found in environment variables');
    }
    








































































































































































































































































































































































































































































































































































module.exports = { MacroFeed, InternationalFeed, TechFeed };}  }    return 'Very Bearish';    if (score > -0.5) return 'Bearish';    if (score > -0.25) return 'Neutral';    if (score >= 0.25) return 'Bullish';    if (score >= 0.5) return 'Very Bullish';  _getSentimentLabel(score) {   */   * @private   * Convert sentiment score to label  /**    }    return result;        }      }        };          sentiment_label: this._getSentimentLabel(data.total_sentiment / data.count)          avg_relevance: data.relevance / data.count,          mentions: data.count,          avg_sentiment: data.total_sentiment / data.count,        result.entity_sentiments[symbol] = {      for (const [symbol, data] of Object.entries(entities)) {      // Process entity sentiments              .slice(0, 5);        .sort((a, b) => b.score - a.score)        .map(([topic, score]) => ({ topic, score }))      result.top_themes = Object.entries(topics)      // Find top themes            result.overall_sentiment_label = this._getSentimentLabel(result.overall_sentiment_score);      result.overall_sentiment_score = totalSentiment / rawData.feed.length;      // Calculate average sentiment            });        });            })) : []              relevance: parseFloat(t.relevance_score || 0)              sentiment: parseFloat(t.ticker_sentiment_score || 0),              symbol: t.ticker,            article.ticker_sentiment.map(t => ({          tickers: article.ticker_sentiment ?           sentiment_label: this._getSentimentLabel(sentimentScore),          sentiment_score: sentimentScore,          summary: article.summary,          authors: article.authors,          time_published: article.time_published,          url: article.url,          title: article.title,        result.articles.push({        // Add to articles array                }          });            entities[symbol].relevance += parseFloat(ticker.relevance_score || 0);            entities[symbol].total_sentiment += parseFloat(ticker.ticker_sentiment_score || 0);            entities[symbol].count += 1;                        }              };                relevance: 0                total_sentiment: 0,                count: 0,              entities[symbol] = {            if (!entities[symbol]) {            const symbol = ticker.ticker;          article.ticker_sentiment.forEach(ticker => {        if (article.ticker_sentiment) {        // Track entity sentiments                }          });            topics[topic.topic] += parseFloat(topic.relevance_score || 0);            if (!topics[topic.topic]) topics[topic.topic] = 0;          article.topics.forEach(topic => {        if (article.topics) {        // Track topics                else result.neutral_articles++;        else if (sentimentScore < -0.25) result.bearish_articles++;        if (sentimentScore > 0.25) result.bullish_articles++;        // Count sentiment categories                totalSentiment += sentimentScore;        const sentimentScore = parseFloat(article.overall_sentiment_score || 0);        // Extract sentiment      rawData.feed.forEach(article => {            const entities = {};      const topics = {};      let totalSentiment = 0;    if (rawData.feed && rawData.feed.length > 0) {    // Process articles        };      entity_sentiments: {}      top_themes: [],      articles: [],      neutral_articles: 0,      bearish_articles: 0,      bullish_articles: 0,      overall_sentiment_label: '',      overall_sentiment_score: 0,      category: this.category,      timestamp: new Date().toISOString(),    const result = {  _processSentimentData(rawData) {   */   * @private   * Process raw sentiment data  /**    }    };      top_tech_companies: topTechCompanies      companies,    return {          }));        sentiment_label: data.sentiment_label        sentiment: data.avg_sentiment,        mentions: data.mentions,        ticker,      .map(([ticker, data]) => ({      .slice(0, 5)      .sort((a, b) => b[1].mentions - a[1].mentions)      .filter(([_, data]) => data.mentions > 0)    const topTechCompanies = Object.entries(companies)    // Get top tech companies by mentions        }      }        };          no_recent_coverage: true          sentiment_label: 'Neutral',          mentions: 0,          avg_sentiment: 0,        companies[ticker] = {      } else {        companies[ticker] = sentimentData.entity_sentiments[ticker];      if (sentimentData.entity_sentiments[ticker]) {    for (const ticker of this.techCompanies) {    // Extract company sentiment from entity sentiments        const companies = {};  _analyzeTechCompanies(sentimentData) {   */   * @private   * Analyze tech companies  /**    }    };      top_tech_topics: topTechTopics      topics,    return {          }));        sentiment_label: data.sentiment_label        sentiment: data.sentiment,        mentions: data.mentions,        topic: topic.replace('_', ' '),      .map(([topic, data]) => ({      .slice(0, 5)      .sort((a, b) => b[1].mentions - a[1].mentions)      .filter(([_, data]) => data.mentions > 0)    const topTechTopics = Object.entries(topics)    // Get top tech topics by mentions        }      }        topics[topic].sentiment_label = this._getSentimentLabel(topics[topic].sentiment);        topics[topic].sentiment = topics[topic].sentiment / topics[topic].mentions;      if (topics[topic].mentions > 0) {    for (const topic in topics) {    // Calculate average sentiment        }      }        }          topics[topic].sentiment += article.sentiment_score;          // Update sentiment                    });            url: article.url            sentiment: article.sentiment_score,            title: article.title,          topics[topic].articles.push({          topics[topic].mentions++;        if (combinedText.includes(searchTerm)) {        // Search for topic in combined text                const searchTerm = topic.replace('_', ' ');        // Need to use a topic-friendly search      for (const topic of this.techTopics) {            const combinedText = (article.title + ' ' + (article.summary || '')).toUpperCase();    for (const article of sentimentData.articles) {    // Analyze each article        }      };        sentiment_label: 'Neutral'        sentiment: 0,        articles: [],        mentions: 0,      topics[topic] = {    for (const topic of this.techTopics) {    // Initialize topics        const topics = {};  _analyzeTechTopics(sentimentData) {   */   * @private   * Analyze tech topics  /**    }    }      throw error;      console.error(`${this.category} Feed error:`, error.message);    } catch (error) {      };        path: filePath        data: sentimentData,        category: this.category,      return {            console.log(`${this.category} Feed: Collected ${sentimentData.articles.length} technology news items`);            );        }          source: 'alpha_vantage_intelligence'          timestamp: new Date().toISOString(),          feed_category: this.category,          type: 'news_feed',        {        sentimentData,        'analysis',        'Technology Sector Intelligence',      const filePath = this.repository.storeResearch(      // Store in repository            sentimentData.tech_companies = this._analyzeTechCompanies(sentimentData);      sentimentData.tech_topics = this._analyzeTechTopics(sentimentData);      // Add tech-specific analysis            const sentimentData = this._processSentimentData(response.data);      // Process the sentiment data            }        throw new Error(`API error: ${response.data['Error Message']}`);      if (response.data['Error Message']) {            });        }          apikey: this.apiKey          limit: 50,          sort: 'RELEVANCE',          topics: 'technology,artificial_intelligence,technology_semiconductor,technology_software',          function: 'NEWS_SENTIMENT',        params: {      const response = await axios.get(this.baseUrl, {            console.log(`${this.category} Feed: Collecting technology intelligence...`);    try {  async collectIntelligence() {   */   * Get technology news and sentiment  /**    }    ];      'INTC', 'AMD', 'TSM', 'CRM', 'ADBE', 'ORCL', 'CSCO'      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',    this.techCompanies = [    // Key tech companies        ];      '5G', 'QUANTUM', 'ROBOTICS', 'AUTONOMOUS', 'METAVERSE'      'CYBERSECURITY', 'CLOUD', 'SEMICONDUCTORS', 'CHIPS',      'AI', 'ARTIFICIAL_INTELLIGENCE', 'MACHINE_LEARNING', 'BLOCKCHAIN',    this.techTopics = [    // Tech topics to track        this.category = 'tech';    this.baseUrl = 'https://www.alphavantage.co/query';        }      throw new Error('Alpha Vantage API key not found in environment variables');    if (!this.apiKey) {        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;    this.repository = config.repository || new ResearchRepository();  constructor(config = {}) {class TechFeed {}  }    return 'Very Bearish';    if (score > -0.5) return 'Bearish';    if (score > -0.25) return 'Neutral';    if (score >= 0.25) return 'Bullish';    if (score >= 0.5) return 'Very Bullish';  _getSentimentLabel(score) {   */   * @private   * Convert sentiment score to label  /**    }    return result;        }      }        };          sentiment_label: this._getSentimentLabel(data.total_sentiment / data.count)          avg_relevance: data.relevance / data.count,          mentions: data.count,          avg_sentiment: data.total_sentiment / data.count,        result.entity_sentiments[symbol] = {      for (const [symbol, data] of Object.entries(entities)) {      // Process entity sentiments              .slice(0, 5);        .sort((a, b) => b.score - a.score)        .map(([topic, score]) => ({ topic, score }))      result.top_themes = Object.entries(topics)      // Find top themes            result.overall_sentiment_label = this._getSentimentLabel(result.overall_sentiment_score);      result.overall_sentiment_score = totalSentiment / rawData.feed.length;      // Calculate average sentiment            });        });            })) : []              relevance: parseFloat(t.relevance_score || 0)              sentiment: parseFloat(t.ticker_sentiment_score || 0),              symbol: t.ticker,            article.ticker_sentiment.map(t => ({          tickers: article.ticker_sentiment ?           sentiment_label: this._getSentimentLabel(sentimentScore),          sentiment_score: sentimentScore,          summary: article.summary,          authors: article.authors,          time_published: article.time_published,          url: article.url,          title: article.title,        result.articles.push({        // Add to articles array                }          });            entities[symbol].relevance += parseFloat(ticker.relevance_score || 0);            entities[symbol].total_sentiment += parseFloat(ticker.ticker_sentiment_score || 0);            entities[symbol].count += 1;                        }              };                relevance: 0                total_sentiment: 0,                count: 0,              entities[symbol] = {            if (!entities[symbol]) {            const symbol = ticker.ticker;          article.ticker_sentiment.forEach(ticker => {        if (article.ticker_sentiment) {        // Track entity sentiments                }          });            topics[topic.topic] += parseFloat(topic.relevance_score || 0);            if (!topics[topic.topic]) topics[topic.topic] = 0;          article.topics.forEach(topic => {        if (article.topics) {        // Track topics                else result.neutral_articles++;        else if (sentimentScore < -0.25) result.bearish_articles++;        if (sentimentScore > 0.25) result.bullish_articles++;        // Count sentiment categories                totalSentiment += sentimentScore;        const sentimentScore = parseFloat(article.overall_sentiment_score || 0);        // Extract sentiment      rawData.feed.forEach(article => {            const entities = {};      const topics = {};      let totalSentiment = 0;    if (rawData.feed && rawData.feed.length > 0) {    // Process articles        };      entity_sentiments: {}      top_themes: [],      articles: [],      neutral_articles: 0,      bearish_articles: 0,      bullish_articles: 0,      overall_sentiment_label: '',      overall_sentiment_score: 0,      category: this.category,      timestamp: new Date().toISOString(),    const result = {  _processSentimentData(rawData) {   */   * @private   * Process raw sentiment data  /**    }    };      top_indicators: topIndicators      indicators,    return {          }));        sentiment_label: data.sentiment_label        sentiment: data.sentiment,        mentions: data.mentions,        indicator,      .map(([indicator, data]) => ({      .slice(0, 5)      .sort((a, b) => b[1].mentions - a[1].mentions)      .filter(([_, data]) => data.mentions > 0)    const topIndicators = Object.entries(indicators)    // Get top mentioned indicators        }      );        new Date(b.time_published) - new Date(a.time_published)      indicators[indicator].articles.sort((a, b) =>     for (const indicator in indicators) {    // Sort articles by recency        }      }        indicators[indicator].sentiment_label = this._getSentimentLabel(indicators[indicator].sentiment);        indicators[indicator].sentiment = indicators[indicator].sentiment / indicators[indicator].mentions;      if (indicators[indicator].mentions > 0) {    for (const indicator in indicators) {    // Calculate average sentiment and set label        }      }        }          indicators[indicator].sentiment += article.sentiment_score;          // Update sentiment                    });            time_published: article.time_published            url: article.url,            sentiment: article.sentiment_score,            title: article.title,          indicators[indicator].articles.push({          indicators[indicator].mentions++;        if (titleMatch || summaryMatch) {                const summaryMatch = article.summary && article.summary.toUpperCase().includes(indicator);        const titleMatch = article.title && article.title.toUpperCase().includes(indicator);        // Search for indicator in title or summary      for (const indicator of this.internationalIndicators) {    for (const article of sentimentData.articles) {    // Analyze each article        }      };        sentiment_label: 'Neutral'        sentiment: 0,        articles: [],        mentions: 0,      indicators[indicator] = {    for (const indicator of this.internationalIndicators) {    // Initialize indicators        const indicators = {};  _analyzeInternationalIndicators(sentimentData) {   */   * @private   * Analyze international indicators  /**    }    }      throw error;      console.error(`${this.category} Feed error:`, error.message);    } catch (error) {      };        path: filePath        data: sentimentData,        category: this.category,      return {            console.log(`${this.category} Feed: Collected ${sentimentData.articles.length} international news items`);            );        }          source: 'alpha_vantage_intelligence'          timestamp: new Date().toISOString(),          feed_category: this.category,          type: 'news_feed',        {        sentimentData,        'analysis',        'International Intelligence',      const filePath = this.repository.storeResearch(      // Store in repository            sentimentData.international_indicators = this._analyzeInternationalIndicators(sentimentData);      // Add international-specific analysis            const sentimentData = this._processSentimentData(response.data);      // Process the sentiment data            }        throw new Error(`API error: ${response.data['Error Message']}`);      if (response.data['Error Message']) {            });        }          apikey: this.apiKey          limit: 50,          sort: 'RELEVANCE',          topics: 'economy_international,economy_fiscal,economy_monetary,finance',          function: 'NEWS_SENTIMENT',        params: {      const response = await axios.get(this.baseUrl, {            console.log(`${this.category} Feed: Collecting international intelligence...`);    try {  async collectIntelligence() {   */   * Get international news and sentiment  /**    }    ];      'UNEMPLOYMENT', 'JOBS', 'NFP', 'TREASURY', 'YIELD'      'GDP', 'CPI', 'INFLATION', 'FED', 'FOMC', 'INTEREST_RATES',    this.internationalIndicators = [    // Define key international indicators to track        this.category = 'international';    this.baseUrl = 'https://www.alphavantage.co/query';    this.baseUrl = 'https://www.alphavantage.co/query';
    this.category = 'international';
    
    // Define key regions to track
    this.regions = [
      'CHINA', 'EUROPE', 'JAPAN', 'ASIA', 'EMERGING_MARKETS',
      'UK', 'GERMANY', 'INDIA', 'RUSSIA', 'BRAZIL'
    ];
  }
  
  /**








module.exports = { MacroFeed, InternationalFeed };
}
  }
    return 'Very Bearish';
    if (score > -0.5) return 'Bearish';    if (score > -0.25) return 'Neutral';

    if (score >= 0.25) return 'Bullish';    if (score >= 0.5) return 'Very Bullish';






  _getSentimentLabel(score) {   */   * @private




   * Convert sentiment score to label  /**  
  }
    return `${year}${month}${day}T0000`;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');    const year = date.getFullYear();


        date.setDate(date.getDate() - days);    const date = new Date();

  _getDateXDaysAgo(days) {   */   * @private   * Get date X days ago in YYYYMMDD format

  /**    }    return result;        }      }        };          sentiment_label: this._getSentimentLabel(data.total_sentiment / data.count)

          avg_relevance: data.relevance / data.count,

          mentions: data.count,          avg_sentiment: data.total_sentiment / data.count,        result.entity_sentiments[symbol] = {      for (const [symbol, data] of Object.entries(entities)) {







      // Process entity sentiments              .slice(0, 5);        .sort((a, b) => b.score - a.score)

        .map(([topic, score]) => ({ topic, score }))      result.top_themes = Object.entries(topics)


      // Find top themes            result.overall_sentiment_label = this._getSentimentLabel(result.overall_sentiment_score);


      result.overall_sentiment_score = totalSentiment / rawData.feed.length;





      // Calculate average sentiment            });        });            })) : []              relevance: parseFloat(t.relevance_score || 0)
              sentiment: parseFloat(t.ticker_sentiment_score || 0),
              symbol: t.ticker,            article.ticker_sentiment.map(t => ({          tickers: article.ticker_sentiment ? 





          sentiment_label: this._getSentimentLabel(sentimentScore),          sentiment_score: sentimentScore,          summary: article.summary,          authors: article.authors,
          time_published: article.time_published,
          url: article.url,
          title: article.title,
        result.articles.push({
        // Add to articles array
        
        }
          });
            entities[symbol].relevance += parseFloat(ticker.relevance_score || 0);
            entities[symbol].total_sentiment += parseFloat(ticker.ticker_sentiment_score || 0);
            entities[symbol].count += 1;
            
            }
              };
                relevance: 0
                total_sentiment: 0,
                count: 0,
              entities[symbol] = {
            if (!entities[symbol]) {
            const symbol = ticker.ticker;
          article.ticker_sentiment.forEach(ticker => {        if (article.ticker_sentiment) {
        // Track entity sentiments
                }          });            topics[topic.topic] += parseFloat(topic.relevance_score || 0);




            if (!topics[topic.topic]) topics[topic.topic] = 0;          article.topics.forEach(topic => {        if (article.topics) {        // Track topics                else result.neutral_articles++;        else if (sentimentScore < -0.25) result.bearish_articles++;   * Get international market news and sentiment
   */
  async collectIntelligence() {








        if (sentimentScore > 0.25) result.bullish_articles++;

        // Count sentiment categories
                totalSentiment += sentimentScore;        const sentimentScore = parseFloat(article.overall_sentiment_score || 0);


        // Extract sentiment
      rawData.feed.forEach(article => {





            const entities = {};      const topics = {};      let totalSentiment = 0;    if (rawData.feed && rawData.feed.length > 0) {





    // Process articles        };      entity_sentiments: {}



      top_themes: [],      articles: [],      neutral_articles: 0,      bearish_articles: 0,
      bullish_articles: 0,      overall_sentiment_label: '',      overall_sentiment_score: 0,      category: this.category,      timestamp: new Date().toISOString(),
    const result = {
  _processSentimentData(rawData) {
   */
   * @private
   * Process raw sentiment data
  /**
    }    };      top_regions: topRegions      regions,    return {    
      }));
        sentiment_label: data.sentiment_label




        sentiment: data.sentiment,        mentions: data.mentions,        region: region.replace('_', ' '),
      .map(([region, data]) => ({      .slice(0, 5)


      .sort((a, b) => b[1].mentions - a[1].mentions)
      .filter(([_, data]) => data.mentions > 0)

    const topRegions = Object.entries(regions)
    // Get top regions by mentions
    
    }      }        regions[region].sentiment_label = this._getSentimentLabel(regions[region].sentiment);

        regions[region].sentiment = regions[region].sentiment / regions[region].mentions;
      if (regions[region].mentions > 0) {
    for (const region in regions) {
    // Calculate average sentiment
    
    }
      }
        }
          regions[region].sentiment += article.sentiment_score;
          // Update sentiment
                    });            time_published: article.time_published

            url: article.url,            sentiment: article.sentiment_score,            title: article.title,          regions[region].articles.push({




          regions[region].mentions++;        if (titleMatch || summaryMatch) {



        
          article.summary.toUpperCase().includes(searchTerm);        const summaryMatch = article.summary &&                     article.title.toUpperCase().includes(searchTerm);



        const titleMatch = article.title && 
        // Search for region in title or summary


                const searchTerm = region.replace('_', ' ');        // Need to use a region-friendly search





      for (const region of this.regions) {    for (const article of sentimentData.articles) {



    // Analyze each article        }      };        sentiment_label: 'Neutral'        sentiment: 0,

        articles: [],
        mentions: 0,
      regions[region] = {    for (const region of this.regions) {

    // Initialize regions
    
    const regions = {};
  _analyzeRegions(sentimentData) {

   */   * @private   * Analyze regions  /**    }    }      throw error;



      console.error(`${this.category} Feed error:`, error.message);
    } catch (error) {      };


        path: filePath        data: sentimentData,        category: this.category,      return {            console.log(`${this.category} Feed: Collected ${sentimentData.articles.length} international news items`);


            );



        }
          source: 'alpha_vantage_intelligence'
          timestamp: new Date().toISOString(),
          feed_category: this.category,

          type: 'news_feed',        {        sentimentData,        'analysis',        'International Markets Intelligence',      const filePath = this.repository.storeResearch(
      // Store in repository
      
      sentimentData.regional_analysis = this._analyzeRegions(sentimentData);
      // Add regional analysis            const sentimentData = this._processSentimentData(response.data);
      // Process the sentiment data
      
      }
        throw new Error(`API error: ${response.data['Error Message']}`);    try {



      if (response.data['Error Message']) {            });




        }          apikey: this.apiKey          limit: 50,          sort: 'LATEST',          time_from: this._getDateXDaysAgo(3), // Last 3 days
          topics: 'economy_macro,economy_fiscal,financial_markets,global_economy',      console.log(`${this.category} Feed: Collecting international markets intelligence...`);

          function: 'NEWS_SENTIMENT',      
      const response = await axios.get(this.baseUrl, {
        params: {