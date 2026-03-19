import Dexie, { Table } from 'dexie';
import { logger } from '@/utils/logger';


/**
 * Currency Cache - Offline currency rates
 */

export interface CachedCurrency {
    id?: number;
    key: string;
    rates: Record<string, number>;
    cachedAt: number;
}

class CurrencyCacheDB extends Dexie {
    currencies!: Table<CachedCurrency>;

    constructor() {
        super('GonepalCurrencyCache');
        this.version(1).stores({
            currencies: '++id, key'
        });
    }
}

export const currencyCache = new CurrencyCacheDB();

// Default rates (fallback when offline and no cache)
const DEFAULT_RATES: Record<string, number> = {
    usd: 1,
    npr: 133.5,
    inr: 83.12,
    eur: 0.92,
    gbp: 0.79,
    aud: 1.53,
    cad: 1.36,
    jpy: 149.5,
    cny: 7.24,
    thb: 35.2,
    bdt: 110.5,
    lkr: 325.0,
};

export interface RatesWithMeta {
    rates: Record<string, number>;
    timestamp: number;
    isDefault?: boolean;
}

export const getCachedRates = async (key: string = 'usd'): Promise<RatesWithMeta> => {
    // Try cache first
    const cached = await currencyCache.currencies.where('key').equals(key).first();
    
    if (cached) {
        // Check if less than 1 hour old for background refresh logic (not used here yet)
        const hourInMs = 60 * 60 * 1000;
        
        // If online, fetch fresh rates
        if (typeof navigator !== 'undefined' && navigator.onLine && (Date.now() - cached.cachedAt > hourInMs)) {
            try {
                const urls = [
                    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${key}.min.json`,
                    `https://latest.currency-api.pages.dev/v1/currencies/${key}.min.json`,
                ];
                
                for (const url of urls) {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        if (data[key]) {
                            // Cache the rates
                            const now = Date.now();
                            await currencyCache.currencies.put({
                                key,
                                rates: data[key],
                                cachedAt: now
                            });
                            return { rates: data[key], timestamp: now };
                        }
                    }
                }
            } catch (e) {
                logger.warn('Currency fetch failed:', e);
            }

        }
        
        return { rates: cached.rates, timestamp: cached.cachedAt };
    }
    
    // If online and no cache, fetch fresh rates
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            const urls = [
                `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${key}.min.json`,
                `https://latest.currency-api.pages.dev/v1/currencies/${key}.min.json`,
            ];
            
            for (const url of urls) {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data[key]) {
                        const now = Date.now();
                        // Cache the rates
                        await currencyCache.currencies.put({
                            key,
                            rates: data[key],
                            cachedAt: now
                        });
                        return { rates: data[key], timestamp: now };
                    }
                }
            }
        } catch (e) {
            logger.warn('Currency fetch failed:', e);
        }

    }
    
    // Return default
    return { rates: DEFAULT_RATES, timestamp: 0, isDefault: true };
};

export const getDefaultRates = () => DEFAULT_RATES;
