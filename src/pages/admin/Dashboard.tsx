import { useEffect, useState } from 'react';
import {
  Users,
  CalendarDays,
  Clock,
  Camera,
  AlertTriangle,
  FileText,
  RefreshCw,
  CalendarOff,
  Activity,
  Globe,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  KPI Card                                                          */
/* ------------------------------------------------------------------ */
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="glass-card p-6 animate-fade-in"
      style={{ animationDelay: `${delay || 0}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[13px] font-body font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-3xl font-heading font-bold text-foreground leading-none">
            {value}
          </p>
          {sub && (
            <p className="text-xs font-body text-muted-foreground mt-1">{sub}</p>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: color + '12' }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alert Item                                                        */
/* ------------------------------------------------------------------ */
function AlertItem({
  icon: Icon,
  text,
  severity,
}: {
  icon: any;
  text: string;
  severity: 'critical' | 'warning' | 'info';
}) {
  const colors = {
    critical: { bg: '#8FC50012', dot: '#8FC500', border: '#8FC50030' },
    warning: { bg: '#0077B612', dot: '#0077B6', border: '#0077B630' },
    info: { bg: '#E4E7F020', dot: '#4A5578', border: '#E4E7F0' },
  };
  const c = colors[severity];

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:brightness-[0.97]"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: c.dot + '20' }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: c.dot }} />
      </div>
      <p className="text-[13px] font-body text-foreground leading-snug">{text}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Item                                                      */
/* ------------------------------------------------------------------ */
function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: '#0077B6' }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-body text-foreground leading-snug">{text}</p>
        <p className="text-[11px] font-body text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    clientsActifs: 0,
    postsPublies: 0,
    postsPrevus: 0,
    postsEnAttente: 0,
    shootingsAplanifier: 0,
    facturesEnRetard: 0,
  });
  const [loading, setLoading] = useState(true);

  const prenom = user?.user_metadata?.prenom || 'Admin';

  useEffect(() => {
    async function loadStats() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const today = now.toISOString().split('T')[0];

      const [
        { count: clientsActifs },
        { count: postsPublies },
        { count: postsPrevus },
        { count: postsEnAttente },
        { data: stockClients },
        { count: facturesEnRetard },
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'actif')
          .or('archived.is.null,archived.eq.false'),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'poste')
          .gte('date_planifiee', startOfMonth)
          .lte('date_planifiee', endOfMonth),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .gte('date_planifiee', startOfMonth)
          .lte('date_planifiee', endOfMonth),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'propose'),
        supabase
          .from('clients')
          .select('id, stock_images, seuil_alerte_images')
          .eq('statut', 'actif')
          .or('archived.is.null,archived.eq.false'),
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .lt('date_echeance', today)
          .not('statut', 'in', '("paye","payee","en_retard")'),
      ]);

      const shootingsCount = (stockClients || []).filter(
        (c: any) => (c.stock_images || 0) <= (c.seuil_alerte_images || 5)
      ).length;

      setStats({
        clientsActifs: clientsActifs || 0,
        postsPublies: postsPublies || 0,
        postsPrevus: postsPrevus || 0,
        postsEnAttente: postsEnAttente || 0,
        shootingsAplanifier: shootingsCount,
        facturesEnRetard: facturesEnRetard || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  // Simulated alert & activity data (will be replaced by real queries later)
  const alerts = [
    {
      icon: Camera,
      text: '3 clients ont un stock d\'images < 5 visuels restants',
      severity: 'critical' as const,
    },
    {
      icon: Clock,
      text: '2 posts en attente de validation depuis plus de 48 h',
      severity: 'critical' as const,
    },
    {
      icon: RefreshCw,
      text: 'Contrat de Amadou Diallo arrive à échéance dans 7 jours',
      severity: 'warning' as const,
    },
    {
      icon: CalendarOff,
      text: 'Fatou Sow a demandé un report de date pour le post du 04/04',
      severity: 'info' as const,
    },
  ];

  const activities = [
    { text: 'Post de Moussa Ndiaye publié sur LinkedIn', time: 'Il y a 12 min' },
    { text: 'Nouveau client ajouté : Awa Diop — TechAfrica', time: 'Il y a 1 h' },
    { text: 'Facture FAC-024 marquée comme payée', time: 'Il y a 2 h' },
    { text: 'Shooting planifié pour Ibrahima Fall le 05/04', time: 'Il y a 3 h' },
    { text: 'Post brouillon créé pour Aminata Ba', time: 'Hier, 18:30' },
    { text: 'Contenu validé par le client Ousmane Sy', time: 'Hier, 14:15' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Bonjour, {prenom} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            Voici l'état de votre activité aujourd'hui
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {stats.facturesEnRetard > 0 && (
            <a
              href="/admin/facturation"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold animate-pulse"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}
            >
              <AlertTriangle className="h-4 w-4" />
              {stats.facturesEnRetard} facture{stats.facturesEnRetard > 1 ? 's' : ''} en retard
            </a>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-semibold transition hover:opacity-90 shadow-sm" style={{ backgroundColor: '#03045E', color: 'white' }}>
            <Globe className="h-4 w-4" /> Voir la landing page
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          icon={Users}
          label="Clients actifs"
          value={String(stats.clientsActifs)}
          color="#0077B6"
          delay={0}
        />
        <KPICard
          icon={CalendarDays}
          label="Posts ce mois"
          value={`${stats.postsPublies} / ${stats.postsPrevus}`}
          sub="publiés / prévus"
          color="#023E8A"
          delay={60}
        />
        <KPICard
          icon={Clock}
          label="En attente validation"
          value={String(stats.postsEnAttente)}
          sub="posts à valider"
          color="#03045E"
          delay={120}
        />
        <KPICard
          icon={Camera}
          label="Shootings à planifier"
          value={String(stats.shootingsAplanifier)}
          sub="stock bas détecté"
          color="#8FC500"
          delay={180}
        />
      </div>

      {/* Two-column: Alerts + Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Alertes — left col (3/5) */}
        <div className="lg:col-span-3 glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="h-5 w-5" style={{ color: '#8FC500' }} />
            <h2 className="font-heading text-lg font-bold text-foreground">
              Alertes & priorités du jour
            </h2>
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <AlertItem key={i} icon={a.icon} text={a.text} severity={a.severity} />
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground font-body py-6 text-center">
                Aucune alerte pour le moment 🎉
              </p>
            )}
          </div>
        </div>

        {/* Activité récente — right col (2/5) */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-5 w-5" style={{ color: '#0077B6' }} />
            <h2 className="font-heading text-lg font-bold text-foreground">
              Activité récente
            </h2>
          </div>
          <div>
            {activities.map((a, i) => (
              <ActivityItem key={i} text={a.text} time={a.time} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
