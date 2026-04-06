import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Camera, Image, AlertTriangle, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const OPTION_TYPES = [
  { value: 'solo', label: 'Solo', desc: '1 session · 1 tenue · 20-30 photos' },
  { value: 'etendu', label: 'Étendu', desc: '1 session · 2-3 tenues · 50+ photos' },
  { value: 'annuel', label: 'Annuel', desc: '4 sessions · tarif préférentiel' },
  { value: 'premium_inclus', label: 'Premium (inclus)', desc: '1 shooting trimestriel inclus' },
];

const PLAN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  planifie: { label: 'Planifié', color: '#378ADD', bg: '#E6F1FB' },
  soumis: { label: 'Soumis au client', color: '#BA7517', bg: '#FAEEDA' },
  valide: { label: 'Validé', color: '#1D9E75', bg: '#EAF3DE' },
  realise: { label: 'Réalisé', color: '#03045E', bg: 'rgba(3,4,94,0.07)' },
};

type Client = {
  id: string; nom: string; formule: string | null;
  stock_images: number | null; seuil_alerte_images: number | null;
  photo_url: string | null;
};

type ShootingPlan = {
  id: string; client_id: string; date_proposee: string; lieu: string;
  budget_estime_xof: number; tenues_suggerees: string | null;
  option_type: string; statut: string; commentaire_client: string | null;
  created_at: string;
  clients?: { nom: string } | null;
};

type ClientImage = {
  id: string; client_id: string; image_url: string;
  used_in_post_id: string | null; shooting_history_id: string | null;
  created_at: string;
};

type ShootingHistory = {
  id: string; client_id: string; date_shooting: string;
  lieu: string; nombre_photos: number; notes: string | null;
};

export default function AdminShootings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('plans');
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<ShootingPlan[]>([]);
  const [images, setImages] = useState<ClientImage[]>([]);
  const [history, setHistory] = useState<ShootingHistory[]>([]);
  const [filterClient, setFilterClient] = useState('all');
  const [search, setSearch] = useState('');

  // Dialogs
  const [openPlan, setOpenPlan] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Form states
  const [planForm, setPlanForm] = useState({
    client_id: '', date_proposee: '', lieu: '', budget_estime_xof: 0,
    tenues_suggerees: '', option_type: 'solo',
  });
  const [moodboardFiles, setMoodboardFiles] = useState<File[]>([]);
  const [uploadClientId, setUploadClientId] = useState('');
  const [uploadShootingId, setUploadShootingId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    client_id: '', date_shooting: '', lieu: '', nombre_photos: 0, notes: '',
  });

  const load = async () => {
    const [{ data: c }, { data: p }, { data: img }, { data: h }] = await Promise.all([
      supabase.from('clients').select('id, nom, formule, stock_images, seuil_alerte_images, photo_url').eq('statut', 'actif'),
      supabase.from('shooting_plans').select('*, clients(nom)').order('date_proposee', { ascending: false }),
      supabase.from('client_images').select('*').order('created_at', { ascending: false }),
      supabase.from('shooting_history').select('*').order('date_shooting', { ascending: false }),
    ]);
    setClients((c as Client[]) || []);
    setPlans((p as ShootingPlan[]) || []);
    setImages((img as ClientImage[]) || []);
    setHistory((h as ShootingHistory[]) || []);
  };

  useEffect(() => { load(); }, []);

  // Alerts
  const stockAlerts = useMemo(() => {
    return clients.filter(c => {
      const stock = c.stock_images ?? 0;
      const seuil = c.seuil_alerte_images ?? 5;
      return stock <= seuil;
    });
  }, [clients]);

  // Upload helper
  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) return null;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  // ── Create shooting plan ──
  const handleCreatePlan = async () => {
    if (!planForm.client_id || !planForm.date_proposee) {
      toast.error('Client et date requis');
      return;
    }
    setUploading(true);

    const { data: plan, error } = await supabase.from('shooting_plans').insert({
      client_id: planForm.client_id,
      date_proposee: planForm.date_proposee,
      lieu: planForm.lieu,
      budget_estime_xof: planForm.budget_estime_xof,
      tenues_suggerees: planForm.tenues_suggerees,
      option_type: planForm.option_type,
      created_by: user?.id,
    } as any).select().single();

    if (error || !plan) { toast.error('Erreur de création'); setUploading(false); return; }

    // Upload moodboard images
    for (const file of moodboardFiles) {
      const url = await uploadFile(file, 'shooting-images');
      if (url) {
        await supabase.from('moodboard_images').insert({ shooting_plan_id: (plan as any).id, image_url: url } as any);
      }
    }

    toast.success('Shooting planifié');
    setOpenPlan(false);
    setPlanForm({ client_id: '', date_proposee: '', lieu: '', budget_estime_xof: 0, tenues_suggerees: '', option_type: 'solo' });
    setMoodboardFiles([]);
    setUploading(false);
    load();
  };

  // ── Submit plan to client ──
  const submitToClient = async (plan: ShootingPlan) => {
    await supabase.from('shooting_plans').update({ statut: 'soumis' } as any).eq('id', plan.id);
    const { data: clientData } = await supabase.from('clients').select('user_id').eq('id', plan.client_id).single();
    if (clientData?.user_id) {
      await supabase.from('notifications').insert({
        user_id: clientData.user_id,
        title: 'Shooting proposé',
        message: `Un shooting photo est proposé le ${format(new Date(plan.date_proposee), 'd MMMM yyyy', { locale: fr })} à ${plan.lieu || 'lieu à confirmer'}.`,
      });
    }
    toast.success('Soumis au client');
    load();
  };

  // ── Mark plan as done ──
  const markRealized = async (plan: ShootingPlan) => {
    await supabase.from('shooting_plans').update({ statut: 'realise' } as any).eq('id', plan.id);
    toast.success('Shooting marqué comme réalisé');
    load();
  };

  // ── Upload photos to image bank ──
  const handleUploadPhotos = async () => {
    if (!uploadClientId || uploadFiles.length === 0) {
      toast.error('Sélectionnez un client et des images');
      return;
    }
    setUploading(true);
    let count = 0;
    for (const file of uploadFiles) {
      const url = await uploadFile(file, 'shooting-images');
      if (url) {
        await supabase.from('client_images').insert({
          client_id: uploadClientId,
          image_url: url,
          shooting_history_id: (uploadShootingId && uploadShootingId !== 'none') ? uploadShootingId : null,
          created_by: user?.id,
        } as any);
        count++;
      }
    }
    // Update stock counter
    const client = clients.find(c => c.id === uploadClientId);
    const newStock = (client?.stock_images ?? 0) + count;
    await supabase.from('clients').update({ stock_images: newStock }).eq('id', uploadClientId);

    toast.success(`${count} photo(s) ajoutée(s) à la banque`);
    setOpenUpload(false);
    setUploadFiles([]);
    setUploadClientId('');
    setUploadShootingId('');
    setUploading(false);
    load();
  };

  // ── Add shooting history ──
  const handleAddHistory = async () => {
    if (!historyForm.client_id || !historyForm.date_shooting) {
      toast.error('Client et date requis');
      return;
    }
    const { error } = await supabase.from('shooting_history').insert({
      client_id: historyForm.client_id,
      date_shooting: historyForm.date_shooting,
      lieu: historyForm.lieu,
      nombre_photos: historyForm.nombre_photos,
      notes: historyForm.notes,
      created_by: user?.id,
    });
    if (error) { toast.error('Erreur'); return; }
    toast.success('Shooting enregistré');
    setOpenHistory(false);
    setHistoryForm({ client_id: '', date_shooting: '', lieu: '', nombre_photos: 0, notes: '' });
    load();
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (filterClient !== 'all' && p.client_id !== filterClient) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = (p.clients as any)?.nom?.toLowerCase() || '';
        if (!name.includes(s) && !p.lieu.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [plans, filterClient, search]);

  const filteredImages = useMemo(() => {
    return images.filter(img => filterClient === 'all' || img.client_id === filterClient);
  }, [images, filterClient]);

  const clientHistory = useMemo(() => {
    return history.filter(h => filterClient === 'all' || h.client_id === filterClient);
  }, [history, filterClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Shootings</h1>
          <p className="text-muted-foreground font-body mt-1 text-sm">Planification, banque d'images & historique</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={openHistory} onOpenChange={setOpenHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-heading font-semibold gap-2">
                <Camera className="h-4 w-4" /> Enregistrer un shooting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Enregistrer un shooting réalisé</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Client *</Label>
                  <Select value={historyForm.client_id} onValueChange={v => setHistoryForm({ ...historyForm, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Date *</Label>
                    <Input type="date" value={historyForm.date_shooting} onChange={e => setHistoryForm({ ...historyForm, date_shooting: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Nombre de photos</Label>
                    <Input type="number" value={historyForm.nombre_photos} onChange={e => setHistoryForm({ ...historyForm, nombre_photos: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Lieu</Label>
                  <Input value={historyForm.lieu} onChange={e => setHistoryForm({ ...historyForm, lieu: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Notes</Label>
                  <Textarea value={historyForm.notes} onChange={e => setHistoryForm({ ...historyForm, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="font-heading text-white" style={{ backgroundColor: '#03045E' }} onClick={handleAddHistory}>Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogTrigger asChild>
              <Button variant="outline" className="font-heading font-semibold gap-2">
                <Upload className="h-4 w-4" /> Uploader des photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Ajouter des photos à la banque</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Client *</Label>
                  <Select value={uploadClientId} onValueChange={setUploadClientId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Shooting associé (optionnel)</Label>
                  <Select value={uploadShootingId} onValueChange={setUploadShootingId}>
                    <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {history.filter(h => h.client_id === uploadClientId).map(h => (
                        <SelectItem key={h.id} value={h.id}>{format(new Date(h.date_shooting), 'd MMM yyyy', { locale: fr })} — {h.lieu}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Photos (multi-sélection)</Label>
                  <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-body text-muted-foreground">
                      {uploadFiles.length > 0 ? `${uploadFiles.length} fichier(s) sélectionné(s)` : 'Cliquez ou glissez les photos ici'}
                    </span>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={e => setUploadFiles(Array.from(e.target.files || []))} />
                  </label>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="font-heading text-white" style={{ backgroundColor: '#8FC500' }} onClick={handleUploadPhotos} disabled={uploading}>
                  {uploading ? 'Upload en cours...' : 'Uploader'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openPlan} onOpenChange={v => { setOpenPlan(v); if (!v) setMoodboardFiles([]); }}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#03045E' }} className="text-white font-heading font-semibold gap-2">
                <Plus className="h-4 w-4" /> Planifier un shooting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading text-xl">Planifier un shooting</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-3">
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Client *</Label>
                  <Select value={planForm.client_id} onValueChange={v => setPlanForm({ ...planForm, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Option</Label>
                  <Select value={planForm.option_type} onValueChange={v => setPlanForm({ ...planForm, option_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPTION_TYPES.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="font-semibold">{o.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{o.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Date proposée *</Label>
                    <Input type="date" value={planForm.date_proposee} onChange={e => setPlanForm({ ...planForm, date_proposee: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-heading font-semibold">Budget estimé (XOF)</Label>
                    <Input type="number" value={planForm.budget_estime_xof} onChange={e => setPlanForm({ ...planForm, budget_estime_xof: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Lieu</Label>
                  <Input value={planForm.lieu} onChange={e => setPlanForm({ ...planForm, lieu: e.target.value })} placeholder="Studio, extérieur..." />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Tenue(s) suggérée(s)</Label>
                  <Textarea value={planForm.tenues_suggerees} onChange={e => setPlanForm({ ...planForm, tenues_suggerees: e.target.value })} rows={2} placeholder="Costume sombre, chemise blanche..." />
                </div>
                <div className="space-y-2">
                  <Label className="font-heading font-semibold">Moodboard d'inspiration</Label>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition">
                    <Image className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-body text-muted-foreground">
                      {moodboardFiles.length > 0 ? `${moodboardFiles.length} image(s)` : 'Ajouter des images d\'inspiration'}
                    </span>
                    <input type="file" className="hidden" multiple accept="image/*" onChange={e => setMoodboardFiles(Array.from(e.target.files || []))} />
                  </label>
                  {moodboardFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {moodboardFiles.map((f, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 object-cover rounded-lg" />
                          <button
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                            onClick={() => setMoodboardFiles(prev => prev.filter((_, j) => j !== i))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="font-heading text-white" style={{ backgroundColor: '#03045E' }} onClick={handleCreatePlan} disabled={uploading}>
                  {uploading ? 'Création...' : 'Planifier'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stock alerts */}
      {stockAlerts.length > 0 && (
        <div className="glass-card p-3 flex flex-wrap gap-2">
          {stockAlerts.map(c => (
            <Badge key={c.id} className="font-body text-xs gap-1.5 border-0" style={{ backgroundColor: '#FAEEDA', color: '#BA7517' }}>
              <AlertTriangle className="h-3 w-3" />
              {c.nom} : {c.stock_images ?? 0} images restantes (seuil : {c.seuil_alerte_images ?? 5})
            </Badge>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tous les clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="font-heading w-full sm:w-auto flex-wrap">
          <TabsTrigger value="plans">Shootings planifiés</TabsTrigger>
          <TabsTrigger value="banque">Banque d'images</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="stock">Stock par client</TabsTrigger>
        </TabsList>

        {/* ── Plans ── */}
        <TabsContent value="plans">
          <div className="glass-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading">Client</TableHead>
                  <TableHead className="font-heading">Date</TableHead>
                  <TableHead className="font-heading">Lieu</TableHead>
                  <TableHead className="font-heading">Option</TableHead>
                  <TableHead className="font-heading">Budget</TableHead>
                  <TableHead className="font-heading">Statut</TableHead>
                  <TableHead className="font-heading text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-body">Aucun shooting planifié</TableCell></TableRow>
                )}
                {filteredPlans.map(plan => {
                  const cfg = PLAN_STATUS[plan.statut] || PLAN_STATUS.planifie;
                  const optLabel = OPTION_TYPES.find(o => o.value === plan.option_type)?.label || plan.option_type;
                  return (
                    <TableRow key={plan.id}>
                      <TableCell className="font-body font-medium">{(plan.clients as any)?.nom || '—'}</TableCell>
                      <TableCell className="font-body text-sm">{format(new Date(plan.date_proposee), 'd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{plan.lieu || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="font-body text-xs">{optLabel}</Badge></TableCell>
                      <TableCell className="font-body text-sm">{plan.budget_estime_xof > 0 ? `${plan.budget_estime_xof.toLocaleString()} XOF` : '—'}</TableCell>
                      <TableCell>
                        <Badge className="font-body text-xs border-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {plan.statut === 'planifie' && (
                            <Button size="sm" variant="outline" className="text-xs font-heading" onClick={() => submitToClient(plan)}>
                              Soumettre au client
                            </Button>
                          )}
                          {plan.statut === 'valide' && (
                            <Button size="sm" variant="outline" className="text-xs font-heading" onClick={() => markRealized(plan)}>
                              Marquer réalisé
                            </Button>
                          )}
                          {plan.commentaire_client && (
                            <Badge variant="outline" className="text-xs font-body">💬 Commentaire</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Image bank ── */}
        <TabsContent value="banque">
          <div className="glass-card p-6">
            {filteredImages.length === 0 ? (
              <p className="text-center text-muted-foreground font-body py-12">Aucune image dans la banque</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredImages.map(img => {
                  const client = clients.find(c => c.id === img.client_id);
                  return (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border/50">
                      <img src={img.image_url} alt="" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">
                        <div className="p-2 opacity-0 group-hover:opacity-100 transition w-full">
                          <p className="text-white text-[10px] font-body truncate">{client?.nom}</p>
                          {img.used_in_post_id && (
                            <Badge className="text-[9px] px-1.5 py-0 border-0 mt-0.5" style={{ backgroundColor: '#EAF3DE', color: '#1D9E75' }}>
                              Utilisée
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="historique">
          <div className="glass-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading">Client</TableHead>
                  <TableHead className="font-heading">Date</TableHead>
                  <TableHead className="font-heading">Lieu</TableHead>
                  <TableHead className="font-heading">Photos</TableHead>
                  <TableHead className="font-heading">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientHistory.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-body">Aucun shooting enregistré</TableCell></TableRow>
                )}
                {clientHistory.map(h => {
                  const client = clients.find(c => c.id === h.client_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="font-body font-medium">{client?.nom || '—'}</TableCell>
                      <TableCell className="font-body text-sm">{format(new Date(h.date_shooting), 'd MMM yyyy', { locale: fr })}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{h.lieu || '—'}</TableCell>
                      <TableCell className="font-body text-sm font-semibold">{h.nombre_photos}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground max-w-[200px] truncate">{h.notes || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Stock per client ── */}
        <TabsContent value="stock">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(c => {
              const stock = c.stock_images ?? 0;
              const seuil = c.seuil_alerte_images ?? 5;
              const isLow = stock <= seuil;
              const clientImgs = images.filter(img => img.client_id === c.id);
              const usedCount = clientImgs.filter(img => img.used_in_post_id).length;
              return (
                <Card key={c.id} className="glass-card border" style={isLow ? { borderColor: '#D97706' } : {}}>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-base flex items-center justify-between">
                      {c.nom}
                      {isLow && <AlertTriangle className="h-4 w-4" style={{ color: '#D97706' }} />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-bold" style={{ color: isLow ? '#D97706' : '#03045E' }}>{stock}</span>
                      <span className="text-sm text-muted-foreground font-body">images restantes</span>
                    </div>
                    <div className="flex gap-4 text-xs font-body text-muted-foreground">
                      <span>Total : {clientImgs.length}</span>
                      <span>Utilisées : {usedCount}</span>
                      <span>Seuil : {seuil}</span>
                    </div>
                    <Badge className="font-body text-xs border-0" style={{ backgroundColor: c.formule === 'premium' ? '#EAF3DE' : '#E6F1FB', color: c.formule === 'premium' ? '#1D9E75' : '#378ADD' }}>
                      {c.formule === 'premium' ? 'Premium (shooting inclus)' : 'Essentiel'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
