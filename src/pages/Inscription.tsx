import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

type Formule = { id: string; nom: string; prix_xof: number; description: string };

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');

export default function Inscription() {
  const navigate = useNavigate();
  const [formules, setFormules] = useState<Formule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    linkedin_url: '',
    formule_id: '',
  });

  useEffect(() => {
    supabase.from('formules')
      .select('id, nom, prix_xof, description')
      .eq('actif', true)
      .order('prix_xof')
      .then(({ data }) => { if (data) setFormules(data as Formule[]); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.email) {
      toast.error('Prénom, nom et email sont requis');
      return;
    }
    if (!form.formule_id) {
      toast.error('Veuillez choisir une formule');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Veuillez accepter les conditions');
      return;
    }

    setSubmitting(true);
    try {
      const selectedFormule = formules.find(f => f.id === form.formule_id);
      const { data, error } = await supabase.from('prospect_submissions').insert({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        whatsapp: form.telephone || null,
        linkedin_url: form.linkedin_url || null,
        formule_id: form.formule_id,
        formule_name: selectedFormule?.nom || '',
        accepted_terms: true,
        status: 'en_attente',
      }).select('id').single();

      if (error) throw error;

      // Notify admins
      try {
        const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              title: '📬 Nouvelle demande d\'inscription',
              message: `${form.prenom} ${form.nom} a soumis une demande (${selectedFormule?.nom || 'formule non précisée'})`,
            });
          }
        }
      } catch { /* ignore */ }

      navigate('/confirmation');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo-blanc.svg" alt="Persona Genius" className="h-10 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-white">Rejoindre Persona Genius</h1>
          <p className="text-white/60 text-sm mt-1">Remplissez ce formulaire — nous revenons vers vous sous 24h</p>
        </div>

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>Prénom *</Label>
                <Input
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                  placeholder="Moussa"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>Nom *</Label>
                <Input
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Diallo"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="moussa@exemple.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>Téléphone / WhatsApp</Label>
              <Input
                type="tel"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                placeholder="+221 77 000 00 00"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>URL LinkedIn</Label>
              <Input
                type="url"
                value={form.linkedin_url}
                onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold" style={{ color: '#03045E' }}>Formule choisie *</Label>
              <Select value={form.formule_id} onValueChange={v => setForm({ ...form, formule_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une formule" />
                </SelectTrigger>
                <SelectContent>
                  {formules.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nom} — {formatXOF(f.prix_xof)} XOF/mois
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-muted-foreground leading-relaxed">
                J'accepte que Persona Genius traite mes données dans le cadre de ma demande d'accompagnement
              </span>
            </label>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-6 text-base font-bold"
              style={{ backgroundColor: '#8FC500', color: '#03045E' }}
            >
              {submitting ? 'Envoi en cours…' : 'Envoyer ma demande →'}
            </Button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm mt-6 mx-auto transition"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
