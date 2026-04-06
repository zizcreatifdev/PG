import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { X, CalendarDays, LayoutGrid, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales });
const DnDCalendar = withDragAndDrop(Calendar);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: '#888780', bg: '#F1F0E8' },
  propose: { label: 'Proposé', color: '#378ADD', bg: '#E6F1FB' },
  modifie: { label: 'Modifié', color: '#BA7517', bg: '#FAEEDA' },
  approuve: { label: 'Approuvé', color: '#E8533A', bg: '#FAECE7' },
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  poste: { label: 'Posté', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

type Post = {
  id: string;
  client_id: string;
  contenu: string;
  date_planifiee: string;
  statut: string;
  format: string;
  heure_publication: string | null;
  media_url: string | null;
  clients?: { nom: string; frequence_q1: number; frequence_q2: number; frequence_q3: number; frequence_q4: number } | null;
};
type Client = { id: string; nom: string; frequence_q1: number; frequence_q2: number; frequence_q3: number; frequence_q4: number };

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Post;
};

export default function AdminCalendrier() {
  const { user, role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filterClient, setFilterClient] = useState('all');
  const [view, setView] = useState<'month' | 'week'>(Views.MONTH as any);
  const [date, setDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editContenu, setEditContenu] = useState('');

  const load = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('posts').select('*, clients(nom, frequence_q1, frequence_q2, frequence_q3, frequence_q4)').order('date_planifiee'),
      supabase.from('clients').select('id, nom, frequence_q1, frequence_q2, frequence_q3, frequence_q4').eq('statut', 'actif'),
    ]);
    setPosts((p as Post[]) || []);
    setClients((c as Client[]) || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Frequency check: get expected posts for current quarter per client
  const frequencyAlerts = useMemo(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1; // 1-4
    const qStart = startOfQuarter(now);
    const qEnd = endOfQuarter(now);
    const alerts: Record<string, { expected: number; actual: number }> = {};
    clients.forEach(c => {
      const expected = (c as any)[`frequence_q${q}`] || 0;
      if (expected === 0) return;
      const actual = posts.filter(p => p.client_id === c.id && new Date(p.date_planifiee) >= qStart && new Date(p.date_planifiee) <= qEnd).length;
      if (actual < expected) {
        alerts[c.id] = { expected, actual };
      }
    });
    return alerts;
  }, [posts, clients]);

  const events: CalEvent[] = useMemo(() => {
    return posts
      .filter(p => filterClient === 'all' || p.client_id === filterClient)
      .map(p => {
        const d = new Date(p.date_planifiee);
        const clientName = (p.clients as any)?.nom || '?';
        return {
          id: p.id,
          title: `${clientName.charAt(0)}. ${p.contenu.substring(0, 30)}`,
          start: d,
          end: d,
          resource: p,
        };
      });
  }, [posts, filterClient]);

  // Drag & drop handler
  const onEventDrop = useCallback(async ({ event, start }: any) => {
    const newDate = format(start as Date, 'yyyy-MM-dd');
    const { error } = await supabase.from('posts').update({ date_planifiee: newDate }).eq('id', event.id);
    if (error) { toast.error('Erreur de déplacement'); return; }
    toast.success('Date mise à jour');
    load();
  }, [load]);

  const changeStatus = async (postId: string, newStatus: string) => {
    const { error } = await supabase.from('posts').update({ statut: newStatus as any }).eq('id', postId);
    if (error) { toast.error('Erreur'); return; }
    toast.success(`Statut → ${STATUS_CONFIG[newStatus]?.label}`);
    load();
    setSelectedPost(prev => prev ? { ...prev, statut: newStatus } : null);
  };

  const saveContenu = async () => {
    if (!selectedPost) return;
    const { error } = await supabase.from('posts').update({ contenu: editContenu }).eq('id', selectedPost.id);
    if (error) { toast.error('Erreur'); return; }
    toast.success('Contenu mis à jour');
    load();
  };

  const getTransitions = (statut: string) => {
    const isAdmin = role === 'admin';
    switch (statut) {
      case 'brouillon': return [{ s: 'propose', l: 'Proposer' }];
      case 'propose': return [];
      case 'modifie': return [{ s: 'propose', l: 'Re-proposer' }];
      case 'approuve': return isAdmin ? [{ s: 'valide', l: 'Valider' }] : [];
      case 'valide': return [];
      default: return [];
    }
  };

  // Custom event styling
  const eventStyleGetter = (event: CalEvent) => {
    const cfg = STATUS_CONFIG[event.resource.statut] || STATUS_CONFIG.brouillon;
    const hasAlert = frequencyAlerts[event.resource.client_id];
    return {
      style: {
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: hasAlert ? '2px solid #D97706' : `1px solid ${cfg.color}30`,
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        
        padding: '2px 6px',
      },
    };
  };

  const messages = {
    today: "Aujourd'hui",
    previous: '←',
    next: '→',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    agenda: 'Agenda',
    noEventsInRange: 'Aucun post sur cette période',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Calendrier éditorial</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">Vue multi-clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                  {frequencyAlerts[c.id] && <span className="ml-1 text-orange-500">⚠</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant={view === 'month' ? 'default' : 'ghost'}
              onClick={() => setView('month' as any)}
              className="rounded-none gap-1.5"
              style={view === 'month' ? { backgroundColor: '#03045E' } : {}}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Mois
            </Button>
            <Button
              size="sm"
              variant={view === 'week' ? 'default' : 'ghost'}
              onClick={() => setView('week' as any)}
              className="rounded-none gap-1.5"
              style={view === 'week' ? { backgroundColor: '#03045E' } : {}}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Semaine
            </Button>
          </div>
        </div>
      </div>

      {/* Frequency alerts */}
      {Object.keys(frequencyAlerts).length > 0 && (
        <div className="glass-card p-3 flex flex-wrap gap-2">
          {Object.entries(frequencyAlerts).map(([clientId, { expected, actual }]) => {
            const client = clients.find(c => c.id === clientId);
            return (
              <Badge key={clientId} className="font-body text-xs gap-1 border-0" style={{ backgroundColor: '#FAEEDA', color: '#BA7517' }}>
                <AlertTriangle className="h-3 w-3" />
                {client?.nom}: {actual}/{expected} posts ce trimestre
              </Badge>
            );
          })}
        </div>
      )}

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
      <div className="glass-card p-2 sm:p-4 overflow-x-auto" style={{ minHeight: 620 }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={view}
          onView={(v: any) => setView(v)}
          date={date}
          onNavigate={setDate}
          onEventDrop={onEventDrop}
          onSelectEvent={(event: any) => {
            setSelectedPost(event.resource);
            setEditContenu(event.resource.contenu);
          }}
          eventPropGetter={eventStyleGetter as any}
          messages={messages}
          culture="fr"
          views={['month', 'week']}
          popup
          resizable={false}
          style={{ height: 580 }}
          draggableAccessor={() => true}
        />
      </div>

      {/* Side panel */}
      <Sheet open={!!selectedPost} onOpenChange={open => { if (!open) setSelectedPost(null); }}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          {selectedPost && (() => {
            const cfg = STATUS_CONFIG[selectedPost.statut] || STATUS_CONFIG.brouillon;
            const clientName = (selectedPost.clients as any)?.nom || '—';
            const transitions = getTransitions(selectedPost.statut);
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading text-lg">Détail du post</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  {/* Client & status */}
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-semibold text-foreground">{clientName}</span>
                    <Badge className="border-0 font-body text-xs" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</Badge>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-muted-foreground font-body mb-1">Date programmée</p>
                    <p className="font-body text-sm">{format(new Date(selectedPost.date_planifiee), 'd MMMM yyyy', { locale: fr })}</p>
                    {selectedPost.heure_publication && (
                      <p className="font-body text-sm text-muted-foreground">à {format(new Date(selectedPost.heure_publication), 'HH:mm')}</p>
                    )}
                  </div>

                  {/* Format */}
                  <div>
                    <p className="text-xs text-muted-foreground font-body mb-1">Format</p>
                    <p className="font-body text-sm capitalize">{selectedPost.format}</p>
                  </div>

                  {/* Contenu editable */}
                  <div>
                    <p className="text-xs text-muted-foreground font-body mb-1">Contenu</p>
                    <Textarea
                      value={editContenu}
                      onChange={e => setEditContenu(e.target.value)}
                      rows={6}
                      className="font-body text-sm"
                    />
                    {editContenu !== selectedPost.contenu && (
                      <Button size="sm" className="mt-2 font-heading" style={{ backgroundColor: '#03045E' }} onClick={saveContenu}>
                        Enregistrer
                      </Button>
                    )}
                  </div>

                  {/* Media */}
                  {selectedPost.media_url && (
                    <div>
                      <p className="text-xs text-muted-foreground font-body mb-1">Média</p>
                      {selectedPost.format === 'video' ? (
                        <video src={selectedPost.media_url} controls className="w-full rounded-lg" />
                      ) : (
                        <img src={selectedPost.media_url} alt="" className="w-full rounded-lg" />
                      )}
                    </div>
                  )}

                  {/* Frequency alert */}
                  {frequencyAlerts[selectedPost.client_id] && (
                    <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: '#FAEEDA' }}>
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#BA7517' }} />
                      <p className="text-xs font-body" style={{ color: '#BA7517' }}>
                        Fréquence trimestrielle non respectée : {frequencyAlerts[selectedPost.client_id].actual}/{frequencyAlerts[selectedPost.client_id].expected} posts
                      </p>
                    </div>
                  )}

                  {/* Status actions */}
                  {transitions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-body">Actions rapides</p>
                      <div className="flex flex-wrap gap-2">
                        {transitions.map(t => (
                          <Button key={t.s} size="sm" variant="outline" className="font-heading text-xs" onClick={() => changeStatus(selectedPost.id, t.s)}>
                            {t.l}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
