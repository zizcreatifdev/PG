import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Eye, Download, UserPlus, X, Plus, Trash2, Edit2, GripVertical } from 'lucide-react';

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: '#FEF3C7', text: '#D97706', label: 'En attente de signature' },
  signed: { bg: '#D1FAE5', text: '#16A34A', label: 'Contrat signé' },
  converti: { bg: '#E0E7FF', text: '#03045E', label: 'Client créé' },
  rejete: { bg: '#FEE2E2', text: '#DC2626', label: 'Rejeté' },
};

export default function AdminContrats() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formules, setFormules] = useState<any[]>([]);
  const [viewSub, setViewSub] = useState<any>(null);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [editFormule, setEditFormule] = useState<any>(null);
  const [newFeature, setNewFeature] = useState('');
  const [confirmReject, setConfirmReject] = useState<any>(null);
  const [confirmDeleteFormule, setConfirmDeleteFormule] = useState<any>(null);

  const load = async () => {
    const [s, t, f] = await Promise.all([
      supabase.from('prospect_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('contract_templates').select('*'),
      supabase.from('formules').select('*').order('created_at'),
    ]);
    if (s.data) setSubmissions(s.data);
    if (t.data) setTemplates(t.data);
    if (f.data) setFormules(f.data);
  };

  useEffect(() => { load(); }, []);

  const convertToClient = async (sub: any) => {
    try {
      const { data, error } = await supabase.from('clients').insert({
        nom: `${sub.prenom} ${sub.nom}`,
        email: sub.email,
        titre_professionnel: sub.profession,
        linkedin_url: sub.linkedin_url,
        whatsapp: sub.whatsapp,
        formule: sub.formule_name?.toLowerCase() || 'essentiel',
        statut: 'actif' as any,
      }).select('id').single();
      if (error) throw error;
      await supabase.from('prospect_submissions').update({ status: 'converti' as any, client_id: data.id }).eq('id', sub.id);
      toast.success('Fiche client créée');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const doReject = async (sub: any) => {
    await supabase.from('prospect_submissions').update({ status: 'rejete' as any }).eq('id', sub.id);
    toast.success('Demande rejetée');
    setConfirmReject(null);
    load();
  };

  const saveTemplate = async () => {
    if (!editTemplate) return;
    const { error } = await supabase.from('contract_templates').update({ contenu: editTemplate.contenu }).eq('id', editTemplate.id);
    if (error) toast.error(error.message);
    else { toast.success('Template mis à jour'); setEditTemplate(null); load(); }
  };

  const saveFormule = async () => {
    if (!editFormule) return;
    const { id, ...rest } = editFormule;
    const payload = {
      nom: rest.nom,
      prix_xof: rest.prix_xof,
      badge: rest.badge || null,
      description: rest.description,
      features: rest.features || [],
      actif: rest.actif ?? true,
      afficher_landing: rest.afficher_landing ?? true,
      contract_type: rest.contract_type || 'SOLO',
      contract_template: rest.contract_template || null,
    };
    if (id) {
      const { error } = await supabase.from('formules').update(payload).eq('id', id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from('formules').insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Formule enregistrée');
    setEditFormule(null);
    load();
  };

  const doDeleteFormule = async (f: any) => {
    const linked = submissions.some(s => s.formule_id === f.id);
    if (linked) { toast.error('Des soumissions sont liées à cette formule'); setConfirmDeleteFormule(null); return; }
    await supabase.from('formules').delete().eq('id', f.id);
    toast.success('Formule supprimée');
    setConfirmDeleteFormule(null);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Contrats</h1>

      <Tabs defaultValue="demandes">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="demandes" className="font-display">Demandes reçues</TabsTrigger>
          <TabsTrigger value="templates" className="font-display">Templates de contrats</TabsTrigger>
          <TabsTrigger value="formules" className="font-display">Gestion des formules</TabsTrigger>
        </TabsList>

        {/* TAB 1 — Submissions */}
        <TabsContent value="demandes">
          <div className="glass-card p-4 sm:p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Nom</TableHead><TableHead>Formule</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(s => {
                  const st = statusColors[s.status] || statusColors.en_attente;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-display font-semibold">{s.prenom} {s.nom}</TableCell>
                      <TableCell>{s.formule_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</TableCell>
                      <TableCell><span className="px-2.5 py-1 rounded-full text-xs font-display font-semibold" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => setViewSub(s)}><Eye className="h-4 w-4" /></Button>
                          {s.status === 'signed' && (
                            <Button variant="ghost" size="sm" onClick={() => convertToClient(s)}><UserPlus className="h-4 w-4" /></Button>
                          )}
                          {(s.status === 'en_attente' || s.status === 'signed') && (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmReject(s)} className="text-destructive"><X className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {submissions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-16">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="h-10 w-10 text-muted-foreground/30" />
                      <p className="font-display font-semibold">Aucune demande reçue</p>
                      <p className="text-sm">Partagez votre landing page pour recevoir des inscriptions</p>
                    </div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2 — Templates */}
        <TabsContent value="templates">
          <div className="grid sm:grid-cols-2 gap-6">
            {templates.map(t => (
              <div key={t.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-lg font-bold text-foreground">{t.nom}</h3>
                  <Badge variant="secondary" className="font-display">{t.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{t.contenu.slice(0, 150)}…</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditTemplate({ ...t })}><Edit2 className="h-4 w-4 mr-1" /> Modifier</Button>
                  <Button variant="outline" size="sm" onClick={() => setViewSub({ __preview: true, contenu: t.contenu })}><Eye className="h-4 w-4 mr-1" /> Prévisualiser</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3 — Formules */}
        <TabsContent value="formules">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">Mes formules</h2>
            <Button onClick={() => setEditFormule({ nom: '', prix_xof: 0, badge: '', description: '', features: [], actif: true, afficher_landing: true, contract_type: 'SOLO', contract_template: '' })} style={{ backgroundColor: '#03045E' }} className="text-white font-display">
              <Plus className="h-4 w-4 mr-1" /> Créer une formule
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {formules.map(f => (
              <div key={f.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-bold text-foreground">{f.nom}</h3>
                  {f.badge && <span className="px-2.5 py-1 rounded-full text-xs font-display font-bold text-white" style={{ backgroundColor: '#8FC500' }}>{f.badge}</span>}
                </div>
                <p className="font-display text-2xl font-bold mb-1" style={{ color: '#03045E' }}>{formatXOF(f.prix_xof)} <span className="text-sm font-normal text-muted-foreground">XOF/mois</span></p>
                <p className="text-sm text-muted-foreground mb-3">{f.features?.length || 0} features · {f.actif ? 'Actif' : 'Inactif'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditFormule({ ...f })}><Edit2 className="h-4 w-4 mr-1" /> Modifier</Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDeleteFormule(f)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* View submission / contract preview modal */}
      <Dialog open={!!viewSub} onOpenChange={() => setViewSub(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{viewSub?.__preview ? 'Prévisualisation du contrat' : 'Détails de la demande'}</DialogTitle></DialogHeader>
          {viewSub?.__preview ? (
            <div className="whitespace-pre-wrap text-[13px] leading-[1.8]">{viewSub.contenu}</div>
          ) : viewSub && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nom :</span> <span className="font-medium">{viewSub.prenom} {viewSub.nom}</span></div>
                <div><span className="text-muted-foreground">Email :</span> <span className="font-medium">{viewSub.email}</span></div>
                <div><span className="text-muted-foreground">Profession :</span> <span className="font-medium">{viewSub.profession}</span></div>
                <div><span className="text-muted-foreground">WhatsApp :</span> <span className="font-medium">{viewSub.whatsapp}</span></div>
                <div><span className="text-muted-foreground">Formule :</span> <span className="font-medium">{viewSub.formule_name}</span></div>
                <div><span className="text-muted-foreground">LinkedIn :</span> <span className="font-medium">{viewSub.linkedin_url || '—'}</span></div>
              </div>
              {viewSub.message && <div className="text-sm"><span className="text-muted-foreground">Message :</span><p className="mt-1">{viewSub.message}</p></div>}
              {viewSub.signature_image && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Signature :</p>
                  <img src={viewSub.signature_image} alt="Signature" className="border rounded-lg max-w-[300px]" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit template modal */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Modifier le template — {editTemplate?.nom}</DialogTitle></DialogHeader>
          {editTemplate && (
            <div className="space-y-4">
              <Textarea value={editTemplate.contenu} onChange={e => setEditTemplate({ ...editTemplate, contenu: e.target.value })} rows={20} className="text-[13px] leading-[1.8] font-mono" />
              <p className="text-xs text-muted-foreground">Variables : {'{CLIENT_NOM}'} · {'{CLIENT_PROFESSION}'} · {'{CLIENT_EMAIL}'} · {'{FORMULE_NOM}'} · {'{FORMULE_MONTANT}'} · {'{DATE_SIGNATURE}'} · {'{DATE_DEBUT}'}</p>
              <Button onClick={saveTemplate} style={{ backgroundColor: '#8FC500', color: '#03045E' }} className="font-display font-bold">Enregistrer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit / Create formule modal */}
      <Dialog open={!!editFormule} onOpenChange={() => setEditFormule(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editFormule?.id ? 'Modifier la formule' : 'Créer une formule'}</DialogTitle></DialogHeader>
          {editFormule && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="font-display text-[13px]">Nom *</Label><Input value={editFormule.nom} onChange={e => setEditFormule({ ...editFormule, nom: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="font-display text-[13px]">Prix mensuel XOF *</Label><Input type="number" value={editFormule.prix_xof} onChange={e => setEditFormule({ ...editFormule, prix_xof: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="font-display text-[13px]">Badge / étiquette</Label><Input placeholder="Populaire, Nouveau…" value={editFormule.badge || ''} onChange={e => setEditFormule({ ...editFormule, badge: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label className="font-display text-[13px]">Type de contrat *</Label>
                  <Select value={editFormule.contract_type} onValueChange={v => setEditFormule({ ...editFormule, contract_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOLO">Template Solo</SelectItem>
                      <SelectItem value="ENTREPRISE">Template Entreprise</SelectItem>
                      <SelectItem value="CUSTOM">Template spécifique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label className="font-display text-[13px]">Description courte *</Label><Input value={editFormule.description} onChange={e => setEditFormule({ ...editFormule, description: e.target.value })} /></div>
              {editFormule.contract_type === 'CUSTOM' && (
                <div className="space-y-1.5">
                  <Label className="font-display text-[13px]">Template de contrat personnalisé</Label>
                  <Textarea value={editFormule.contract_template || ''} onChange={e => setEditFormule({ ...editFormule, contract_template: e.target.value })} rows={10} className="font-mono text-xs" />
                </div>
              )}
              <div className="space-y-3">
                <Label className="font-display text-[13px]">Features</Label>
                {(editFormule.features || []).map((feat: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1">{feat}</span>
                    <button onClick={() => setEditFormule({ ...editFormule, features: editFormule.features.filter((_: any, j: number) => j !== i) })} className="text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Nouvelle feature…" value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newFeature.trim()) { setEditFormule({ ...editFormule, features: [...(editFormule.features || []), newFeature.trim()] }); setNewFeature(''); } }} />
                  <Button variant="outline" size="sm" onClick={() => { if (newFeature.trim()) { setEditFormule({ ...editFormule, features: [...(editFormule.features || []), newFeature.trim()] }); setNewFeature(''); } }}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm"><Switch checked={editFormule.actif} onCheckedChange={v => setEditFormule({ ...editFormule, actif: v })} /> Actif</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editFormule.afficher_landing} onCheckedChange={v => setEditFormule({ ...editFormule, afficher_landing: v })} /> Afficher sur la landing</label>
              </div>
              <Button onClick={saveFormule} style={{ backgroundColor: '#8FC500', color: '#03045E' }} className="font-display font-bold w-full">Enregistrer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm reject */}
      <AlertDialog open={!!confirmReject} onOpenChange={() => setConfirmReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Rejeter cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              La demande de {confirmReject?.prenom} {confirmReject?.nom} sera définitivement rejetée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => doReject(confirmReject)} className="bg-destructive text-destructive-foreground font-display">Rejeter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete formule */}
      <AlertDialog open={!!confirmDeleteFormule} onOpenChange={() => setConfirmDeleteFormule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Supprimer « {confirmDeleteFormule?.nom} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette formule sera définitivement supprimée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => doDeleteFormule(confirmDeleteFormule)} className="bg-destructive text-destructive-foreground font-display">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
