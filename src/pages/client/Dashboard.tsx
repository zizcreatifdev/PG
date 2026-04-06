import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileCheck, BarChart3, ExternalLink, CalendarDays, ArrowRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const FORMAT_LABELS: Record<string, string> = {
  texte: 'Texte',
  image: 'Image',
  video: 'Vidéo',
  sondage: 'Sondage',
};

type PostPropose = {
  id: string;
  contenu: string;
  date_planifiee: string;
  format: string;
  heure_publication: string | null;
};

type PostPoste = {
  id: string;
  date_planifiee: string;
  format: string;
  contenu: string;
};

type KPIs = {
  validesComois: number;
  prochainPost: { date: string; format: string } | null;
  enAttente: number;
  totalPoste: number;
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIs>({ validesComois: 0, prochainPost: null, enAttente: 0, totalPoste: 0 });
  const [postsAValider, setPostsAValider] = useState<PostPropose[]>([]);
  const [postsPublies, setPostsPublies] = useState<PostPoste[]>([]);
  const [loadingToken, setLoadingToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: clientData } = await supabase.from('clients').select('id').eq('user_id', user.id).single();
    if (!clientData) return;
    const cid = clientData.id;
    setClientId(cid);

    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();

    const [
      { data: validesData },
      { data: prochainData },
      { data: proposeData },
      { data: posteCountData },
      { data: posteData },
    ] = await Promise.all([
      // Posts validés ce mois (statut = valide ou poste, date dans le mois)
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('client_id', cid)
        .in('statut', ['valide', 'poste'] as any[])
        .gte('date_planifiee', monthStart.slice(0, 10))
        .lte('date_planifiee', monthEnd.slice(0, 10)),
      // Prochain post planifié
      supabase
        .from('posts')
        .select('date_planifiee, format')
        .eq('client_id', cid)
        .in('statut', ['valide', 'propose'] as any[])
        .gte('date_planifiee', now.toISOString().slice(0, 10))
        .order('date_planifiee', { ascending: true })
        .limit(1),
      // Posts en attente de validation
      supabase
        .from('posts')
        .select('id, contenu, date_planifiee, format, heure_publication')
        .eq('client_id', cid)
        .eq('statut', 'propose' as any)
        .order('date_planifiee', { ascending: true }),
      // Total posts publiés
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('client_id', cid)
        .eq('statut', 'poste' as any),
      // 5 derniers posts publiés
      supabase
        .from('posts')
        .select('id, date_planifiee, format, contenu')
        .eq('client_id', cid)
        .eq('statut', 'poste' as any)
        .order('date_planifiee', { ascending: false })
        .limit(5),
    ]);

    setKpis({
      validesComois: validesData?.length ?? 0,
      prochainPost: prochainData?.[0] ? { date: prochainData[0].date_planifiee, format: prochainData[0].format } : null,
      enAttente: proposeData?.length ?? 0,
      totalPoste: posteCountData?.length ?? 0,
    });
    setPostsAValider((proposeData as PostPropose[]) || []);
    setPostsPublies((posteData as PostPoste[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleVoirEtValider = async (postId: string) => {
    setLoadingToken(postId);
    try {
      const { data } = await supabase
        .from('post_validation_tokens')
        .select('token')
        .eq('post_id', postId)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data?.token) {
        navigate(`/valider/${data.token}`);
      } else {
        // No valid token available — show info
        navigate(`/valider/no-token`);
      }
    } finally {
      setLoadingToken(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mon tableau de bord</h1>
        <p className="text-muted-foreground font-body mt-1 text-sm">Bienvenue dans votre espace PersonaGenius</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Posts validés ce mois */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-muted-foreground">Validés ce mois</span>
            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(141,197,0,0.12)' }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: '#8FC500' }} />
            </div>
          </div>
          <p className="text-3xl font-heading font-bold" style={{ color: '#03045E' }}>{kpis.validesComois}</p>
          <p className="text-xs font-body text-muted-foreground">Posts approuvés pour {format(new Date(), 'MMMM yyyy', { locale: fr })}</p>
        </div>

        {/* Prochain post planifié */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-muted-foreground">Prochain post</span>
            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,119,182,0.1)' }}>
              <CalendarDays className="h-5 w-5" style={{ color: '#0077B6' }} />
            </div>
          </div>
          {kpis.prochainPost ? (
            <>
              <p className="text-xl font-heading font-bold" style={{ color: '#03045E' }}>
                {format(new Date(kpis.prochainPost.date), 'd MMM', { locale: fr })}
              </p>
              <Badge className="w-fit font-body text-xs border-0" style={{ backgroundColor: 'rgba(0,119,182,0.1)', color: '#0077B6' }}>
                {FORMAT_LABELS[kpis.prochainPost.format] || kpis.prochainPost.format}
              </Badge>
            </>
          ) : (
            <p className="text-base font-heading font-medium text-muted-foreground">Aucun planifié</p>
          )}
        </div>

        {/* Posts en attente */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-muted-foreground">En attente</span>
            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: kpis.enAttente > 0 ? 'rgba(217,119,6,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <Clock className="h-5 w-5" style={{ color: kpis.enAttente > 0 ? '#D97706' : 'rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <p className="text-3xl font-heading font-bold" style={{ color: kpis.enAttente > 0 ? '#D97706' : '#03045E' }}>
            {kpis.enAttente}
          </p>
          <p className="text-xs font-body text-muted-foreground">Post(s) en attente de votre validation</p>
        </div>

        {/* Total publiés */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-muted-foreground">Total publiés</span>
            <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(3,4,94,0.08)' }}>
              <BarChart3 className="h-5 w-5" style={{ color: '#03045E' }} />
            </div>
          </div>
          <p className="text-3xl font-heading font-bold" style={{ color: '#03045E' }}>{kpis.totalPoste}</p>
          <p className="text-xs font-body text-muted-foreground">Posts publiés sur LinkedIn</p>
        </div>
      </div>

      {/* ── À valider maintenant ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">À valider maintenant</h2>
          {kpis.enAttente > 0 && (
            <Badge className="font-body text-xs border-0" style={{ backgroundColor: 'rgba(217,119,6,0.12)', color: '#D97706' }}>
              {kpis.enAttente} en attente
            </Badge>
          )}
        </div>

        {postsAValider.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
            <p className="font-heading font-semibold text-foreground">Aucun post en attente</p>
            <p className="text-sm text-muted-foreground font-body mt-1">Tous vos posts ont été traités ✨</p>
          </div>
        ) : (
          <div className="space-y-3">
            {postsAValider.map(post => (
              <div
                key={post.id}
                className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ borderLeft: '3px solid #D97706' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className="font-body text-[10px] border-0" style={{ backgroundColor: '#E6F1FB', color: '#378ADD' }}>
                      Proposé
                    </Badge>
                    <span className="text-xs font-body text-muted-foreground">
                      {format(new Date(post.date_planifiee), 'd MMMM yyyy', { locale: fr })}
                      {post.heure_publication && ` à ${format(new Date(post.heure_publication), 'HH:mm')}`}
                    </span>
                    <Badge className="font-body text-[10px] border-0" style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }}>
                      {FORMAT_LABELS[post.format] || post.format}
                    </Badge>
                  </div>
                  <p className="font-body text-sm text-foreground line-clamp-2 leading-relaxed">
                    {post.contenu || 'Contenu du post…'}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="font-heading font-semibold gap-1.5 text-white shrink-0"
                  style={{ backgroundColor: '#0077B6' }}
                  disabled={loadingToken === post.id}
                  onClick={() => handleVoirEtValider(post.id)}
                >
                  {loadingToken === post.id ? 'Chargement…' : (
                    <>Voir et valider <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Récemment publiés ── */}
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">Récemment publiés</h2>

        {postsPublies.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <ExternalLink className="h-10 w-10 mx-auto text-muted-foreground/25 mb-3" />
            <p className="font-heading font-semibold text-foreground">Aucun post publié pour l'instant</p>
            <p className="text-sm text-muted-foreground font-body mt-1">Vos publications apparaîtront ici.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            {postsPublies.map((post, i) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4"
                style={i < postsPublies.length - 1 ? { borderBottom: '1px solid rgba(0,0,0,0.06)' } : {}}
              >
                <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(3,4,94,0.08)' }}>
                  <ExternalLink className="h-4 w-4" style={{ color: '#03045E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{post.contenu || '—'}</p>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {format(new Date(post.date_planifiee), 'd MMM yyyy', { locale: fr })}
                  </p>
                </div>
                <Badge className="font-body text-[10px] border-0 shrink-0" style={{ backgroundColor: 'rgba(3,4,94,0.07)', color: '#03045E' }}>
                  {FORMAT_LABELS[post.format] || post.format}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
