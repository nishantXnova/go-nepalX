import { cacheTrip } from "./offlineService";
import { trackMetric } from "./metricsService";
import { logger } from "@/utils/logger";

const SAMPLE_TOURIST_DATA = {
    touristId: "NPL-2026-9999",
    name: "Alex Wanderer",
    nationality: "Switzerland",
    nationalityFlag: "🇨🇭",
    passportNumber: "Z987654321",
    visaType: "Tourist (15 Days)",
    visaNumber: "VIS-2026-X99",
    entryDate: "2026-02-15",
    exitDate: "2026-03-02",
    status: "Valid",
    expiry: "2026-03-02",
    emergencyContact: "+41 44 123 4567",
    photo: null,
};

const SAMPLE_CACHED_TRIP = {
    weather: {
        temp: 8,
        condition: "Partly Cloudy",
        location: "Namche Bazaar",
    },
    homeCoords: {
        lat: 27.8069,
        lng: 86.7131,
        address: "Namche Bazaar, Everest Region",
    }
};

export const triggerDemoMode = () => {
    // 1. Pre-fill Tourist ID
    localStorage.setItem("tourist_id_data", JSON.stringify(SAMPLE_TOURIST_DATA));

    // 2. Pre-fill Offline Toolkit
    cacheTrip(SAMPLE_CACHED_TRIP);

    // 3. Populate Metrics and Cache
    // Simulate some translations to show high cache efficiency
    const commonPhrases = [
        "Hello", "Thank you", "Where is the bathroom?",
        "How much is this?", "Help", "I'm lost"
    ];

    // Fill cache
    commonPhrases.forEach(p => {
        // We can't easily fill the translation cache from here without async 
        // but we can at least simulate hits/misses in metrics
    });

    // Notify user via console or a toast would be better but this is a lib
    logger.log("Demo Mode Activated: Data pre-filled.");
};
