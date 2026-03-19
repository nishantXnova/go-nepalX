import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, MapPin, Star, Users, Image, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getSafeErrorMessage } from '@/utils/errorUtils';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Place = Tables<'places'>;

const categories = ['Trekking', 'Heritage', 'Wildlife', 'Pilgrimage', 'Adventure', 'Nature'];

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    category: '',
    image_url: '',
  });

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      logger.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', location: '', category: '', image_url: '' });
    setEditingPlace(null);
  };

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      description: place.description || '',
      location: place.location || '',
      category: place.category || '',
      image_url: place.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Name is required' });
      return;
    }

    setSaving(true);
    try {
      if (editingPlace) {
        const { error } = await supabase
          .from('places')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            location: formData.location.trim() || null,
            category: formData.category || null,
            image_url: formData.image_url.trim() || null,
          })
          .eq('id', editingPlace.id);

        if (error) throw error;
        toast({ title: 'Place updated successfully' });
      } else {
        const insertData: TablesInsert<'places'> = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          category: formData.category || null,
          image_url: formData.image_url.trim() || null,
        };

        const { error } = await supabase.from('places').insert(insertData);

        if (error) throw error;
        toast({ title: 'Place created successfully' });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPlaces();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: getSafeErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this place?')) return;

    try {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Place deleted successfully' });
      fetchPlaces();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: getSafeErrorMessage(error) });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container-wide pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="heading-section text-3xl">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage destinations and content</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Add Place
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingPlace ? 'Edit Place' : 'Add New Place'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Mount Everest Base Camp"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe this destination..."
                      rows={3}
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                      placeholder="e.g., Solukhumbu District"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(f => ({ ...f, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(f => ({ ...f, image_url: e.target.value }))}
                      placeholder="https://..."
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      {editingPlace ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{places.length}</p>
                  <p className="text-sm text-muted-foreground">Total Places</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {places.length > 0 ? (places.reduce((acc, p) => acc + (p.rating || 0), 0) / places.length).toFixed(1) : '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-nepal-gold/10 flex items-center justify-center">
                  <Image className="w-6 h-6 text-nepal-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{places.filter(p => p.image_url).length}</p>
                  <p className="text-sm text-muted-foreground">With Images</p>
                </div>
              </div>
            </div>
          </div>

          {/* Places Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No places yet. Add your first destination!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">Place</th>
                      <th className="text-left p-4 font-medium text-foreground">Location</th>
                      <th className="text-left p-4 font-medium text-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-foreground">Rating</th>
                      <th className="text-right p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.map((place) => (
                      <tr key={place.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {place.image_url ? (
                              <img src={place.image_url} alt={place.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">{place.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{place.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{place.location || '-'}</td>
                        <td className="p-4">
                          {place.category && (
                            <span className="bg-accent/10 text-accent px-2 py-1 rounded-full text-xs font-medium">
                              {place.category}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-nepal-gold text-nepal-gold" />
                            <span className="text-foreground">{place.rating || 0}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(place)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(place.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
