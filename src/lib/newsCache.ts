import Dexie, { Table } from 'dexie';
import { logger } from '@/utils/logger';

/**
 * News Cache - IndexedDB storage for offline news
 * Allows AI news summaries to work offline
 */

export interface CachedNewsItem {
    id?: number;
    title: string;
    link: string;
    pubDate: string;
    thumbnail: string;
    source: string;
    isEmergency: boolean;
    lastUpdated: string;
    cachedAt: number;
}

class NewsCacheDB extends Dexie {
    news!: Table<CachedNewsItem>;

    constructor() {
        super('GonepalNewsCache');
        this.version(1).stores({
            news: '++id, title, isEmergency, cachedAt'
        });
    }
}

export const newsCache = new NewsCacheDB();

/**
 * Cache news items for offline use
 */
export const cacheNews = async (items: CachedNewsItem[]): Promise<void> => {
    // Clear old cache first
    await newsCache.news.clear();
    
    // Add timestamp to each item
    const itemsWithTimestamp = items.map(item => ({
        ...item,
        cachedAt: Date.now()
    }));
    
    await newsCache.news.bulkAdd(itemsWithTimestamp);
    logger.log(`[NewsCache] Cached ${items.length} news items`);
};

/**
 * Get cached news items
 */
export const getCachedNews = async (): Promise<CachedNewsItem[]> => {
    return await newsCache.news.toArray();
};

/**
 * Check if cache is fresh (less than 1 hour old)
 */
export const isCacheFresh = async (): Promise<boolean> => {
    const items = await newsCache.news.toArray();
    if (items.length === 0) return false;
    
    const oldestItem = items[0];
    const hourInMs = 60 * 60 * 1000;
    return (Date.now() - oldestItem.cachedAt) < hourInMs;
};

/**
 * Clear news cache
 */
export const clearNewsCache = async (): Promise<void> => {
    await newsCache.news.clear();
};

/**
 * Get emergency news only
 */
export const getEmergencyNews = async (): Promise<CachedNewsItem[]> => {
    return await newsCache.news
        .where('isEmergency')
        .equals(1)
        .toArray();
};
