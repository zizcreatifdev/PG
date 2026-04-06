import { useEffect, useState } from 'react';
import { Users, FileText, Camera, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: color + '18' }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div>
          <p className="text-sm font-body text-muted-foreground">{label}</p>
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface TodoItem {
  id: string;
  type: 'post' | 'shooting';
  label: string;
  client: string;
  url: string;
  urgent?: boolean;
}

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    clientsActifs: 0,
    postsBrouillonSemaine: 0,
    shootingsAvenir: 0,
    postsEnAttente: 0,
  });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const today = now.toISOString().split('T')[0];
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [
        { count: clientsActifs },
        { count: postsBrouillonSemaine },
        { count: shootingsAvenir },
        { count: postsEnAttente },
        { data: postsAFaire },
        { data: shootingsAFaire },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
        supabase.from('posts').select('*', { count: 'exact', head: true })
          .eq('statut', 'brouillon')
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString()),
        supabase.from('shootings').select('*', { count: 'exact', head: true })
          .gte('date_seance', today),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('statut', 'propose'),
        supabase.from('posts')
          .select('id, titre, statut, date_publication, clients(nom)')
          .eq('statut', 'brouillon')
          .lte('date_publication', in7Days)
          .order('date_publication', { ascending: true })
          .limit(5),
        supabase.from('shootings')
          .select('id, titre, date_seance, clients(nom)')
          .gte('date_seance', today)
          .lte('date_seance', in7Days)
          .order('date_seance', { ascending: true })
          .limit(5),
      ]);

      setStats({
        clientsActifs: clientsActifs || 0,
        postsBrouillonSemaine: postsBrouillonSemaine || 0,
        shootingsAvenir: shootingsAvenir || 0,
        postsEnAttente: postsEnAttente || 0,
      });

      const todoItems: TodoItem[] = [];

      if (postsAFaire) {
        for (const p of postsAFaire) {
          const client = (p.clients as any)?.nom || '—';
          todoItems.push({
            id: p.id,
            type: 'post',
            label: p.titre || 'Post sans titre',
            client,
            url: '/staff/posts',
            urgent: p.date_publication ? new Date(p.date_publication) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) : false,
          });
        }
      }

      if (shootingsAFaire) {
        for (const s of shootingsAFaire) {
          const client = (s.clients as any)?.nom || '—';
          todoItems.push({
            id: s.id,
            type: 'shooting',
            label: s.titre || 'Shooting sans titre',
            client,
            url: '/staff/shootings',
            urgent: s.date_seance === today,
          });
        }
      }

      setTodos(todoItems);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground font-body mt-1">Vue opérationnelle — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={Users} label="Clients actifs" value={stats.clientsActifs} color="#0077B6" />
        <KPICard icon={FileText} label="Brouillons cette semaine" value={stats.postsBrouillonSemaine} color="#023E8A" />
        <KPICard icon={Camera} label="Shootings à venir" value={stats.shootingsAvenir} color="#7B2FF7" />
        <KPICard icon={Clock} label="Posts en attente client" value={stats.postsEnAttente} color="#D97706" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading font-semibold text-foreground">À faire aujourd'hui / cette semaine</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : todos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10">
            <CheckCircle className="h-10 w-10 text-[#8FC500]" />
            <p className="font-body text-sm text-muted-foreground">Tout est à jour — rien à faire pour le moment !</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {todos.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.url}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: item.type === 'post' ? '#0077B615' : '#7B2FF715' }}
                  >
                    {item.type === 'post'
                      ? <FileText className="h-4 w-4" style={{ color: '#0077B6' }} />
                      : <Camera className="h-4 w-4" style={{ color: '#7B2FF7' }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="font-body text-xs text-muted-foreground">{item.client}</p>
                  </div>
                  {item.urgent && (
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      Urgent
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/staff/posts" className="glass-card p-5 hover:ring-2 hover:ring-[#0077B6]/30 transition-all group">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#0077B6]" />
            <span className="font-body text-sm font-medium text-foreground group-hover:text-[#0077B6] transition-colors">Gérer les posts</span>
          </div>
        </Link>
        <Link to="/staff/clients" className="glass-card p-5 hover:ring-2 hover:ring-[#023E8A]/30 transition-all group">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#023E8A]" />
            <span className="font-body text-sm font-medium text-foreground group-hover:text-[#023E8A] transition-colors">Voir les clients</span>
          </div>
        </Link>
        <Link to="/staff/shootings" className="glass-card p-5 hover:ring-2 hover:ring-[#7B2FF7]/30 transition-all group">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-[#7B2FF7]" />
            <span className="font-body text-sm font-medium text-foreground group-hover:text-[#7B2FF7] transition-colors">Gérer les shootings</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
