import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Download, FileText, Camera, Users, Image, Send, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

type LogEntry = {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  description: string;
  entity_type: string | null;
  created_at: string;
};

type StaffUser = { user_id: string; nom: string; prenom: string };

const actionConfig: Record<string, { label: string; color: string; bg: string; icon: typeof FileText }> = {
  post_create: { label: 'Post créé', color: '#0077B6', bg: '#E6F1FB', icon: FileText },
  post_update: { label: 'Post modifié', color: '#023E8A', bg: '#E8EBF6', icon: FileText },
  post_validate: { label: 'Validation envoyée', color: '#8FC500', bg: '#F4F9E6', icon: Send },
  post_status: { label: 'Statut modifié', color: '#BA7517', bg: '#FAEEDA', icon: FileText },
  shooting_plan: { label: 'Shooting planifié', color: '#BA7517', bg: '#FAEEDA', icon: Camera },
  client_update: { label: 'Client modifié', color: '#6B7280', bg: '#F3F4F6', icon: Users },
  client_create: { label: 'Client créé', color: '#16A34A', bg: '#F0FDF4', icon: Users },
  image_upload: { label: 'Images uploadées', color: '#16A34A', bg: '#F0FDF4', icon: Image },
  invoice_create: { label: 'Facture créée', color: '#7C3AED', bg: '#EDE9FE', icon: FileText },
  autre: { label: 'Action', color: '#6B7280', bg: '#F3F4F6', icon: FileText },
};

const PAGE_SIZE = 25;

export default function AdminJournal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [filterUser, setFilterUser] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [{ data: logData }, { data: staffRoles }] = await Promise.all([
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('user_roles').select('user_id').in('role', ['staff', 'admin']),
      ]);
      setLogs((logData as LogEntry[]) || []);

      if (staffRoles && staffRoles.length > 0) {
        const userIds = staffRoles.map(r => r.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, nom, prenom').in('user_id', userIds);
        setStaffUsers((profiles as StaffUser[]) || []);
      }
    })();
  }, []);

  const filteredLogs = useMemo(() => {
    setPage(1);
    return logs.filter(l => {
      if (filterUser !== 'all' && l.user_id !== filterUser) return false;
      if (filterType !== 'all' && l.action_type !== filterType) return false;
      if (filterFrom && l.created_at < filterFrom) return false;
      if (filterTo && l.created_at > filterTo + 'T23:59:59') return false;
      return true;
    });
  }, [logs, filterUser, filterType, filterFrom, filterTo]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pageLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const exportCSV = () => {
    const rows = filteredLogs.map(l => ({
      Date: formatDate(l.created_at),
      Collaborateur: l.user_name,
      Action: actionConfig[l.action_type]?.label || l.action_type,
      Détail: l.description,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Journal');
    XLSX.writeFile(wb, `journal-activite-${new Date().toISOString().slice(0, 10)}.csv`, { bookType: 'csv' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Journal d'activité</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">{filteredLogs.length} action{filteredLogs.length !== 1 ? 's' : ''} enregistrée{filteredLogs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-heading font-semibold text-foreground">Filtres</span>
        </div>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Collaborateur" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les collaborateurs</SelectItem>
            {staffUsers.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.prenom} {u.nom}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Type d'action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            {Object.entries(actionConfig).filter(([k]) => k !== 'autre').map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-40" />
          <span className="text-muted-foreground text-sm">→</span>
          <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-40" />
        </div>
        {(filterUser !== 'all' || filterType !== 'all' || filterFrom || filterTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterUser('all'); setFilterType('all'); setFilterFrom(''); setFilterTo(''); }}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Log table */}
      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Collaborateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageLogs.map(log => {
              const config = actionConfig[log.action_type] || actionConfig.autre;
              const Icon = config.icon;
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[11px] font-heading font-bold" style={{ backgroundColor: config.bg, color: config.color }}>
                        {getInitials(log.user_name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-heading font-medium text-sm">{log.user_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 text-[11px]" style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color + '33' }}>
                      <Icon className="h-3 w-3" /> {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground max-w-[400px] truncate">{log.description}</TableCell>
                  <TableCell className="text-right text-xs font-body text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                </TableRow>
              );
            })}
            {pageLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-heading font-semibold">Aucune activité enregistrée</p>
                    <p className="text-sm">Les actions apparaîtront ici automatiquement</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-body">
            Page {page} sur {totalPages} · {filteredLogs.length} entrées
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}
                  style={p === page ? { backgroundColor: '#03045E' } : {}}>
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
