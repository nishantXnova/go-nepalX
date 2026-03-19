import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';


export function useBookmark(placeName: string, placeData?: {
  description?: string;
  category?: string;
  image_url?: string;
  location?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (user && placeName) {
      checkIfSaved();
    }
  }, [user, placeName]);

  const checkIfSaved = async () => {
    if (!user || !placeName) return;
    try {
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('name', placeName)
        .maybeSingle();

      if (existingPlace) {
        setPlaceId(existingPlace.id);
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

  const toggleSave = useCallback(async () => {
    if (!user) {
      toast({ title: 'Please sign in to save places' });
      return;
    }
    if (!placeName) return;

    setLoading(true);
    try {
      let currentPlaceId = placeId;

      if (!currentPlaceId) {
        const { data: newPlace, error: createError } = await supabase
          .from('places')
          .insert({
            name: placeName,
            description: placeData?.description || null,
            category: placeData?.category || null,
            image_url: placeData?.image_url || null,
            location: placeData?.location || null,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        currentPlaceId = newPlace.id;
        setPlaceId(currentPlaceId);
      }

      if (isSaved) {
        const { error } = await supabase
          .from('saved_places')
          .delete()
          .eq('user_id', user.id)
          .eq('place_id', currentPlaceId);
        if (error) throw error;
        setIsSaved(false);
        toast({ title: 'Removed from saved places' });
      } else {
        const { error } = await supabase
          .from('saved_places')
          .insert({ user_id: user.id, place_id: currentPlaceId });
        if (error) throw error;
        setIsSaved(true);
        toast({ title: 'Added to saved places! ⭐' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, placeName, placeId, isSaved, placeData, toast]);

  return { isSaved, loading, toggleSave };
}
