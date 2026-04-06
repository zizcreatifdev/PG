import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LinkedInPreview from '@/components/LinkedInPreview';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  poste: { label: 'Posté', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

type Post = {
  id: string;
  contenu: string;
  date_planifiee: string;
  statut: string;
  format: string;
  media_url: string | null;
  sondage_question: string | null;
  sondage_options: string[] | null;
  heure_publication: string | null;
};

type ClientInfo = { nom: string; photo_url: string | null; titre_professionnel: string | null };

export default function ClientValides() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: c } = await supabase.from('clients').select('id, nom, photo_url, titre_professionnel').eq('user_id', user.id).single();
    if (!c) return;
    setClientInfo(c);
    const { data } = await supabase
      .from('posts')
      .select('id, contenu, date_planifiee, statut, format, media_url, sondage_question, sondage_options, heure_publication')
      .eq('client_id', c.id)
      .in('statut', ['valide', 'poste'] as any)
      .order('date_planifiee', { ascending: false });
    setPosts((data as Post[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Déjà validés</h1>
        <p className="text-muted-foreground font-body mt-1">Vos posts validés et publiés</p>
      </div>

      {posts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground font-body">Aucun post validé pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const cfg = STATUS_CONFIG[post.statut] || STATUS_CONFIG.valide;
            return (
              <div key={post.id} className="glass-card p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="font-body text-xs border-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-body">
                      {format(new Date(post.date_planifiee), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm font-body text-foreground line-clamp-3 whitespace-pre-wrap">{post.contenu}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 font-heading gap-1.5"
                  onClick={() => setPreviewPost(post)}
                >
                  <Eye className="h-3.5 w-3.5" /> Aperçu
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* LinkedIn Preview */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#F3F2EF' }}>
          <LinkedInPreview
            nom={clientInfo?.nom || 'Vous'}
            titre={clientInfo?.titre_professionnel || ''}
            photoUrl={clientInfo?.photo_url}
            contenu={previewPost.contenu}
            mediaUrl={previewPost.media_url}
            format={previewPost.format}
            sondageQuestion={previewPost.sondage_question}
            sondageOptions={previewPost.sondage_options}
            onClose={() => setPreviewPost(null)}
          />
        </div>
      )}
    </div>
  );
}
