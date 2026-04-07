import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Save, Shield, AlertTriangle, UserPlus, Eye, EyeOff, Building2, Mail, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';

type StaffAccount = {
  user_id: string;
  email: string;
  nom: string;
  prenom: string;
};

type AgencySettings = {
  id: string;
  nom_agence: string;
  email_contact: string;
  seuil_alerte_images_global: number;
  logo_url?: string;
  notifs_email?: boolean;
};

type AdminProfile = {
  user_id: string;
  nom: string;
  prenom: string;
};

export default function AdminParametres() {
  const { user } = useAuth();
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Admin profile
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Staff creation
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: '', password: '', nom: '', prenom: '' });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Danger zone
  const [dangerConfirm, setDangerConfirm] = useState('');
  const [dangerModal, setDangerModal] = useState(false);

  const load = async () => {
    // Get staff roles
    const { data: staffRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'staff');
    if (staffRoles && staffRoles.length > 0) {
      const userIds = staffRoles.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, nom, prenom').in('user_id', userIds);
      if (profiles) {
        setStaffAccounts(profiles.map(p => ({ ...p, email: '' })));
      }
    }

    // Get settings
    const { data: s } = await supabase.from('agency_settings').select('*').limit(1).single();
    if (s) setSettings(s as AgencySettings);

    // Get admin profile
    if (user?.id) {
      const { data: profile } = await supabase.from('profiles').select('user_id, nom, prenom').eq('user_id', user.id).single();
      if (profile) setAdminProfile(profile as AdminProfile);
    }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from('agency_settings').update({
      nom_agence: settings.nom_agence,
      email_contact: settings.email_contact,
      seuil_alerte_images_global: settings.seuil_alerte_images_global,
      logo_url: settings.logo_url,
      notifs_email: settings.notifs_email,
    }).eq('id', settings.id);
    if (error) toast.error('Erreur de sauvegarde');
    else toast.success('Paramètres enregistrés');
    setSaving(false);
  };

  const saveAdminProfile = async () => {
    if (!adminProfile || !user?.id) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({
      nom: adminProfile.nom,
      prenom: adminProfile.prenom,
    }).eq('user_id', user.id);
    if (error) toast.error('Erreur de sauvegarde');
    else toast.success('Profil mis à jour');
    setSavingProfile(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `logos/agency-logo.${ext}`;
    const { error: uploadError } = await supabase.storage.from('agency-assets').upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error('Erreur lors du téléchargement du logo');
      setUploadingLogo(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('agency-assets').getPublicUrl(path);
    const logoUrl = urlData?.publicUrl ?? '';
    setSettings({ ...settings, logo_url: logoUrl });
    toast.success('Logo téléchargé — pensez à enregistrer');
    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const createStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffAccounts.length >= 2) { toast.error('Maximum 2 comptes Staff autorisés'); return; }
    setCreatingStaff(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-admin`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          email: staffForm.email,
          password: staffForm.password,
          nom: staffForm.nom,
          prenom: staffForm.prenom,
          role: 'staff',
        }),
      });
      const data = await response.json();
      if (data.error) { toast.error(data.error); }
      else {
        toast.success('Compte Staff créé');
        setStaffModal(false);
        setStaffForm({ email: '', password: '', nom: '', prenom: '' });
        load();
      }
    } catch { toast.error('Erreur de connexion'); }
    setCreatingStaff(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.newPw.length < 8) { toast.error('Minimum 8 caractères'); return; }

    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) toast.error(error.message);
    else { toast.success('Mot de passe modifié'); setPwForm({ current: '', newPw: '', confirm: '' }); }
  };

  const getInitials = (nom: string, prenom: string) => {
    return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || 'ST';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground font-body mt-1">Configuration de l'agence et gestion des accès</p>
      </div>

      <Tabs defaultValue="agence" className="w-full">
        <TabsList className="mb-6 bg-muted/60 border border-border/50 rounded-xl p-1 gap-1">
          <TabsTrigger
            value="agence"
            className="font-heading font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#03045E]"
          >
            Agence
          </TabsTrigger>
          <TabsTrigger
            value="compte"
            className="font-heading font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#03045E]"
          >
            Mon compte
          </TabsTrigger>
          <TabsTrigger
            value="alertes"
            className="font-heading font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#03045E]"
          >
            Alertes
          </TabsTrigger>
          <TabsTrigger
            value="equipe"
            className="font-heading font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#03045E]"
          >
            Équipe
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════
            TAB 1 — Agence
        ══════════════════════════════════════ */}
        <TabsContent value="agence" className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
                <Building2 className="h-5 w-5" style={{ color: '#03045E' }} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Informations agence</h3>
                <p className="text-sm text-muted-foreground">Nom et email affichés sur les documents</p>
              </div>
            </div>

            {settings && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Nom de l'agence</Label>
                  <Input
                    value={settings.nom_agence}
                    onChange={e => setSettings({ ...settings, nom_agence: e.target.value })}
                    placeholder="Mon Agence Immo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Email de contact</Label>
                  <Input
                    type="email"
                    value={settings.email_contact}
                    onChange={e => setSettings({ ...settings, email_contact: e.target.value })}
                    placeholder="contact@agence.fr"
                  />
                </div>
              </div>
            )}

            {/* Logo upload */}
            <div className="space-y-3 pt-1">
              <Label className="text-[13px]">Logo de l'agence</Label>
              <div className="flex items-center gap-4">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Logo agence"
                    className="h-14 w-auto rounded-lg border border-border object-contain bg-white p-1"
                  />
                ) : (
                  <div className="h-14 w-24 rounded-lg border border-dashed border-border flex items-center justify-center bg-muted/30">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 font-heading"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingLogo ? 'Téléchargement…' : 'Importer un logo'}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">PNG, JPG ou SVG — max 2 Mo</span>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={saveSettings}
            disabled={saving || !settings}
            className="font-heading font-semibold gap-2 text-white"
            style={{ backgroundColor: '#8FC500' }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB 2 — Mon compte
        ══════════════════════════════════════ */}
        <TabsContent value="compte" className="space-y-6">
          {/* Admin profile */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Informations personnelles</h3>
                <p className="text-sm text-muted-foreground">Nom et prénom associés à votre compte</p>
              </div>
            </div>

            {adminProfile && (
              <div className="grid sm:grid-cols-2 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label className="text-[13px]">Prénom</Label>
                  <Input
                    value={adminProfile.prenom}
                    onChange={e => setAdminProfile({ ...adminProfile, prenom: e.target.value })}
                    placeholder="Prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Nom</Label>
                  <Input
                    value={adminProfile.nom}
                    onChange={e => setAdminProfile({ ...adminProfile, nom: e.target.value })}
                    placeholder="Nom"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={saveAdminProfile}
              disabled={savingProfile || !adminProfile}
              className="font-heading font-semibold gap-2 text-white"
              style={{ backgroundColor: '#8FC500' }}
            >
              <Save className="h-4 w-4" />
              {savingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
            </Button>
          </div>

          {/* Change password */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFF7ED' }}>
                <Shield className="h-5 w-5" style={{ color: '#C2410C' }} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Changer le mot de passe</h3>
                <p className="text-sm text-muted-foreground">Minimum 8 caractères</p>
              </div>
            </div>

            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-[13px]">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                    placeholder="Minimum 8 caractères"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px]">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                    placeholder="Répétez le mot de passe"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="font-heading font-semibold border-[#03045E] text-[#03045E] hover:bg-[#03045E] hover:text-white"
              >
                Mettre à jour le mot de passe
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB 3 — Alertes
        ══════════════════════════════════════ */}
        <TabsContent value="alertes" className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FAEEDA' }}>
                <ImageIcon className="h-5 w-5" style={{ color: '#BA7517' }} />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Seuil d'alerte images</h3>
                <p className="text-sm text-muted-foreground">
                  Alerte déclenchée quand le stock d'un client descend sous ce seuil
                </p>
              </div>
            </div>

            {settings && (
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={settings.seuil_alerte_images_global}
                    onChange={e => setSettings({ ...settings, seuil_alerte_images_global: parseInt(e.target.value) || 0 })}
                    className="w-24"
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">images minimum</span>
                </div>

                <Slider
                  value={[settings.seuil_alerte_images_global]}
                  onValueChange={([val]) => setSettings({ ...settings, seuil_alerte_images_global: val })}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
            )}

            {/* Email notifications toggle */}
            {settings && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 max-w-sm">
                <div>
                  <p className="font-heading text-sm font-medium text-foreground">Recevoir les alertes par email</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Envoi automatique à {settings.email_contact || 'l\'adresse de contact'}
                  </p>
                </div>
                <Switch
                  checked={settings.notifs_email ?? false}
                  onCheckedChange={checked => setSettings({ ...settings, notifs_email: checked })}
                  style={settings.notifs_email ? { backgroundColor: '#8FC500' } : undefined}
                />
              </div>
            )}
          </div>

          <Button
            onClick={saveSettings}
            disabled={saving || !settings}
            className="font-heading font-semibold gap-2 text-white"
            style={{ backgroundColor: '#8FC500' }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </TabsContent>

        {/* ══════════════════════════════════════
            TAB 4 — Équipe
        ══════════════════════════════════════ */}
        <TabsContent value="equipe" className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Shield className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Comptes Staff</h3>
                  <p className="text-sm text-muted-foreground">{staffAccounts.length}/2 comptes utilisés</p>
                </div>
              </div>
              <Button
                onClick={() => setStaffModal(true)}
                disabled={staffAccounts.length >= 2}
                className="font-heading font-semibold gap-2 text-white"
                style={{ backgroundColor: '#03045E' }}
              >
                <UserPlus className="h-4 w-4" /> Nouveau Staff
              </Button>
            </div>

            {staffAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffAccounts.map(s => (
                    <TableRow key={s.user_id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[11px] font-heading font-bold bg-secondary/10 text-secondary">
                            {getInitials(s.nom, s.prenom)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-heading font-medium">{s.nom}</TableCell>
                      <TableCell className="font-body">{s.prenom}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[11px]"
                          style={{ color: '#16A34A', backgroundColor: '#F0FDF4', borderColor: '#16A34A33' }}
                        >
                          Actif
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun compte Staff créé</p>
            )}
          </div>

          {/* Danger zone */}
          <div className="rounded-xl border-2 border-destructive/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-heading font-semibold text-destructive">Zone dangereuse</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Réinitialiser les données de test. Cette action est irréversible et supprimera toutes les données clients,
              posts, factures et images de test.
            </p>
            <Button variant="destructive" onClick={() => setDangerModal(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Réinitialiser les données test
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Staff Creation Modal ─── */}
      <Dialog open={staffModal} onOpenChange={setStaffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Créer un compte Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={createStaffAccount} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Prénom *</Label>
                <Input value={staffForm.prenom} onChange={e => setStaffForm({ ...staffForm, prenom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Nom *</Label>
                <Input value={staffForm.nom} onChange={e => setStaffForm({ ...staffForm, nom: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Email *</Label>
              <Input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Mot de passe *</Label>
              <Input
                type="password"
                value={staffForm.password}
                onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={creatingStaff}
              className="w-full text-white font-heading"
              style={{ backgroundColor: '#03045E' }}
            >
              {creatingStaff ? 'Création…' : 'Créer le compte'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Danger Confirmation Modal ─── */}
      <Dialog open={dangerModal} onOpenChange={setDangerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">⚠️ Confirmation requise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Pour confirmer, tapez <strong className="text-foreground">SUPPRIMER</strong> ci-dessous.
            </p>
            <Input value={dangerConfirm} onChange={e => setDangerConfirm(e.target.value)} placeholder="Tapez SUPPRIMER" />
            <Button
              variant="destructive"
              className="w-full"
              disabled={dangerConfirm !== 'SUPPRIMER'}
              onClick={() => {
                toast.info('Réinitialisation non implémentée en V1');
                setDangerModal(false);
                setDangerConfirm('');
              }}
            >
              Confirmer la réinitialisation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
