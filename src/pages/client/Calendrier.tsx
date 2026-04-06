import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { CalendarDays, LayoutGrid, Clock } from 'lucide-react';
import { toast } from 'sonner';
import LinkedInPreview from '@/components/LinkedInPreview';

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales });

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  propose: { label: 'Proposé', color: '#378ADD', bg: '#E6F1FB' },
  modifie: { label: 'Modifié', color: '#BA7517', bg: '#FAEEDA' },
  approuve: { label: 'Approuvé', color: '#E8533A', bg: '#FAECE7' },
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  poste: { label: 'Posté', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

// Statuses visible to client (never brouillon)
const VISIBLE_STATUSES = ['propose', 'modifie', 'approuve', 'valide', 'poste'];

type Post = {
  id: string;
  client_id: string;
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

export default function ClientCalendrier() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [view, setView] = useState<'week' | 'month'>('week' as any);
  const [date, setDate] = useState(new Date());
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);
  const [reportMessage, setReportMessage] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    // Get client info
    const { data: clientData } = await supabase.from('clients').select('nom, photo_url, titre_professionnel').eq('user_id', user.id).single();
    if (clientData) setClientInfo(clientData);

    // Get posts visible to client
    const { data: p } = await supabase
      .from('posts')
      .select('id, client_id, contenu, date_planifiee, statut, format, media_url, sondage_question, sondage_options, heure_publication')
      .in('statut', VISIBLE_STATUSES as any)
      .order('date_planifiee');
    setPosts((p as Post[]) || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const events = useMemo(() => {
    return posts.map(p => ({
      id: p.id,
      title: p.contenu.substring(0, 40) || 'Post',
      start: new Date(p.date_planifiee),
      end: new Date(p.date_planifiee),
      resource: p,
    }));
  }, [posts]);

  const eventStyleGetter = (event: any) => {
    const cfg = STATUS_CONFIG[event.resource.statut] || STATUS_CONFIG.propose;
    return {
      style: {
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}30`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        
        padding: '2px 6px',
      },
    };
  };

  // Approve post
  const approvePost = async (postId: string) => {
    const { error } = await supabase.from('posts').update({ statut: 'approuve' as any }).eq('id', postId);
    if (error) { toast.error('Erreur'); return; }
    // Notify admin
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Post approuvé par le client',
          message: `${clientInfo?.nom || 'Un client'} a approuvé un post.`,
        });
      }
    }
    toast.success('Post approuvé !');
    setPreviewPost(null);
    load();
  };

  // Request modification
  const modifyPost = async (postId: string) => {
    const { error } = await supabase.from('posts').update({ statut: 'modifie' as any }).eq('id', postId);
    if (error) { toast.error('Erreur'); return; }
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Post modifié par le client',
          message: `${clientInfo?.nom || 'Un client'} a demandé une modification.`,
        });
      }
    }
    toast.success('Demande de modification envoyée');
    setPreviewPost(null);
    load();
  };

  // Report request
  const submitReport = async () => {
    if (!reportPost || !reportMessage.trim()) return;
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      for (const a of admins) {
        await supabase.from('notifications').insert({
          user_id: a.user_id,
          title: 'Demande de report',
          message: `${clientInfo?.nom || 'Client'} demande un report pour le post du ${format(new Date(reportPost.date_planifiee), 'd MMM yyyy', { locale: fr })} : "${reportMessage}"`,
        });
      }
    }
    toast.success('Demande de report envoyée à votre gestionnaire');
    setReportPost(null);
    setReportMessage('');
  };

  const messages = {
    today: "Aujourd'hui",
    previous: '←',
    next: '→',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    noEventsInRange: 'Aucune publication sur cette période',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Mes publications</h1>
          <p className="text-muted-foreground font-body mt-1">Votre calendrier éditorial LinkedIn</p>
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            size="sm"
            variant={view === 'week' ? 'default' : 'ghost'}
            onClick={() => setView('week' as any)}
            className="rounded-none gap-1.5"
            style={view === 'week' ? { backgroundColor: '#03045E' } : {}}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Semaine
          </Button>
          <Button
            size="sm"
            variant={view === 'month' ? 'default' : 'ghost'}
            onClick={() => setView('month' as any)}
            className="rounded-none gap-1.5"
            style={view === 'month' ? { backgroundColor: '#03045E' } : {}}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Mois
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-body" style={{ backgroundColor: v.bg, color: v.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <div className="glass-card p-2 sm:p-4 overflow-x-auto" style={{ minHeight: 580 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={(v: any) => setView(v)}
          date={date}
          onNavigate={setDate}
          onSelectEvent={(event: any) => setPreviewPost(event.resource)}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="fr"
          views={['week', 'month']}
          popup
          style={{ height: 540 }}
        />
      </div>

      {/* LinkedIn Preview overlay */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: '#F3F2EF' }}>
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

          {/* Client actions below preview */}
          <div className="mt-4 flex items-center gap-3 z-[51]">
            {previewPost.statut === 'propose' && (
              <>
                <Button
                  className="font-heading font-semibold text-white gap-1.5"
                  style={{ backgroundColor: '#1D9E75' }}
                  onClick={() => approvePost(previewPost.id)}
                >
                  ✓ Approuver
                </Button>
                <Button
                  variant="outline"
                  className="font-heading font-semibold gap-1.5"
                  style={{ borderColor: '#BA7517', color: '#BA7517' }}
                  onClick={() => modifyPost(previewPost.id)}
                >
                  ✎ Demander modification
                </Button>
              </>
            )}
            {['propose', 'approuve', 'valide'].includes(previewPost.statut) && (
              <Button
                variant="outline"
                className="font-heading font-semibold gap-1.5"
                onClick={() => { setReportPost(previewPost); }}
              >
                <Clock className="h-4 w-4" /> Demander un report
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Report request dialog */}
      <Dialog open={!!reportPost} onOpenChange={o => { if (!o) { setReportPost(null); setReportMessage(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Demander un report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm font-body text-muted-foreground">
              Post du {reportPost && format(new Date(reportPost.date_planifiee), 'd MMMM yyyy', { locale: fr })}
            </p>
            <div className="space-y-2">
              <Label className="font-heading font-semibold">Votre message</Label>
              <Textarea
                value={reportMessage}
                onChange={e => setReportMessage(e.target.value)}
                placeholder="Expliquez la raison du report souhaité..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReportPost(null); setReportMessage(''); }}>Annuler</Button>
            <Button
              className="font-heading text-white"
              style={{ backgroundColor: '#03045E' }}
              onClick={submitReport}
              disabled={!reportMessage.trim()}
            >
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
