import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Shield, AlertTriangle, UserPlus, Eye, EyeOff, Building2, Mail, ImageIcon } from 'lucide-react';
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
};

export default function AdminParametres() {
  const { user } = useAuth();
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [settings, setSettings] = useState<AgencySettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Staff creation
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: '', password: '', nom: '', prenom: '' });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

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
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from('agency_settings').update({
      nom_agence: settings.nom_agence,
      email_contact: settings.email_contact,
      seuil_alerte_images_global: settings.seuil_alerte_images_global,
    }).eq('id', settings.id);
    if (error) toast.error('Erreur de sauvegarde');
    else toast.success('Paramètres enregistrés');
    setSaving(false);
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
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground font-body mt-1">Configuration de l'agence et gestion des accès</p>
      </div>

      {/* ─── Staff Accounts ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10"><Shield className="h-5 w-5 text-secondary" /></div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">Comptes Staff</h3>
              <p className="text-sm text-muted-foreground">{staffAccounts.length}/2 comptes utilisés</p>
            </div>
          </div>
          <Button
            onClick={() => setStaffModal(true)}
            disabled={staffAccounts.length >= 2}
            className="bg-primary text-primary-foreground font-heading font-semibold gap-2"
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
                  <TableCell><Badge variant="outline" className="text-[11px]" style={{ color: '#16A34A', backgroundColor: '#F0FDF4', borderColor: '#16A34A33' }}>Actif</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun compte Staff créé</p>
        )}
      </div>

      {/* ─── Agency Info ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-accent/10"><Building2 className="h-5 w-5 text-accent" /></div>
          <h3 className="font-heading font-semibold text-foreground">Informations agence</h3>
        </div>
        {settings && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nom de l'agence</Label>
              <Input value={settings.nom_agence} onChange={e => setSettings({ ...settings, nom_agence: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Email de contact</Label>
              <Input type="email" value={settings.email_contact} onChange={e => setSettings({ ...settings, email_contact: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* ─── Alert Threshold ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: '#FAEEDA' }}><ImageIcon className="h-5 w-5" style={{ color: '#BA7517' }} /></div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Seuil d'alerte images</h3>
            <p className="text-sm text-muted-foreground">Alerte déclenchée quand le stock d'un client descend sous ce seuil</p>
          </div>
        </div>
        {settings && (
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
        )}
      </div>

      {/* Save button */}
      <Button onClick={saveSettings} disabled={saving} style={{ backgroundColor: '#8FC500' }} className="text-white font-heading font-semibold gap-2">
        <Save className="h-4 w-4" /> {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </Button>

      <Separator />

      {/* ─── Change Password ─── */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
          <h3 className="font-heading font-semibold text-foreground">Changer le mot de passe</h3>
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
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">Confirmer</Label>
            <Input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <Button type="submit" variant="outline">Mettre à jour</Button>
        </form>
      </div>

      <Separator />

      {/* ─── Danger Zone ─── */}
      <div className="rounded-xl border-2 border-destructive/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="font-heading font-semibold text-destructive">Zone dangereuse</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Réinitialiser les données de test. Cette action est irréversible et supprimera toutes les données clients, posts, factures et images de test.
        </p>
        <Button variant="destructive" onClick={() => setDangerModal(true)}>
          <Trash2 className="h-4 w-4 mr-2" /> Réinitialiser les données test
        </Button>
      </div>

      {/* Staff Creation Modal */}
      <Dialog open={staffModal} onOpenChange={setStaffModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Créer un compte Staff</DialogTitle></DialogHeader>
          <form onSubmit={createStaffAccount} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[13px]">Prénom *</Label><Input value={staffForm.prenom} onChange={e => setStaffForm({ ...staffForm, prenom: e.target.value })} required /></div>
              <div className="space-y-2"><Label className="text-[13px]">Nom *</Label><Input value={staffForm.nom} onChange={e => setStaffForm({ ...staffForm, nom: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px]">Email *</Label><Input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required /></div>
            <div className="space-y-2"><Label className="text-[13px]">Mot de passe *</Label><Input type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} minLength={8} required /></div>
            <Button type="submit" disabled={creatingStaff} className="w-full bg-primary text-primary-foreground">
              {creatingStaff ? 'Création…' : 'Créer le compte'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Danger Confirmation Modal */}
      <Dialog open={dangerModal} onOpenChange={setDangerModal}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading text-destructive">⚠️ Confirmation requise</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Pour confirmer, tapez <strong className="text-foreground">SUPPRIMER</strong> ci-dessous.
            </p>
            <Input value={dangerConfirm} onChange={e => setDangerConfirm(e.target.value)} placeholder="Tapez SUPPRIMER" />
            <Button
              variant="destructive"
              className="w-full"
              disabled={dangerConfirm !== 'SUPPRIMER'}
              onClick={() => { toast.info('Réinitialisation non implémentée en V1'); setDangerModal(false); setDangerConfirm(''); }}
            >
              Confirmer la réinitialisation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
