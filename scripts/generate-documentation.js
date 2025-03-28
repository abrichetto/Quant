const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');quire('../src/utils/research-repository');
const EventEmitter = require('events');
const ResearchRepository = require('../../../utils/research-repository');
  const repository = new ResearchRepository();
// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });
  
class CryptoFeed extends EventEmitter {sts
  constructor(config = {}) {repository.baseDir, 'documentation');
    super();istsSync(docsDir)) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    
    this.config = {ure documentation
      filterLevel: 0.6, // Noise filtering threshold (0-1)
      signalThreshold: 0.65, // Minimum confidence for signalstation', 'news-intelligence-architecture.md'),
      specialFocus: [], // Special topics to prioritize
      maxArticlesPerQuery: 50, // Max articles to process
      ...config
    };riteFileSync(
    path.join(docsDir, 'news-intelligence-architecture.md'),
    this.baseUrl = 'https://www.alphavantage.co/query';
    
    // Track recent articles to avoid duplicates
    this.recentArticleIds = new Set();tecture documentation saved to repository.');
    
    // Cryptocurrencies to monitorol
    this.targetAssets = [ = fs.readFileSync(
      // Current assetsository', 'documentation', 'crypto-monitoring-protocol.md'),
      'BTC', 'ETH', 'AVAX', 'ADA', 'MATIC', 
      'SUI', 'DOGE', 'HBAR', 'ONE', 'UNI', 'SOL',
      
      // Additional promising assets for signal monitoring
      'XRP',  // Ripple - major payment protocolir, 'crypto-monitoring-protocol.md'),
      'DOT',  // Polkadot - interoperability blockchainc
      'LINK', // Chainlink - oracle network
      'ATOM', // Cosmos - interchain ecosystem
      'FIL',  // Filecoin - decentralized storage('Cryptocurrency Monitoring Protocol documentation saved to repository.');
      'NEAR', // NEAR Protocol - developer-friendly L1
      'ARB',  // Arbitrum - Ethereum L2 scaling solutionprehensive documentation index
      'OP',   // Optimism - Ethereum L2 scaling solutionader Pro System Documentation
      'ALGO', // Algorand - high-performance blockchain
      'TON'   // Telegram Open Network - mass adoption potentialre Documents
    ];
    s Intelligence System Architecture](./news-intelligence-architecture.md)
    // Topics to trackryptocurrency Monitoring Protocol](./crypto-monitoring-protocol.md)
    this.topics = [
      'blockchain', 
      'crypto', 
      'cryptocurrency',rk
      'defi',lysis Framework
      'nft',sis Methodology
      'regulation',al Generation Protocol
      'mining_cryptocurrencies',
      'exchanges', Data Collection Systems
      'stablecoins',
      'central_bank_digital_currency'
    ];s & Social Media Collection
    ollection
    // Recent feed data
    this.lastUpdate = null;
    this.recentArticles = [];
    this.recentSentiment = {
      overall: 0,
      byAsset: {}folio Optimization Methods
    };
  }
  
  /**
   * Fetch crypto news and sentiment data
   */ution Framework
  async fetch() {
    try {
      console.log('Crypto feed fetching data...');
      th.join(docsDir, 'index.md'),
      // Fetch news for tracked assets
      const assetData = await this._fetchAssetNews();
      
      // Fetch topical newsndex created.');
      const topicalData = await this._fetchTopicalNews();
      
      // Merge and deduplicate resultsreResearch(
      const combinedArticles = this._mergeResults(assetData, topicalData);System Architecture Documentation',
       'reports',
      // Update state  {
      this.lastUpdate = new Date().toISOString(); timestamp: new Date().toISOString(),
      this.recentArticles = combinedArticles.slice(0, 100); // Keep only the most recent 100
      
      // Update sentiment tracking     title: 'News Intelligence System Architecture',
      this._updateSentimentTracking(combinedArticles);ion/news-intelligence-architecture.md',
      e of the news intelligence system including feed agents and director.'
      return combinedArticles;
    } catch (error) {   {
      console.error('Error fetching crypto feed data:', error.message);      title: 'Cryptocurrency Monitoring Protocol',
      return [];
    }      summary: 'Detailed protocol for monitoring 11 target cryptocurrencies including data collection, analysis and signal generation.'
  }
  
  /**
   * Process the fetched data and extract signals
   * @param {Array} articles - Articles to processtype: 'system_documentation',
   */ true,
  async process(articles) {
    if (!articles || articles.length === 0) {
      return [];
    }
    );
    console.log(`Crypto feed processing ${articles.length} articles...`);ole.log('All documentation generated successfully for due diligence purposes.');
    
    try {
      // Apply noise filtering.catch(console.error);      const filteredArticles = this._filterNoise(articles);      console.log(`Filtered to ${filteredArticles.length} significant articles`);            // Extract signals      const signals = this._extractSignals(filteredArticles);      console.log(`Generated ${signals.length} signals from crypto news`);            // Look for critical developments that need immediate attention      this._checkForCriticalDevelopments(filteredArticles, signals);            // Store the processed data      this._storeProcessedData(filteredArticles, signals);            return signals;    } catch (error) {      console.error('Error processing crypto feed data:', error.message);      return [];    }  }    /**   * Generate a summary of the feed's recent data   */  async generateSummary() {    const summary = {      timestamp: new Date().toISOString(),      last_updated: this.lastUpdate,      article_count: this.recentArticles.length,      sentiment: this._getOverallSentiment(),      top_assets: this._getTopAssetsByMention(),      top_topics: this._getTopTopics(),      significant_developments: this._getSignificantDevelopments()    };        return summary;  }    /**   * Fetch news for specific crypto assets   * @private   */  async _fetchAssetNews() {    // Create batches of assets to avoid too long URLs    const batches = [];    for (let i = 0; i < this.targetAssets.length; i += 5) {      batches.push(this.targetAssets.slice(i, i + 5));    }        const allResults = [];        for (const batch of batches) {      try {        const tickers = batch.join(',');                const response = await axios.get(this.baseUrl, {          params: {            function: 'NEWS_SENTIMENT',            tickers: tickers,            apikey: this.apiKey,            sort: 'RELEVANCE',            limit: this.config.maxArticlesPerQuery          }        });                if (response.data.feed) {          allResults.push(...response.data.feed);        }                // Respect API rate limits        await new Promise(resolve => setTimeout(resolve, 2000));      } catch (error) {        console.error(`Error fetching news for crypto assets ${batch.join(',')}:`, error.message);      }    }        return this._processArticles(allResults);  }    /**   * Fetch news for crypto topics   * @private   */  async _fetchTopicalNews() {    try {      // Combine topics with a comma      const topicsString = this.topics.join(',');            const response = await axios.get(this.baseUrl, {        params: {          function: 'NEWS_SENTIMENT',          topics: topicsString,          apikey: this.apiKey,          sort: 'LATEST',          limit: this.config.maxArticlesPerQuery        }      });            if (!response.data.feed) {        return [];      }            return this._processArticles(response.data.feed);    } catch (error) {      console.error('Error fetching topical crypto news:', error.message);      return [];    }  }    /**   * Process raw articles into a standard format   * @private   */  _processArticles(articles) {    if (!articles || articles.length === 0) return [];        return articles.map(article => {      // Extract relevant crypto tickers      const cryptoTickers = article.ticker_sentiment        ? article.ticker_sentiment            .filter(t => this.targetAssets.includes(t.ticker))            .map(t => ({              symbol: t.ticker,              sentiment: parseFloat(t.ticker_sentiment_score || 0),              relevance: parseFloat(t.relevance_score || 0)            }))        : [];            // Extract topics      const articleTopics = article.topics         ? article.topics.map(t => ({            topic: t.topic,            relevance: parseFloat(t.relevance_score || 0)          }))        : [];            return {        id: article.url || `${article.title}-${article.time_published}`,        title: article.title,        summary: article.summary,        url: article.url,        time_published: article.time_published,        authors: article.authors,        overall_sentiment: parseFloat(article.overall_sentiment_score || 0),        sentiment_label: article.overall_sentiment_label || 'neutral',        tickers: cryptoTickers,        topics: articleTopics,        source: article.source,        // Add extracted entities        entities: cryptoTickers.map(t => t.symbol),        // Add topic names        topics_list: articleTopics.map(t => t.topic)      };    });  }    /**   * Merge and deduplicate results from multiple queries   * @private   */  _mergeResults(...dataSets) {    // Flatten all data sets    const allArticles = dataSets.flat();        // Deduplicate by article ID or URL    const uniqueArticles = [];    const seenIds = new Set();        for (const article of allArticles) {      const articleId = article.id;            // Skip if we've seen this article already or it's in our recent history      if (seenIds.has(articleId) || this.recentArticleIds.has(articleId)) {        continue;      }            // Add to unique articles      uniqueArticles.push(article);      seenIds.add(articleId);            // Add to recent history      this.recentArticleIds.add(articleId);            // Keep recent article set to a reasonable size      if (this.recentArticleIds.size > 500) {        // Remove oldest entries (approximately)        const idsArray = Array.from(this.recentArticleIds);        for (let i = 0; i < 100; i++) {          this.recentArticleIds.delete(idsArray[i]);        }      }    }        return uniqueArticles;  }    /**   * Update sentiment tracking with new articles   * @private   */  _updateSentimentTracking(articles) {    if (!articles || articles.length === 0) return;        let overallSentimentSum = 0;    const assetSentimentSums = {};    const assetSentimentCounts = {};        articles.forEach(article => {      // Update overall sentiment      overallSentimentSum += article.overall_sentiment;            // Update sentiment for specific assets      (article.tickers || []).forEach(ticker => {        const symbol = ticker.symbol;        if (!assetSentimentSums[symbol]) {          assetSentimentSums[symbol] = 0;          assetSentimentCounts[symbol] = 0;        }        assetSentimentSums[symbol] += ticker.sentiment;        assetSentimentCounts[symbol]++;      });    });        // Calculate average sentiments    this.recentSentiment.overall = overallSentimentSum / articles.length;        // Calculate asset-specific sentiment    Object.keys(assetSentimentSums).forEach(symbol => {      this.recentSentiment.byAsset[symbol] =         assetSentimentSums[symbol] / assetSentimentCounts[symbol];    });  }    /**   * Filter out noise from the articles   * @private   */  _filterNoise(articles) {    // Implement noise filtering based on:    // 1. Relevance to our target assets    // 2. Quality of source (could be improved with source reliability ratings)    // 3. Sentiment extremity (very positive or very negative articles)    // 4. Topics matching our special focus        return articles.filter(article => {      // If it contains a ticker with high relevance, keep it      if (article.tickers && article.tickers.some(t => t.relevance > 0.8)) {        return true;      }            // If it strongly matches any of our special focus topics, keep it      if (this.config.specialFocus.length > 0 &&           article.topics_list &&           article.topics_list.some(topic =>             this.config.specialFocus.includes(topic))) {        return true;      }            // If sentiment is strong (positive or negative), keep it      if (Math.abs(article.overall_sentiment) > 0.5) {        return true;      }            // Use the filterLevel as a threshold - higher means more filtering      return Math.random() > this.config.filterLevel;    });  }    /**   * Extract trading signals from filtered articles   * @private   */  _extractSignals(articles) {    const signals = [];        // Group articles by asset    const articlesByAsset = {};        articles.forEach(article => {      (article.tickers || []).forEach(ticker => {        const symbol = ticker.symbol;        if (!articlesByAsset[symbol]) {          articlesByAsset[symbol] = [];        }        articlesByAsset[symbol].push({          article,          ticker_sentiment: ticker.sentiment,          relevance: ticker.relevance        });      });    });        // Generate signals for assets with significant coverage    Object.entries(articlesByAsset).forEach(([symbol, assetArticles]) => {      // Only generate signals if we have enough relevant articles      if (assetArticles.length < 2) return;            // Calculate weighted average sentiment      let weightedSentimentSum = 0;      let weightSum = 0;            assetArticles.forEach(item => {        const weight = item.relevance;        weightedSentimentSum += item.ticker_sentiment * weight;        weightSum += weight;      });            const averageSentiment = weightedSentimentSum / weightSum;            // Calculate confidence based on number of sources and their relevance      const confidence = Math.min(        0.5 + (assetArticles.length * 0.1) + (weightSum / assetArticles.length * 0.2),        0.95      );            // Only create signals with sufficient confidence      if (confidence >= this.config.signalThreshold) {        // Create topics list from all related articles        const topics = new Set();        assetArticles.forEach(item => {          (item.article.topics_list || []).forEach(topic => topics.add(topic));        });                signals.push({          id: `crypto-${symbol}-${Date.now()}`,          symbol,          asset_type: 'crypto',          signal_type: 'news_sentiment',          sentiment: averageSentiment,          confidence,          timestamp: new Date().toISOString(),          sources_count: assetArticles.length,          topics: Array.from(topics),          sources: assetArticles.map(item => ({            title: item.article.title,            url: item.article.url,            sentiment: item.ticker_sentiment,            published: item.article.time_published          })),          // For higher-level processing          entities: [symbol],          priority: Math.abs(averageSentiment) > 0.8 ? 'immediate' : 'normal'        });      }    });        // Generate signals for significant topics without specific asset    const significantTopics = this.config.specialFocus.filter(topic =>       articles.some(article =>         article.topics_list && article.topics_list.includes(topic)      )    );        significantTopics.forEach(topic => {      const topicArticles = articles.filter(article =>         article.topics_list && article.topics_list.includes(topic)      );            if (topicArticles.length < 3) return; // Need enough coverage            // Calculate average sentiment      const avgSentiment = topicArticles.reduce(        (sum, article) => sum + article.overall_sentiment,         0      ) / topicArticles.length;            // Calculate confidence based on number of sources      const confidence = Math.min(0.5 + (topicArticles.length * 0.05), 0.9);            if (confidence >= this.config.signalThreshold) {        signals.push({          id: `crypto-topic-${topic}-${Date.now()}`,          topic,          signal_type: 'topic_sentiment',          sentiment: avgSentiment,          confidence,          timestamp: new Date().toISOString(),          sources_count: topicArticles.length,          sources: topicArticles.map(article => ({            title: article.title,            url: article.url,            sentiment: article.overall_sentiment,            published: article.time_published          })),          // For higher-level processing          topics: [topic],          priority: Math.abs(avgSentiment) > 0.8 ? 'immediate' : 'normal'        });      }    });        return signals;  }    /**   * Check for critical developments needing immediate attention   * @private   */  _checkForCriticalDevelopments(articles, signals) {    // Keywords indicating potentially critical developments    const criticalKeywords = [      'hack', 'hacked', 'security breach', 'exploit',       'collapse', 'bankruptcy', 'banned', 'ban',      'sec lawsuit', 'sec charges', 'fraud', 'investigation',      'emergency', 'crash', 'flash crash'    ];        // Look for articles with critical keywords in the title    const criticalArticles = articles.filter(article =>       criticalKeywords.some(keyword =>         article.title.toLowerCase().includes(keyword)      )    );        if (criticalArticles.length > 0) {      // For each critical article, check which assets are affected      criticalArticles.forEach(article => {        const affectedAssets = article.tickers || [];                if (affectedAssets.length > 0) {          // Emit critical signal for each affected asset          affectedAssets.forEach(ticker => {            this.emit('critical-signal', {              id: `crypto-critical-${ticker.symbol}-${Date.now()}`,              title: `CRITICAL: ${article.title}`,              description: article.summary,              symbol: ticker.symbol,              sentiment: ticker.sentiment,              confidence: 0.9, // High confidence for critical events              url: article.url,              time_published: article.time_published,              source: article.source,              type: 'critical_development'            });          });        } else {          // Emit general crypto market critical signal          this.emit('critical-signal', {            id: `crypto-critical-market-${Date.now()}`,            title: `CRITICAL: ${article.title}`,            description: article.summary,            market: 'crypto',            sentiment: article.overall_sentiment,            confidence: 0.85,            url: article.url,            time_published: article.time_published,            source: article.source,            type: 'critical_market_development'          });        }      });    }  }    /**   * Store processed data in the repository   * @private   */  _storeProcessedData(articles, signals) {    // Store only if we have meaningful data    if (articles.length === 0 && signals.length === 0) return;        const data = {      timestamp: new Date().toISOString(),      articles: articles.slice(0, 50), // Store only the top 50 articles      signals,      sentiment: {        overall: this.recentSentiment.overall,        byAsset: this.recentSentiment.byAsset      }    };        // Store as research    this.repository.storeResearch(      'Crypto Feed Analysis',      'analysis',      data,      {        type: 'feed_analysis',        feed_type: 'crypto',        timestamp: data.timestamp,        signals_count: signals.length      }    );  }    /**   * Get the overall sentiment from recent data   * @private   */  _getOverallSentiment() {    // Convert numeric sentiment to label    const sentiment = this.recentSentiment.overall;        if (sentiment >= 0.7) return 'very bullish';    if (sentiment >= 0.3) return 'bullish';    if (sentiment > -0.3) return 'neutral';    if (sentiment > -0.7) return 'bearish';    return 'very bearish';  }    /**   * Get the top assets by mention frequency   * @private   */  _getTopAssetsByMention() {    // Count mentions in recent articles    const assetMentions = {};        this.recentArticles.forEach(article => {      (article.tickers || []).forEach(ticker => {        const symbol = ticker.symbol;        if (!assetMentions[symbol]) {          assetMentions[symbol] = {            mentions: 0,            sentiment_sum: 0          };        }        assetMentions[symbol].mentions++;        assetMentions[symbol].sentiment_sum += ticker.sentiment;      });    });        // Calculate average sentiment and return top assets    return Object.entries(assetMentions)      .map(([symbol, data]) => ({        symbol,        mentions: data.mentions,        avg_sentiment: data.sentiment_sum / data.mentions      }))      .sort((a, b) => b.mentions - a.mentions)      .slice(0, 5);  }    /**   * Get the top topics from recent articles   * @private   */  _getTopTopics() {    // Count topic occurrences    const topicCounts = {};        this.recentArticles.forEach(article => {      (article.topics_list || []).forEach(topic => {        if (!topicCounts[topic]) {          topicCounts[topic] = 0;        }        topicCounts[topic]++;      });    });        // Return top topics by count    return Object.entries(topicCounts)      .map(([topic, count]) => ({ topic, count }))      .sort((a, b) => b.count - a.count)      .slice(0, 5);  }    /**   * Get the most significant recent developments   * @private   */  _getSignificantDevelopments() {    // Look for articles with strong sentiment or high relevance    return this.recentArticles      .filter(article =>         Math.abs(article.overall_sentiment) > 0.6 || 
        (article.tickers && article.tickers.some(t => t.relevance > 0.8))
      )
      .map(article => ({
        title: article.title,
        sentiment: article.overall_sentiment,
        url: article.url,
        time_published: article.time_published
      }))
      .slice(0, 3);
  }
}

module.exports = CryptoFeed;