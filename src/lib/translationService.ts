/**
 * Translation Service with Offline Support using Dexie.js
 * 
 * Flow:
 * 1. Check Memory Cache FIRST (fastest)
 * 2. Check Dexie Vault SECOND (offline-ready)
 * 3. If Offline and not in vault, return original text
 * 4. If Online, fetch from API and save to vault for future offline use
 */

import { trackMetric } from "./metricsService";
import { 
    translationVault, 
    TranslationEntry, 
    clearTranslationVault, 
    isOnline,
    getVaultSize 
} from "./translationVault";
import { logger } from "@/utils/logger";

export interface TranslationResult {
    text: string;
    sourceLang: string;
    targetLang: string;
}

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

// Memory cache for fastest access (cleared on page refresh)
const memoryCache: Record<string, string> = {};

// Track which keys have been saved to vault to avoid duplicates
const savedToVault: Set<string> = new Set();

export const clearTranslationCache = async () => {
    Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    savedToVault.clear();
    await clearTranslationVault();
};

export const getTranslationVaultSize = getVaultSize;

/**
 * Save translation to Dexie vault for offline use
 */
const saveToVault = async (
    originalText: string,
    translatedText: string,
    fromLang: string,
    toLang: string
): Promise<void> => {
    const cacheKey = `${fromLang}-${toLang}-${originalText}`;
    
    // Avoid duplicate saves
    if (savedToVault.has(cacheKey)) return;
    
    try {
        await translationVault.translations.add({
            cacheKey,
            originalText,
            translatedText,
            fromLang,
            toLang,
            timestamp: Date.now()
        });
        savedToVault.add(cacheKey);
        logger.log(`[TranslationVault] Saved: ${originalText.substring(0, 30)}... -> ${translatedText.substring(0, 30)}...`);
    } catch (error) {
        logger.error('[TranslationVault] Error saving:', error);
    }
};

/**
 * Check if translation exists in Dexie vault (works offline)
 */
const getFromVault = async (
    cacheKey: string
): Promise<string | undefined> => {
    try {
        const entry = await translationVault.translations
            .where('cacheKey')
            .equals(cacheKey)
            .first();
        
        if (entry) {
            trackMetric('translation_vault_hit');
            return entry.translatedText;
        }
    } catch (error) {
        logger.error('[TranslationVault] Error reading:', error);
    }
    return undefined;
};

/**
 * Main translation function with offline support
 */
export const translateText = async (
    text: string,
    from: string = "auto",
    to: string = "ne"
): Promise<string> => {
    if (!text.trim()) return "";

    trackMetric('translation_request');

    // Create unique cache key
    const cacheKey = `${from}-${to}-${text}`;

    // STEP 1: Check Memory Cache FIRST (fastest)
    if (memoryCache[cacheKey]) {
        trackMetric('translation_memory_cache_hit');
        return memoryCache[cacheKey];
    }

    // STEP 2: Check Dexie Vault SECOND (works offline)
    const vaultTranslation = await getFromVault(cacheKey);
    if (vaultTranslation) {
        // Save to memory cache for faster subsequent access
        memoryCache[cacheKey] = vaultTranslation;
        return vaultTranslation;
    }

    // STEP 3: If Offline and not in vault, return original text
    if (!isOnline()) {
        trackMetric('translation_offline_fallback');
        return text; // User sees English - but this is better than broken UI
    }

    // STEP 4: Fetch from API if Online
    trackMetric('translation_cache_miss');
    const startTime = Date.now();

    try {
        const params = new URLSearchParams({
            client: "gtx",
            sl: from,
            tl: to,
            dt: "t",
            q: text,
        });

        const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Translation failed: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;
        trackMetric('api_call', duration);

        if (data && data[0]) {
            const translatedParts = data[0].map((part: any) => part[0]);
            const result = translatedParts.join(" ");

            // Store in memory cache
            memoryCache[cacheKey] = result;
            
            // STEP 5: Save to Vault for future offline use
            await saveToVault(text, result, from, to);
            
            return result;
        }

        throw new Error("Invalid response format from translation service");
    } catch (error) {
        logger.error("Translation error:", error);
        return text; // Fallback to original text on error
    }
};

/**
 * Batch translate multiple texts (useful for translating entire sections)
 */
export const translateBatch = async (
    texts: string[],
    from: string = "auto",
    to: string = "ne"
): Promise<string[]> => {
    return Promise.all(texts.map(text => translateText(text, from, to)));
};

/**
 * Preload translations for common UI strings
 * Call this when user selects a language to prime the vault
 */
export const preloadCommonTranslations = async (
    commonStrings: string[],
    to: string = "ne"
): Promise<void> => {
    logger.log(`[TranslationVault] Preloading ${commonStrings.length} common strings to ${to}...`);
    
    for (const text of commonStrings) {
        await translateText(text, "en", to);
    }
    
    const size = await getVaultSize();
    logger.log(`[TranslationVault] Vault now contains ${size} translations`);
};
