import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, MapPin, Star, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getSafeErrorMessage } from '@/utils/errorUtils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';

interface SavedPlace {
  id: string;
  place_id: string;
  saved_at: string;
  place: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    category: string | null;
    image_url: string | null;
    rating: number | null;
  };
}

const SavedPlaces = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedPlaces();
    }
  }, [user]);

  const fetchSavedPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select(`
          id,
          place_id,
          saved_at,
          place:places (
            id,
            name,
            description,
            location,
            category,
            image_url,
            rating
          )
        `)
        .eq('user_id', user?.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;

      // Filter out any entries where place might be null (if place was deleted)
      const validPlaces = (data || []).filter(sp => sp.place !== null) as SavedPlace[];
      setSavedPlaces(validPlaces);
    } catch (error) {
      logger.error('Error fetching saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedPlaceId: string) => {
    try {
      const { error } = await supabase
        .from('saved_places')
        .delete()
        .eq('id', savedPlaceId);

      if (error) throw error;

      setSavedPlaces(prev => prev.filter(sp => sp.id !== savedPlaceId));
      toast({ title: 'Place removed from saved list' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: getSafeErrorMessage(error) });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-wide pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-section text-3xl flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-nepal-terracotta animate-pulse-slow" />
                Travel History
              </h1>
              <p className="text-muted-foreground mt-1">Your bookmarked destinations & journey record</p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : savedPlaces.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Bookmark className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No saved places yet</h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and save destinations you'd like to visit!
              </p>
              <Link to="/">
                <Button className="btn-primary">Explore Destinations</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
              {savedPlaces.map((saved, index) => (
                <motion.div
                  key={saved.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border overflow-hidden group hover:shadow-card transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-video relative overflow-hidden">
                    {saved.place.image_url ? (
                      <img
                        src={saved.place.image_url}
                        alt={saved.place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {saved.place.category && (
                      <span className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {saved.place.category}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(saved.id)}
                      className="absolute top-3 right-3 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      {saved.place.name}
                    </h3>
                    {saved.place.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {saved.place.location}
                      </div>
                    )}
                    {saved.place.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {saved.place.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-nepal-gold text-nepal-gold" />
                        <span className="text-sm font-medium">{saved.place.rating || 0}</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded-full">
                        Saved {new Date(saved.saved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SavedPlaces;
