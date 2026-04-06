import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type StaffMember = {
  user_id: string;
  profiles: { nom: string; prenom: string } | null;
};

export default function AdminEquipe() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('user_roles').select('user_id, profiles(nom, prenom)').eq('role', 'staff');
    setStaff((data as unknown as StaffMember[]) || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staff.length >= 2) { toast.error('Maximum 2 comptes Staff autorisés'); return; }
    setLoading(true);

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nom: form.nom, prenom: form.prenom } },
    });

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Erreur lors de la création');
      setLoading(false);
      return;
    }

    // Assign staff role
    await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'staff' as any });

    toast.success('Compte Staff créé');
    setOpen(false);
    setForm({ email: '', password: '', nom: '', prenom: '' });
    setLoading(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Gestion de l'équipe</h1>
          <p className="text-muted-foreground font-body mt-1">{staff.length}/2 comptes Staff</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: '#8FC500' }} className="text-white font-heading font-semibold gap-2" disabled={staff.length >= 2}>
              <Plus className="h-4 w-4" /> Ajouter Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Créer un compte Staff</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Prénom</Label><Input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Nom</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Mot de passe</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
              <Button type="submit" className="w-full" style={{ backgroundColor: '#8FC500' }} disabled={loading}>
                {loading ? 'Création…' : 'Créer le compte'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map(s => (
              <TableRow key={s.user_id}>
                <TableCell className="font-medium">{s.profiles?.prenom} {s.profiles?.nom}</TableCell>
                <TableCell><Badge variant="outline" className="bg-accent/10 text-accent">Staff</Badge></TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Aucun membre staff</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
