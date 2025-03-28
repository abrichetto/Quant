const BaseAgent = require('../base-agent');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '..', 'config', '.env') });

/**
 * Fiscal Policy feed agent
 */
class FiscalPolicyFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'Fiscal Policy Monitor',
      type: 'macro_fiscal',
      priority: 8
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching fiscal policy news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'economy_fiscal,economy_macro,government',
          sort: 'RELEVANCE',
          limit: 30,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for fiscal policy feed`);
        return [];
      }
      
      // Filter for fiscal policy news
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('fiscal') ||
          article.title.toLowerCase().includes('budget') ||
          article.title.toLowerCase().includes('treasury') ||
          article.title.toLowerCase().includes('spending') ||
          article.title.toLowerCase().includes('deficit') ||
          article.summary.toLowerCase().includes('fiscal policy') ||
          article.summary.toLowerCase().includes('government spending')
        )
        .map(article => {
          // Determine policy type
          const policyType = this._determinePolicyType(article.title + ' ' + article.summary);
          
          // Determine if stimulus-related
          const isStimulus = 
            (article.title + ' ' + article.summary).toLowerCase().includes('stimulus') ||
            (article.title + ' ' + article.summary).toLowerCase().includes('relief');
          
          // Policy likely to be contractionary vs expansionary
          const isContractionary = 
            (article.title + ' ' + article.summary).toLowerCase().includes('austerity') ||
            (article.title + ' ' + article.summary).toLowerCase().includes('cut') ||
            (article.title + ' ' + article.summary).toLowerCase().includes('deficit reduction');
          
          let sentiment = parseFloat(article.overall_sentiment_score || 0);
          if (isStimulus) sentiment = Math.max(sentiment, 0.3);
          if (isContractionary) sentiment = Math.min(sentiment, -0.2);
          
          return {
            title: article.title,
            topic: policyType,
            source: 'Fiscal Policy News',
            url: article.url,
            timestamp: article.time_published,
            sentiment,
            policy_type: policyType,
            stimulus: isStimulus,
            contractionary: isContractionary,
            strength: isStimulus || isContractionary ? 0.8 : 0.6,
            confidence: 0.7,
            priority: isStimulus || isContractionary ? 8 : 7,
            summary: article.summary
          };
        });
      
      // Add signals to buffer
      signals.forEach(signal => this.addSignal(signal));
      
      console.log(`${this.name}: Processed ${signals.length} fiscal policy news items into signals`);
      return signals;
    } catch (error) {
      console.error(`${this.name} error:`, error.message);
      return [];
    }
  }
  
  /**
   * Determine type of fiscal policy from text
   * @private
   */
  _determinePolicyType(text) {
    const lcText = text.toLowerCase();
    
    if (lcText.includes('tax') && (lcText.includes('cut') || lcText.includes('reform'))) {
      return 'Tax Policy';
    } else if (lcText.includes('infrastructure') || lcText.includes('spending bill')) {
      return 'Infrastructure Spending';
    } else if (lcText.includes('debt') || lcText.includes('deficit')) {
      return 'Deficit/Debt';
    } else if (lcText.includes('budget')) {
      return 'Budget';
    } else if (lcText.includes('stimulus') || lcText.includes('relief')) {
      return 'Stimulus';
    }
    
    return 'General Fiscal Policy';
  }
}

/**
 * Interest Rates & Fed feed agent
 */
class RatesFedFeed extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      name: 'Rates & Fed Monitor',
      type: 'macro_monetary',
      priority: 9
    });
    
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }
  
  async processData() {
    try {
      console.log(`${this.name}: Fetching monetary policy news...`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: 'economy_monetary,federal_reserve,interest_rates',
          sort: 'RELEVANCE',
          limit: 50,
          apikey: this.apiKey
        }
      });
      
      if (!response.data.feed || response.data.feed.length === 0) {
        console.warn(`No articles found for rates/Fed feed`);
        return [];
      }
      
      // Filter for monetary policy news
      const signals = response.data.feed
        .filter(article => 
          article.title.toLowerCase().includes('fed') ||
          article.title.toLowerCase().includes('federal reserve') ||
          article.title.toLowerCase().includes('interest rate') ||
          article.title.toLowerCase().includes('powell') ||
          article.title.toLowerCase().includes('central bank') ||
          article.summary.toLowerCase().includes('federal reserve') ||
          article.summary.toLowerCase().includes('monetary policy')
        )
        .map(article => {
          // Determine policy direction
          let policyDirection = 'neutral';
          let sentiment = parseFloat(article.overall_sentiment_score || 0);
          
          const fullText = article.title + ' ' + article.summary;
          if (fullText.toLowerCase().includes('hike') || 
              fullText.toLowerCase().includes('raise') || 
              fullText.toLowerCase().includes('increase') ||
              fullText.toLowerCase().includes('hawkish')) {
            policyDirection = 'tightening';
            sentiment = Math.min(sentiment, -0.2);  // Tightening usually negative for markets
          } else if (fullText.toLowerCase().includes('cut') || 
                     fullText.toLowerCase().includes('lower') || 
                     fullText.toLowerCase().includes('decrease') ||
                     fullText.toLowerCase().includes('dovish')) {
            policyDirection = 'easing';
            sentiment = Math.max(sentiment, 0.3);  // Easing usually positive for markets
          }
          
          // Check if this is a meeting or speech
          const isMeeting = 
            fullText.toLowerCase().includes('fomc') ||
            fullText.toLowerCase().includes('meeting') ||
            fullText.toLowerCase().includes('decision');
          
          const isSpeech = 
            fullText.toLowerCase().includes('speech') ||
            fullText.toLowerCase().includes('speaks') ||
            fullText.toLowerCase().includes('testimony') ||
            fullText.toLowerCase().includes('comments');
          
          return {
            title: article.title,
            topic: 'Monetary Policy',
            source: 'Fed/Rates News',
            url: article.url,
            timestamp: article.time_published,
            sentiment,
            policy_direction: policyDirection,
            meeting: isMeeting,
            speech: isSpeech,
            strength: isMeeting ? 0.9 : (isSpeech ? 0.8 : 0.7),
            confidence: isMeeting ? 0.9 : (isSpeech ? 0.7 : 0.6),
            priority: