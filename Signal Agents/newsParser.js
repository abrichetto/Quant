const axios = require('axios');
const logger = require('../utils/logger');

class NewsParser {
  constructor(config) {
    this.sources = config.sources; // Array of sources with weights
  }

  async fetchNewsFromSource(source) {
    try {
      const response = await axios.get(source.apiUrl, {
        headers: { 'Authorization': `Bearer ${source.apiKey}` }
      });
      return response.data.articles.map(article => ({
        ...article,
        weight: source.weight // Attach the source's weight to each article
      }));
    } catch (error) {
      logger.error(`Failed to fetch news from ${source.name}:`, error);
      return [];
    }
  }

  async fetchNews() {
    const allArticles = [];
    for (const source of this.sources) {
      const articles = await this.fetchNewsFromSource(source);
      allArticles.push(...articles);
    }
    return allArticles;
  }

  analyzeSentiment(articles) {
    // Placeholder for sentiment analysis logic
    return articles.map(article => {
      const sentiment = Math.random() > 0.5 ? 'positive' : 'negative'; // Mock sentiment
      const signal = sentiment === 'positive' ? 'buy' : 'sell'; // Mock trading signal
      const weightedSignal = sentiment === 'positive' ? article.weight : -article.weight;

      return {
        title: article.title,
        source: article.source?.name || 'Unknown',
        sentiment,
        signal,
        weight: article.weight,
        weightedSignal
      };
    });
  }

  async getSignals() {
    const articles = await this.fetchNews();
    const analyzedArticles = this.analyzeSentiment(articles);

    // Aggregate weighted signals
    const aggregatedSignal = analyzedArticles.reduce((acc, article) => acc + article.weightedSignal, 0);

    return {
      aggregatedSignal: aggregatedSignal > 0 ? 'buy' : 'sell',
      articles: analyzedArticles
    };
  }
}

module.exports = NewsParser;