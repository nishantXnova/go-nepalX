import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import {
    QrCode, Shield, CheckCircle2, Download, Share2,
    Globe, Calendar, CreditCard, User, Flag, Fingerprint,
    Phone, AlertTriangle, Wifi, WifiOff, Copy, ChevronLeft,
    Loader2, Scan, IdCard, Sparkles, Verified, X, Briefcase, Map, Languages, Plus, Sun
} from "lucide-react";
import { cacheTrip, getCachedTrip, isOffline, CachedTripData } from "@/lib/offlineService";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { getSafeErrorMessage } from "@/utils/errorUtils";
import { Link } from "react-router-dom";

// ── Tourist Data Schema ──────────────────────────────────────────────────────
interface TouristData {
    touristId: string;
    name: string;
    nationality: string;
    nationalityFlag: string;
    passportNumber: string;
    visaType: string;
    visaNumber: string;
    entryDate: string;
    exitDate: string;
    status: string;
    expiry: string;
    emergencyContact: string;
    photo: string | null;
}

const DEFAULT_TOURIST_DATA: TouristData = {
    touristId: "NPL-2026-0021",
    name: "John Smith",
    nationality: "United States",
    nationalityFlag: "🇺🇸",
    passportNumber: "A12347891",
    visaType: "Tourist",
    visaNumber: "VIS-2026-8844",
    entryDate: "2026-02-01",
    exitDate: "2026-03-01",
    status: "Valid",
    expiry: "2026-03-01",
    emergencyContact: "+1 212-555-0197",
    photo: null,
};

// Generate QR code locally (works offline!)
async function generateQRDataUrl(data: TouristData): Promise<string> {
    const payload = JSON.stringify({
        touristId: data.touristId,
        name: data.name,
        visaType: data.visaType,
        expiry: data.exitDate,
        status: data.status,
    });

    try {
        // Generate QR code locally using canvas - works offline!
        return await QRCode.toDataURL(payload, {
            width: 200,
            margin: 1,
            color: {
                dark: '#1a1a1a',
                light: '#ffffff'
            }
        });
    } catch (error) {
        logger.error('QR generation error:', error);
        return '';
    }
}

// Legacy function - falls back to online API
function getQRUrl(data: TouristData) {
    const payload = JSON.stringify({
        touristId: data.touristId,
        name: data.name,
        visaType: data.visaType,
        expiry: data.exitDate,
        status: data.status,
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}&bgcolor=ffffff&color=1a1a1a&margin=10`;
}

// ── Hotel Check-In Simulator ──────────────────────────────────────────────────



// ── Edit Profile Form ────────────────────────────────────────────────────────
function EditProfileModal({ data, onSave, onClose }: { data: TouristData; onSave: (d: TouristData) => void; onClose: () => void }) {
    const [formData, setFormData] = useState<TouristData>(data);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Customize Your ID</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Nationality</label>
                            <input
                                type="text"
                                value={formData.nationality}
                                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Flag Emoji</label>
                            <input
                                type="text"
                                value={formData.nationalityFlag}
                                onChange={e => setFormData({ ...formData, nationalityFlag: e.target.value })}
                                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Passport No.</label>
                            <input
                                type="text"
                                value={formData.passportNumber}
                                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-400">Visa Type</label>
                            <input
                                type="text"
                                value={formData.visaType}
                                onChange={e => setFormData({ ...formData, visaType: e.target.value })}
                                className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Emergency Contact</label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#E41B17] outline-none"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-[#E41B17] hover:bg-[#c0151a] text-white rounded-xl py-6 font-bold text-lg mt-4 shadow-lg shadow-red-500/20">
                        Save Changes
                    </Button>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DigitalTouristID = () => {
    const [showCheckin, setShowCheckin] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [qrLoaded, setQrLoaded] = useState(false);
    const [touristData, setTouristData] = useState<TouristData>(DEFAULT_TOURIST_DATA);
    const [cachedTrip, setCachedTrip] = useState<CachedTripData | null>(null);
    const [isCaching, setIsCaching] = useState(false);
    const [localQRCode, setLocalQRCode] = useState<string>('');
    const { toast } = useToast();

    // Generate QR code locally (works offline!)
    useEffect(() => {
        const generateQR = async () => {
            try {
                const qrDataUrl = await generateQRDataUrl(touristData);
                setLocalQRCode(qrDataUrl);
                setQrLoaded(true);
            } catch (error) {
                logger.error('Failed to generate QR:', error);
            }
        };
        generateQR();
    }, [touristData]);

    useEffect(() => {
        setCachedTrip(getCachedTrip());
    }, []);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("tourist_id_data");
        if (saved) {
            try {
                setTouristData(JSON.parse(saved));
            } catch (e) {
                logger.error("Failed to parse saved tourist data", e);
            }
        }
    }, []);

    const handleSave = (newData: TouristData) => {
        setTouristData(newData);
        localStorage.setItem("tourist_id_data", JSON.stringify(newData));
        setShowEdit(false);
        setQrLoaded(false); // Trigger QR reload
        toast({
            title: "✅ Profile Updated",
            description: "Your Digital Tourist ID has been successfully updated.",
        });
    };

    const maskedPassport = touristData.passportNumber.slice(0, -4).replace(/./g, "*") + touristData.passportNumber.slice(-4);

    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `Nepal-Tourist-ID-${touristData.touristId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast({
                title: "📥 ID Card Downloaded",
                description: "Your Tourist ID has been saved to your device.",
            });
        } catch (error) {
            logger.error('Download error:', error);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: getSafeErrorMessage("Could not download the ID card. Please try again."),
            });
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imageUrl = canvas.toDataURL('image/png');

            if (navigator.share) {
                // Convert data URL to blob for sharing
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], `Nepal-Tourist-ID-${touristData.touristId}.png`, { type: 'image/png' });

                try {
                    await navigator.share({
                        title: "My Nepal Tourist ID",
                        text: `Tourist ID: ${touristData.touristId} | ${touristData.name} | Visa: ${touristData.visaType}`,
                        files: [file],
                    });
                } catch {
                    // Fallback if files are not supported
                    await navigator.share({
                        title: "My Nepal Tourist ID",
                        text: `Tourist ID: ${touristData.touristId} | ${touristData.name} | Visa: ${touristData.visaType}\n\nCheck out my Nepal Digital Tourist ID!`,
                        url: window.location.href,
                    });
                }
            } else {
                // Fallback: download the image
                const link = document.createElement('a');
                link.download = `Nepal-Tourist-ID-${touristData.touristId}.png`;
                link.href = imageUrl;
                link.click();
                toast({ title: "📋 Image Downloaded!", description: "Share the downloaded image to share your ID." });
            }
        } catch (error) {
            logger.error('Share error:', error);
            // Fallback to text sharing
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: "My Nepal Tourist ID",
                        text: `Tourist ID: ${touristData.touristId} | ${touristData.name} | Visa: ${touristData.visaType}`,
                        url: window.location.href,
                    });
                } catch {
                    // Cancelled
                }
            } else {
                await navigator.clipboard.writeText(`Tourist ID: ${touristData.touristId}`);
                toast({ title: "📋 Copied to clipboard!", description: "Tourist ID copied successfully." });
            }
        }
    };

    const handleCopyId = async () => {
        await navigator.clipboard.writeText(touristData.touristId);
        toast({ title: "Copied!", description: touristData.touristId });
    };

    const handleCacheTrip = async () => {
        setIsCaching(true);
        try {
            // Fix 8: Permission check before Geolocation
            const hasConsent = localStorage.getItem("geo_consent") === "true";
            if (!hasConsent) {
                const proceed = window.confirm("GoNepal needs your location to cache weather and nearby emergency services for offline use. Do you allow this?");
                if (!proceed) {
                    setIsCaching(false);
                    return;
                }
                localStorage.setItem("geo_consent", "true");
            }

            // Get location
            const pos: GeolocationPosition = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            // Fix 1: Round coordinates to 3 decimal places
            const latitude = Math.round(pos.coords.latitude * 1000) / 1000;
            const longitude = Math.round(pos.coords.longitude * 1000) / 1000;

            // Fetch weather
            const wRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
            );
            const wData = await wRes.json();

            // Reverse geocode for location name
            let locationName = 'Current Location';
            try {
                const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const gData = await gRes.json();
                locationName = gData.address?.city || gData.address?.town || gData.address?.village || 'Nepal';
            } catch { /* ignore */ }

            const weatherLabel = (code: number) => {
                if (code === 0) return 'Clear';
                if (code < 3) return 'Partly Cloudy';
                if (code < 50) return 'Overcast';
                if (code < 70) return 'Rainy';
                return 'Stormy';
            };

            cacheTrip({
                weather: {
                    temp: Math.round(wData.current.temperature_2m),
                    condition: weatherLabel(wData.current.weather_code),
                    location: locationName,
                },
                homeCoords: {
                    lat: latitude,
                    lng: longitude,
                    address: locationName,
                },
            });

            setCachedTrip(getCachedTrip());
            toast({
                title: "🎒 Trip Cached Offline",
                description: "Weather and coordinates saved for offline access.",
            });
        } catch (error) {
            logger.error("Caching error:", error);
            toast({
                variant: "destructive",
                title: "Failed to cache trip",
                description: getSafeErrorMessage("Please check your connection and location permissions."),
            });
        } finally {
            setIsCaching(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F2F2F2] to-[#E5E9F0] relative overflow-hidden">
            {/* Subtle background abstract shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
            <Navbar />

            {/* Beta Disclaimer Banner - Fixed at top, visible on all devices */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 shadow-lg">
                <div className="max-w-sm mx-auto px-4 py-2 flex items-center justify-center gap-2">
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex-shrink-0">
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">Beta</span>
                    </div>
                    <p className="text-white text-xs font-medium text-center">
                        ⚠️ GoNepal is in testing — <span className="underline decoration-white/50">don't enter real documents</span>!
                    </p>
                </div>
            </div>

            {/* Hotel Check-in Modal */}
            <AnimatePresence>
                {showCheckin && <HotelCheckin onClose={() => setShowCheckin(false)} touristData={touristData} />}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEdit && <EditProfileModal data={touristData} onSave={handleSave} onClose={() => setShowEdit(false)} />}
            </AnimatePresence>

            <div className="pt-28 pb-12 px-4">
                <div className="max-w-sm mx-auto space-y-4">

                    {/* Back + Header */}
                    <div className="flex items-center justify-between mb-2">
                        <Link to="/" className="flex items-center gap-1.5 text-gray-500 hover:text-[#E41B17] transition-colors text-sm">
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEdit(true)}
                            className="text-xs font-bold text-[#E41B17] hover:bg-red-50 rounded-full"
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            Customize ID
                        </Button>
                    </div>

                    {/* ── Official ID Card ── */}
                    <motion.div
                        ref={cardRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden group perspective-1000"
                        style={{ boxShadow: "0 25px 50px -12px rgba(228,27,23,0.15)" }}
                    >
                        {/* Shimmer overlay for card face */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-20 opacity-30"
                            animate={{ background: ["linear-gradient(110deg, transparent 40%, white 50%, transparent 60%)", "linear-gradient(110deg, transparent 140%, white 150%, transparent 160%)"] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Card Top — Nepal Header */}
                        <div className="relative bg-gradient-to-r from-[#E41B17] to-[#b01215] px-8 pt-8 pb-12 overflow-hidden">
                            {/* Decorative motifs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-2xl pointer-events-none" />

                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-white/10">🇳🇵</div>
                                        <div>
                                            <p className="text-white font-black text-xs uppercase tracking-[0.3em] leading-none mb-1">Nepal</p>
                                            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">Government ID Card</p>
                                        </div>
                                    </div>
                                    <h1 className="text-white font-black text-xl leading-none mt-4 tracking-tight uppercase">
                                        Ministry of Culture, Tourism<br />& Civil Aviation
                                    </h1>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-inner"
                                >
                                    <User className="w-10 h-10 text-white opacity-80" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Red Banner overlap divider */}
                        <div className="relative">
                            <div className="absolute -top-4 left-0 right-0 h-8 bg-white rounded-t-3xl" />
                        </div>

                        {/* Card Body */}
                        <div className="px-5 pt-4 pb-5 space-y-4">
                            {/* Tourist Name */}
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Tourist Name</p>
                                <p className="text-gray-900 font-bold text-xl">{touristData.name}</p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Nationality", value: `${touristData.nationalityFlag} ${touristData.nationality}`, icon: <Flag className="w-3 h-3" /> },
                                    { label: "Visa Type", value: touristData.visaType, icon: <Globe className="w-3 h-3" /> },
                                    { label: "Entry Date", value: touristData.entryDate, icon: <Calendar className="w-3 h-3" /> },
                                    { label: "Exit Date", value: touristData.exitDate, icon: <Calendar className="w-3 h-3" /> },
                                    { label: "Passport No.", value: maskedPassport, icon: <CreditCard className="w-3 h-3" /> },
                                    { label: "Visa No.", value: touristData.visaNumber, icon: <IdCard className="w-3 h-3" /> },
                                ].map(field => (
                                    <div key={field.label} className="bg-[#F8F8F8] rounded-xl px-3 py-2.5">
                                        <div className="flex items-center gap-1 mb-1 text-gray-400">
                                            {field.icon}
                                            <p className="text-[9px] uppercase tracking-widest font-semibold">{field.label}</p>
                                        </div>
                                        <p className="text-gray-800 font-semibold text-xs leading-tight">{field.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Tourist ID with copy */}
                            <div className="bg-gray-900 rounded-2xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-0.5">Unique Tourist ID</p>
                                    <p className="text-white font-bold font-mono text-base tracking-wider">{touristData.touristId}</p>
                                </div>
                                <button onClick={handleCopyId} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                                    <Copy className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-dashed border-gray-200" />

                            {/* QR Code Section */}
                            <div className="flex flex-col items-center space-y-3">
                                <div className="relative">
                                    {/* QR Loading shimmer */}
                                    {!qrLoaded && (
                                        <div className="absolute inset-0 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
                                            <QrCode className="w-8 h-8 text-gray-300" />
                                        </div>
                                    )}
                                    {/* QR Generation animation wrapper */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: qrLoaded ? 1 : 0, scale: qrLoaded ? 1 : 0.85 }}
                                        transition={{ duration: 0.5, type: "spring" }}
                                        className="p-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm"
                                    >
                                        <img
                                            src={localQRCode || getQRUrl(touristData)}
                                            alt="Tourist ID QR Code"
                                            className="w-44 h-44"
                                            onLoad={() => setQrLoaded(true)}
                                        />
                                    </motion.div>
                                    {/* Scan corner overlay */}
                                    {qrLoaded && (
                                        <>
                                            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#E41B17] rounded-tl-sm" />
                                            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#E41B17] rounded-tr-sm" />
                                            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#E41B17] rounded-bl-sm" />
                                            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#E41B17] rounded-br-sm" />
                                        </>
                                    )}
                                </div>

                                {/* Verified Badge */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: qrLoaded ? 1 : 0.8, opacity: qrLoaded ? 1 : 0 }}
                                    transition={{ delay: 0.3, type: "spring" }}
                                    className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4 fill-green-100" />
                                    Verified ✅
                                    <Shield className="w-4 h-4" />
                                </motion.div>
                                <p className="text-[10px] text-gray-400 text-center">
                                    Scan to verify identity via FNMIS
                                </p>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="bg-[#F8F8F8] border-t border-gray-100 px-5 py-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Status</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-green-700 font-bold text-xs">Valid</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Valid Until</p>
                                    <p className="text-gray-700 font-bold text-xs mt-0.5">{touristData.exitDate}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Action Buttons ─────────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-2 gap-3"
                    >
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="rounded-2xl py-5 border-2 border-gray-200 hover:border-[#E41B17] hover:text-[#E41B17] bg-white font-semibold text-sm transition-all"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download ID
                        </Button>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            className="rounded-2xl py-5 border-2 border-gray-200 hover:border-[#E41B17] hover:text-[#E41B17] bg-white font-semibold text-sm transition-all"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share ID
                        </Button>
                    </motion.div>



                    {/* ── Trekker's Offline Toolkit ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100 scroll-mt-24"
                        id="toolkit"
                    >
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">Trekker's Offline Toolkit</h3>
                                    <p className="text-white/70 text-xs">Essential data for dead zones</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {!cachedTrip ? (
                                <div className="text-center py-4 space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                        <WifiOff className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-gray-800">No cached data found</p>
                                        <p className="text-xs text-gray-500">Cache your current trip before heading into the mountains.</p>
                                    </div>
                                    <Button
                                        onClick={handleCacheTrip}
                                        disabled={isCaching}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold"
                                    >
                                        {isCaching ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                                        Cache Current Trip
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                                            <div className="flex items-center gap-2 mb-2 text-emerald-700">
                                                <Map className="w-3.5 h-3.5" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Set Home</p>
                                            </div>
                                            <p className="text-sm font-bold text-emerald-900 truncate">{cachedTrip.homeCoords.address}</p>
                                            <p className="text-[10px] text-emerald-600">{cachedTrip.homeCoords.lat.toFixed(4)}, {cachedTrip.homeCoords.lng.toFixed(4)}</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2 text-blue-700">
                                                <Sun className="w-3.5 h-3.5" />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">Cached Sky</p>
                                            </div>
                                            <p className="text-sm font-bold text-blue-900">{cachedTrip.weather.temp}° {cachedTrip.weather.condition}</p>
                                            <p className="text-[10px] text-blue-600">Saved: {new Date(cachedTrip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-3 text-gray-600">
                                            <Languages className="w-4 h-4" />
                                            <p className="text-[11px] font-bold uppercase tracking-wider">Emergency Phrases</p>
                                        </div>
                                        <div className="space-y-3">
                                            {cachedTrip.emergencyPhrases.slice(0, 3).map((p, i) => (
                                                <div key={i} className="space-y-0.5">
                                                    <p className="text-[11px] font-bold text-gray-800">{p.english}</p>
                                                    <p className="text-xs text-emerald-700 font-medium">{p.nepali}</p>
                                                </div>
                                            ))}
                                            <p className="text-[9px] text-gray-400 text-center pt-1">+ 7 more phrases saved</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCacheTrip}
                                        variant="outline"
                                        disabled={isCaching}
                                        className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl py-5 font-bold text-xs"
                                    >
                                        {isCaching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                        Update Cached Trip
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Disclaimer */}
                    <p className="text-center text-xs text-gray-400 leading-relaxed px-4">
                        🔒 This is a simulated Digital Tourist ID for demonstration purposes only.<br />
                        Not a legal document. FNMIS integration is mocked.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DigitalTouristID;
