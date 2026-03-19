import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Download, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { parseMarkdown } from "@/lib/markdownParser";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Kathmandu": { lat: 27.7172, lng: 85.3240 },
  "Pokhara": { lat: 28.2096, lng: 83.9856 },
  "Lumbini": { lat: 27.4784, lng: 83.2750 },
  "Chitwan": { lat: 27.5333, lng: 84.4500 },
  "Lukla": { lat: 27.6833, lng: 86.7333 },
  "Namche": { lat: 27.8000, lng: 86.7167 },
};

const renderItineraryWithLinks = (text: string) => {
  return (
    <div className="space-y-4">
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={idx} />;

        const isAccommodation = trimmed.toLowerCase().includes('accommodation') ||
          trimmed.toLowerCase().includes('stay at') ||
          trimmed.toLowerCase().includes('hotels');

        if (isAccommodation && !trimmed.toLowerCase().includes('#')) {
          const city = Object.keys(CITY_COORDS).find(c => trimmed.includes(c));

          return (
            <div key={idx} className="mb-4">
              {parseMarkdown(line)}
              <div className="mt-2">
                <Link
                  to="/#nearby-places"
                  className="inline-flex items-center text-[13px] font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100"
                >
                  <Hotel className="w-3.5 h-3.5 mr-1.5" />
                  Find real hotels here →
                </Link>
              </div>
            </div>
          );
        }
        return <div key={idx}>{parseMarkdown(line)}</div>;
      })}
    </div>
  );
};

const SharedItinerary = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        if (!id) throw new Error("No itinerary ID provided");
        // Using any fallback since typescript types might not be perfectly up to date with SQL executed by the user.
        const { data, error: fetchError } = await supabase
          .from('shared_itineraries' as any)
          .select('itinerary_text')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Itinerary not found");
        
        setItinerary(data.itinerary_text);
      } catch (err: any) {
        setError(err.message || "Failed to load itinerary");
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [id]);

  const handleDownload = () => {
    if (!itinerary) return;
    const blob = new Blob([itinerary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GoNepal-Trip-Plan-${id?.slice(0, 6) || 'Itinerary'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading this journey...</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Itinerary Not Found</h2>
          <p className="text-sm opacity-90 mb-6">
            This link might be invalid or the itinerary has been removed.
          </p>
          <Link to="/">
            <Button variant="default">Plan a New Trip</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container px-4 h-16 flex items-center justify-between mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-lg tracking-tight">GoNepal Plan</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto max-w-3xl">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-card rounded-3xl p-6 md:p-10 shadow-elevated border border-border/50"
        >
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <div className="text-sm leading-relaxed">
               {renderItineraryWithLinks(itinerary)}
            </div>
          </div>
        </motion.div>
        
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold mb-4 font-display">Ready to explore Nepal?</h3>
          <Link to="/">
            <Button size="lg" className="rounded-full shadow-lg h-14 px-8 text-lg hover:scale-105 transition-transform bg-orange-600 hover:bg-orange-700 text-white">
              Plan Your Own Trip
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SharedItinerary;
