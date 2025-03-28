import axios from 'axios';
import { Logger } from '../utils/logger';

interface Article {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string;
  // Add any other properties that might be in the RSS feed
}

interface ProcessedArticle extends Article {
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  signal: 'buy' | 'sell' | 'hold';
  weight: number;
  weightedSignal: number;
}

interface SignalAgentConfig {
  sources: Array<{
    name: string;
    rssUrl: string;
    weight: number; // Source credibility weight
  }>;
}

class SignalAgent {
  #sources: SignalAgentConfig['sources']; // Private field for sources
  #logger: Logger; // Private field for logger

  constructor(config: SignalAgentConfig) {
    this.#sources = config.sources; // Use # to access private fields
    this.#logger = new Logger(); // Use # to access private fields
  }

  // Fetch news from a single source
  async #fetchFromSource(source: SignalAgentConfig['sources'][0]): Promise<Article[]> {
    try {
      this.#logger.info(`Fetching news from ${source.name}`);
      const response = await axios.get(source.rssUrl);
      
      // Parse the RSS feed (simplified for this example)
      // In a real implementation, you'd use a proper RSS parser
      const articles: Article[] = this.#parseRSSFeed(response.data as string);
      
      // Enrich articles with source information
      return articles.map(article => ({
        ...article,
        source: source.name,
        weight: source.weight,
      }));
    } catch (error) {
      this.#logger.error(`Failed to fetch news from ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Helper method to parse RSS feed (simplified)
  #parseRSSFeed(data: string): Article[] {
    // This is a placeholder. In a real implementation, you'd use a library like rss-parser
    try {
      // Simple regex to extract titles (this is not a robust solution!)
      const titles = data.match(/<title>(.*?)<\/title>/g) || [];
      return titles.map(title => ({
        title: title.replace(/<title>(.*?)<\/title>/, '$1'),
      }));
    } catch (error) {
      this.#logger.error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  // Fetch news from all sources concurrently
  async #fetchAllSources(): Promise<Article[]> {
    const fetchPromises = this.#sources.map((source) => this.#fetchFromSource(source));
    const results = await Promise.all(fetchPromises);
    return results.flat(); // Flatten the array of results
  }

  // Process fetched news and generate signals with proper weight consideration
  #processNews(articles: Article[]): { aggregatedSignal: string; details: ProcessedArticle[] } {
    let weightedSignalSum = 0;
    let totalWeight = 0;

    const processedArticles: ProcessedArticle[] = articles.map((article: any) => {
      // In a real implementation, you would use NLP for sentiment analysis
      // For this example, we'll use a simple random approach
      const sentimentScore = Math.random(); // 0 to 1
      let sentiment: 'positive' | 'negative' | 'neutral';
      let signal: 'buy' | 'sell' | 'hold';
      
      if (sentimentScore > 0.6) {
        sentiment = 'positive';
        signal = 'buy';
      } else if (sentimentScore < 0.4) {
        sentiment = 'negative';
        signal = 'sell';
      } else {
        sentiment = 'neutral';
        signal = 'hold';
      }
      
      // Calculate weighted signal based on source credibility and sentiment
      const sourceWeight = article.weight || 1;
      totalWeight += sourceWeight;
      
      // Convert sentiment to a signal value: positive -> +1, neutral -> 0, negative -> -1
      const signalValue = sentiment === 'positive' ? 1 : (sentiment === 'negative' ? -1 : 0);
      const weightedSignal = signalValue * sourceWeight;
      
      weightedSignalSum += weightedSignal;

      return {
        title: article.title,
        source: article.source,
        sentiment,
        signal,
        weight: sourceWeight,
        weightedSignal,
      };
    });

    // Normalize the weighted signal sum by the total weight
    const normalizedSignal = totalWeight > 0 ? weightedSignalSum / totalWeight : 0;
    
    // Determine final signal based on normalized weighted sum
    let aggregatedSignal;
    if (normalizedSignal > 0.2) {
      aggregatedSignal = 'buy';
    } else if (normalizedSignal < -0.2) {
      aggregatedSignal = 'sell';
    } else {
      aggregatedSignal = 'hold';
    }

    return { aggregatedSignal, details: processedArticles };
  }

  // Main method to fetch, process, and log signals
  async monitor(): Promise<void> {
    try {
      this.#logger.info('Starting news monitoring');
      const articles = await this.#fetchAllSources();
      
      if (articles.length === 0) {
        this.#logger.info('No articles found');
        return;
      }
      
      this.#logger.info(`Found ${articles.length} articles`);
      const { aggregatedSignal, details } = this.#processNews(articles);

      this.#logger.info(`Aggregated Signal: ${aggregatedSignal}`);
      this.#logger.info(`Signal strength: ${details.reduce((sum, article) => sum + article.weightedSignal, 0)}`);
      
      // Log detailed results
      details.forEach(article => {
        this.#logger.debug(`${article.source} (weight: ${article.weight}): ${article.title} - ${article.sentiment} -> ${article.signal}`);
      });
    } catch (error) {
      this.#logger.error(`Error in monitoring: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default SignalAgent;