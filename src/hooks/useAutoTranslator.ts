import { useEffect, useRef, useCallback } from 'react';
import { translateText, clearTranslationCache, getTranslationVaultSize, preloadCommonTranslations } from '@/lib/translationService';
import { isOnline } from '@/lib/translationVault';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

/**
 * useAutoTranslator - Hook for automatic translation of dynamic content
 * 
 * This hook uses MutationObserver to detect new text elements on the page
 * and automatically translates them using the offline-first translation service.
 * 
 * Flow:
 * 1. When user picks a language, preloads common UI strings
 * 2. MutationObserver watches for new DOM elements
 * 3. New text is translated (from vault if offline, from API if online)
 * 4. Translations are saved to vault for future offline use
 */

interface UseAutoTranslatorOptions {
    /** Skip translation for these selectors */
    skipSelectors?: string[];
    /** Only translate these selectors (if empty, translate all) */
    onlySelectors?: string[];
    /** Delay before translating (ms) - helps with animations */
    delay?: number;
}

const DEFAULT_SKIP_SELECTORS = [
    'script',
    'style',
    'noscript',
    'iframe',
    'input',
    'textarea',
    'select',
    '[data-skip-translate]',
    '.no-translate',
    '[translate="no"]',
];

const DEFAULT_ONLY_SELECTORS: string[] = [];

const COMMON_UI_STRINGS = [
    // Navigation
    'Home', 'Destinations', 'Hotels', 'Flights', 'Plan Trip', 'Nearby', 'Profile', 'Login', 'Sign Up',
    // Common actions
    'Search', 'Book Now', 'View Details', 'Read More', 'Submit', 'Cancel', 'Save', 'Delete', 'Edit',
    // Weather & Status
    'Weather', 'Temperature', 'Humidity', 'Wind', 'Forecast', 'Today', 'Tomorrow',
    // Travel info
    'Distance', 'Duration', 'Rating', 'Reviews', 'Price', 'Currency',
    // Messages
    'Loading...', 'Error', 'Success', 'No results found', 'Please wait',
    // Emergency
    'Emergency', 'Help', 'Hospital', 'Police', 'Ambulance',
    // Categories
    'Trekking', 'Hiking', 'Tour', 'Adventure', 'Cultural', 'Wildlife',
];

export const useAutoTranslator = (options: UseAutoTranslatorOptions = {}) => {
    const { skipSelectors = DEFAULT_SKIP_SELECTORS, onlySelectors = DEFAULT_ONLY_SELECTORS, delay = 100 } = options;
    const { currentLanguage } = useLanguage();
    const observerRef = useRef<MutationObserver | null>(null);
    const isTranslatingRef = useRef<Set<Element>>(new Set());
    const hasPreloadedRef = useRef<boolean>(false);

    /**
     * Check if element should be translated
     */
    const shouldTranslate = useCallback((element: Element): boolean => {
        // Skip if in skip list
        for (const selector of skipSelectors) {
            if (element.matches(selector)) return false;
        }

        // If onlySelectors is specified, only translate those
        if (onlySelectors.length > 0) {
            for (const selector of onlySelectors) {
                if (element.matches(selector)) return true;
            }
            return false;
        }

        // Check if element has translatable text
        const hasText = element.textContent?.trim().length ?? 0 > 0;
        const isNotEmpty = element.childNodes.length > 0;
        
        return hasText && isNotEmpty;
    }, [skipSelectors, onlySelectors]);

    /**
     * Translate a single element's text content
     */
    const translateElement = useCallback(async (element: Element) => {
        // Skip if already being translated
        if (isTranslatingRef.current.has(element)) return;
        
        // Skip if not the target language (only translate TO Nepali/other, not FROM)
        if (currentLanguage.code === 'en') return;
        
        // Skip if already has translation marker
        if (element.hasAttribute('data-translated')) return;

        const text = element.textContent?.trim();
        if (!text || text.length < 2) return;

        // Skip very long texts (likely articles) - save vault space
        if (text.length > 500) return;

        isTranslatingRef.current.add(element);

        try {
            const translated = await translateText(text, 'en', currentLanguage.code);
            
            if (translated && translated !== text) {
                element.setAttribute('data-translated', 'true');
                element.setAttribute('data-original-text', text);
                
                // Preserve HTML structure if possible
                if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                    element.textContent = translated;
                }
            }
        } catch (error) {
            logger.error('[AutoTranslator] Error:', error);
        } finally {
            isTranslatingRef.current.delete(element);
        }
    }, [currentLanguage.code]);

    /**
     * Process multiple elements with delay
     */
    const processElements = useCallback((elements: Element[]) => {
        setTimeout(() => {
            elements.forEach(el => {
                if (shouldTranslate(el)) {
                    translateElement(el);
                }
            });
        }, delay);
    }, [delay, shouldTranslate, translateElement]);

    /**
     * Preload common UI strings when language changes
     */
    const preloadTranslations = useCallback(async () => {
        if (currentLanguage.code === 'en') return;
        if (hasPreloadedRef.current) return;
        
        // Only preload if online
        if (!isOnline()) {
            logger.log('[AutoTranslator] Offline - skipping preload');
            hasPreloadedRef.current = true;
            return;
        }

        hasPreloadedRef.current = true;
        
        logger.log(`[AutoTranslator] Preloading common strings to ${currentLanguage.name}...`);
        await preloadCommonTranslations(COMMON_UI_STRINGS, currentLanguage.code);
        
        const size = await getTranslationVaultSize();
        logger.log(`[AutoTranslator] Vault size: ${size} translations`);
    }, [currentLanguage]);

    /**
     * Initialize MutationObserver
     */
    useEffect(() => {
        // Preload translations on language change
        preloadTranslations();

        const handleMutations = (mutations: MutationRecord[]) => {
            const newElements: Element[] = [];

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            newElements.push(node as Element);
                            // Also check children of added element
                            newElements.push(...(node as Element).querySelectorAll('*'));
                        }
                    });
                }
            });

            if (newElements.length > 0) {
                processElements(newElements);
            }
        };

        observerRef.current = new MutationObserver(handleMutations);
        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Initial translation of existing content
        setTimeout(() => {
            const allElements = document.body.querySelectorAll('*');
            processElements(Array.from(allElements));
        }, 500);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [currentLanguage.code, processElements, preloadTranslations]);

    /**
     * Manual translation trigger (for components that need it)
     */
    const forceTranslate = useCallback(async (element: Element) => {
        await translateElement(element);
    }, [translateElement]);

    return {
        forceTranslate,
        isOnline: isOnline(),
    };
};

export default useAutoTranslator;
