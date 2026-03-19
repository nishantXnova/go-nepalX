import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudRain, Sun, Thermometer, MapPin, Loader2, Navigation, Wind, Droplets, Sparkles, AlertTriangle, X, Search, LocateFixed, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWeather } from "@/contexts/WeatherContext";
import { GlassmorphicSkeleton } from "@/components/ui/GlassmorphicSkeleton";
import { getCachedTrip, isWeatherStale } from "@/lib/offlineService";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";


interface WeatherData {
    temperature: number;
    condition: string;
    conditionCode: number;
    locationName: string;
    windSpeed: number;
    humidity: number;
    isCurrentLocation: boolean;
}

interface LocationSuggestion {
    display_name: string;
    lat: string;
    lon: string;
}

const WeatherForecast = () => {
    const { isOpen, closeWeather } = useWeather();
    const { toast } = useToast();
    const [weather, setWeather] = useState<WeatherData | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recommendation, setRecommendation] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [isStale, setIsStale] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Monitor online/offline status
    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOffline(!navigator.onLine);
        };
        
        updateOnlineStatus();
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        
        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
        };
    }, []);

    const getWeatherCondition = (code: number) => {
        if (code === 0) return "Clear sky";
        if (code <= 3) return "Partly cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 67) return "Rainy";
        if (code <= 77) return "Snowy";
        if (code <= 82) return "Showers";
        if (code <= 99) return "Thunderstorm";
        return "Unknown";
    };

    const generateAIRecommendation = (temp: number, conditionCode: number) => {
        if (conditionCode === 0 || (conditionCode >= 1 && conditionCode <= 3)) {
            if (temp > 20) return "It's a beautiful day! Perfect for outdoor adventures or exploring local markets.";
            if (temp > 10) return "Crisp and clear. Ideal for sightseeing and photography.";
            return "Chilly but clear. Great for enjoying localized warm beverages with a view.";
        }
        if (conditionCode >= 61 && conditionCode <= 82) {
            return "A bit damp outside. Perfect time to visit indoor museums or cozy cafes.";
        }
        if (conditionCode >= 95) {
            return "Stormy weather. Stay safe indoors! Good time to plan your next itinerary.";
        }
        return "Adaptable weather ahead. Keep a light jacket handy!";
    };

    const fetchWeather = async (lat: number, lon: number, customLocationName?: string, iscurrent: boolean = false) => {
        // If offline, try to use cached data
        if (!navigator.onLine) {
            const cached = getCachedTrip();
            if (cached?.weather) {
                setWeather({
                    temperature: cached.weather.temp,
                    condition: cached.weather.condition,
                    conditionCode: 0, // Default code for cached data
                    locationName: cached.weather.location,
                    windSpeed: 0,
                    humidity: 50,
                    isCurrentLocation: false
                });
                setIsStale(isWeatherStale(cached.timestamp));
                setLoading(false);
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);
            setIsStale(false);
            // Added timezone=auto for accurate local time data syncing
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.current_weather) {
                const current = data.current_weather;
                const condition = getWeatherCondition(current.weathercode);

                let locationName = customLocationName || "Your Location";
                if (!customLocationName) {
                    try {
                        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                        const geoData = await geoResponse.json();
                        locationName = geoData.address.city || geoData.address.town || geoData.address.village || "Unknown Location";
                    } catch (e) {
                        logger.error("Geocoding error:", e);
                    }

                }

                const weatherData: WeatherData = {
                    temperature: current.temperature,
                    condition: condition,
                    conditionCode: current.weathercode,
                    locationName: locationName,
                    windSpeed: current.windspeed,
                    humidity: data.hourly?.relativehumidity_2m?.[0] || 60,
                    isCurrentLocation: iscurrent
                };

                setWeather(weatherData);
                setRecommendation(generateAIRecommendation(current.temperature, current.weathercode));
                setSearchQuery(""); // Clear search on success
                setShowSuggestions(false);
            }
        } catch (err) {
            logger.error("Weather fetch error:", err);
            setError("Failed to fetch weather data.");

        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        if ("geolocation" in navigator) {
            toast({
                title: "Location Access",
                description: "We use your location to provide accurate weather for your current area.",
            });

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude, undefined, true);
                },
                (err) => {
                    logger.error("Geolocation error:", err);
                    fetchWeather(27.7172, 85.3240, "Kathmandu", false); // Fallback
                    setError("Location access denied. Showing Kathmandu.");
                }
            );
        } else {
            fetchWeather(27.7172, 85.3240, "Kathmandu", false);
        }
    };


    // Debounced Search Handler
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (searchQuery.trim().length > 2) {
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (e) {
                    logger.error("Search error:", e);
                    setSuggestions([]);

                } finally {
                    setIsSearching(false);
                }
            }, 500); // 500ms debounce
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsSearching(false);
        }

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchQuery]);

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        const shortName = suggestion.display_name.split(",")[0];
        fetchWeather(parseFloat(suggestion.lat), parseFloat(suggestion.lon), shortName, false);
    };

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && !weather) {
            getLocation();
        }
    }, [isOpen]);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="h-10 w-10 text-nepal-gold" />;
        if (code <= 3) return <Cloud className="h-10 w-10 text-muted-foreground" />;
        return <CloudRain className="h-10 w-10 text-nepal-forest" />;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={closeWeather}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-background/90 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-visible"
                    >
                        {/* Header / Close */}
                        <div className="absolute top-4 right-4 z-20">
                            <Button variant="ghost" size="icon" onClick={closeWeather} className="rounded-full hover:bg-black/10">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Search Bar & Suggestions */}
                            <div className="flex gap-2 mb-6">
                                <div ref={wrapperRef} className="relative z-30 flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search city (e.g., Pokhara, London)..."
                                            className="pl-10 rounded-xl bg-secondary/80 border-transparent focus:border-nepal-forest/50"
                                        />
                                        {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>

                                    {/* Auto-complete Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 overflow-hidden"
                                            >
                                                {suggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors text-sm border-b last:border-0 border-border/50 flex items-center gap-2"
                                                    >
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="truncate">{suggestion.display_name}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={getLocation}
                                    title="My Location"
                                    className="shrink-0 rounded-xl bg-secondary/80 border-transparent hover:bg-secondary hover:text-nepal-forest"
                                >
                                    <LocateFixed className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="min-h-[300px] flex flex-col justify-center">
                                {loading && !weather ? (
                                    <div className="space-y-6 py-4">
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-nepal-forest mb-2" />
                                            <p className="text-muted-foreground text-xs">Forecasting...</p>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <GlassmorphicSkeleton className="h-8 w-48 mx-auto" variant="text" />
                                            <GlassmorphicSkeleton className="h-4 w-32 mx-auto" variant="text" />
                                        </div>
                                        <div className="flex items-center justify-center gap-6 py-2">
                                            <GlassmorphicSkeleton className="h-16 w-16 rounded-2xl" />
                                            <GlassmorphicSkeleton className="h-12 w-24" variant="text" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <GlassmorphicSkeleton className="h-14" variant="card" />
                                            <GlassmorphicSkeleton className="h-14" variant="card" />
                                        </div>
                                        <GlassmorphicSkeleton className="h-20" variant="card" />
                                    </div>
                                ) : weather ? (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-5 w-5 text-nepal-forest" />
                                                    {weather.locationName}
                                                </div>
                                                {weather.isCurrentLocation && (
                                                    <span className="text-xs font-normal text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-full">
                                                        Your Location
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-muted-foreground text-sm mt-1">{weather.condition}</p>
                                            {isOffline && (
                                                <div className="flex items-center justify-center gap-2 mt-2">
                                                    <WifiOff className="h-4 w-4 text-amber-500" />
                                                    {isStale ? (
                                                        <span className="text-amber-500 text-xs bg-amber-500/10 px-2 py-1 rounded-lg">
                                                            cached weather may be old
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-500 text-xs">
                                                            Showing cached data
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center gap-6 py-4">
                                            <div className="p-4 bg-secondary/50 rounded-2xl">
                                                {getWeatherIcon(weather.conditionCode)}
                                            </div>
                                            <div className="text-5xl font-bold">
                                                {weather.temperature}°
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl">
                                                <Wind className="h-4 w-4 mb-1 text-muted-foreground" />
                                                <span className="font-semibold text-sm">{weather.windSpeed} km/h</span>
                                            </div>
                                            <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl">
                                                <Droplets className="h-4 w-4 mb-1 text-muted-foreground" />
                                                <span className="font-semibold text-sm">{weather.humidity}%</span>
                                            </div>
                                        </div>

                                        <div className="bg-nepal-forest/5 p-4 rounded-xl border border-nepal-forest/10">
                                            <div className="flex items-center gap-2 mb-2 text-nepal-forest text-xs font-bold uppercase tracking-wide">
                                                <Sparkles className="h-3 w-3" />
                                                Travel AI
                                            </div>
                                            <p className="text-sm text-foreground/90 leading-relaxed">
                                                "{recommendation}"
                                            </p>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg justify-center">
                                                <AlertTriangle className="h-3 w-3" />
                                                {error}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground">Search for a location to see the forecast.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WeatherForecast;
