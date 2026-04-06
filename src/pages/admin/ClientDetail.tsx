import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Archive,
  Trash2,
  Link2,
  Plus,
  Camera,
  Mail,
  Phone,
  MessageCircle,
  Linkedin,
  Globe,
  Send,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

type ClientFull = {
  id: string;
  nom: string;
  photo_url: string | null;
  entreprise: string | null;
  email: string | null;
  titre_professionnel: string | null;
  secteur_activite: string | null;
  audience_cible: string | null;
  telephone: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  biographie: string | null;
  piliers_contenu: string[] | null;
  ton_voix: string | null;
  style_ecriture: string | null;
  sujets_a_eviter: string | null;
  objectifs_linkedin: string[] | null;
  formule: string | null;
  date_debut: string | null;
  date_renouvellement: string | null;
  frequence_q1: number | null;
  frequence_q2: number | null;
  frequence_q3: number | null;
  frequence_q4: number | null;
  montant_mensuel_xof: number | null;
  notes_internes: string | null;
  stock_images: number | null;
  seuil_alerte_images: number | null;
  statut: 'actif' | 'pause' | 'termine';
  statut_paiement: string | null;
  archived: boolean | null;
};

type ShootingRecord = {
  id: string;
  date_shooting: string;
  lieu: string;
  nombre_photos: number;
  notes: string | null;
};

type PaymentRecord = {
  id: string;
  montant_xof: number;
  date_paiement: string;
  methode: string | null;
  reference: string | null;
};

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ') + ' XOF';

/* ------------------------------------------------------------------ */
/*  Section Card wrapper                                               */
/* ------------------------------------------------------------------ */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-4">
      {title && <h3 className="font-heading text-base font-bold text-foreground">{title}</h3>}
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-body text-[13px] font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

  const [client, setClient] = useState<ClientFull | null>(null);
  const [form, setForm] = useState<Partial<ClientFull>>({});
  const [shootings, setShootings] = useState<ShootingRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [shootingForm, setShootingForm] = useState({ date_shooting: '', lieu: '', nombre_photos: '' });
  const [shootingDialogOpen, setShootingDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [lastOnboarding, setLastOnboarding] = useState<string | null>(null);
  const [sendingOnboarding, setSendingOnboarding] = useState<'initial' | 'correction' | null>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await supabase.from('clients').select('*').eq('id', id).single();
    if (data) {
      setClient(data as unknown as ClientFull);
      setForm(data as unknown as ClientFull);
    }

    const { data: sh } = await supabase
      .from('shooting_history')
      .select('*')
      .eq('client_id', id)
      .order('date_shooting', { ascending: false });
    setShootings((sh as ShootingRecord[]) || []);

    if (isAdmin) {
      const { data: py } = await supabase
        .from('payment_history')
        .select('*')
        .eq('client_id', id)
        .order('date_paiement', { ascending: false });
      setPayments((py as PaymentRecord[]) || []);
    }

    // Last completed onboarding
    const { data: lastTok } = await supabase
      .from('onboarding_tokens')
      .select('created_at')
      .eq('client_id', id)
      .eq('used', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setLastOnboarding(lastTok?.created_at ?? null);
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({
        nom: form.nom,
        photo_url: form.photo_url,
        entreprise: form.entreprise,
        email: form.email,
        titre_professionnel: form.titre_professionnel,
        secteur_activite: form.secteur_activite,
        audience_cible: form.audience_cible,
        telephone: form.telephone,
        whatsapp: form.whatsapp,
        linkedin_url: form.linkedin_url,
        biographie: form.biographie,
        piliers_contenu: form.piliers_contenu,
        ton_voix: form.ton_voix,
        style_ecriture: form.style_ecriture,
        sujets_a_eviter: form.sujets_a_eviter,
        objectifs_linkedin: form.objectifs_linkedin,
        formule: form.formule,
        date_debut: form.date_debut,
        date_renouvellement: form.date_renouvellement,
        frequence_q1: form.frequence_q1,
        frequence_q2: form.frequence_q2,
        frequence_q3: form.frequence_q3,
        frequence_q4: form.frequence_q4,
        montant_mensuel_xof: form.montant_mensuel_xof,
        notes_internes: form.notes_internes,
        stock_images: form.stock_images,
        seuil_alerte_images: form.seuil_alerte_images,
        statut_paiement: form.statut_paiement,
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Client mis à jour');
      load();
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    await supabase.from('clients').update({ archived: !client?.archived }).eq('id', id);
    toast.success(client?.archived ? 'Client réactivé' : 'Client archivé');
    navigate('/admin/clients');
  };

  const handleDelete = async () => {
    if (!id) return;
    // Check for unpaid invoices
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id)
      .neq('statut', 'payee');
    if ((count || 0) > 0) {
      toast.error('Impossible de supprimer : factures non soldées');
      setDeleteStep(0);
      return;
    }
    await supabase.from('clients').delete().eq('id', id);
    toast.success('Client supprimé définitivement');
    navigate('/admin/clients');
  };

  const handleAddShooting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const nb = parseInt(shootingForm.nombre_photos) || 0;
    await supabase.from('shooting_history').insert({
      client_id: id,
      date_shooting: shootingForm.date_shooting,
      lieu: shootingForm.lieu,
      nombre_photos: nb,
      created_by: user?.id,
    });
    // Update stock
    await supabase
      .from('clients')
      .update({ stock_images: (form.stock_images || 0) + nb })
      .eq('id', id);
    toast.success('Shooting ajouté');
    setShootingForm({ date_shooting: '', lieu: '', nombre_photos: '' });
    setShootingDialogOpen(false);
    load();
  };

  const handleSendOnboarding = async (type: 'initial' | 'correction') => {
    if (!id || !client?.email) {
      toast.error('Email du client requis pour envoyer le lien');
      return;
    }
    setSendingOnboarding(type);
    try {
      // Invalider les anciens tokens
      await supabase.from('onboarding_tokens').update({ used: true }).eq('client_id', id).eq('used', false);
      // Créer nouveau token
      const { data: tokenData, error } = await supabase
        .from('onboarding_tokens')
        .insert({ client_id: id, created_by: user?.id })
        .select('token')
        .single();
      if (error || !tokenData) { toast.error('Erreur génération token'); return; }

      const link = `https://pg-nu-virid.vercel.app/onboarding/${tokenData.token}`;

      // Envoyer email via edge function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      await fetch(`${SUPABASE_URL}/functions/v1/send-onboarding-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({
          client_email: client.email,
          client_nom: client.nom,
          onboarding_link: link,
          is_correction: type === 'correction',
        }),
      });

      toast.success(`Lien ${type === 'correction' ? 'de correction' : 'd\'onboarding'} envoyé à ${client.nom}`);
      load();
    } finally {
      setSendingOnboarding(null);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, value: string) => {
    const arr = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, [field]: arr }));
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const initials = client.nom
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-[1100px]">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          {client.photo_url ? (
            <img src={client.photo_url} alt={client.nom} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="h-14 w-14 rounded-full flex items-center justify-center font-heading text-lg font-bold text-primary-foreground" style={{ backgroundColor: '#03045E' }}>
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{client.nom}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {client.entreprise && <span className="text-sm text-muted-foreground font-body">{client.entreprise}</span>}
              {client.titre_professionnel && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground font-body">{client.titre_professionnel}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 font-heading font-semibold" style={{ backgroundColor: '#03045E' }}>
          <Save className="h-4 w-4" /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-6">
        <TabsList className="bg-card border border-border p-1 h-auto flex-wrap">
          <TabsTrigger value="profil" className="font-body text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Profil
          </TabsTrigger>
          <TabsTrigger value="strategie" className="font-body text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Stratégie
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="contrat" className="font-body text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Contrat
            </TabsTrigger>
          )}
          <TabsTrigger value="notes" className="font-body text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Notes internes
          </TabsTrigger>
          <TabsTrigger value="shooting" className="font-body text-[13px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Shooting
          </TabsTrigger>
        </TabsList>

        {/* ─────── Onglet 1 : Profil ─────── */}
        <TabsContent value="profil" className="space-y-5">
          <Section title="Informations personnelles">
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Nom complet">
                <Input value={form.nom || ''} onChange={(e) => updateField('nom', e.target.value)} />
              </FieldRow>
              <FieldRow label="Titre professionnel">
                <Input value={form.titre_professionnel || ''} onChange={(e) => updateField('titre_professionnel', e.target.value)} placeholder="CEO, Consultant, Fondatrice…" />
              </FieldRow>
              <FieldRow label="Secteur d'activité">
                <Input value={form.secteur_activite || ''} onChange={(e) => updateField('secteur_activite', e.target.value)} placeholder="Tech, Finance, Santé…" />
              </FieldRow>
              <FieldRow label="Audience cible LinkedIn">
                <Input value={form.audience_cible || ''} onChange={(e) => updateField('audience_cible', e.target.value)} placeholder="Décideurs, DRH, investisseurs…" />
              </FieldRow>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={form.email || ''} onChange={(e) => updateField('email', e.target.value)} />
                </div>
              </FieldRow>
              <FieldRow label="Téléphone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={form.telephone || ''} onChange={(e) => updateField('telephone', e.target.value)} />
                </div>
              </FieldRow>
              <FieldRow label="WhatsApp">
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={form.whatsapp || ''} onChange={(e) => updateField('whatsapp', e.target.value)} />
                </div>
              </FieldRow>
              <FieldRow label="LinkedIn">
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" value={form.linkedin_url || ''} onChange={(e) => updateField('linkedin_url', e.target.value)} />
                </div>
              </FieldRow>
            </div>
          </Section>

          <Section title="Biographie / Storytelling">
            <Textarea
              value={form.biographie || ''}
              onChange={(e) => updateField('biographie', e.target.value)}
              rows={5}
              placeholder="Parcours, histoire personnelle, valeurs…"
              className="font-body text-sm"
            />
          </Section>
        </TabsContent>

        {/* ─────── Onglet 2 : Stratégie ─────── */}
        <TabsContent value="strategie" className="space-y-5">
          <Section title="Piliers de contenu">
            <FieldRow label="Piliers (séparés par des virgules)">
              <Input
                value={(form.piliers_contenu || []).join(', ')}
                onChange={(e) => updateArrayField('piliers_contenu', e.target.value)}
                placeholder="Expertise, Leadership, Personnel, Inspiration…"
              />
            </FieldRow>
          </Section>

          <Section title="Ton & Style">
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldRow label="Ton de voix">
                <Input value={form.ton_voix || ''} onChange={(e) => updateField('ton_voix', e.target.value)} placeholder="Professionnel, chaleureux, inspirant…" />
              </FieldRow>
              <FieldRow label="Style d'écriture">
                <Input value={form.style_ecriture || ''} onChange={(e) => updateField('style_ecriture', e.target.value)} placeholder="Narratif, factuel, punchy…" />
              </FieldRow>
            </div>
          </Section>

          <Section title="Limites">
            <FieldRow label="Sujets à éviter / Lignes rouges">
              <Textarea
                value={form.sujets_a_eviter || ''}
                onChange={(e) => updateField('sujets_a_eviter', e.target.value)}
                rows={3}
                placeholder="Politique, concurrents, vie privée…"
              />
            </FieldRow>
          </Section>

          <Section title="Objectifs LinkedIn">
            <FieldRow label="Objectifs (séparés par des virgules)">
              <Input
                value={(form.objectifs_linkedin || []).join(', ')}
                onChange={(e) => updateArrayField('objectifs_linkedin', e.target.value)}
                placeholder="Notoriété, Leads, Recrutement, Thought Leadership…"
              />
            </FieldRow>
          </Section>
        </TabsContent>

        {/* ─────── Onglet 3 : Contrat (Admin only) ─────── */}
        {isAdmin && (
          <TabsContent value="contrat" className="space-y-5">
            <Section title="Formule & Durée">
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldRow label="Formule souscrite">
                  <Select value={form.formule || 'essentiel'} onValueChange={(v) => updateField('formule', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essentiel">Essentiel</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Statut paiement">
                  <Select value={form.statut_paiement || 'en_attente'} onValueChange={(v) => updateField('statut_paiement', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paye">Payé</SelectItem>
                      <SelectItem value="partiel">Partiel</SelectItem>
                      <SelectItem value="en_retard">En retard</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Date de début">
                  <Input type="date" value={form.date_debut || ''} onChange={(e) => updateField('date_debut', e.target.value)} />
                </FieldRow>
                <FieldRow label="Date de renouvellement">
                  <Input type="date" value={form.date_renouvellement || ''} onChange={(e) => updateField('date_renouvellement', e.target.value)} />
                </FieldRow>
              </div>
            </Section>

            <Section title="Fréquence par trimestre">
              <div className="grid grid-cols-4 gap-4">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q, i) => {
                  const field = `frequence_q${i + 1}` as keyof typeof form;
                  return (
                    <FieldRow key={q} label={q}>
                      <Input
                        type="number"
                        value={form[field] as number || 0}
                        onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                        min={0}
                        className="text-center font-heading font-bold"
                      />
                    </FieldRow>
                  );
                })}
              </div>
            </Section>

            <Section title="Financier">
              <FieldRow label="Montant mensuel (XOF)">
                <Input
                  type="number"
                  value={form.montant_mensuel_xof || 0}
                  onChange={(e) => updateField('montant_mensuel_xof', parseInt(e.target.value) || 0)}
                  className="font-heading font-bold text-lg max-w-xs"
                />
              </FieldRow>
              {payments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-heading text-sm font-semibold text-foreground mb-2">Historique des paiements</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Montant</TableHead>
                        <TableHead className="text-xs">Méthode</TableHead>
                        <TableHead className="text-xs">Réf.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell className="font-heading font-semibold text-sm">{formatXOF(p.montant_xof)}</TableCell>
                          <TableCell className="text-sm">{p.methode || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.reference || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Section>
          </TabsContent>
        )}

        {/* ─────── Onglet 4 : Notes internes ─────── */}
        <TabsContent value="notes" className="space-y-5">
          <Section title="Notes internes">
            <p className="text-xs text-muted-foreground font-body mb-2">
              Ces notes ne sont jamais visibles par le client.
              {!isAdmin && <span className="ml-1 text-amber-600">Les informations financières sont réservées aux admins.</span>}
            </p>
            <Textarea
              value={form.notes_internes || ''}
              onChange={(e) => updateField('notes_internes', e.target.value)}
              rows={12}
              placeholder="Notes libres sur le client, observations, rappels…"
              className="font-body text-sm"
            />
          </Section>
        </TabsContent>

        {/* ─────── Onglet 5 : Shooting ─────── */}
        <TabsContent value="shooting" className="space-y-5">
          <Section title="Stock d'images">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-heading font-bold" style={{ color: (form.stock_images || 0) <= (form.seuil_alerte_images || 5) ? '#DC2626' : '#03045E' }}>
                  {form.stock_images || 0}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-1">images restantes</p>
              </div>
              <div className="flex-1 max-w-xs space-y-3">
                <FieldRow label="Stock actuel">
                  <Input type="number" value={form.stock_images || 0} onChange={(e) => updateField('stock_images', parseInt(e.target.value) || 0)} min={0} />
                </FieldRow>
                <FieldRow label="Seuil d'alerte">
                  <Input type="number" value={form.seuil_alerte_images || 5} onChange={(e) => updateField('seuil_alerte_images', parseInt(e.target.value) || 5)} min={0} />
                </FieldRow>
              </div>
            </div>
          </Section>

          <Section title="Historique des shootings">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-body">{shootings.length} shooting(s) enregistré(s)</p>
              <Dialog open={shootingDialogOpen} onOpenChange={setShootingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-heading text-xs" style={{ backgroundColor: '#03045E' }}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">Nouveau shooting</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddShooting} className="space-y-4 mt-4">
                    <FieldRow label="Date">
                      <Input type="date" value={shootingForm.date_shooting} onChange={(e) => setShootingForm({ ...shootingForm, date_shooting: e.target.value })} required />
                    </FieldRow>
                    <FieldRow label="Lieu">
                      <Input value={shootingForm.lieu} onChange={(e) => setShootingForm({ ...shootingForm, lieu: e.target.value })} placeholder="Studio Dakar, bureau client…" required />
                    </FieldRow>
                    <FieldRow label="Nombre de photos">
                      <Input type="number" value={shootingForm.nombre_photos} onChange={(e) => setShootingForm({ ...shootingForm, nombre_photos: e.target.value })} min={1} required />
                    </FieldRow>
                    <Button type="submit" className="w-full font-heading" style={{ backgroundColor: '#03045E' }}>Enregistrer</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {shootings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Lieu</TableHead>
                    <TableHead className="text-xs text-center">Photos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shootings.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{new Date(s.date_shooting).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-sm">{s.lieu}</TableCell>
                      <TableCell className="text-center font-heading font-bold text-sm">{s.nombre_photos}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun shooting enregistré</p>
            )}
          </Section>
        </TabsContent>
      </Tabs>

      {/* ─── Section Onboarding ─── */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-base font-bold text-foreground">Onboarding</h3>
            {lastOnboarding ? (
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Dernier onboarding complété le {new Date(lastOnboarding).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-body mt-0.5">Aucun onboarding complété pour l'instant</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2 font-body text-sm"
            disabled={sendingOnboarding !== null}
            onClick={() => handleSendOnboarding('initial')}
            style={{ borderColor: '#0077B640', color: '#0077B6' }}
          >
            <Send className="h-4 w-4" />
            {sendingOnboarding === 'initial' ? 'Envoi…' : 'Envoyer lien onboarding'}
          </Button>
          <Button
            variant="outline"
            className="gap-2 font-body text-sm"
            disabled={sendingOnboarding !== null}
            onClick={() => handleSendOnboarding('correction')}
            style={{ borderColor: '#BA751740', color: '#BA7517' }}
          >
            <RefreshCw className="h-4 w-4" />
            {sendingOnboarding === 'correction' ? 'Envoi…' : 'Lien de correction'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-body text-xs text-muted-foreground"
            onClick={async () => {
              if (!id) return;
              await supabase.from('onboarding_tokens').update({ used: true }).eq('client_id', id).eq('used', false);
              const { data: tokenData, error } = await supabase.from('onboarding_tokens').insert({ client_id: id, created_by: user?.id }).select('token').single();
              if (error || !tokenData) { toast.error('Erreur'); return; }
              const link = `https://pg-nu-virid.vercel.app/onboarding/${tokenData.token}`;
              navigator.clipboard.writeText(link);
              toast.success('Lien copié dans le presse-papier');
            }}
          >
            <Link2 className="h-3.5 w-3.5" /> Copier le lien
          </Button>
        </div>
      </div>

      {/* Actions bas de page */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button variant="outline" className="gap-2 font-body text-sm" onClick={handleArchive}>
          <Archive className="h-4 w-4" />
          {client.archived ? 'Réactiver le client' : 'Archiver le client'}
        </Button>

        {isAdmin && (
          <AlertDialog open={deleteStep > 0} onOpenChange={(o) => !o && setDeleteStep(0)}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 font-body text-sm text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteStep(1)}>
                <Trash2 className="h-4 w-4" /> Supprimer définitivement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">
                  {deleteStep === 1 ? 'Êtes-vous sûr ?' : 'Confirmation finale'}
                </AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  {deleteStep === 1
                    ? 'Cette action supprimera le client et toutes ses données. Les factures non soldées bloqueront la suppression.'
                    : `Cette action est irréversible. Toutes les données de ${client.nom} seront supprimées.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
                {deleteStep === 1 ? (
                  <AlertDialogAction className="bg-destructive text-destructive-foreground font-heading" onClick={(e) => { e.preventDefault(); setDeleteStep(2); }}>
                    Continuer
                  </AlertDialogAction>
                ) : (
                  <AlertDialogAction className="bg-destructive text-destructive-foreground font-heading" onClick={handleDelete}>
                    Supprimer définitivement
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
