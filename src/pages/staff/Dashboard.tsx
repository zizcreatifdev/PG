import { useEffect, useState } from 'react';
import { Users, CalendarDays, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function KPICard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: color + '15' }}>
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

export default function StaffDashboard() {
  const [stats, setStats] = useState({ clients: 0, posts: 0, postsValidated: 0 });

  useEffect(() => {
    async function load() {
      const [{ count: c }, { count: p }, { count: v }] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('statut', 'valide'),
      ]);
      setStats({ clients: c || 0, posts: p || 0, postsValidated: v || 0 });
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground font-body mt-1">Vue opérationnelle</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <KPICard icon={Users} label="Clients actifs" value={String(stats.clients)} color="#0077B6" />
        <KPICard icon={CalendarDays} label="Posts planifiés" value={String(stats.posts)} color="#023E8A" />
        <KPICard icon={TrendingUp} label="Posts validés" value={String(stats.postsValidated)} color="#8FC500" />
      </div>
    </div>
  );
}
