import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Eye, Search, Upload, Link2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LinkedInPreview from '@/components/LinkedInPreview';

// ── Status config ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: '#888780', bg: '#F1F0E8' },
  propose: { label: 'Proposé', color: '#378ADD', bg: '#E6F1FB' },
  modifie: { label: 'Modifié', color: '#BA7517', bg: '#FAEEDA' },
  approuve: { label: 'Approuvé', color: '#E8533A', bg: '#FAECE7' },
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  poste: { label: 'Posté', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

const FORMAT_OPTIONS = [
  { value: 'texte', label: 'Texte seul' },
  { value: 'image', label: 'Texte + Image' },
  { value: 'video', label: 'Vidéo courte' },
  { value: 'sondage', label: 'Sondage LinkedIn' },
];

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
  clients?: { nom: string; photo_url: string | null; titre_professionnel: string | null } | null;
};

type Client = { id: string; nom: string; photo_url: string | null; titre_professionnel: string | null };

export default function AdminPosts() {
  const { user, role } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [open, setOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ postId: string; newStatus: string; label: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    client_id: '',
    contenu: '',
    date_planifiee: '',
    heure: '',
    format: 'texte',
    sondage_question: '',
    sondage_options: ['', '', '', ''],
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('posts').select('*, clients(nom, photo_url, titre_professionnel)').order('date_planifiee', { ascending: false }),
      supabase.from('clients').select('id, nom, photo_url, titre_professionnel').eq('statut', 'actif'),
    ]);
    setPosts((p as Post[]) || []);
    setClients((c as Client[]) || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (filterStatus !== 'all' && p.statut !== filterStatus) return false;
      if (filterClient !== 'all' && p.client_id !== filterClient) return false;
      if (search) {
        const s = search.toLowerCase();
        const clientName = (p.clients as any)?.nom?.toLowerCase() || '';
        if (!clientName.includes(s) && !p.contenu.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [posts, filterStatus, filterClient, search]);

  // ── Upload media ──
  const uploadMedia = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('post-media').upload(path, file);
    if (error) { toast.error("Erreur d'upload"); return null; }
    const { data } = supabase.storage.from('post-media').getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Create post ──
  const handleCreate = async (asPropose: boolean) => {
    if (!form.client_id || !form.date_planifiee) {
      toast.error('Client et date requis');
      return;
    }
    setUploading(true);
    let mediaUrl: string | null = null;
    if (mediaFile) {
      mediaUrl = await uploadMedia(mediaFile);
      if (!mediaUrl) { setUploading(false); return; }
    }

    const heure_publication = form.heure
      ? new Date(`${form.date_planifiee}T${form.heure}`).toISOString()
      : null;

    const insertData: any = {
      client_id: form.client_id,
      contenu: form.contenu,
      date_planifiee: form.date_planifiee,
      statut: (asPropose ? 'propose' : 'brouillon') as 'propose' | 'brouillon',
      format: form.format,
      media_url: mediaUrl,
      heure_publication,
      created_by: user?.id,
    };
    if (form.format === 'sondage') {
      insertData.sondage_question = form.sondage_question;
      insertData.sondage_options = form.sondage_options.filter(Boolean);
    }

    const { error } = await supabase.from('posts').insert(insertData);
    if (error) { toast.error('Erreur de création'); setUploading(false); return; }

    // Notify client if proposed
    if (asPropose) {
      const client = clients.find(c => c.id === form.client_id);
      // Find client's user_id for notification
      const { data: clientData } = await supabase.from('clients').select('user_id').eq('id', form.client_id).single();
      if (clientData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: clientData.user_id,
          title: 'Nouveau post proposé',
          message: `Un nouveau post a été proposé pour ${client?.nom || 'vous'}. Consultez-le dans votre espace.`,
        });
      }
    }

    toast.success(asPropose ? 'Post proposé au client' : 'Brouillon sauvegardé');
    setOpen(false);
    resetForm();
    load();
    setUploading(false);
  };

  const resetForm = () => {
    setForm({ client_id: '', contenu: '', date_planifiee: '', heure: '', format: 'texte', sondage_question: '', sondage_options: ['', '', '', ''] });
    setMediaFile(null);
  };

  // ── Status transitions ──
  const changeStatus = async (postId: string, newStatus: string) => {
    const { error } = await supabase.from('posts').update({ statut: newStatus as any }).eq('id', postId);
    if (error) { toast.error('Erreur'); return; }

    // Notifications
    const post = posts.find(p => p.id === postId);
    if (post) {
      if (newStatus === 'propose') {
        const { data: clientData } = await supabase.from('clients').select('user_id').eq('id', post.client_id).single();
        if (clientData?.user_id) {
          await supabase.from('notifications').insert({
            user_id: clientData.user_id,
            title: 'Post proposé',
            message: `Un post a été proposé pour votre validation.`,
          });
        }
      }
    }

    toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label}`);
    setConfirmAction(null);
    load();
  };

  const getAvailableTransitions = (statut: string): { status: string; label: string }[] => {
    const isAdmin = role === 'admin';
    switch (statut) {
      case 'brouillon': return [{ status: 'propose', label: 'Proposer au client' }];
      case 'propose': return [];
      case 'modifie': return [{ status: 'propose', label: 'Re-proposer' }];
      case 'approuve': return isAdmin ? [{ status: 'valide', label: 'Valider définitivement' }] : [];
      case 'valide': return [];
      case 'poste': return [];
      default: return [];
    }
  };

  // ── Time-based status label ──
  const getDisplayStatus = (post: Post) => {
    if (post.statut === 'valide' && post.heure_publication) {
      const pubTime = new Date(post.heure_publication).getTime();
      const now = Date.now();
      const diff = pubTime - now;
      if (diff > 0 && diff <= 30 * 60 * 1000) {
        return { label: 'En ligne bientôt', color: '#1D9E75', bg: '#EAF3DE' };
      }
    }
    return STATUS_CONFIG[post.statut] || STATUS_CONFIG.brouillon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Posts</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">Gestion des publications LinkedIn</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: '#03045E' }} className="text-white font-heading font-semibold gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nouveau post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-xl">Créer un post</DialogTitle></DialogHeader>
            <div className="space-y-5 mt-4">
              {/* Client */}
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Client *</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Format</Label>
                <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label className="font-heading font-semibold">Contenu</Label>
                <Textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} rows={6} placeholder="Rédigez le contenu du post..." />
              </div>

              {/* Media upload */}
              {(form.format === 'image' || form.format === 'video') && (
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">
                    {form.format === 'image' ? 'Image' : 'Vidéo'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-body text-muted-foreground">
                        {mediaFile ? mediaFile.name : 'Choisir un fichier'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept={form.format === 'image' ? 'image/*' : 'video/*'}
                        onChange={e => setMediaFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Poll fields */}
              {form.format === 'sondage' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Question du sondage</Label>
                    <Input value={form.sondage_question} onChange={e => setForm({ ...form, sondage_question: e.target.value })} placeholder="Posez votre question..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Options (2 à 4)</Label>
                    {form.sondage_options.map((opt, i) => (
                      <Input
                        key={i}
                        value={opt}
                        onChange={e => {
                          const opts = [...form.sondage_options];
                          opts[i] = e.target.value;
                          setForm({ ...form, sondage_options: opts });
                        }}
                        placeholder={`Option ${i + 1}${i < 2 ? ' *' : ' (optionnel)'}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Date & time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Date de publication *</Label>
                  <Input type="date" value={form.date_planifiee} onChange={e => setForm({ ...form, date_planifiee: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Heure programmée</Label>
                  <Input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleCreate(false)}
                  disabled={uploading}
                  variant="outline"
                  className="flex-1 font-heading font-semibold"
                >
                  Sauvegarder en brouillon
                </Button>
                <Button
                  onClick={() => handleCreate(true)}
                  disabled={uploading}
                  className="flex-1 font-heading font-semibold text-white"
                  style={{ backgroundColor: '#0077B6' }}
                >
                  Proposer au client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher par client ou contenu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-body" style={{ backgroundColor: v.bg, color: v.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: v.color }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Posts table */}
      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-heading">Client</TableHead>
              <TableHead className="font-heading">Format</TableHead>
              <TableHead className="font-heading">Contenu</TableHead>
              <TableHead className="font-heading">Date</TableHead>
              <TableHead className="font-heading">Statut</TableHead>
              <TableHead className="font-heading text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground font-body">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-heading font-semibold text-foreground">Aucun post créé</p>
                    <p className="text-sm">Créez votre premier post en cliquant sur le bouton ci-dessus</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map(post => {
              const status = getDisplayStatus(post);
              const transitions = getAvailableTransitions(post.statut);
              const formatLabel = FORMAT_OPTIONS.find(f => f.value === post.format)?.label || post.format;
              return (
                <TableRow key={post.id}>
                  <TableCell className="font-body font-medium">
                    {(post.clients as any)?.nom || '—'}
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{formatLabel}</TableCell>
                  <TableCell className="font-body text-sm max-w-[300px] truncate">{post.contenu || '—'}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(post.date_planifiee), 'd MMM yyyy', { locale: fr })}
                    {post.heure_publication && (
                      <span className="block text-xs">{format(new Date(post.heure_publication), 'HH:mm')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="font-body text-xs border-0" style={{ backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewPost(post)}
                        title="Aperçu LinkedIn"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(post.statut === 'propose' || post.statut === 'brouillon') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Lien de validation"
                          onClick={async () => {
                            // Invalidate previous tokens
                            await (supabase as any).from('post_validation_tokens').update({ used: true }).eq('post_id', post.id).eq('used', false);
                            // Create new token
                            const { data: tokenData, error } = await (supabase as any)
                              .from('post_validation_tokens')
                              .insert({ post_id: post.id, created_by: user?.id })
                              .select('token')
                              .single();
                            if (error || !tokenData) { toast.error('Erreur'); return; }
                            const link = `${window.location.origin}/valider/${tokenData.token}`;
                            await navigator.clipboard.writeText(link);
                            toast.success('Lien copié dans le presse-papier !');
                          }}
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      )}
                      {transitions.map(t => (
                        <Button
                          key={t.status}
                          size="sm"
                          variant="outline"
                          className="text-xs font-heading"
                          onClick={() => setConfirmAction({ postId: post.id, newStatus: t.status, label: t.label })}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* LinkedIn Preview */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#F3F2EF' }}>
          <LinkedInPreview
            nom={(previewPost.clients as any)?.nom || 'Utilisateur'}
            titre={(previewPost.clients as any)?.titre_professionnel || ''}
            photoUrl={(previewPost.clients as any)?.photo_url}
            contenu={previewPost.contenu}
            mediaUrl={previewPost.media_url}
            format={previewPost.format}
            sondageQuestion={previewPost.sondage_question}
            sondageOptions={previewPost.sondage_options}
            onClose={() => setPreviewPost(null)}
          />
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Confirmer l'action</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Voulez-vous vraiment {confirmAction?.label?.toLowerCase()} ce post ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-heading">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="font-heading"
              style={{ backgroundColor: '#03045E' }}
              onClick={() => confirmAction && changeStatus(confirmAction.postId, confirmAction.newStatus)}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
