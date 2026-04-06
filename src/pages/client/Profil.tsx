import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
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

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('id, nom, titre_professionnel, email, photo_url, telephone')
        .eq('user_id', user!.id)
        .single();
      setProfile(data as ClientProfile | null);
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground font-body">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mon profil</h1>
        <p className="text-muted-foreground font-body mt-1">Vos informations personnelles</p>
      </div>

      <div className="glass-card p-6 space-y-6">
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
    </div>
  );
}
