import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Hospital, Hotel, Utensils, TreePine, ShoppingBag, MapPin, Loader2, Navigation, Home, RotateCcw, ShieldAlert, ExternalLink, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import { logger } from "@/utils/logger";
import { useToast } from "@/hooks/use-toast";


// Fix for default marker icon in Leaflet + Webpack/Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface Place {
    id: number;
    lat: number;
    lon: number;
    name: string;
    type: string;
    category: "hospital" | "hotel" | "restaurant" | "park" | "mall";
}

const CATEGORIES = {
    hospital: { label: "Hospitals", icon: Hospital, color: "bg-red-500", query: 'node["amenity"="hospital"]' },
    hotel: { label: "Hotels & Homestays", icon: Hotel, color: "bg-amber-500", query: 'node["tourism"~"hotel|guest_house|hostel"]' },
    restaurant: { label: "Restaurant & Cafes", icon: Utensils, color: "bg-orange-500", query: 'node["amenity"~"restaurant|cafe"]' },
    park: { label: "Parks", icon: TreePine, color: "bg-green-500", query: 'node["leisure"="park"]' },
    mall: { label: "Malls", icon: ShoppingBag, color: "bg-purple-500", query: 'node["shop"="mall"]' },
};

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center, 14);
    return null;
}

const NearbyPlaces = () => {
    const [location, setLocation] = useState<[number, number] | null>(null);
    const { toast } = useToast();
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [distanceToHome, setDistanceToHome] = useState<number | null>(null);
    const [comfortRadius, setComfortRadius] = useState<number>(3000);
    const [radiusInput, setRadiusInput] = useState<string>("3000");
    const [showNearby, setShowNearby] = useState<boolean>(true);

    useEffect(() => {
        const savedHome = localStorage.getItem('user_home_base');
        if (savedHome) {
            setHomeLocation(JSON.parse(savedHome));
        }

        const savedRadius = localStorage.getItem('user_comfort_radius');
        if (savedRadius) {
            const r = parseInt(savedRadius);
            setComfortRadius(r);
            setRadiusInput(savedRadius);
        }
    }, []);

    const toggleNearby = (checked: boolean) => {
        setShowNearby(checked);
        if (!checked) {
            setPlaces([]);
            setActiveCategory(null);
        } else if (location) {
            fetchNearbyPlaces(location[0], location[1]);
        }
    };

    useEffect(() => {
        if (location && homeLocation) {
            const dist = L.latLng(location[0], location[1]).distanceTo(L.latLng(homeLocation.lat, homeLocation.lng));
            setDistanceToHome(dist);
        }
    }, [location, homeLocation]);

    // Fetch places when category changes
    useEffect(() => {
        if (location && showNearby) {
            // Only fetch if we have a valid category or if it's "All" (null/undefined)
            fetchNearbyPlaces(location[0], location[1], activeCategory || undefined);
        }
    }, [activeCategory, location, showNearby]);

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRadiusInput(val);
        const parsed = parseInt(val);
        if (!isNaN(parsed) && parsed > 0) {
            setComfortRadius(parsed);
            localStorage.setItem('user_comfort_radius', parsed.toString());
        }
    };

    const saveHomeBase = () => {
        if (location) {
            const homeBase = { 
                lat: Math.round(location[0] * 1000) / 1000, 
                lng: Math.round(location[1] * 1000) / 1000, 
                timestamp: Date.now() 
            };
            localStorage.setItem('user_home_base', JSON.stringify(homeBase));
            setHomeLocation(homeBase);
        }
    };

    const clearHomeBase = () => {
        localStorage.removeItem('user_home_base');
        setHomeLocation(null);
        setDistanceToHome(null);
    };

    const initiateReturn = () => {
        if (homeLocation) {
            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${homeLocation.lat},${homeLocation.lng}&travelmode=walking`;
            window.open(navUrl, '_blank');
        }
    };

    const requestLocation = () => {
        setLoading(true);
        setError(null);
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        toast({
            title: "Location Access",
            description: "We use your location to find nearby hospitals, hotels, and services.",
        });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation([position.coords.latitude, position.coords.longitude]);
                fetchNearbyPlaces(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                logger.error("Geolocation error:", err);
                setError("Please allow location access to see places nearby");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };


    const fetchNearbyPlaces = async (lat: number, lon: number, category?: string) => {
        if (!showNearby) return;
        setLoading(true);
        setError(null);
        try {
            const radius = 3000;

            // If a specific category is selected, only fetch that category
            // Otherwise, fetch all categories
            let queries: string;
            if (category && CATEGORIES[category as keyof typeof CATEGORIES]) {
                queries = `${CATEGORIES[category as keyof typeof CATEGORIES].query}(around:${radius},${lat},${lon});`;
            } else {
                // Fetch all categories
                queries = Object.entries(CATEGORIES)
                    .map(([key, cat]) => `${cat.query}(around:${radius},${lat},${lon});`)
                    .join("");
            }

            const overpassQuery = `
        [out:json];
        (
          ${queries}
        );
        out body;
      `;

            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: overpassQuery,
            });

            if (!response.ok) throw new Error("Failed to fetch places");

            const data = await response.json();
            const formattedPlaces: Place[] = data.elements
                .filter((el: any) => el.lat && el.lon)
                .map((el: any) => {
                    let category: Place["category"] = "restaurant";
                    if (el.tags.amenity === "hospital") category = "hospital";
                    else if (el.tags.tourism) category = "hotel";
                    else if (el.tags.leisure === "park") category = "park";
                    else if (el.tags.shop === "mall") category = "mall";

                    return {
                        id: el.id,
                        lat: el.lat,
                        lon: el.lon,
                        name: el.tags.name || el.tags.operator || "Unnamed Place",
                        type: el.tags.amenity || el.tags.tourism || el.tags.leisure || el.tags.shop || "Place",
                        category,
                    };
                });

            setPlaces(formattedPlaces);
        } catch (err) {
            setError("Error fetching nearby places. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const filteredPlaces = (activeCategory && showNearby)
        ? places.filter(p => p.category === activeCategory)
        : showNearby ? places : [];

    return (
        <section className="section-padding px-4 md:px-8 bg-background relative overflow-hidden" id="nearby-places">
            <div className="container-wide relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-8">
                    <div className="space-y-6 max-w-2xl">
                        <p className="text-accent uppercase tracking-[0.4em] text-xs font-bold flex items-center gap-4">
                            <span className="h-[1px] w-8 bg-accent" />
                            Live Discovery
                        </p>
                        <h2 className="heading-section text-foreground leading-tight">
                            Explore <span className="italic text-accent text-glow">Nearby</span> Treasures
                        </h2>
                        <p className="text-muted-foreground text-lg font-light leading-relaxed">
                            Discover essential services, hidden gems, and local favorites within a 3km radius of your current location.
                        </p>
                    </div>

                    <Button
                        onClick={requestLocation}
                        disabled={loading || !showNearby}
                        className="btn-accent gap-3 h-16 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-elevated disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        <span className="uppercase tracking-widest font-bold text-sm">
                            {location ? "Update Location" : "Unlock Nearby Discovery"}
                        </span>
                    </Button>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <MapPin className="w-5 h-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] md:h-[700px]">
                    {/* Map Column */}
                    <Card className="lg:col-span-2 overflow-hidden border-none shadow-soft h-full relative group">
                        {!location ? (
                            <div className="absolute inset-0 z-10 bg-nepal-stone/5 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 transition-all group-hover:bg-nepal-stone/10">
                                <MapPin className="w-10 h-10 text-orange-400 mb-4" />
                                <h3 className="text-2xl font-display text-nepal-stone mb-2">Location Required</h3>
                                <p className="text-muted-foreground max-w-sm mb-8">
                                    Allow location access to visualize nearby facilities on our interactive map.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={requestLocation}
                                    className="rounded-full px-8 hover:bg-nepal-terracotta hover:text-white border-nepal-terracotta text-nepal-terracotta transition-colors"
                                >
                                    Enable Location
                                </Button>
                            </div>
                        ) : (
                            <MapContainer
                                center={location}
                                zoom={14}
                                style={{ height: "100%", width: "100%" }}
                                className="z-0"
                            >
                                <ChangeView center={location} />
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {homeLocation && (
                                    <>
                                        <Circle
                                            center={[homeLocation.lat, homeLocation.lng]}
                                            radius={comfortRadius}
                                            pathOptions={{
                                                color: distanceToHome && distanceToHome > comfortRadius ? '#ef4444' : '#eab308',
                                                fillColor: distanceToHome && distanceToHome > comfortRadius ? '#ef4444' : '#eab308',
                                                fillOpacity: 0.1,
                                                weight: 2,
                                                dashArray: '5, 10'
                                            }}
                                        />
                                        <Marker position={[homeLocation.lat, homeLocation.lng]} icon={goldIcon}>
                                            <Popup>
                                                <div className="font-semibold text-nepal-gold">Home Base</div>
                                                <div className="text-xs text-muted-foreground">Your starting point</div>
                                            </Popup>
                                        </Marker>
                                    </>
                                )}

                                <Marker position={location}>
                                    <Popup className="custom-popup">
                                        <div className="font-semibold text-nepal-terracotta">Your Location</div>
                                        {distanceToHome && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {Math.round(distanceToHome)}m from Home Base
                                                {distanceToHome > comfortRadius && (
                                                    <span className="block text-red-500 font-bold">Outside comfort zone!</span>
                                                )}
                                            </div>
                                        )}
                                    </Popup>
                                </Marker>

                                {filteredPlaces.map((place) => {
                                    const CategoryIcon = CATEGORIES[place.category].icon;
                                    return (
                                        <Marker
                                            key={place.id}
                                            position={[place.lat, place.lon]}
                                        >
                                            <Popup>
                                                <div className="p-1 min-w-[120px]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={cn("p-1.5 rounded-md text-white shadow-sm", CATEGORIES[place.category].color)}>
                                                            <CategoryIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                            {CATEGORIES[place.category].label}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-nepal-stone leading-tight">{place.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground mt-1 truncate">{place.type}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        )}

                        {/* Map Overlay Controls */}
                        {location && (
                            <>
                                <div className="absolute top-4 left-4 z-[400]">
                                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-elevated border border-nepal-gold/20 animate-in fade-in slide-in-from-left-4 duration-500">
                                        {showNearby ? (
                                            <div className="bg-nepal-terracotta/10 p-1.5 rounded-full">
                                                <Eye className="w-4 h-4 text-nepal-terracotta" />
                                            </div>
                                        ) : (
                                            <div className="bg-muted p-1.5 rounded-full">
                                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-nepal-stone/60 leading-none mb-1">Nearby Mode</span>
                                            <span className={cn(
                                                "text-xs font-bold leading-none",
                                                showNearby ? "text-nepal-terracotta" : "text-muted-foreground"
                                            )}>
                                                {showNearby ? "Live Discovery ON" : "Discovery OFF"}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={showNearby}
                                            onCheckedChange={toggleNearby}
                                            className="data-[state=checked]:bg-nepal-terracotta"
                                        />
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                                    {!homeLocation ? (
                                        <Button
                                            onClick={saveHomeBase}
                                            className="bg-nepal-gold hover:bg-nepal-gold/90 text-white rounded-full w-12 h-12 p-0 shadow-lg transition-all hover:scale-110"
                                            title="Set Current Location as Home Base"
                                        >
                                            <Home className="w-5 h-5" />
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={clearHomeBase}
                                                className="bg-white hover:bg-red-50 text-red-600 rounded-full w-12 h-12 p-0 shadow-lg border border-red-100 transition-all hover:scale-110"
                                                title="Clear Home Base"
                                            >
                                                <MapPinOff className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                onClick={initiateReturn}
                                                className={cn(
                                                    "rounded-full h-12 px-6 gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 text-white border-none",
                                                    distanceToHome && distanceToHome > comfortRadius
                                                        ? "bg-red-600 hover:bg-red-700 animate-pulse"
                                                        : "bg-nepal-terracotta hover:bg-nepal-terracotta/90"
                                                )}
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Take Me Back</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Distance Badge */}
                                {homeLocation && distanceToHome !== null && (
                                    <div className="absolute bottom-4 left-4 z-[400]">
                                        <Badge className={cn(
                                            "px-4 py-2 border shadow-lg flex items-center gap-2 text-sm",
                                            distanceToHome > comfortRadius
                                                ? "bg-red-50 text-red-600 border-red-200"
                                                : "bg-white text-nepal-gold border-nepal-gold/20"
                                        )}>
                                            {distanceToHome > comfortRadius ? <ShieldAlert className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                            <span>{Math.round(distanceToHome)}m to Home Base</span>
                                        </Badge>
                                        <div className="mt-2 bg-white/80 backdrop-blur-md px-3 py-3 rounded-xl text-[10px] text-muted-foreground shadow-sm border border-black/5 flex flex-col gap-2">
                                            <div className="flex flex-col gap-1.5">
                                                <Label htmlFor="radius-input" className="text-[9px] uppercase tracking-wider font-bold opacity-70">Comfort Radius (meters)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="radius-input"
                                                        type="number"
                                                        value={radiusInput}
                                                        onChange={handleRadiusChange}
                                                        className="h-7 w-20 text-[10px] bg-white/50 border-nepal-gold/20 focus-visible:ring-nepal-gold transition-all"
                                                    />
                                                    <span className="text-[10px] font-medium opacity-60">m</span>
                                                </div>
                                            </div>
                                            <div className="pt-1 border-t border-black/5">
                                                <span className="font-mono block italic">Lat: {homeLocation.lat.toFixed(6)}</span>
                                                <span className="font-mono block italic">Lon: {homeLocation.lng.toFixed(6)}</span>
                                                <span className="mt-1 flex items-center gap-1 opacity-70"><ExternalLink className="w-3 h-3" /> External OS Nav Ready</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* List Column */}
                    <div className="flex flex-col gap-6 overflow-hidden">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={activeCategory === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveCategory(null)}
                                className={cn(
                                    "rounded-full px-4 text-xs font-semibold h-9",
                                    activeCategory === null ? "bg-nepal-stone text-white" : "text-nepal-stone border-nepal-stone/20 hover:bg-nepal-stone/5"
                                )}
                            >
                                All
                            </Button>
                            {Object.entries(CATEGORIES).map(([key, cat]) => {
                                const Icon = cat.icon;
                                return (
                                    <Button
                                        key={key}
                                        variant={activeCategory === key ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveCategory(key)}
                                        className={cn(
                                            "rounded-full px-4 text-xs font-semibold h-9 gap-2",
                                            activeCategory === key
                                                ? "bg-nepal-stone text-white"
                                                : "text-nepal-stone border-nepal-stone/20 hover:bg-nepal-stone/5"
                                        )}
                                    >
                                        <Icon className="w-3 h-3" />
                                        <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
                                        <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                                    </Button>
                                );
                            })}
                        </div>

                        <Card className="flex-1 flex flex-col border-none shadow-soft overflow-hidden">
                            <div className="p-4 border-b bg-muted/30">
                                <h3 className="font-display text-lg text-nepal-stone flex items-center justify-between">
                                    Nearby Results
                                    <Badge variant="secondary" className="bg-white/50 text-nepal-stone">
                                        {filteredPlaces.length} found
                                    </Badge>
                                </h3>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-3">
                                    {loading && !location && (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-nepal-terracotta" />
                                            <p className="text-sm font-medium">Locating you...</p>
                                        </div>
                                    )}

                                    {loading && location && (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-nepal-terracotta" />
                                            <p className="text-sm font-medium">Finding places...</p>
                                        </div>
                                    )}

                                    {location && filteredPlaces.length === 0 && !loading && (
                                        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl bg-muted/20 border border-dashed border-muted/60 mt-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-muted-foreground">
                                                <MapPinOff className="w-8 h-8 opacity-50" />
                                            </div>
                                            <h4 className="font-semibold text-foreground mb-1">No Results Found</h4>
                                            <p className="text-sm text-muted-foreground">
                                                No {activeCategory ? CATEGORIES[activeCategory as keyof typeof CATEGORIES].label.toLowerCase() : "places"} found in this area. Try adjusting your location or category.
                                            </p>
                                        </div>
                                    )}

                                    {!location && !loading && (
                                        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl bg-muted/20 border border-dashed border-muted/60 mt-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-orange-400">
                                                <MapPin className="w-8 h-8 opacity-80" />
                                            </div>
                                            <h4 className="font-semibold text-foreground mb-1">Location Permissions Needed</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Please enable location access to discover places near you.
                                            </p>
                                        </div>
                                    )}

                                    {filteredPlaces.map((place) => {
                                        const CategoryIcon = CATEGORIES[place.category].icon;
                                        return (
                                            <div
                                                key={place.id}
                                                className="p-4 rounded-xl border border-transparent bg-white hover:border-nepal-terracotta/20 hover:shadow-md transition-all group flex items-start gap-4 cursor-pointer"
                                                onClick={() => {
                                                    // In a real app we'd zoom the map to this marker
                                                }}
                                            >
                                                <div className={cn("p-2.5 rounded-lg text-white shadow-soft transition-transform group-hover:scale-110", CATEGORIES[place.category].color)}>
                                                    <CategoryIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-nepal-stone text-sm line-clamp-1 group-hover:text-nepal-terracotta transition-colors">{place.name}</h4>
                                                    <p className="text-xs text-muted-foreground mt-1 capitalize">{place.type.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Background accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-nepal-terracotta/5 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-nepal-gold/5 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/2" />
        </section>
    );
};

export default NearbyPlaces;
