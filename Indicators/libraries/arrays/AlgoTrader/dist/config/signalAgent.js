"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SignalAgent_instances, _SignalAgent_sources, _SignalAgent_logger, _SignalAgent_fetchFromSource, _SignalAgent_parseRSSFeed, _SignalAgent_fetchAllSources, _SignalAgent_processNews;
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class SignalAgent {
    constructor(config) {
        _SignalAgent_instances.add(this);
        _SignalAgent_sources.set(this, void 0);
        _SignalAgent_logger.set(this, void 0);
        __classPrivateFieldSet(this, _SignalAgent_sources, config.sources, "f");
        __classPrivateFieldSet(this, _SignalAgent_logger, new logger_1.Logger(), "f");
    }
    monitor() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                __classPrivateFieldGet(this, _SignalAgent_logger, "f").info('Starting news monitoring');
                const articles = yield __classPrivateFieldGet(this, _SignalAgent_instances, "m", _SignalAgent_fetchAllSources).call(this);
                if (articles.length === 0) {
                    __classPrivateFieldGet(this, _SignalAgent_logger, "f").info('No articles found');
                    return;
                }
                __classPrivateFieldGet(this, _SignalAgent_logger, "f").info(`Found ${articles.length} articles`);
                const { aggregatedSignal, details } = __classPrivateFieldGet(this, _SignalAgent_instances, "m", _SignalAgent_processNews).call(this, articles);
                __classPrivateFieldGet(this, _SignalAgent_logger, "f").info(`Aggregated Signal: ${aggregatedSignal}`);
                __classPrivateFieldGet(this, _SignalAgent_logger, "f").info(`Signal strength: ${details.reduce((sum, article) => sum + article.weightedSignal, 0)}`);
                details.forEach(article => {
                    __classPrivateFieldGet(this, _SignalAgent_logger, "f").debug(`${article.source} (weight: ${article.weight}): ${article.title} - ${article.sentiment} -> ${article.signal}`);
                });
            }
            catch (error) {
                __classPrivateFieldGet(this, _SignalAgent_logger, "f").error(`Error in monitoring: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
}
_SignalAgent_sources = new WeakMap(), _SignalAgent_logger = new WeakMap(), _SignalAgent_instances = new WeakSet(), _SignalAgent_fetchFromSource = function _SignalAgent_fetchFromSource(source) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            __classPrivateFieldGet(this, _SignalAgent_logger, "f").info(`Fetching news from ${source.name}`);
            const response = yield axios_1.default.get(source.rssUrl);
            const articles = __classPrivateFieldGet(this, _SignalAgent_instances, "m", _SignalAgent_parseRSSFeed).call(this, response.data);
            return articles.map(article => (Object.assign(Object.assign({}, article), { source: source.name, weight: source.weight })));
        }
        catch (error) {
            __classPrivateFieldGet(this, _SignalAgent_logger, "f").error(`Failed to fetch news from ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    });
}, _SignalAgent_parseRSSFeed = function _SignalAgent_parseRSSFeed(data) {
    try {
        const titles = data.match(/<title>(.*?)<\/title>/g) || [];
        return titles.map(title => ({
            title: title.replace(/<title>(.*?)<\/title>/, '$1'),
        }));
    }
    catch (error) {
        __classPrivateFieldGet(this, _SignalAgent_logger, "f").error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : String(error)}`);
        return [];
    }
}, _SignalAgent_fetchAllSources = function _SignalAgent_fetchAllSources() {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchPromises = __classPrivateFieldGet(this, _SignalAgent_sources, "f").map((source) => __classPrivateFieldGet(this, _SignalAgent_instances, "m", _SignalAgent_fetchFromSource).call(this, source));
        const results = yield Promise.all(fetchPromises);
        return results.flat();
    });
}, _SignalAgent_processNews = function _SignalAgent_processNews(articles) {
    let weightedSignalSum = 0;
    let totalWeight = 0;
    const processedArticles = articles.map((article) => {
        const sentimentScore = Math.random();
        let sentiment;
        let signal;
        if (sentimentScore > 0.6) {
            sentiment = 'positive';
            signal = 'buy';
        }
        else if (sentimentScore < 0.4) {
            sentiment = 'negative';
            signal = 'sell';
        }
        else {
            sentiment = 'neutral';
            signal = 'hold';
        }
        const sourceWeight = article.weight || 1;
        totalWeight += sourceWeight;
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
    const normalizedSignal = totalWeight > 0 ? weightedSignalSum / totalWeight : 0;
    let aggregatedSignal;
    if (normalizedSignal > 0.2) {
        aggregatedSignal = 'buy';
    }
    else if (normalizedSignal < -0.2) {
        aggregatedSignal = 'sell';
    }
    else {
        aggregatedSignal = 'hold';
    }
    return { aggregatedSignal, details: processedArticles };
};
exports.default = SignalAgent;
//# sourceMappingURL=signalAgent.js.map