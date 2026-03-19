import { cacheNews, getCachedNews, CachedNewsItem } from './newsCache';
import { logger } from '@/utils/logger';

export interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    thumbnail: string;
    source: string;
    isEmergency: boolean;
    lastUpdated: string;
}

const NEPAL_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1000&auto=format&fit=crop";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapItems = (items: any[], sourceName: string): NewsItem[] => {
    const emergencyKeywords = [
        'flood', 'landslide', 'earthquake', 'avalanche', 'emergency', 'disaster', 'alert',
        'strike', 'bandh', 'protest', 'demonstration', 'blockade',
        'holi', 'dashain', 'tihar', 'festival', 'parade'
    ];
    const irrelevantKeywords = ['irrelevant', 'spam', 'ads'];

    return items
        .filter(item => {
            const titleLower = item.title.toLowerCase();
            return !irrelevantKeywords.some(k => titleLower.includes(k));
        })
        .slice(0, 10).map((item): NewsItem => {
            const titleLower = item.title.toLowerCase();
            const isEmergency = emergencyKeywords.some(k => titleLower.includes(k));

            // More robust thumbnail extraction
            let thumbnail = item.thumbnail || item.enclosure?.link;

            // If still missing, try to find in description or content
            if (!thumbnail && item.description) {
                const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) thumbnail = imgMatch[1];
            }

            if (!thumbnail && item.content) {
                const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) thumbnail = imgMatch[1];
            }

            return {
                title: item.title,
                link: item.link,
                pubDate: item.pubDate || new Date().toISOString(),
                thumbnail: thumbnail || NEPAL_FALLBACK_IMAGE,
                source: `Verified Source: ${sourceName}`,
                isEmergency,
                lastUpdated: new Date().toLocaleTimeString(),
            };
        });
};

const SOURCES = [
    {
        name: 'OnlineKhabar English',
        rss: 'https://english.onlinekhabar.com/feed',
    },
    {
        name: 'OnlineKhabar',
        rss: 'https://www.onlinekhabar.com/feed',
    },
];

// Check if online
const isOnline = (): boolean => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

export const fetchAlerts = async (): Promise<NewsItem[]> => {
    const news = await fetchNepalNews();
    return news.filter(item => item.isEmergency);
};

export const fetchNepalNews = async (): Promise<NewsItem[]> => {
    // If offline, try to get from cache
    if (!isOnline()) {
        logger.log('[News] Offline - fetching from cache');
        const cached = await getCachedNews();
        if (cached.length > 0) {
            logger.log(`[News] Found ${cached.length} cached items`);
            return cached.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                thumbnail: item.thumbnail,
                source: item.source,
                isEmergency: item.isEmergency,
                lastUpdated: item.lastUpdated + ' (offline)'
            }));
        }
        logger.log('[News] No cached news available');
        return [];
    }

    // Try to fetch from network
    for (const source of SOURCES) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.rss)}&count=10`;
            const response = await fetch(apiUrl);
            if (!response.ok) continue;
            const data = await response.json();
            if (data.status !== 'ok' || !data.items?.length) continue;

            logger.info(`[News] Loaded from: ${source.name}`);
            const newsItems = mapItems(data.items, source.name);
            
            // Cache the news for offline use
            await cacheNews(newsItems as CachedNewsItem[]);
            
            return newsItems;
        } catch (err) {
            logger.warn(`[News] Failed source ${source.name}:`, err);
        }
    }

    // If all sources fail, try cache as fallback
    logger.log('[News] All sources failed - trying cache');
    const cached = await getCachedNews();
    if (cached.length > 0) {
        return cached.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            thumbnail: item.thumbnail,
            source: item.source,
            isEmergency: item.isEmergency,
            lastUpdated: item.lastUpdated + ' (cached)'
        }));
    }

    logger.error('[News] All sources failed.');
    return [];
};

// Keep old export name as alias for backward compat
export const fetchOnlineKhabarNews = fetchNepalNews;
