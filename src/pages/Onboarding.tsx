import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Upload, X } from 'lucide-react';

const OBJECTIFS = ['Notoriété', 'Génération de leads', 'Recrutement', 'Positionnement expert', 'Autre'];
const PILIERS = ['Expertise métier', 'Leadership', 'Personnel / storytelling', 'Inspiration', 'Actualités secteur', 'Behind the scenes'];
const TONS = ['Formel', 'Accessible', 'Inspirant', 'Direct', 'Autre'];

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'submitted'>('loading');
  const [invalidReason, setInvalidReason] = useState('');
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: '',
    titre_professionnel: '',
    secteur_activite: '',
    email: '',
    telephone: '',
    whatsapp: '',
    linkedin_url: '',
    objectifs_linkedin: [] as string[],
    piliers_contenu: [] as string[],
    ton_voix: '',
    sujets_a_eviter: '',
    biographie: '',
  });

  useEffect(() => {
    if (!token) { setStatus('invalid'); setInvalidReason('Lien invalide'); return; }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await supabase.functions.invoke('onboarding', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });
      // Use fetch directly since invoke doesn't support GET with query params well
      const projectId = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding?token=${token}`;
      const response = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await response.json();
      if (data.valid) {
        setStatus('valid');
      } else {
        setStatus('invalid');
        setInvalidReason(data.reason || 'Lien invalide');
      }
    } catch {
      setStatus('invalid');
      setInvalidReason('Erreur de connexion');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo trop volumineuse (max 5 Mo)'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleArrayField = (field: 'objectifs_linkedin' | 'piliers_contenu', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.email) { toast.error('Veuillez remplir le nom et l\'email'); return; }
    setSubmitting(true);

    let photo_url: string | null = null;

    // Upload photo if provided
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `onboarding/${token}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('client-photos').upload(path, photoFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('client-photos').getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          token,
          ...form,
          photo_url,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus('submitted');
      } else {
        toast.error(data.error || 'Erreur lors de la soumission');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
    setSubmitting(false);
  };

  const wordCount = form.biographie.trim().split(/\s+/).filter(Boolean).length;

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  // ── Invalid / Expired ──
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
        <div className="glass-card max-w-md w-full p-8 text-center animate-fade-in">
          <AlertTriangle className="h-14 w-14 mx-auto mb-4" style={{ color: '#D97706' }} />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Lien invalide</h1>
          <p className="text-muted-foreground font-body text-[15px] leading-relaxed">{invalidReason}</p>
          <p className="text-muted-foreground font-body text-sm mt-4">
            Contactez votre gestionnaire Persona Genius pour obtenir un nouveau lien d'inscription.
          </p>
        </div>
      </div>
    );
  }

  // ── Submitted ──
  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
        <div className="glass-card max-w-md w-full p-8 text-center animate-fade-in">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#8FC500' }} />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Dossier reçu !</h1>
          <p className="text-muted-foreground font-body text-[15px] leading-relaxed">
            Votre dossier a bien été transmis à notre équipe. Nous vous recontacterons très prochainement pour démarrer votre accompagnement.
          </p>
          <div className="mt-6 pt-6 border-t border-border">
            <img src="/logo-couleur.svg" alt="Persona Genius" className="h-8 mx-auto opacity-60" />
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-blanc.svg" alt="Persona Genius" className="h-12 mx-auto mb-3" />
          <p className="text-white/60 font-body text-sm">Formulaire d'inscription</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center font-heading text-sm font-bold transition-all duration-300"
                style={{
                  backgroundColor: step >= s ? '#8FC500' : 'rgba(255,255,255,0.15)',
                  color: step >= s ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className="w-16 h-0.5 rounded-full transition-all duration-300"
                  style={{ backgroundColor: step > s ? '#8FC500' : 'rgba(255,255,255,0.15)' }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 sm:p-8 animate-fade-in">
          {/* ─── Step 1: Informations de base ─── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Informations de base</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">Dites-nous qui vous êtes</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">Nom complet *</Label>
                  <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Amadou Diallo" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">Titre professionnel</Label>
                  <Input value={form.titre_professionnel} onChange={(e) => setForm({ ...form, titre_professionnel: e.target.value })} placeholder="CEO, Consultant…" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-body text-[13px] font-medium">Secteur d'activité</Label>
                <Input value={form.secteur_activite} onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })} placeholder="Tech, Finance, Santé…" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="amadou@email.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">Téléphone</Label>
                  <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+221 77 000 00 00" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+221 77 000 00 00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body text-[13px] font-medium">Profil LinkedIn</Label>
                  <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/…" />
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-1.5">
                <Label className="font-body text-[13px] font-medium">Photo de profil</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                      <button
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground font-body">JPG, PNG — max 5 Mo</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Stratégie de contenu ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Stratégie de contenu</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">Vos objectifs et préférences</p>
              </div>

              <div className="space-y-3">
                <Label className="font-body text-[13px] font-medium">Objectifs LinkedIn</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {OBJECTIFS.map((obj) => (
                    <label key={obj} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Checkbox
                        checked={form.objectifs_linkedin.includes(obj)}
                        onCheckedChange={() => toggleArrayField('objectifs_linkedin', obj)}
                      />
                      <span className="text-sm font-body text-foreground">{obj}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-body text-[13px] font-medium">Piliers de contenu</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {PILIERS.map((p) => (
                    <label key={p} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Checkbox
                        checked={form.piliers_contenu.includes(p)}
                        onCheckedChange={() => toggleArrayField('piliers_contenu', p)}
                      />
                      <span className="text-sm font-body text-foreground">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-body text-[13px] font-medium">Ton de voix souhaité</Label>
                <div className="flex flex-wrap gap-2">
                  {TONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, ton_voix: t })}
                      className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all border ${
                        form.ton_voix === t
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-border text-foreground hover:bg-muted/40'
                      }`}
                      style={form.ton_voix === t ? { backgroundColor: '#03045E' } : {}}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-body text-[13px] font-medium">Sujets / thèmes à éviter</Label>
                <Textarea
                  value={form.sujets_a_eviter}
                  onChange={(e) => setForm({ ...form, sujets_a_eviter: e.target.value })}
                  rows={3}
                  placeholder="Politique, concurrents, vie privée…"
                  className="font-body text-sm"
                />
              </div>
            </div>
          )}

          {/* ─── Step 3: Biographie ─── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Votre histoire</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">Racontez votre parcours professionnel</p>
              </div>

              <div className="space-y-2">
                <Label className="font-body text-[13px] font-medium">
                  Racontez votre histoire professionnelle
                </Label>
                <Textarea
                  value={form.biographie}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 500 || e.target.value.length < form.biographie.length) {
                      setForm({ ...form, biographie: e.target.value });
                    }
                  }}
                  rows={10}
                  placeholder="D'où venez-vous ? Qu'est-ce qui vous a mené là où vous êtes aujourd'hui ? Quelles sont vos valeurs, vos convictions professionnelles ?…"
                  className="font-body text-sm"
                />
                <div className="flex justify-end">
                  <span className={`text-xs font-body ${wordCount > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {wordCount} / 500 mots
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep((step - 1) as Step)}
                className="font-heading font-semibold"
              >
                ← Précédent
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 1 && (!form.nom || !form.email)) {
                    toast.error('Le nom et l\'email sont requis');
                    return;
                  }
                  setStep((step + 1) as Step);
                }}
                className="font-heading font-semibold text-white gap-1"
                style={{ backgroundColor: '#8FC500' }}
              >
                Suivant →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="font-heading font-semibold text-white gap-1"
                style={{ backgroundColor: '#8FC500' }}
              >
                {submitting ? 'Envoi…' : 'Valider ✓'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © 2026 Persona Genius — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
