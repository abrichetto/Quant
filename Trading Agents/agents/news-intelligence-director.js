const ResearchRepository = require('../../utils/research-repository');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', 'config', '.env') });

class NewsIntelligenceDirector {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!this.apiKey) {
      console.warn('Alpha Vantage API key not found. Some intelligence features will be limited.');
    }
    
    // Settings for noise filtering
    this.settings = {
      relevanceThreshold: 0.65,  // Minimum relevance score to consider a news item important
      sentimentThreshold: 0.25,  // Minimum absolute sentiment score to consider significant
      maxSignalsPerCategory: 5,  // Maximum number of signals to pass from each feed
      recencyWeight: 0.6,        // How much to weight recent news vs. relevant news
      minimumMentions: 2,        // Minimum mentions required for an entity to be tracked
      ...config.settings
    };

    // Intelligence prioritization settings
    this.thresholds = {
      highPriority: 0.7,  // Above this sentiment impact is high priority
      lowPriority: 0.3,   // Below this sentiment impact is low priority
      signalThreshold: 0.5, // Threshold for generating a trading signal
      confidenceMinimum: 0.6 // Minimum confidence to include in reports
    };
    
    // Keep track of recent important intelligence
    this.recentIntelligence = [];
    this.maxRecentItems = 50;
  }
  
  /**
   * Register feed agents with the director
   */
  registerFeeds(feeds) {
    this.feeds = feeds;
  }

  /**
   * Aggregate and prioritize intelligence from all news feeds
   * @param {Array} feedsData - Array of data from various news feed agents
   */
  async aggregateIntelligence(feedsData) {
    console.log(`News Intelligence Director: Aggregating data from ${feedsData.length} feeds...`);
    
    // Initialize aggregated intelligence
    const intelligence = {
      timestamp: new Date().toISOString(),
      priority_signals: [],
      market_sentiment: {
        overall: 0,
        by_category: {}
      },
      key_themes: [],
      top_entities: [],
      category_insights: {},
      recent_shifts: [],
      noise_filtered: 0,
    };
    
    let totalArticles = 0;
    let filteredArticles = 0;
    const allThemes = {};
    const allEntities = {};
    const allSignals = [];
    
    // Process each feed
    for (const feed of feedsData) {
      if (!feed || !feed.data) continue;
      
      const category = feed.category || 'uncategorized';
      intelligence.category_insights[category] = {
        sentiment_score: feed.data.overall_sentiment_score || 0,
        sentiment_label: feed.data.overall_sentiment_label || 'Neutral',
        top_signals: []
      };
      
      // Track overall sentiment by category
      intelligence.market_sentiment.by_category[category] = feed.data.overall_sentiment_score || 0;
      
      // Process articles for signals
      if (feed.data.articles) {
        totalArticles += feed.data.articles.length;
        
        // Filter and prioritize articles
        const prioritizedArticles = this._prioritizeArticles(feed.data.articles, category);
        filteredArticles += feed.data.articles.length - prioritizedArticles.length;
        
        // Extract signals from prioritized articles
        const categorySignals = this._extractSignalsFromArticles(prioritizedArticles, category);
        
        // Add to category insights
        intelligence.category_insights[category].top_signals = categorySignals.slice(0, this.settings.maxSignalsPerCategory);
        
        // Add to all signals
        allSignals.push(...categorySignals);
        
        // Process themes
        if (feed.data.top_themes) {
          feed.data.top_themes.forEach(theme => {
            if (!allThemes[theme.topic]) allThemes[theme.topic] = { score: 0, categories: [] };
            allThemes[theme.topic].score += theme.score;
            if (!allThemes[theme.topic].categories.includes(category)) {
              allThemes[theme.topic].categories.push(category);
            }
          });
        }
        
        // Process entities
        if (feed.data.entity_sentiments) {
          Object.entries(feed.data.entity_sentiments).forEach(([entity, data]) => {
            if (!allEntities[entity]) {
              allEntities[entity] = {
                total_sentiment: 0,
                mentions: 0,
                categories: [],
                relevance: 0
              };
            }
            allEntities[entity].total_sentiment += data.avg_sentiment * data.mentions;
            allEntities[entity].mentions += data.mentions;
            allEntities[entity].relevance += data.avg_relevance * data.mentions;
            if (!allEntities[entity].categories.includes(category)) {
              allEntities[entity].categories.push(category);
            }
          });
        }
      }
      
      // Detect shifts by comparing with previous feed data
      const shifts = await this._detectShifts(feed, category);
      if (shifts.length > 0) {
        intelligence.recent_shifts.push(...shifts);
      }
    }
    
    // Calculate overall market sentiment (weighted average of category sentiments)
    const sentimentValues = Object.values(intelligence.market_sentiment.by_category);
    if (sentimentValues.length > 0) {
      intelligence.market_sentiment.overall = sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
    }
    
    // Process themes
    intelligence.key_themes = Object.entries(allThemes)
      .map(([topic, data]) => ({
        topic,
        score: data.score,
        categories: data.categories,
        cross_category: data.categories.length > 1
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    // Process entities
    intelligence.top_entities = Object.entries(allEntities)
      .filter(([_, data]) => data.mentions >= this.settings.minimumMentions)
      .map(([entity, data]) => ({
        entity,
        sentiment: data.total_sentiment / data.mentions,
        sentiment_label: this._getSentimentLabel(data.total_sentiment / data.mentions),
        mentions: data.mentions,
        categories: data.categories,
        relevance: data.relevance / data.mentions
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20);
    
    // Select priority signals across categories
    intelligence.priority_signals = this._selectPrioritySignals(allSignals);
    
    // Save noise filtering stats
    intelligence.noise_filtered = filteredArticles;
    intelligence.total_articles = totalArticles;
    intelligence.noise_reduction_percentage = Math.round((filteredArticles / totalArticles) * 100);
    
    // Store the intelligence in the repository
    const filePath = this.repository.storeResearch(
      'News Intelligence Synthesis',
      'analysis',
      intelligence,
      {
        type: 'news_intelligence',
        timestamp: intelligence.timestamp,
        priority_signals: intelligence.priority_signals.length
      }
    );
    
    console.log(`News Intelligence Director: Analysis complete. Filtered out ${intelligence.noise_reduction_percentage}% noise`);
    console.log(`Report saved to: ${filePath}`);
    
    return {
      intelligence,
      path: filePath
    };
  }
  
  /**
   * Prioritize articles based on relevance, sentiment, and recency
   * @private
   */
  _prioritizeArticles(articles, category) {
    // Filter out low-relevance articles
    const filteredArticles = articles.filter(article => {
      // Check if the article has tickers with sufficient relevance
      const hasRelevantTickers = article.tickers && article.tickers.some(t => 
        t.relevance >= this.settings.relevanceThreshold
      );
      
      // Check if article has significant sentiment
      const hasSignificantSentiment = Math.abs(article.sentiment_score) >= this.settings.sentimentThreshold;
      
      // Articles with either high relevance or significant sentiment pass through
      return hasRelevantTickers || hasSignificantSentiment;
    });
    
    // Calculate priority score for each article
    const scoredArticles = filteredArticles.map(article => {
      // Calculate recency score (1.0 = now, decreases with age)
      const pubTime = new Date(article.time_published).getTime();
      const currentTime = new Date().getTime();
      const hoursDiff = (currentTime - pubTime) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - (hoursDiff / 72)); // 3 days = 0 score
      
      // Calculate relevance score
      const relevanceScore = article.tickers ? 
        Math.max(...article.tickers.map(t => t.relevance)) : 0.5;
      
      // Calculate sentiment impact score
      const sentimentImpactScore = Math.abs(article.sentiment_score);
      
      // Calculate final priority score
      const priorityScore = (
        recencyScore * this.settings.recencyWeight + 
        relevanceScore * (1 - this.settings.recencyWeight)
      ) * (1 + sentimentImpactScore);
      
      return { ...article, priorityScore };
    });
    
    // Sort by priority score
    return scoredArticles.sort((a, b) => b.priorityScore - a.priorityScore);
  }
  
  /**
   * Extract signals from articles
   * @private
   */
  _extractSignalsFromArticles(articles, category) {
    return articles.map(article => ({
      headline: article.title,
      url: article.url,
      time_published: article.time_published,
      sentiment: article.sentiment_score,
      sentiment_label: article.sentiment_label,
      category,
      priority_score: article.priorityScore,
      entities: article.tickers ? article.tickers.map(t => ({
        symbol: t.symbol,
        sentiment: t.sentiment,
        relevance: t.relevance
      })) : [],
      summary: article.summary
    }));
  }
  
  /**
   * Select priority signals across all categories
   * @private
   */
  _selectPrioritySignals(allSignals) {
    // First, select signals with highest overall priority
    const highPrioritySignals = allSignals
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 10);
    
    // Then select signals with significant sentiment (both positive and negative)
    const significantPositiveSignals = allSignals
      .filter(signal => signal.sentiment > 0.4)
      .sort((a, b) => b.sentiment - a.sentiment)
      .slice(0, 5);
    
    const significantNegativeSignals = allSignals
      .filter(signal => signal.sentiment < -0.4)
      .sort((a, b) => a.sentiment - b.sentiment)
      .slice(0, 5);
    
    // Combine and deduplicate signals by URL
    const combinedSignals = [
      ...highPrioritySignals,
      ...significantPositiveSignals,
      ...significantNegativeSignals
    ];
    
    const uniqueSignals = Array.from(
      new Map(combinedSignals.map(signal => [signal.url, signal])).values()
    );
    
    // Final sort by priority score
    return uniqueSignals
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 15);
  }
  
  /**
   * Detect significant shifts in sentiment or topics
   * @private
   */
  async _detectShifts(feed, category) {
    try {
      // Find previous feed from the same category
      const previousFeeds = this.repository.search({
        type: 'research',
        'metadata.feed_category': category,
        'metadata.type': 'news_feed'
      });
      
      if (previousFeeds.length < 2) return [];
      
      // Sort by timestamp (descending)
      const sortedFeeds = previousFeeds.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Get the second most recent feed (the one before current)
      const previousFeed = this.repository._retrieveFile(sortedFeeds[1]);
      
      const shifts = [];
      
      // Check for sentiment shifts
      if (previousFeed && previousFeed.data && previousFeed.data.overall_sentiment_score !== undefined) {
        const currentSentiment = feed.data.overall_sentiment_score;
        const previousSentiment = previousFeed.data.overall_sentiment_score;
        const sentimentChange = currentSentiment - previousSentiment;
        
        if (Math.abs(sentimentChange) >= 0.2) {
          shifts.push({
            type: 'sentiment_shift',
            category,
            previous: previousSentiment,
            current: currentSentiment,
            change: sentimentChange,
            magnitude: Math.abs(sentimentChange),
            description: sentimentChange > 0 ? 
              `${category} sentiment becoming more positive` : 
              `${category} sentiment becoming more negative`
          });
        }
      }
      
      // Check for new emerging themes
      if (feed.data.top_themes && previousFeed && previousFeed.data && previousFeed.data.top_themes) {
        const currentThemes = new Set(feed.data.top_themes.map(t => t.topic));
        const previousTopThemes = new Set(previousFeed.data.top_themes.slice(0, 3).map(t => t.topic));
        
        // Find new themes in the top 3 that weren't in previous top themes
        const newTopThemes = feed.data.top_themes
          .slice(0, 3)
          .filter(theme => !previousTopThemes.has(theme.topic));
        
        if (newTopThemes.length > 0) {
          shifts.push({
            type: 'emerging_theme',
            category,
            themes: newTopThemes.map(t => t.topic),
            description: `New dominant themes in ${category}: ${newTopThemes.map(t => t.topic).join(', ')}`
          });
        }
      }
      
      return shifts;
    } catch (error) {
      console.warn(`Error detecting shifts for ${category}:`, error.message);
      return [];
    }
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

  /**
   * Process intelligence from all feeds
   * @param {Array} feedResults - Results from the feeds
   */
  async processIntelligence(feedResults) {
    console.log('Director processing intelligence from all feeds...');
    
    // Flatten all feed results
    const allIntelligence = feedResults.flat().filter(item => item);
    
    if (allIntelligence.length === 0) {
      console.warn('No intelligence gathered from feeds.');
      return [];
    }
    
    // Process for sentiment if not already processed
    const processedIntelligence = await Promise.all(
      allIntelligence.map(item => this._processSentiment(item))
    );
    
    // Prioritize intelligence
    const prioritizedIntelligence = this._prioritizeIntelligence(processedIntelligence);
    
    // Store high priority items in recent intelligence
    const highPriorityItems = prioritizedIntelligence.filter(item => item.priority === 'high');
    this._updateRecentIntelligence(highPriorityItems);
    
    // Store the intelligence
    const timestamp = new Date().toISOString();
    this.repository.storeResearch(
      'Intelligence Collection',
      'analysis',
      {
        timestamp,
        intelligence: prioritizedIntelligence,
        summary: this._generateSummary(prioritizedIntelligence)
      },
      {
        type: 'news_intelligence',
        timestamp,
        high_priority_count: highPriorityItems.length,
        total_count: prioritizedIntelligence.length
      }
    );
    
    return prioritizedIntelligence;
  }
  
  /**
   * Process intelligence specific to an asset
   */
  async processAssetIntelligence(symbol, feedData) {
    console.log(`Director processing intelligence for ${symbol}...`);
    
    // Process sentiment
    const processedData = await Promise.all(
      feedData.map(item => this._processSentiment(item))
    );
    
    // Filter for relevance
    const relevant = processedData.filter(item => 
      item.relevanceScore > 0.5 || 
      (item.tickers && item.tickers.some(t => t.symbol === symbol))
    );
    
    // Get market context
    const marketContext = await this._getMarketContext(symbol);
    
    // Generate asset intelligence
    const intelligence = {
      symbol,
      timestamp: new Date().toISOString(),
      sentiment: this._calculateAverageSentiment(relevant),
      articles: relevant.slice(0, 10), // Top 10 most relevant
      recentTrend: this._detectSentimentTrend(symbol),
      marketContext,
      signals: this._generateSignalsFromIntelligence(relevant, symbol),
    };
    
    // Store the asset intelligence
    const filePath = this.repository.storeResearch(
      `Intelligence: ${symbol}`,
      'analysis',
      intelligence,
      {
        type: 'asset_intelligence',
        symbol,
        timestamp: intelligence.timestamp,
        sentiment: intelligence.sentiment
      }
    );
    
    return {
      intelligence,
      path: filePath
    };
  }
  
  /**
   * Generate a comprehensive intelligence report
   */
  async generateReport() {
    console.log('Director generating intelligence report...');
    
    // Get recent intelligence
    const recent = this.recentIntelligence.slice(0, 20);
    
    // Get the most important trends
    const trends = this._identifyTrends(recent);
    
    // Generate sector impact analysis
    const sectorImpacts = await this._analyzeSectorImpacts(recent);
    
    // Create the report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        headline: this._generateHeadline(trends),
        keyFindings: this._generateKeyFindings(trends, sectorImpacts)
      },
      marketOutlook: this._generateMarketOutlook(trends, sectorImpacts),
      trends,
      sectorImpacts,
      topIntelligence: recent.slice(0, 10).map(item => ({
        title: item.title,
        source: item.source,
        sentimentScore: item.sentimentScore,
        sentimentLabel: this._getSentimentLabel(item.sentimentScore),
        tickers: item.tickers,
        url: item.url
      })),
      tradingSignals: this._generateSignalsFromTrends(trends)
    };
    
    // Store the report
    const filePath = this.repository.storeResearch(
      'Market Intelligence Report',
      'reports',
      report,
      {
        type: 'intelligence_report',
        timestamp: report.timestamp,
        trends_identified: trends.length,
        signals_generated: report.tradingSignals.length
      }
    );
    
    return {
      report,
      path: filePath
    };
  }
  
  /**
   * Generate a quick market summary
   */
  async generateMarketSummary() {
    // Get the most recent intelligence
    const recent = this.recentIntelligence.slice(0, 20);
    
    // Get market-wide sentiment
    let overallSentiment = 0;
    if (recent.length > 0) {
      overallSentiment = recent.reduce((sum, item) => sum + item.sentimentScore, 0) / recent.length;
    }
    
    // Get key topics
    const topics = this._extractKeyTopics(recent);
    
    // Generate market summary
    const summary = {
      timestamp: new Date().toISOString(),
      sentiment: {
        score: overallSentiment,
        label: this._getSentimentLabel(overallSentiment)
      },
      keyTopics: topics.slice(0, 5),
      recentHeadlines: recent.slice(0, 5).map(item => item.title),
      marketDirection: overallSentiment > 0.2 ? 'Bullish' : 
                      overallSentiment < -0.2 ? 'Bearish' : 'Neutral'
    };
    
    return summary;
  }
  
  // Private helper methods
  
  /**
   * Process sentiment for an intelligence item
   * @private
   */
  async _processSentiment(item) {
    // If sentiment is already processed, return as is
    if (item.sentimentScore !== undefined) {
      return item;
    }
    
    try {
      // Use Alpha Vantage if possible
      if (this.apiKey) {
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'NEWS_SENTIMENT',
            tickers: item.tickers ? item.tickers.map(t => t.symbol).join(',') : '',
            topics: item.topics ? item.topics.join(',') : '',
            time_from: item.publishedAt,
            apikey: this.apiKey
          }
        });
        
        if (response.data.feed && response.data.feed.length > 0) {
          const matchingArticle = response.data.feed.find(article => 
            article.title === item.title || 
            article.url === item.url
          );
          
          if (matchingArticle) {
            item.sentimentScore = parseFloat(matchingArticle.overall_sentiment_score) || 0;
            item.relevanceScore = parseFloat(matchingArticle.relevance_score) || 0.5;
            
            // Get ticker-specific sentiment
            if (matchingArticle.ticker_sentiment) {
              item.tickers = matchingArticle.ticker_sentiment.map(ticker => ({
                symbol: ticker.ticker,
                sentiment: parseFloat(ticker.ticker_sentiment_score),
                relevance: parseFloat(ticker.relevance_score)
              }));
            }
            
            return item;
          }
        }
      }
      
      // Fallback: Simple sentiment based on presence of keywords
      const text = item.title + ' ' + (item.content || '');
      const bullishWords = ['bullish', 'surge', 'gain', 'grew', 'positive', 'upside', 'support', 'rally', 'outperform', 'beat'];
      const bearishWords = ['bearish', 'drop', 'fall', 'plunge', 'negative', 'downside', 'resistance', 'selloff', 'underperform', 'miss'];
      
      let score = 0;
      const lowerText = text.toLowerCase();
      
      bullishWords.forEach(word => {
        if (lowerText.includes(word)) score += 0.1;
      });
      
      bearishWords.forEach(word => {
        if (lowerText.includes(word)) score -= 0.1;
      });
      
      // Cap the score
      score = Math.min(1, Math.max(-1, score));
      
      item.sentimentScore = score;
      item.relevanceScore = 0.5; // Default relevance
      
      return item;
    } catch (error) {
      console.error('Error processing sentiment:', error.message);
      // Return item with neutral sentiment
      item.sentimentScore = 0;
      item.relevanceScore = 0.3; // Lower relevance for uncertain sentiment
      return item;
    }
  }
  
  /**
   * Prioritize intelligence based on sentiment impact and relevance
   * @private
   */
  _prioritizeIntelligence(intelligence) {
    return intelligence.map(item => {
      // Calculate impact as a combination of sentiment strength and relevance
      const sentimentStrength = Math.abs(item.sentimentScore);
      const impact = sentimentStrength * (item.relevanceScore || 0.5);
      
      // Assign priority
      let priority;
      if (impact >= this.thresholds.highPriority) {
        priority = 'high';
      } else if (impact <= this.thresholds.lowPriority) {
        priority = 'low';
      } else {
        priority = 'medium';
      }
      
      return {
        ...item,
        impact,
        priority
      };
    }).sort((a, b) => b.impact - a.impact); // Sort by impact descending
  }
  
  /**
   * Update the recent intelligence cache
   * @private
   */
  _updateRecentIntelligence(newItems) {
    // Add new items
    this.recentIntelligence = [
      ...newItems,
      ...this.recentIntelligence
    ];
    
    // Remove duplicates
    this.recentIntelligence = this.recentIntelligence.filter(
      (item, index, self) => index === self.findIndex(t => t.url === item.url)
    );
    
    // Trim to max size
    if (this.recentIntelligence.length > this.maxRecentItems) {
      this.recentIntelligence = this.recentIntelligence.slice(0, this.maxRecentItems);
    }
  }
  
  /**
   * Generate a summary of the intelligence
   * @private
   */
  _generateSummary(intelligence) {
    const highPriority = intelligence.filter(item => item.priority === 'high');
    const mediumPriority = intelligence.filter(item => item.priority === 'medium');
    
    // Get overall sentiment
    let overallSentiment = 0;
    if (intelligence.length > 0) {
      overallSentiment = intelligence.reduce((sum, item) => sum + item.sentimentScore, 0) / intelligence.length;
    }
    
    // Get affected tickers
    const tickers = new Set();
    intelligence.forEach(item => {
      if (item.tickers) {
        item.tickers.forEach(ticker => tickers.add(ticker.symbol));
      }
    });
    
    return {
      timestamp: new Date().toISOString(),
      itemCount: intelligence.length,
      highPriorityCount: highPriority.length,
      mediumPriorityCount: mediumPriority.length,
      overallSentiment,
      overallSentimentLabel: this._getSentimentLabel(overallSentiment),
      affectedTickers: Array.from(tickers)
    };
  }
  
  /**
   * Get sentiment label from a score
   * @private
   */
  _getSentimentLabel(score) {
    if (score >= 0.5) return 'Very Positive';
    if (score >= 0.2) return 'Positive';
    if (score > -0.2) return 'Neutral';
    if (score > -0.5) return 'Negative';
    return 'Very Negative';
  }
  
  /**
   * Calculate average sentiment from a list of items
   * @private
   */
  _calculateAverageSentiment(items) {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + item.sentimentScore, 0) / items.length;
  }
  
  /**
   * Detect sentiment trend for a symbol
   * @private
   */
  _detectSentimentTrend(symbol) {
    // Find recent intelligence for this symbol
    const symbolIntelligence = this.recentIntelligence.filter(item => 
      item.tickers && item.tickers.some(t => t.symbol === symbol)
    );
    
    if (symbolIntelligence.length < 5) {
      return 'Insufficient Data';
    }
    
    // Sort by timestamp
    symbolIntelligence.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Calculate moving averages
    const recent = symbolIntelligence.slice(0, 5);
    const older = symbolIntelligence.slice(5, 10);
    
    const recentSentiment = this._calculateAverageSentiment(recent);
    const olderSentiment = this._calculateAverageSentiment(older);
    
    const change = recentSentiment - olderSentiment;
    
    if (change > 0.2) return 'Strongly Improving';
    if (change > 0.1) return 'Improving';
    if (change < -0.2) return 'Strongly Deteriorating';
    if (change < -0.1) return 'Deteriorating';
    return 'Stable';
  }
  
  /**
   * Get market context for a symbol
   * @private
   */
  async _getMarketContext(symbol) {
    // Check if it's a crypto
    const isCrypto = ['BTC', 'ETH', 'AVAX', 'ADA', 'MATIC', 'SUI', 'DOGE', 'HBAR', 'ONE', 'UNI', 'SOL'].includes(symbol);
    
    // Get relevant context
    if (isCrypto) {
      return {
        sector: 'Cryptocurrency',
        relatedAssets: ['BTC', 'ETH'], // Major crypto assets always relevant
        isCrypto: true
      };
    }
    
    // For stocks, we would ideally look up the sector
    // For simplicity, we'll return a placeholder
    return {
      sector: 'Unknown',
      relatedAssets: [],
      isCrypto: false
    };
  }
  
  /**
   * Generate signals from intelligence items
   * @private
   */
  _generateSignalsFromIntelligence(intelligence, symbol) {
    const signals = [];
    
    // Overall sentiment signal
    const overallSentiment = this._calculateAverageSentiment(intelligence);
    if (Math.abs(overallSentiment) >= this.thresholds.signalThreshold) {
      signals.push({
        type: overallSentiment > 0 ? 'BULLISH' : 'BEARISH',
        confidence: Math.min(1, Math.abs(overallSentiment) + 0.3),
        reason: `Strong ${overallSentiment > 0 ? 'positive' : 'negative'} news sentiment`,
        source: 'news_sentiment'
      });
    }
    
    // Trend signal
    const trend = this._detectSentimentTrend(symbol);
    if (trend === 'Strongly Improving' || trend === 'Strongly Deteriorating') {
      signals.push({
        type: trend.includes('Improving') ? 'BULLISH' : 'BEARISH',
        confidence: 0.7,
        reason: `Rapidly ${trend.includes('Improving') ? 'improving' : 'deteriorating'} sentiment trend`,
        source: 'sentiment_trend'
      });
    }
    
    // Extreme articles signal
    const extremeArticles = intelligence.filter(item => Math.abs(item.sentimentScore) >= 0.8);
    if (extremeArticles.length >= 3) {
      const averageExtremeSentiment = this._calculateAverageSentiment(extremeArticles);
      signals.push({
        type: averageExtremeSentiment > 0 ? 'BULLISH' : 'BEARISH',
        confidence: Math.min(0.9, 0.6 + (extremeArticles.length * 0.05)),
        reason: `Multiple high-impact ${averageExtremeSentiment > 0 ? 'positive' : 'negative'} news articles`,
        source: 'extreme_news'
      });
    }
    
    return signals;
  }
  
  /**
   * Identify trends in the intelligence
   * @private
   */
  _identifyTrends(intelligence) {
    // Group by topics
    const topicGroups = {};
    
    intelligence.forEach(item => {
      if (!item.topics) return;
      
      item.topics.forEach(topic => {
        if (!topicGroups[topic]) {
          topicGroups[topic] = [];
        }
        topicGroups[topic].push(item);
      });
    });
    
    // Find trends
    const trends = [];
    
    for (const [topic, items] of Object.entries(topicGroups)) {
      if (items.length < 3) continue; // Need at least 3 items to confirm a trend
      
      const sentimentTrend = this._calculateAverageSentiment(items);
      
      trends.push({
        topic,
        strength: items.length,
        sentiment: sentimentTrend,
        sentimentLabel: this._getSentimentLabel(sentimentTrend),
        headlines: items.slice(0, 3).map(item => item.title)
      });
    }
    
    // Sort by strength
    trends.sort((a, b) => b.strength - a.strength);
    
    return trends;
  }
  
  /**
   * Generate headline for the report
   * @private
   */
  _generateHeadline(trends) {
    if (trends.length === 0) {
      return "Market News Summary";
    }
    
    const topTrend = trends[0];
    const sentiment = topTrend.sentiment;
    
    if (sentiment > 0.5) {
      return `Strong Positive Sentiment Around ${topTrend.topic}`;
    } else if (sentiment > 0.2) {
      return `Positive Developments in ${topTrend.topic}`;
    } else if (sentiment < -0.5) {
      return `Significant Concerns About ${topTrend.topic}`;
    } else if (sentiment < -0.2) {
      return `Negative News Surrounding ${topTrend.topic}`;
    } else {
      return `Mixed Reports on ${topTrend.topic}`;
    }
  }
  
  /**
   * Generate key findings based on trends
   * @private
   */
  _generateKeyFindings(trends, sectorImpacts) {
    const findings = [];
    
    // Add trend findings
    trends.slice(0, 3).forEach(trend => {
      const sentiment = trend.sentiment > 0 ? "positive" : trend.sentiment < 0 ? "negative" : "mixed";
      findings.push(`${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} news trend in ${trend.topic}`);
    });
    
    // Add sector impact findings
    if (sectorImpacts && sectorImpacts.length > 0) {
      sectorImpacts.slice(0, 2).forEach(sector => {
        if (Math.abs(sector.impact) > 0.3) {
          const direction = sector.impact > 0 ? "positive" : "negative";
          findings.push(`${direction.charAt(0).toUpperCase() + direction.slice(1)} outlook for ${sector.sector} sector`);
        }
      });
    }
    
    return findings;
  }
  
  /**
   * Analyze sector impacts from intelligence
   * @private
   */
  async _analyzeSectorImpacts(intelligence) {
    const sectors = {};
    
    // Group intelligence by sector
    intelligence.forEach(item => {
      if (item.tickers) {
        item.tickers.forEach(ticker => {
          // This is simplified - in a real system you'd look up the sector
          let sector = 'Unknown';
          const symbol = ticker.symbol;
          
          if (['BTC', 'ETH', 'AVAX', 'ADA', 'MATIC', 'SUI', 'DOGE', 'HBAR', 'ONE', 'UNI', 'SOL'].includes(symbol)) {
            sector = 'Cryptocurrency';
          } else if (['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NFLX'].includes(symbol)) {
            sector = 'Technology';
          } else if (['JPM', 'BAC', 'GS', 'MS', 'C'].includes(symbol)) {
            sector = 'Financial';
          }
          
          if (!sectors[sector]) {
            sectors[sector] = [];
          }
          
          sectors[sector].push({
            ...item,
            ticker_sentiment: ticker.sentiment
          });
        });
      }
    });
    
    // Calculate impact for each sector
    const sectorImpacts = [];
    
    for (const [sector, items] of Object.entries(sectors)) {
      if (items.length > 0) {
        // Calculate average sentiment
        const avgSentiment = items.reduce((sum, item) => {
          return sum + (item.ticker_sentiment || item.sentimentScore);
        }, 0) / items.length;
        
        sectorImpacts.push({
          sector,
          impact: avgSentiment,
          impactLabel: this._getSentimentLabel(avgSentiment),
          articles: items.length,
          topHeadlines: items.slice(0, 3).map(item => item.title)
        });
      }
    }
    
    // Sort by impact (absolute value)
    sectorImpacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    
    return sectorImpacts;
  }
  
  /**
   * Generate market outlook based on trends
   * @private
   */
  _generateMarketOutlook(trends, sectorImpacts) {
    // Calculate overall sentiment from trends
    let overallSentiment = 0;
    let totalWeight = 0;
    
    trends.forEach(trend => {
      overallSentiment += trend.sentiment * trend.strength;
      totalWeight += trend.strength;
    });
    
    if (totalWeight > 0) {
      overallSentiment = overallSentiment / totalWeight;
    }
    
    // Generate outlook text
    let outlook = '';
    if (overallSentiment > 0.3) {
      outlook = 'Positive market sentiment with strong bullish indicators.';
    } else if (overallSentiment > 0.1) {
      outlook = 'Cautiously optimistic market outlook with mixed signals leaning positive.';
    } else if (overallSentiment < -0.3) {
      outlook = 'Negative market sentiment with strong bearish indicators.';
    } else if (overallSentiment < -0.1) {
      outlook = 'Cautious market outlook with mixed signals leaning negative.';
    } else {
      outlook = 'Neutral market outlook with balanced positive and negative signals.';
    }
    
    // Add sector-specific comments
    if (sectorImpacts && sectorImpacts.length > 0) {
      // Find strongest positive sector
      const positiveSectors = sectorImpacts.filter(s => s.impact > 0.3);
      if (positiveSectors.length > 0) {
        outlook += ` ${positiveSectors[0].sector} sector showing particular strength.`;
      }
      
      // Find strongest negative sector
      const negativeSectors = sectorImpacts.filter(s => s.impact < -0.3);
      if (negativeSectors.length > 0) {
        outlook += ` ${negativeSectors[0].sector} sector facing notable challenges.`;
      }
    }
    
    return outlook;
  }
  
  /**
   * Generate trading signals from trend analysis
   * @private
   */
  _generateSignalsFromTrends(trends) {
    const signals = [];
    
    trends.forEach(trend => {
      // Only generate signals for strong trends
      if (Math.abs(trend.sentiment) < this.thresholds.signalThreshold || 
          trend.strength < 3) {
        return;
      }
      
      signals.push({
        topic: trend.topic,
        signal: trend.sentiment > 0 ? 'BULLISH' : 'BEARISH',
        strength: trend.strength,
        confidence: Math.min(0.9, 0.5 + (trend.strength * 0.1)),
        headlines: trend.headlines
      });
    });
    
    return signals;
  }
  
  /**
   * Extract key topics from intelligence items
   * @private
   */
  _extractKeyTopics(intelligence) {
    const topicCount = {};
    
    intelligence.forEach(item => {
      if (!item.topics) return;
      
      item.topics.forEach(topic => {
        if (!topicCount[topic]) {
          topicCount[topic] = 0;
        }
        topicCount[topic] += 1;
      });
    });
    
    return Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }
}

module.exports = NewsIntelligenceDirector;