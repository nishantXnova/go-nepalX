import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Clock, Star, Calendar, Mountain, AlertCircle, FileText, Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDestinationById } from "@/data/destinations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { getSafeErrorMessage } from "@/utils/errorUtils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DestinationReviews from "@/components/DestinationReviews";
import AIChatbot from "@/components/AIChatbot";

const DestinationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const destination = getDestinationById(id || "");
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (destination && user) {
      checkIfSaved();
    }
  }, [destination, user]);

  const checkIfSaved = async () => {
    if (!user || !destination) return;

    try {
      // First find or create the place in our database
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('name', destination.name)
        .maybeSingle();

      if (existingPlace) {
        setPlaceId(existingPlace.id);

        // Check if saved
        const { data: savedData } = await supabase
          .from('saved_places')
          .select('id')
          .eq('user_id', user.id)
          .eq('place_id', existingPlace.id)
          .maybeSingle();

        setIsSaved(!!savedData);
      }
    } catch (error) {
      logger.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast({ title: 'Please sign in to save places' });
      return;
    }
    if (!destination) return;

    setSavingState(true);
    try {
      let currentPlaceId = placeId;

      // Create place if it doesn't exist
      if (!currentPlaceId) {
        const { data: newPlace, error: createError } = await supabase
          .from('places')
          .insert({
            name: destination.name,
            description: destination.description,
            category: destination.category,
            image_url: destination.image,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        currentPlaceId = newPlace.id;
        setPlaceId(currentPlaceId);
      }

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('user_id', user.id)
          .eq('place_id', currentPlaceId);

        if (error) throw error;
        setIsSaved(false);
        toast({ title: 'Removed from saved places' });
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_places')
          .insert({
            user_id: user.id,
            place_id: currentPlaceId,
          });

        if (error) throw error;
        setIsSaved(true);
        toast({ title: 'Added to saved places!' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: getSafeErrorMessage(error) });
    } finally {
      setSavingState(false);
    }
  };

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">Destination Not Found</h1>
          <p className="text-muted-foreground mb-6">Sorry, we couldn't find the destination you're looking for.</p>
          <Link to="/">
            <Button className="btn-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px]">
        <div className="absolute inset-0">
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="container-wide pb-12">
            {/* Back Button */}
            <div className="flex items-center justify-between mb-6">
              <Link to="/">
                <Button variant="outline" className="border-primary-foreground/50 text-primary-foreground bg-transparent hover:bg-primary-foreground/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleToggleSave}
                disabled={savingState}
                className={`border-primary-foreground/50 bg-transparent hover:bg-primary-foreground/10 ${isSaved ? 'text-nepal-gold border-nepal-gold' : 'text-primary-foreground'
                  }`}
              >
                {savingState ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isSaved ? (
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                ) : (
                  <Bookmark className="w-4 h-4 mr-2" />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>

            <span className="inline-block bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              {destination.category}
            </span>
            <h1 className="heading-display text-primary-foreground mb-2">{destination.name}</h1>
            <p className="text-2xl text-primary-foreground/80 font-display italic">{destination.tagline}</p>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-card border-b border-border">
        <div className="container-wide py-6">
          <div className="flex flex-wrap gap-6 md:gap-12">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">{destination.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Best Time</p>
                <p className="font-medium text-foreground">{destination.bestTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mountain className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Altitude</p>
                <p className="font-medium text-foreground">{destination.altitude}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p className="font-medium text-foreground">{destination.difficulty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 fill-nepal-gold text-nepal-gold shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Rating</p>
                <p className="font-medium text-foreground">{destination.rating} / 5</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pt-12 pb-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Overview */}
              <div>
                <h2 className="heading-section text-foreground mb-6">Overview</h2>
                <p className="text-body-large text-muted-foreground leading-relaxed">
                  {destination.fullDescription}
                </p>
              </div>

              {/* Top Attractions */}
              <div>
                <h2 className="heading-section text-foreground mb-6">Top Attractions</h2>
                <div className="space-y-6">
                  {destination.attractions.map((attraction, index) => (
                    <div key={index} className="bg-card rounded-xl p-6 border border-border">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                            {attraction.name}
                          </h3>
                          <p className="text-muted-foreground">{attraction.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Itinerary */}
              <div>
                <h2 className="heading-section text-foreground mb-6">Suggested Itinerary</h2>
                <div className="space-y-4">
                  {destination.itinerary.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                          {item.day.split(' ')[0] === 'Days' ? item.day.split(' ')[1] : item.day.split(' ')[1]}
                        </div>
                        {index < destination.itinerary.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="text-sm text-accent font-medium">{item.day}</p>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Section */}
              {placeId && (
                <DestinationReviews placeId={placeId} />
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Highlights */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">Highlights</h3>
                <div className="flex flex-wrap gap-2">
                  {destination.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Travel Tips */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">Travel Tips</h3>
                <ul className="space-y-3">
                  {destination.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Permits */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-accent" />
                  <h3 className="font-display text-xl font-semibold text-foreground">Permits Required</h3>
                </div>
                <ul className="space-y-3">
                  {destination.permits.map((permit, index) => (
                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-sm">{permit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-primary rounded-xl p-6">
                <h3 className="font-display text-xl font-semibold text-primary-foreground mb-2">
                  Ready to Explore?
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Start planning your {destination.name} adventure today.
                </p>
                <Link to="/#plan">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Plan Your Trip
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <AIChatbot />
    </div>
  );
};

export default DestinationDetail;
