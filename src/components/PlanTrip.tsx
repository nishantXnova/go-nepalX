import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Users, DollarSign, Filter, Loader2, Sparkles, X, Hotel, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { getSafeErrorMessage } from "@/utils/errorUtils";
import { parseMarkdown, cleanLatexText } from "@/lib/markdownParser";

const interests = ["Adventure", "Culture", "Nature", "Spirituality", "Family"];
const durations = ["3 days", "5 days", "7 days", "10+ days"];
const difficulties = ["Easy", "Moderate", "Challenging"];
const budgets = ["Budget", "Mid-range", "Luxury"];

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

        if (isAccommodation) {
          const city = Object.keys(CITY_COORDS).find(c => trimmed.includes(c));
          const coords = city ? CITY_COORDS[city] : CITY_COORDS["Kathmandu"];

          return (
            <div key={idx} className="mb-4">
              {parseMarkdown(line)}
              <div className="mt-2">
                <a
                  href="/#nearby-places"
                  className="inline-flex items-center text-[13px] font-bold text-orange-600 hover:text-orange-700 transition-colors bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100"
                >
                  <Hotel className="w-3.5 h-3.5 mr-1.5" />
                  Find real hotels here →
                </a>
              </div>
            </div>
          );
        }
        return <div key={idx}>{parseMarkdown(line)}</div>;
      })}
    </div>
  );
};

const PlanTrip = () => {
  const { toast } = useToast();
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);

  const handleGenerateItinerary = async () => {
    if (!selectedInterest || !selectedDuration) {
      toast({
        variant: "destructive",
        title: "Please select your interests and trip duration",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-trip-planner', {
        body: {
          interest: selectedInterest,
          duration: selectedDuration,
          difficulty: selectedDifficulty || 'Moderate',
          budget: selectedBudget || 'Mid-range',
        }
      });

      if (error) throw error;

      if (data.success) {
        // Clean the LaTeX characters before setting
        const cleanedItinerary = cleanLatexText(data.itinerary);
        setItinerary(cleanedItinerary);
      } else {
        throw new Error(data.error || 'Failed to generate itinerary');
      }
    } catch (error: any) {
      logger.error('Trip planner error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: getSafeErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetItinerary = () => {
    setItinerary(null);
  };

  return (
    <section id="plan" className="section-padding bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-wide relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-primary-foreground/70 uppercase tracking-widest text-sm font-medium mb-4">
            AI Trip Planner
          </p>
          <h2 className="heading-section text-primary-foreground mb-4">
            Plan Your Perfect <span className="italic text-nepal-gold">Journey</span>
          </h2>
          <p className="text-body-large text-primary-foreground/80 max-w-2xl mx-auto">
            Tell us how you want to explore, and our AI will create a personalized itinerary just for you.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {itinerary ? (
            // Itinerary Result
            <motion.div
              key="itinerary"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-3xl p-8 md:p-12 shadow-elevated max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <h3 className="font-display text-xl font-semibold text-foreground">Your Custom Itinerary</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={resetItinerary}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <div className="text-sm leading-relaxed">
                  {itinerary ? renderItineraryWithLinks(itinerary) : null}
                </div>
              </div>

              {itinerary && (
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="default"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-6"
                    onClick={() => {
                        const blob = new Blob([itinerary], { type: 'text/markdown;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `GoNepal-Trip-Plan-${new Date().toISOString().split('T')[0]}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: "Downloaded Successfully",
                          description: "Your plan has been saved as a Markdown file.",
                        });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl py-6 relative"
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                         const { data, error } = await supabase
                           .from('shared_itineraries' as any)
                           .insert([{ itinerary_text: itinerary }])
                           .select('id')
                           .single();
                           
                         if (error) throw error;
                         
                         const shareUrl = `${window.location.origin}/itinerary/${data.id}`;
                         await navigator.clipboard.writeText(shareUrl);
                         
                         toast({
                           title: "Link Copied!",
                           description: "A unique public shareable link has been copied to your clipboard.",
                         });
                      } catch (err: any) {
                        toast({
                          variant: "destructive",
                          title: "Sharing Failed",
                          description: err.message || "Could not generate share link.",
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                    Share Link
                  </Button>
                </div>
              )}
              <div className="mt-8 pt-6 border-t border-border">
                <Button onClick={resetItinerary} variant="outline" className="w-full">
                  Plan Another Trip
                </Button>
              </div>
            </motion.div>
          ) : (
            // Filter Card
            <motion.div
              key="filters"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card rounded-3xl p-8 md:p-12 shadow-elevated max-w-4xl mx-auto"
            >
              {/* Interest Filter */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <label className="flex items-center gap-2 text-foreground font-medium mb-4">
                  <Search className="h-5 w-5 text-accent" />
                  What interests you?
                </label>
                <div className="flex flex-wrap gap-3">
                  {interests.map((interest, index) => (
                    <motion.button
                      key={interest}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedInterest(interest === selectedInterest ? null : interest)}
                      className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 ${selectedInterest === interest
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-foreground hover:border-accent hover:text-accent"
                        }`}
                    >
                      {interest}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Duration Filter */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <label className="flex items-center gap-2 text-foreground font-medium mb-4">
                  <Calendar className="h-5 w-5 text-accent" />
                  How long is your trip?
                </label>
                <div className="flex flex-wrap gap-3">
                  {durations.map((duration, index) => (
                    <motion.button
                      key={duration}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDuration(duration === selectedDuration ? null : duration)}
                      className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 ${selectedDuration === duration
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-foreground hover:border-accent hover:text-accent"
                        }`}
                    >
                      {duration}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Difficulty & Budget */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Difficulty */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="flex items-center gap-2 text-foreground font-medium mb-4">
                    <Filter className="h-5 w-5 text-accent" />
                    Difficulty level?
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {difficulties.map((difficulty, index) => (
                      <motion.button
                        key={difficulty}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDifficulty(difficulty === selectedDifficulty ? null : difficulty)}
                        className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 ${selectedDifficulty === difficulty
                          ? "bg-accent text-accent-foreground border-accent"
                          : "border-border text-foreground hover:border-accent hover:text-accent"
                          }`}
                      >
                        {difficulty}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Budget */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="flex items-center gap-2 text-foreground font-medium mb-4">
                    <DollarSign className="h-5 w-5 text-accent" />
                    What's your budget?
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {budgets.map((budget, index) => (
                      <motion.button
                        key={budget}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedBudget(budget === selectedBudget ? null : budget)}
                        className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 ${selectedBudget === budget
                          ? "bg-accent text-accent-foreground border-accent"
                          : "border-border text-foreground hover:border-accent hover:text-accent"
                          }`}
                      >
                        {budget}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="w-full text-lg py-6 text-white font-semibold transition-colors disabled:opacity-50 disabled:bg-gray-400"
                  style={{ backgroundColor: (!selectedInterest || !selectedDuration || isLoading) ? undefined : '#FB923C' }}
                  disabled={!selectedInterest || !selectedDuration || isLoading}
                  onClick={handleGenerateItinerary}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate AI Itinerary
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default PlanTrip;
