import { Parser } from 'rss-parser';

// Types and Interfaces
export interface CryptoSignal {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

export interface FeedSource {
    url: string;
    weight: number;
    tier: number;
}

// Constants
export const FEED_SOURCES: FeedSource[] = [
    // Tier 1 Sources (Most Reliable)
    { url: 'https://www.bloomberg.com/feeds/podcasts/etf.xml', weight: 0.95, tier: 1 },
    { url: 'https://www.reuters.com/rssFeed/cryptocurrency', weight: 0.95, tier: 1 },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', weight: 0.90, tier: 1 },
    { url: 'https://www.wsj.com/xml/rss/3_7455.xml', weight: 0.90, tier: 1 },
    { url: 'https://cointelegraph.com/rss', weight: 0.85, tier: 1 },
    { url: 'https://bitcoinmagazine.com/.rss/full/', weight: 0.85, tier: 1 },

    // Tier 2 Sources (Reliable but may need verification)
    { url: 'https://cryptonews.com/news/feed', weight: 0.80, tier: 2 },
    { url: 'https://decrypt.co/feed', weight: 0.80, tier: 2 },
    { url: 'https://www.theblockcrypto.com/rss.xml', weight: 0.75, tier: 2 },
    { url: 'https://news.bitcoin.com/feed/', weight: 0.75, tier: 2 },
    { url: 'https://bitcoinist.com/feed/', weight: 0.70, tier: 2 },
    { url: 'https://ambcrypto.com/feed/', weight: 0.70, tier: 2 },

    // Tier 3 Sources (Supplementary Information)
    { url: 'https://cryptoslate.com/feed/', weight: 0.65, tier: 3 },
    { url: 'https://dailyhodl.com/feed/', weight: 0.60, tier: 3 },
    { url: 'https://zycrypto.com/feed/', weight: 0.60, tier: 3 },
    { url: 'https://cryptopotato.com/feed/', weight: 0.60, tier: 3 },
    { url: 'https://beincrypto.com/feed/', weight: 0.55, tier: 3 },
    { url: 'https://u.today/rss', weight: 0.55, tier: 3 },
    { url: 'https://nulltx.com/feed/', weight: 0.50, tier: 3 }
];
