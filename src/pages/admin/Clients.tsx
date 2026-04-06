import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Archive, ImageIcon, Users, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Client = {
  id: string;
  nom: string;
  photo_url: string | null;
  entreprise: string | null;
  email: string | null;
  formule: string | null;
  statut: 'actif' | 'pause' | 'termine';
  statut_paiement: string | null;
  stock_images: number | null;
  seuil_alerte_images: number | null;
  archived: boolean | null;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const paiementBadge = (statut: string | null) => {
  switch (statut) {
    case 'paye':
      return <Badge className="text-[11px] font-semibold border-0" style={{ backgroundColor: '#16A34A18', color: '#16A34A' }}>Payé</Badge>;
    case 'partiel':
      return <Badge className="text-[11px] font-semibold border-0" style={{ backgroundColor: '#D9770618', color: '#D97706' }}>Partiel</Badge>;
    case 'en_retard':
      return <Badge className="text-[11px] font-semibold border-0" style={{ backgroundColor: '#DC262618', color: '#DC2626' }}>En retard</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px] text-muted-foreground">En attente</Badge>;
  }
};

const formuleLabel = (f: string | null) => {
  switch (f) {
    case 'premium':
      return <Badge variant="outline" className="text-[11px] font-semibold" style={{ borderColor: '#03045E40', color: '#03045E' }}>Premium</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px] font-semibold" style={{ borderColor: '#0077B640', color: '#0077B6' }}>Essentiel</Badge>;
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function AdminClients() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'actif' | 'archived'>('actif');
  const [filterFormule, setFilterFormule] = useState<'all' | 'essentiel' | 'premium'>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', entreprise: '', email: '', formule: 'essentiel' });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

  const load = async () => {
    let query = supabase
      .from('clients')
      .select('id, nom, photo_url, entreprise, email, formule, statut, statut_paiement, stock_images, seuil_alerte_images, archived, created_at')
      .order('created_at', { ascending: false });

    if (filterStatut === 'actif') query = query.or('archived.is.null,archived.eq.false');
    else if (filterStatut === 'archived') query = query.eq('archived', true);

    const { data } = await query;
    const clientList = (data as Client[]) || [];
    setClients(clientList);

    if (clientList.length > 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const { data: posts } = await supabase.from('posts').select('client_id').gte('date_planifiee', start).lte('date_planifiee', end).eq('statut', 'poste');
      const counts: Record<string, number> = {};
      (posts || []).forEach((p: any) => { counts[p.client_id] = (counts[p.client_id] || 0) + 1; });
      setPostCounts(counts);
    }
  };

  useEffect(() => { load(); }, [filterStatut]);

  const filtered = useMemo(() => {
    let list = clients;
    if (filterFormule !== 'all') list = list.filter((c) => c.formule === filterFormule);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.nom.toLowerCase().includes(s) || (c.entreprise || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s));
    }
    return list;
  }, [clients, filterFormule, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('clients').insert({
      nom: form.nom, entreprise: form.entreprise || null,
      email: form.email || null, formule: form.formule, created_by: user?.id,
    });
    if (error) { toast.error('Erreur lors de la création'); return; }
    toast.success('Client ajouté');
    setForm({ nom: '', entreprise: '', email: '', formule: 'essentiel' });
    setOpen(false);
    load();
  };

  const handleArchive = async (c: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('clients').update({ archived: !c.archived }).eq('id', c.id);
    toast.success(c.archived ? 'Client réactivé' : 'Client archivé');
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const cid = deleteTarget.id;
    // Check unpaid invoices
    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('client_id', cid).neq('statut', 'payee');
    if ((count || 0) > 0) {
      toast.error('Impossible : ce client a des factures impayées');
      setDeleteTarget(null);
      return;
    }
    // Cascade delete
    await supabase.from('posts').delete().eq('client_id', cid);
    await supabase.from('client_images').delete().eq('client_id', cid);
    await supabase.from('shooting_history').delete().eq('client_id', cid);
    await supabase.from('shooting_plans').delete().eq('client_id', cid);
    await supabase.from('invoices').delete().eq('client_id', cid);
    await supabase.from('onboarding_tokens').delete().eq('client_id', cid);
    await supabase.from('clients').delete().eq('id', cid);
    toast.success('Client supprimé définitivement');
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground font-body mt-1 text-[15px]">
            {filtered.length} client{filtered.length !== 1 ? 's' : ''} — gestion complète
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-heading font-semibold gap-2 text-primary-foreground" style={{ backgroundColor: '#03045E' }}>
              <Plus className="h-4 w-4" /> Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-xl">Ajouter un client</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="font-body text-sm font-medium">Nom complet *</Label>
                <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Amadou Diallo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm font-medium">Entreprise</Label>
                  <Input value={form.entreprise} onChange={(e) => setForm({ ...form, entreprise: e.target.value })} placeholder="TechAfrica" />
                </div>
                <div className="space-y-2">
                  <Label className="font-body text-sm font-medium">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="amadou@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm font-medium">Formule</Label>
                <Select value={form.formule} onValueChange={(v) => setForm({ ...form, formule: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essentiel">Essentiel</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full font-heading font-semibold" style={{ backgroundColor: '#03045E' }}>Ajouter le client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 bg-card border-border" />
        </div>
        <div className="flex gap-1.5">
          {(['actif', 'archived', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-body font-medium transition-all ${filterStatut === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted border border-border'}`}
            >
              {s === 'actif' ? 'Actifs' : s === 'archived' ? 'Archivés' : 'Tous'}
            </button>
          ))}
        </div>
        <Select value={filterFormule} onValueChange={(v: any) => setFilterFormule(v)}>
          <SelectTrigger className="w-[140px] h-10 bg-card"><SelectValue placeholder="Formule" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="essentiel">Essentiel</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-heading text-xs uppercase tracking-wider">Nom</TableHead>
              <TableHead className="font-heading text-xs uppercase tracking-wider">Formule</TableHead>
              {isAdmin && <TableHead className="font-heading text-xs uppercase tracking-wider">Paiement</TableHead>}
              <TableHead className="font-heading text-xs uppercase tracking-wider text-center">Posts ce mois</TableHead>
              <TableHead className="font-heading text-xs uppercase tracking-wider text-center">Stock images</TableHead>
              <TableHead className="font-heading text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const stockLow = (c.stock_images || 0) <= (c.seuil_alerte_images || 5);
              return (
                <TableRow key={c.id} className="cursor-pointer group" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                  <TableCell>
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.nom} className="h-9 w-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="h-9 w-9 rounded-full flex items-center justify-center font-heading text-xs font-bold text-primary-foreground" style={{ backgroundColor: '#03045E' }}>
                        {c.nom.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-body font-medium text-foreground text-sm">{c.nom}</span>
                      {c.entreprise && <span className="block text-xs text-muted-foreground">{c.entreprise}</span>}
                      {c.archived && (
                        <Badge className="text-[10px] px-1.5 py-0 border-0 mt-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.45)' }}>
                          Archivé
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formuleLabel(c.formule)}</TableCell>
                  {isAdmin && <TableCell>{paiementBadge(c.statut_paiement)}</TableCell>}
                  <TableCell className="text-center">
                    <span className="font-heading font-bold text-sm text-foreground">{postCounts[c.id] || 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" style={{ color: stockLow ? '#DC2626' : '#4A5578' }} />
                      <span className="font-heading font-bold text-sm" style={{ color: stockLow ? '#DC2626' : undefined }}>{c.stock_images || 0}</span>
                      {stockLow && <Badge className="text-[9px] px-1.5 py-0 border-0 ml-1" style={{ backgroundColor: '#8FC50020', color: '#8FC500' }}>Bas</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="Voir la fiche" onClick={(e) => { e.stopPropagation(); navigate(`/admin/clients/${c.id}`); }}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={c.archived ? 'Réactiver' : 'Archiver'}
                        onClick={(e) => handleArchive(c, e)}
                      >
                        {c.archived
                          ? <RotateCcw className="h-4 w-4" style={{ color: '#8FC500' }} />
                          : <Archive className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer définitivement"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); setDeleteStep(1); }}
                        >
                          <Trash2 className="h-4 w-4" style={{ color: '#DC2626' }} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-16 text-muted-foreground font-body">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-heading font-semibold text-foreground">Aucun client pour l'instant</p>
                    <p className="text-sm">Créez un client ou partagez votre lien d'onboarding</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteStep(1); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {deleteStep === 1 ? 'Supprimer ce client ?' : '⚠️ Confirmation finale'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {deleteStep === 1
                ? `Vous allez supprimer définitivement ${deleteTarget?.nom}. Cette action est irréversible. Toutes les données seront supprimées (posts, images, shootings, factures).`
                : `Êtes-vous absolument certain ? Toutes les données de ${deleteTarget?.nom} seront effacées de façon permanente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
            {deleteStep === 1 ? (
              <AlertDialogAction
                className="font-heading bg-destructive text-destructive-foreground"
                onClick={(e) => { e.preventDefault(); setDeleteStep(2); }}
              >
                Continuer
              </AlertDialogAction>
            ) : (
              <AlertDialogAction className="font-heading bg-destructive text-destructive-foreground" onClick={handleDelete}>
                Supprimer définitivement
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
