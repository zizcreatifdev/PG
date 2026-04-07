import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

type ClientProfile = {
  id: string;
  nom: string;
  titre_professionnel: string | null;
  email: string | null;
  photo_url: string | null;
  telephone: string | null;
};

export default function ClientProfil() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [clientImages, setClientImages] = useState<any[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const loadImages = async (clientId: string) => {
    const { data } = await supabase
      .from('client_images')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setClientImages(data || []);
  };

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('id, nom, titre_professionnel, email, photo_url, telephone')
        .eq('user_id', user!.id)
        .single();
      const p = data as ClientProfile | null;
      setProfile(p);
      if (p) loadImages(p.id);
    }
    load();
  }, [user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('client-photos').upload(path, file, { upsert: true });
    if (error) { toast.error("Erreur d'upload"); setUploading(false); return; }
    const { data } = supabase.storage.from('client-photos').getPublicUrl(path);
    const photoUrl = data.publicUrl + `?t=${Date.now()}`;
    await supabase.from('clients').update({ photo_url: photoUrl }).eq('id', profile.id);
    setProfile(prev => prev ? { ...prev, photo_url: photoUrl } : null);
    toast.success('Photo mise à jour');
    setUploading(false);
  };

  const handleClientPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !profile) return;
    setUploadingPhotos(true);
    let count = 0;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('shooting-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('shooting-images').getPublicUrl(path);
        await supabase.from('client_images').insert({ client_id: profile.id, image_url: data.publicUrl });
        count++;
      }
    }
    toast.success(`${count} photo(s) ajoutée(s)`);
    loadImages(profile.id);
    setUploadingPhotos(false);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground font-body">Chargement...</p>
      </div>
    );
  }

  const availableCount = clientImages.filter(img => img.used_in_post_id == null).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mon profil</h1>
        <p className="text-muted-foreground font-body mt-1">Vos informations personnelles et vos photos</p>
      </div>

      <Tabs defaultValue="profil">
        <TabsList className="mb-4">
          <TabsTrigger value="profil">Mon profil</TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Mes photos
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Mon profil ── */}
        <TabsContent value="profil">
          <div className="glass-card p-6 space-y-6 max-w-xl">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.photo_url || undefined} alt={profile.nom} />
                <AvatarFallback className="text-2xl font-heading font-bold" style={{ backgroundColor: '#03045E', color: 'white' }}>
                  {profile.nom.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-dashed border-border hover:bg-muted/50 transition">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-body text-muted-foreground">
                    {uploading ? 'Upload en cours...' : 'Changer la photo'}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            {/* Fields (read-only except photo) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Nom complet</Label>
                <Input value={profile.nom} disabled className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Titre professionnel</Label>
                <Input value={profile.titre_professionnel || ''} disabled className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Email</Label>
                <Input value={profile.email || user?.email || ''} disabled className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Téléphone</Label>
                <Input value={profile.telephone || ''} disabled className="bg-muted/30" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Mes photos ── */}
        <TabsContent value="photos">
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-body text-muted-foreground">
                <span className="font-semibold" style={{ color: '#0077B6' }}>{availableCount}</span> image{availableCount !== 1 ? 's' : ''} disponible{availableCount !== 1 ? 's' : ''}
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg text-sm font-body text-white transition hover:opacity-90" style={{ backgroundColor: '#8FC500' }}>
                <Upload className="h-4 w-4" />
                {uploadingPhotos ? 'Upload en cours...' : 'Ajouter des photos'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleClientPhotoUpload}
                  disabled={uploadingPhotos}
                />
              </label>
            </div>

            {/* Grid */}
            {clientImages.length === 0 ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center gap-3 text-center">
                <Image className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground font-body text-sm">Aucune photo pour le moment.<br />Ajoutez vos premières images ci-dessus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {clientImages.map((img) => {
                  const used = img.used_in_post_id != null;
                  return (
                    <div key={img.id} className="glass-card overflow-hidden group relative">
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <span
                          className="text-xs font-body font-semibold px-2 py-0.5 rounded-full"
                          style={
                            used
                              ? { backgroundColor: '#8FC500', color: '#fff' }
                              : { backgroundColor: '#0077B6', color: '#fff' }
                          }
                        >
                          {used ? 'Utilisée' : 'Disponible'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
