const BaseAgent = require('../base-agent');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });

/**
 * DeFi Protocol feed agent
 */
class DeFiFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'DeFi Protocol Monitor',
      type: 'crypto_defi',
      priority: 6
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching DeFi news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'defi,blockchain,cryptocurrency',
          sort: 'RELEVANCE',
          limit: 30,
          apikey: this.apiKey
        }
      });
      
      if (response.data['Error Message']) {
        throw new Error(`API error: ${response.data['Error Message']}`);
      }
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for DeFi feed`);
        return [];
      }
      
      // Process articles into signals
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('defi') ||
          article.summary.toLowerCase().includes('defi') ||
          article.summary.toLowerCase().includes('protocol') ||
          article.summary.toLowerCase().includes('lending') ||
          article.summary.toLowerCase().includes('yield')
        )
        .map(article => {
          // Extract DeFi protocol names
          const protocols = this._extractDeFiProtocols(article.title + ' ' + article.summary);
          
          // Get primary ticker if available
          const tickers = article.ticker_sentiment || [];
          const primaryAsset = tickers.length > 0 ? 
            tickers[0].ticker : (protocols.length > 0 ? protocols[0] : 'DeFi');
          
          // Determine if article mentions exploits/hacks
          const securityIncident = 
            article.title.toLowerCase().includes('hack') ||
            article.summary.toLowerCase().includes('hack') ||
            article.title.toLowerCase().includes('exploit') ||
            article.summary.toLowerCase().includes('exploit') ||
            article.title.toLowerCase().includes('vulnerability') ||
            article.summary.toLowerCase().includes('vulnerability');
          
          let priority = 6;
          if (securityIncident) priority = 9;
          
          return {
            title: article.title,
            topic: primaryAsset,
            protocols: protocols,
            source: 'DeFi News',
            url: article.url,
            timestamp: article.time_published,
            sentiment: parseFloat(article.overall_sentiment_score || 0),
            strength: securityIncident ? 0.9 : 0.6,
            confidence: 0.7,
            priority,
            security_incident: securityIncident,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} DeFi news into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
  
  /**
   * Extract DeFi protocol names from text
   * @private
   */
  _extractDeFiProtocols(text) {
    const protocols = [
      'Uniswap', 'Aave', 'Compound', 'MakerDAO', 'Curve', 'SushiSwap', 
      'Balancer', 'Yearn', 'Synthetix', '1inch', 'Convex', 'PancakeSwap',
      'dYdX', 'Lido', 'Instadapp', 'BadgerDAO', 'Bancor', 'Perpetual',
      'Euler', 'Frax', 'Olympus'
    ];
    
    return protocols.filter(protocol => 
      text.toLowerCase().includes(protocol.toLowerCase())
    );
  }
}

/**
 * Layer 1/2 Blockchain feed agent
 */
class LayerOneTwoFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'Layer 1/2 Monitor',
      type: 'crypto_infrastructure',
      priority: 7
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
    
    // Define major layer 1/2 blockchains to track
    this.layer1s = ['Bitcoin', 'Ethereum', 'Solana', 'Avalanche', 'Cardano', 'Polkadot'];
    this.layer2s = ['Polygon', 'Arbitrum', 'Optimism', 'ZkSync', 'Starknet', 'Loopring'];
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching Layer 1/2 news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'blockchain,cryptocurrency',
          sort: 'RELEVANCE',
          limit: 50,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for Layer 1/2 feed`);
        return [];
      }
      
      // Filter for L1/L2 blockchain news
      const signals = response.data.feed
        .filter(article => {
          const fullText = article.title + ' ' + article.summary;
          return this.layer1s.some(l1 => fullText.toLowerCase().includes(l1.toLowerCase())) ||
                 this.layer2s.some(l2 => fullText.toLowerCase().includes(l2.toLowerCase())) ||
                 fullText.toLowerCase().includes('layer 2') ||
                 fullText.toLowerCase().includes('layer-2') ||
                 fullText.toLowerCase().includes('scaling');
        })
        .map(article => {
          // Identify which blockchain(s) are mentioned
          const chains = [
            ...this.layer1s.filter(l1 => 
              (article.title + ' ' + article.summary).toLowerCase().includes(l1.toLowerCase())
            ),
            ...this.layer2s.filter(l2 => 
              (article.title + ' ' + article.summary).toLowerCase().includes(l2.toLowerCase())
            )
          ];
          
          // Get primary chain
          const primaryChain = chains.length > 0 ? chains[0] : 'blockchain';
          
          // Determine if article mentions upgrades/forks
          const upgrade = 
            article.title.toLowerCase().includes('upgrade') ||
            article.summary.toLowerCase().includes('upgrade') ||
            article.title.toLowerCase().includes('fork') ||
            article.summary.toLowerCase().includes('fork') ||
            article.title.toLowerCase().includes('update') ||
            article.summary.toLowerCase().includes('update');
          
          let priority = 6;
          if (upgrade) priority = 8;
          
          return {
            title: article.title,
            topic: primaryChain,
            chains,
            layer: chains.some(c => this.layer2s.includes(c)) ? 'layer2' : 'layer1',
            source: 'Blockchain News',
            url: article.url,
            timestamp: article.time_published,
            sentiment: parseFloat(article.overall_sentiment_score || 0),
            strength: upgrade ? 0.8 : 0.6,
            confidence: 0.7,
            priority,
            upgrade,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} L1/L2 news into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
}

/**
 * NFT Market feed agent
 */
class NFTFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'NFT Market Monitor',
      type: 'crypto_nft',
      priority: 5
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching NFT market news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'nft,metaverse,blockchain,cryptocurrency',
          sort: 'RELEVANCE',
          limit: 30,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for NFT feed`);
        return [];
      }
      
      // Filter for NFT-related news
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('nft') ||
          article.summary.toLowerCase().includes('nft') ||
          article.title.toLowerCase().includes('metaverse') ||
          article.summary.toLowerCase().includes('metaverse')
        )
        .map(article => {
          // Extract NFT collection or marketplace
          const nftEntity = this._extractNFTEntity(article.title + ' ' + article.summary);
          
          // Find related blockchain if mentioned
          const blockchain = this._extractNFTBlockchain(article.title + ' ' + article.summary);
          
          // Determine if high-value sale
          const highValueSale = 
            article.title.toLowerCase().includes('million') ||
            article.title.toLowerCase().includes('record sale') ||
            article.summary.toLowerCase().includes('million dollar');
          
          return {
            title: article.title,
            topic: nftEntity || 'NFT Market',
            blockchain,
            source: 'NFT News',
            url: article.url,
            timestamp: article.time_published,
            sentiment: parseFloat(article.overall_sentiment_score || 0),
            strength: highValueSale ? 0.7 : 0.5,
            confidence: 0.6,
            high_value_sale: highValueSale,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} NFT news into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
  
  /**
   * Extract NFT collection or marketplace from text
   * @private
   */
  _extractNFTEntity(text) {
    const nftEntities = [
      'Bored Ape', 'BAYC', 'CryptoPunks', 'Azuki', 'Doodles', 'Art Blocks',
      'OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'LooksRare', 'Blur',
      'Magic Eden', 'Meebits', 'Moonbirds', 'Pudgy Penguins', 'Cool Cats'
    ];
    
    for (const entity of nftEntities) {
      if (text.toLowerCase().includes(entity.toLowerCase())) {
        return entity;
      }
    }
    
    return null;
  }
  
  /**
   * Extract blockchain related to NFT
   * @private
   */
  _extractNFTBlockchain(text) {
    const blockchains = [
      'Ethereum', 'Solana', 'Polygon', 'Flow', 'Tezos', 'Immutable X'
    ];
    
    for (const blockchain of blockchains) {
      if (text.toLowerCase().includes(blockchain.toLowerCase())) {
        return blockchain;
      }
    }
    
    return 'Ethereum';  // Default to Ethereum if not specified
  }
}

module.exports = {
  DeFiFeed,
  LayerOneTwoFeed,
  NFTFeed
};