const NewsIntelligenceDirector = require('./agents/news-intelligence-director');
const WallStreetFeed = require('./agents/feeds/wallstreet-feed');
const CryptoFeed = require('./agents/feeds/crypto-feed');
const MacroFeed = require('./agents/feeds/macro-feed');
const InternationalFeed = require('./agents/feeds/international-feed');
const TechFeed = require('./agents/feeds/tech-feed');
const ResearchRepository = require('../utils/research-repository');

class NewsIntelligenceSystem {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    
    // Create director
    this.director = new NewsIntelligenceDirector({ repository: this.repository });
    
    // Create feeds
    this.feeds = {// filepath: /Users/anthonybrichetto/Package/AlgoTrader Pro/src/signals/news-intelligence-system.js
const NewsIntelligenceDirector = require('./agents/news-intelligence-director');
const WallStreetFeed = require('./agents/feeds/wallstreet-feed');
const CryptoFeed = require('./agents/feeds/crypto-feed');
const MacroFeed = require('./agents/feeds/macro-feed');
const InternationalFeed = require('./agents/feeds/international-feed');
const TechFeed = require('./agents/feeds/tech-feed');
const ResearchRepository = require('../utils/research-repository');

class NewsIntelligenceSystem {
  constructor(config = {}) {
    this.repository = config.repository || new ResearchRepository();
    
    // Create director
    this.director = new NewsIntelligenceDirector({ repository: this.repository });
    
    // Create feeds
    this.feeds = {