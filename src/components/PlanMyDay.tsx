import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, MapPin, Sun, Cloud, CloudRain, Sparkles,
    Navigation, Clock, ExternalLink, Wind, Droplets,
    Mountain, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchAlerts, NewsItem } from "@/lib/newsService";
import { AlertCircle, AlertTriangle, PartyPopper } from "lucide-react";
import { GlassmorphicSkeleton } from "@/components/ui/GlassmorphicSkeleton";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";


interface PlanMyDayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface WeatherData {
    temperature: number;
    condition: string;
    conditionCode: number;
    locationName: string;
    windSpeed: number;
    humidity: number;
}

interface ItineraryStop {
    time: string;
    name: string;
    description: string;
    tip: string;
    type: string;
    lat?: number;
    lng?: number;
}

// Parse the AI response text into structured stops
function parseItinerary(text: string): ItineraryStop[] {
    const stops: ItineraryStop[] = [];
    // Split by numbered list pattern: "1.", "2.", etc.
    const chunks = text.split(/(?=\d+\.\s)/);
    for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (!trimmed || !/^\d+\./.test(trimmed)) continue;

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const titleLine = lines[0]?.replace(/^\d+\.\s*/, '') || '';
        const timeParts = titleLine.match(/\(([^)]+)\)/);
        const name = titleLine.replace(/\([^)]+\)/g, '').replace(/\*\*/g, '').trim();
        const time = timeParts?.[1] || '';

        const description = lines.slice(1).find(l => !l.toLowerCase().startsWith('tip') && !l.toLowerCase().startsWith('pro tip') && !l.startsWith('•') && !l.startsWith('-'))?.replace(/\*\*/g, '') || '';
        const tipLine = lines.find(l => l.toLowerCase().includes('tip:'));
        const tip = tipLine ? tipLine.replace(/.*tip[:\s]*/i, '').replace(/\*\*/g, '').trim() : '';

        if (name) {
            stops.push({ time, name, description, tip, type: 'culture' });
        }
    }
    return stops.slice(0, 4);
}

const PlanMyDay = ({ isOpen, onClose }: PlanMyDayProps) => {
    const { toast } = useToast();
    const [step, setStep] = useState<'locating' | 'weather' | 'generating' | 'done' | 'error'>('locating');
    const [weather, setWeather] = useState<WeatherData | null>(null);

    const [stops, setStops] = useState<ItineraryStop[]>([]);
    const [rawAiText, setRawAiText] = useState('');
    const [mapsUrl, setMapsUrl] = useState('');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [alerts, setAlerts] = useState<NewsItem[]>([]);
    const [errorMsg, setErrorMsg] = useState('');

    const getWeatherLabel = (code: number) => {
        if (code === 0) return 'Clear Skies';
        if (code < 3) return 'Partly Cloudy';
        if (code < 50) return 'Overcast';
        if (code < 70) return 'Rainy';
        return 'Stormy';
    };

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="w-8 h-8 text-yellow-500" />;
        if (code < 3) return <Cloud className="w-8 h-8 text-gray-400" />;
        return <CloudRain className="w-8 h-8 text-blue-500" />;
    };

    const startFlow = async () => {
        setStep('locating');
        setStops([]);
        setRawAiText('');
        setErrorMsg('');

        toast({
            title: "Location Access",
            description: "We use your location to generate a personalized daily itinerary for your current area.",
        });

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });
                setStep('weather');


                try {
                    // 1. Fetch weather
                    const wRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
                    );
                    const wData = await wRes.json();
                    const current = wData.current;

                    // 2. Reverse geocode
                    let locationName = 'Kathmandu';
                    try {
                        const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const gData = await gRes.json();
                        locationName = gData.address?.city || gData.address?.town || gData.address?.village || 'Kathmandu';
                    } catch { /* ignore */ }

                    const weatherObj: WeatherData = {
                        temperature: Math.round(current.temperature_2m),
                        condition: getWeatherLabel(current.weather_code),
                        conditionCode: current.weather_code,
                        locationName,
                        windSpeed: Math.round(current.wind_speed_10m),
                        humidity: current.relative_humidity_2m,
                    };
                    setWeather(weatherObj);

                    // 3. Ask AI for itinerary
                    setStep('generating');
                    const isRainy = current.weather_code >= 50;
                    const prompt = `I am currently in ${locationName}, Nepal. The weather right now is: ${weatherObj.condition}, ${weatherObj.temperature}°C, humidity ${weatherObj.humidity}%, wind ${weatherObj.windSpeed} km/h.

Generate a personalized 4-stop day itinerary for a tourist here. ${isRainy ? 'Since it is rainy, prioritize indoor attractions like museums, temples, and cafés.' : 'The weather is nice, so include a mix of outdoor and cultural spots.'}

Format your response EXACTLY like this, with 4 numbered entries:
1. [Place Name] ([Time e.g. 9:00 AM - 10:30 AM])
[One sentence description]
Pro Tip: [One practical tip]

2. ...and so on.

Only output the 4 numbered stops, nothing else. Keep tips short and practical.`;

                    const { data, error } = await supabase.functions.invoke('ai-chatbot', {
                        body: { message: prompt, history: [] }
                    });

                    if (error) throw error;

                    const aiText: string = data.reply || '';
                    setRawAiText(aiText);

                    // 4. Fetch Alerts
                    try {
                        const activeAlerts = await fetchAlerts();
                        setAlerts(activeAlerts);
                    } catch (err) {
                        logger.warn('Failed to fetch alerts:', err);
                    }


                    // 5. Build prompt with alerts if they exist
                    let finalPrompt = prompt;
                    if (alerts.length > 0) {
                        const alertSummaries = alerts.map(a => `- ${a.title}`).join('\n');
                        finalPrompt += `\n\nCRITICAL: There are active alerts/festivals in the region:\n${alertSummaries}\nIMPORTANT: Adjust the itinerary to accommodate these events (maximize safety or cultural experience). Mention the alerts in the tips.`;

                        // Re-trigger AI with context if alerts found (optimistic update to prompt for next time or just use it here)
                        // For simplicity in this demo, we'll just show the banner and let the next regeneration handle it if needed,
                        // OR we re-invoke the AI. Let's re-invoke if alerts are found to make it look "Smart".
                        const { data: dataWithAlerts, error: errorWithAlerts } = await supabase.functions.invoke('ai-chatbot', {
                            body: { message: finalPrompt, history: [] }
                        });
                        if (!errorWithAlerts) {
                            setRawAiText(dataWithAlerts.reply || '');
                            const parsedWithAlerts = parseItinerary(dataWithAlerts.reply || '');
                            setStops(parsedWithAlerts);
                        }
                    }

                    // 6. Parse AI response into stops
                    const parsed = parseItinerary(aiText);
                    if (alerts.length === 0) setStops(parsed);

                    // 5. Build Google Maps URL for parsed stops (using place names as queries)
                    const finalDest = encodeURIComponent(parsed[parsed.length - 1]?.name || locationName + ', Nepal');
                    const stopWaypoints = parsed.slice(0, -1).map(s => encodeURIComponent(s.name + ', Nepal')).join('|');
                    const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${finalDest}&waypoints=${stopWaypoints}&travelmode=walking`;
                    setMapsUrl(mapLink);

                    setStep('done');
                } catch (err) {
                    logger.error('PlanMyDay error:', err);
                    setErrorMsg('Could not generate your itinerary. Please check your connection and try again.');
                    setStep('error');
                }

            },
            () => {
                setErrorMsg('Location access denied. Please enable location and try again.');
                setStep('error');
            }
        );
    };

    useEffect(() => {
        if (isOpen) startFlow();
    }, [isOpen]);

    const TYPE_BG: Record<string, string> = {
        culture: 'bg-amber-50 text-amber-700 border-amber-100',
        nature: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        food: 'bg-rose-50 text-rose-700 border-rose-100',
        adventure: 'bg-blue-50 text-blue-700 border-blue-100',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full sm:max-w-xl bg-white/90 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/20"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-[#E41B17] via-[#c0151a] to-[#8b0000] text-white p-6 pb-10 flex-shrink-0 overflow-hidden">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"
                            />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 px-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-yellow-300" />
                                            <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">AI Concierge</span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-extrabold tracking-tight">Plan My Day</h2>
                                    <p className="text-white/80 text-sm mt-1 max-w-[260px]">AI-generated itinerary based on your live weather & location.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative -mt-6 bg-white rounded-t-[2.5rem] flex-1 flex flex-col min-h-0 z-10">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full sm:hidden" />
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

                                {/* Alert Banner */}
                                {step === 'done' && alerts.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-6 overflow-hidden"
                                    >
                                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-4">
                                            <div className="p-2 bg-amber-100 rounded-2xl flex-shrink-0">
                                                {alerts[0].title.toLowerCase().includes('fest') || alerts[0].title.toLowerCase().includes('holi') ? (
                                                    <PartyPopper className="w-5 h-5 text-amber-600" />
                                                ) : (
                                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Cultural Alert / Advisory</p>
                                                <h4 className="text-sm font-bold text-amber-900 leading-tight mb-1">{alerts[0].title}</h4>
                                                <p className="text-xs text-amber-700 leading-relaxed">AI has adjusted your itinerary to prioritize safety and cultural relevance based on this live update.</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Loading states */}
                                {(step === 'locating' || step === 'weather' || step === 'generating') && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center justify-center py-12 gap-6">
                                            <div className="relative">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    className="w-20 h-20 rounded-full border-4 border-dashed border-[#E41B17]/20"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                                                        {step === 'locating' ? <MapPin className="w-8 h-8 text-[#E41B17]" /> :
                                                            step === 'weather' ? <Sun className="w-8 h-8 text-yellow-500" /> :
                                                                <Sparkles className="w-8 h-8 text-purple-500" />}
                                                    </motion.div>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-gray-900 font-bold text-lg">
                                                    {step === 'locating' ? 'Finding your location…' :
                                                        step === 'weather' ? 'Checking the weather…' :
                                                            'AI is crafting your itinerary…'}
                                                </p>
                                                <p className="text-gray-400 text-sm">Powered by AI ✨</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <GlassmorphicSkeleton className="h-32" variant="card" />
                                            <div className="flex items-center justify-between px-1">
                                                <GlassmorphicSkeleton className="h-6 w-32" variant="text" />
                                                <GlassmorphicSkeleton className="h-6 w-16" variant="text" />
                                            </div>
                                            <div className="space-y-3">
                                                <GlassmorphicSkeleton className="h-24" variant="card" />
                                                <GlassmorphicSkeleton className="h-24" variant="card" />
                                                <GlassmorphicSkeleton className="h-24" variant="card" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {step === 'error' && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                            <X className="w-8 h-8 text-red-400" />
                                        </div>
                                        <p className="font-bold text-gray-800">{errorMsg}</p>
                                        <Button onClick={startFlow} className="bg-[#E41B17] hover:bg-[#c0151a] text-white rounded-2xl">
                                            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                                        </Button>
                                    </div>
                                )}

                                {/* Done */}
                                {step === 'done' && weather && (
                                    <div className="space-y-6 pb-10">
                                        {/* Weather Card */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="relative bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 rounded-3xl p-5 border border-gray-100 shadow-sm overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <Mountain className="w-24 h-24" />
                                            </div>
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                                        {getWeatherIcon(weather.conditionCode)}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Current Skies</p>
                                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                            {weather.locationName}
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                                        </h3>
                                                        <p className="text-gray-500 text-sm">{weather.condition}</p>
                                                    </div>
                                                </div>
                                                <span className="text-4xl font-black text-gray-900">{weather.temperature}°</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-4">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-gray-50">
                                                    <Wind className="w-3.5 h-3.5 text-blue-400" />
                                                    <div>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Wind</p>
                                                        <p className="text-xs font-bold text-gray-700">{weather.windSpeed} km/h</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-gray-50">
                                                    <Droplets className="w-3.5 h-3.5 text-indigo-400" />
                                                    <div>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Humidity</p>
                                                        <p className="text-xs font-bold text-gray-700">{weather.humidity}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Itinerary Header */}
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                <Navigation className="w-5 h-5 text-[#E41B17]" />
                                                Your AI-Crafted Day
                                            </h4>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                                                {stops.length} stops
                                            </span>
                                        </div>

                                        {/* Stops */}
                                        {stops.length > 0 ? (
                                            <div className="space-y-3">
                                                {stops.map((stop, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.1 + index * 0.08 }}
                                                        whileHover={{ x: 4 }}
                                                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                                                    >
                                                        <div className="flex items-stretch">
                                                            {/* Number */}
                                                            <div className="w-14 flex flex-col items-center justify-start py-4 border-r border-gray-50 flex-shrink-0">
                                                                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#E41B17] group-hover:text-white transition-colors flex items-center justify-center font-bold text-gray-400 text-sm">
                                                                    {index + 1}
                                                                </div>
                                                            </div>
                                                            {/* Content */}
                                                            <div className="flex-1 p-4 pl-3">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h5 className="font-bold text-gray-900 group-hover:text-[#E41B17] transition-colors leading-tight">{stop.name}</h5>
                                                                    {stop.time && (
                                                                        <span className="text-[10px] text-gray-400 font-bold shrink-0 flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {stop.time}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {stop.description && (
                                                                    <p className="text-gray-500 text-xs leading-relaxed mb-2">{stop.description}</p>
                                                                )}
                                                                {stop.tip && (
                                                                    <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-100/50">
                                                                        <p className="text-[11px] text-amber-900 leading-tight">
                                                                            <span className="font-black uppercase text-[9px] mr-1">Pro Tip:</span>
                                                                            {stop.tip}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Fallback: show raw AI text
                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{rawAiText}</p>
                                            </div>
                                        )}

                                        {/* Google Maps CTA */}
                                        {mapsUrl && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 }}
                                            >
                                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                                                    <Button className="w-full h-14 bg-gradient-to-r from-[#E41B17] to-[#8b0000] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg rounded-2xl relative overflow-hidden group">
                                                        <motion.div
                                                            className="absolute inset-0 bg-white/10"
                                                            animate={{ translateX: ["100%", "-100%"] }}
                                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                                        />
                                                        <div className="relative flex items-center justify-center gap-2 font-bold text-white text-base">
                                                            <MapPin className="w-5 h-5" />
                                                            Open Route in Google Maps
                                                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                                        </div>
                                                    </Button>
                                                </a>
                                            </motion.div>
                                        )}

                                        {/* Regenerate */}
                                        <button
                                            onClick={startFlow}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-gray-400 hover:text-[#E41B17] transition-colors border-t border-gray-100 mt-2"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            REGENERATE WITH AI
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PlanMyDay;
