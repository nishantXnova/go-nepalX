import { trackMetric } from "./metricsService";

export interface DigitalID {
    name: string;
    passportNumber: string;
    nationality: string;
    emergencyContact: string;
    dob: string;
}

export interface CachedTripData {
    weather: {
        temp: number;
        condition: string;
        location: string;
    };
    homeCoords: {
        lat: number;
        lng: number;
        address: string;
    };
    emergencyPhrases: {
        english: string;
        nepali: string;
        phonetic: string;
    }[];
    digitalID?: DigitalID;
    timestamp: number;
}

// TTL Constants (in milliseconds)
export const TTL = {
    WEATHER: 6 * 60 * 60 * 1000,        // 6 hours
    MAPS: 7 * 24 * 60 * 60 * 1000,     // 7 days
    EMERGENCY_PHRASES: Infinity,        // forever
    DIGITAL_ID: Infinity,               // forever
} as const;

// Check if weather data is stale
export const isWeatherStale = (timestamp: number): boolean => {
    const currentTime = Date.now();
    const age = currentTime - timestamp;
    return age > TTL.WEATHER;
};

const STORAGE_KEY = "trekker_offline_toolkit";

export const EMERGENCY_PHRASES = [
    { english: "Where is the nearest hospital?", nepali: "नजिकैको अस्पताल कहाँ छ?", phonetic: "Najikaiko aspatal kaha cha?" },
    { english: "I need help.", nepali: "मलाई मद्दत चाहिन्छ।", phonetic: "Malai maddat chahinchha." },
    { english: "I am lost.", nepali: "म हराएँ।", phonetic: "Ma harae." },
    { english: "Call an ambulance.", nepali: "एम्बुलेन्स बोलाउनुहोस्।", phonetic: "Ambulance bolaunuhos." },
    { english: "Where is the police station?", nepali: "प्रहरी चौकी कहाँ छ?", phonetic: "Prahari chauki kaha cha?" },
    { english: "I am injured.", nepali: "म घाइते छु।", phonetic: "Ma ghaite chu." },
    { english: "I need water.", nepali: "मलाई पानी चाहिन्छ।", phonetic: "Malai pani chahinchha." },
    { english: "Is there a pharmacy nearby?", nepali: "के यहाँ नजिकै कुनै औषधि पसल छ?", phonetic: "Ke yaha najikai kunai ausadhi pasal cha?" },
    { english: "Please call this number.", nepali: "कृपया यो नम्बरमा फोन गरिदिनुहोस्।", phonetic: "Kripaya yo number ma phone garidinhosh." },
    { english: "I have an allergy.", nepali: "मलाई एलर्जी छ।", phonetic: "Malai allergy cha." },
];

export const cacheTrip = (data: Omit<CachedTripData, "timestamp" | "emergencyPhrases">) => {
    // Fix 1: Round coordinates to 3 decimal places
    const homeCoords = data.homeCoords ? {
        ...data.homeCoords,
        lat: Math.round(data.homeCoords.lat * 1000) / 1000,
        lng: Math.round(data.homeCoords.lng * 1000) / 1000,
    } : data.homeCoords;

    const fullData: CachedTripData = {
        ...data,
        homeCoords,
        emergencyPhrases: EMERGENCY_PHRASES,
        timestamp: Date.now(),
    };

    // Fix 2: Strip digitalID before storing
    if (fullData.digitalID) {
        delete fullData.digitalID;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
};

export const getCachedTrip = (): CachedTripData | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    if (!navigator.onLine) {
        trackMetric('offline_access');
    }

    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
};

export const clearCachedTrip = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const isOffline = () => !navigator.onLine;
