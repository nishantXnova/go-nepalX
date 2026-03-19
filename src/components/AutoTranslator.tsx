import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateText, preloadCommonTranslations, getTranslationVaultSize } from "@/lib/translationService";
import { isOnline } from "@/lib/translationVault";
import { logger } from "@/utils/logger";

const COMMON_UI_STRINGS = [
    // Navigation
    'Home', 'Destinations', 'Hotels', 'Flights', 'Plan Trip', 'Nearby', 'Profile', 'Login', 'Sign Up', 'Logout',
    // Common actions
    'Search', 'Book Now', 'View Details', 'Read More', 'Submit', 'Cancel', 'Save', 'Delete', 'Edit', 'Close',
    // Weather & Status
    'Weather', 'Temperature', 'Humidity', 'Wind', 'Forecast', 'Today', 'Tomorrow', 'Loading',
    // Travel info
    'Distance', 'Duration', 'Rating', 'Reviews', 'Price', 'Currency', 'Per person', 'Available', 'Sold out',
    // Messages
    'Error', 'Success', 'No results found', 'Please wait', 'Welcome', 'Next', 'Previous',
    // Emergency
    'Emergency', 'Help', 'Hospital', 'Police', 'Ambulance', 'Contact us',
    // Categories
    'Trekking', 'Hiking', 'Tour', 'Adventure', 'Cultural', 'Wildlife', 'Nature', 'Mountain',
    // UI Elements
    'Learn more', 'See all', 'View all', 'Popular', 'Featured', 'Recommended', 'Best value',
    // Auth
    'Email', 'Password', 'Sign in', 'Create account', 'Forgot password', 'Remember me',
];

const AutoTranslator = () => {
    const { currentLanguage } = useLanguage();
    const observerRef = useRef<MutationObserver | null>(null);
    const hasPreloadedRef = useRef<boolean>(false);

    // Track original text for each node to allow switching back to English
    const originalTextMap = useRef<Map<Node, string>>(new Map());

    const shouldShield = (text: string) => {
        const protectedPatterns = [
            /GoNepal/gi,
            /Go\s+Nepal/gi,
            /Go-Nepal/gi,
            /Rs\.?\s?\d+/i,        // Rs. 500
            /NPR\.?\s?\d+/i,       // NPR 1000
            /\$\d+/g,              // $50
            /€\d+/g,               // €50
            /\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4}/gi, // 20 Feb 2026
            /\d{4}-\d{2}-\d{2}/g,  // 2026-02-20
            /^\d+(\.\d+)?$/,       // Just numbers
        ];
        return protectedPatterns.some(pattern => pattern.test(text.trim()));
    };

    const shouldTranslate = (node: Node) => {
        if (!node.textContent || node.textContent.trim().length < 2) return false;

        // Prevent translation if the node or its parent has data-no-translate
        const parent = node.parentElement;
        if (parent?.dataset.noTranslate === "true") return false;

        if (shouldShield(node.textContent)) return false;

        // Ignore script, style, and icon tags
        if (parent) {
            const tag = parent.tagName.toLowerCase();
            if (["script", "style", "noscript", "svg", "path"].includes(tag)) return false;
            // Also ignore elements that have already been translated
            if (parent.dataset.translated === "true" && currentLanguage.code !== "en") return false;
        }

        return true;
    };

    const translateNode = async (node: Node) => {
        if (!shouldTranslate(node)) return;

        // Save original text if not already saved
        if (!originalTextMap.current.has(node)) {
            originalTextMap.current.set(node, node.textContent || "");
        }

        const originalText = originalTextMap.current.get(node);
        if (!originalText) return;

        if (currentLanguage.code === "en") {
            node.textContent = originalText;
            if (node.parentElement) delete node.parentElement.dataset.translated;
            return;
        }

        try {
            // This now uses the offline-first translation service with Dexie
            const translated = await translateText(originalText, "en", currentLanguage.code);
            if (translated && translated !== originalText) {
                node.textContent = translated;
                if (node.parentElement) node.parentElement.dataset.translated = "true";
            }
        } catch (error) {
            logger.error("Auto-translation error for node:", error);
        }
    };

    const processNodes = (root: Node) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
            translateNode(node);
        }
    };

    // Preload common UI strings when language changes (only when online)
    const preloadOnLanguageChange = async () => {
        if (currentLanguage.code === 'en') return;
        if (hasPreloadedRef.current) return;
        
        // Only preload if online - this primes the Dexie vault
        if (!isOnline()) {
            logger.log('[AutoTranslator] Offline - skipping preload, will use cached translations');
            hasPreloadedRef.current = true;
            return;
        }

        hasPreloadedRef.current = true;
        
        logger.log(`[AutoTranslator] Preloading common strings to ${currentLanguage.name}...`);
        
        // Preload translations to Dexie vault for offline use
        await preloadCommonTranslations(COMMON_UI_STRINGS, currentLanguage.code);
        
        const size = await getTranslationVaultSize();
        logger.log(`[AutoTranslator] Translation vault now contains ${size} cached translations`);
    };

    useEffect(() => {
        // Preload translations when language changes to non-English
        preloadOnLanguageChange();
    }, [currentLanguage.code]);

    useEffect(() => {
        // Initial translation of the whole page
        processNodes(document.body);

        // Setup mutation observer for dynamic content
        observerRef.current = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        translateNode(node);
                    } else {
                        processNodes(node);
                    }
                });
            });
        });

        observerRef.current.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [currentLanguage.code]);

    return null; // This component doesn't render anything
};

export default AutoTranslator;
