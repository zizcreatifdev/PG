import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle2, Upload, X, ArrowLeft } from 'lucide-react';

const OBJECTIFS = ['Notoriété', 'Génération de leads', 'Recrutement', 'Positionnement expert', 'Autre'];
const PILIERS = ['Expertise métier', 'Leadership', 'Personnel / storytelling', 'Inspiration', 'Actualités secteur', 'Behind the scenes'];
const TONS = ['Formel', 'Accessible', 'Inspirant', 'Direct', 'Autre'];

type Formule = { nom: string; prix: number; features: string[]; shooting: string; popular?: boolean };

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');

export default function Inscription() {
  const navigate = useNavigate();
  const [formules, setFormules] = useState<Formule[]>([]);
  const [step, setStep] = useState(1); // 1=formule, 2-4=onboarding, 5=confirm
  const [selectedFormule, setSelectedFormule] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: '', titre_professionnel: '', secteur_activite: '', email: '', telephone: '', whatsapp: '', linkedin_url: '',
    objectifs_linkedin: [] as string[], piliers_contenu: [] as string[], ton_voix: '', sujets_a_eviter: '', biographie: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('landing_page_config').select('content').limit(1).single();
      if (data?.content) {
        const c = data.content as any;
        setFormules(c.formules || []);
      }
    })();
  }, []);

  const toggleArray = (field: 'objectifs_linkedin' | 'piliers_contenu', value: string) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value] }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.email) { toast.error('Nom et email requis'); return; }
    setSubmitting(true);

    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `inscription/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('client-photos').upload(path, photoFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from('client-photos').getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    // Create client via edge function or directly (public insert needs a function)
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ ...form, photo_url, formule: selectedFormule, from_landing: true }),
      });
      const data = await response.json();
      if (data.success) {
        setStep(5);
      } else {
        toast.error(data.error || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
    setSubmitting(false);
  };

  const wordCount = form.biographie.trim().split(/\s+/).filter(Boolean).length;
  const totalSteps = 4;
  const progressPct = Math.round((Math.min(step, totalSteps) / totalSteps) * 100);

  // Confirmed
  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
        <div className="glass-card max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: '#8FC500' }} />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Inscription reçue !</h1>
          <p className="text-muted-foreground font-body text-[15px] leading-relaxed">
            Votre dossier a bien été transmis. Notre équipe vous recontactera sous 24h pour finaliser votre accompagnement.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="mt-6">Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 50%, #0077B6 100%)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo-blanc.svg" alt="Persona Genius" className="h-10 mx-auto mb-2" />
          <p className="text-white/60 font-body text-sm">Inscription — Étape {step} sur {totalSteps}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: '#8FC500' }} />
        </div>

        <div className="glass-card p-6 sm:p-8">
          {/* Step 1: Formule */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">Choisissez votre formule</h2>
                <p className="text-sm text-muted-foreground font-body mt-1">Sélectionnez l'accompagnement souhaité</p>
              </div>
              <div className="space-y-4">
                {formules.map(f => (
                  <button key={f.nom} type="button" onClick={() => setSelectedFormule(f.nom.toLowerCase())}
                    className="w-full text-left rounded-xl p-5 transition-all border-2"
                    style={{
                      borderColor: selectedFormule === f.nom.toLowerCase() ? '#8FC500' : '#E4E7F0',
                      backgroundColor: selectedFormule === f.nom.toLowerCase() ? 'rgba(143,197,0,0.05)' : 'white',
                    }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-lg" style={{ color: '#03045E' }}>{f.nom}</span>
                      <span className="font-heading font-bold" style={{ color: '#03045E' }}>{formatXOF(f.prix)} XOF/mois</span>
                    </div>
                    <ul className="space-y-1">
                      {f.features.slice(0, 3).map((feat, j) => (
                        <li key={j} className="text-sm text-muted-foreground">• {feat}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">Informations personnelles</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px]">Nom complet *</Label><Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-[13px]">Titre professionnel</Label><Input value={form.titre_professionnel} onChange={e => setForm({ ...form, titre_professionnel: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[13px]">Secteur d'activité</Label><Input value={form.secteur_activite} onChange={e => setForm({ ...form, secteur_activite: e.target.value })} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px]">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-[13px]">Téléphone</Label><Input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[13px]">WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-[13px]">Profil LinkedIn</Label><Input value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Photo de profil</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img src={photoPreview} alt="" className="h-16 w-16 rounded-full object-cover border" />
                      <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50">
                      <Upload className="h-4 w-4 text-muted-foreground" /><input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Stratégie */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">Stratégie de contenu</h2>
              <div className="space-y-3">
                <Label className="text-[13px]">Objectifs LinkedIn</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {OBJECTIFS.map(o => (
                    <label key={o} className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={form.objectifs_linkedin.includes(o)} onCheckedChange={() => toggleArray('objectifs_linkedin', o)} />
                      <span className="text-sm">{o}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[13px]">Piliers de contenu</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {PILIERS.map(p => (
                    <label key={p} className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                      <Checkbox checked={form.piliers_contenu.includes(p)} onCheckedChange={() => toggleArray('piliers_contenu', p)} />
                      <span className="text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[13px]">Ton de voix</Label>
                <div className="flex flex-wrap gap-2">
                  {TONS.map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, ton_voix: t })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${form.ton_voix === t ? 'text-white border-transparent' : 'border-border hover:bg-muted/40'}`}
                      style={form.ton_voix === t ? { backgroundColor: '#03045E' } : {}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5"><Label className="text-[13px]">Sujets à éviter</Label><Textarea value={form.sujets_a_eviter} onChange={e => setForm({ ...form, sujets_a_eviter: e.target.value })} rows={2} /></div>
            </div>
          )}

          {/* Step 4: Bio */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">Votre histoire</h2>
              <div className="space-y-2">
                <Label className="text-[13px]">Biographie professionnelle</Label>
                <Textarea value={form.biographie} onChange={e => { const w = e.target.value.trim().split(/\s+/).filter(Boolean).length; if (w <= 500 || e.target.value.length < form.biographie.length) setForm({ ...form, biographie: e.target.value }); }} rows={8} />
                <p className="text-xs text-right text-muted-foreground">{wordCount} / 500 mots</p>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4 mr-1" /> Accueil</Button>
            )}
            {step < totalSteps ? (
              <Button onClick={() => { if (step === 1 && !selectedFormule) { toast.error('Choisissez une formule'); return; } if (step === 2 && (!form.nom || !form.email)) { toast.error('Nom et email requis'); return; } setStep(s => s + 1); }} style={{ backgroundColor: '#8FC500' }} className="text-white font-heading">
                Suivant
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: '#8FC500' }} className="text-white font-heading">
                {submitting ? 'Envoi…' : 'Valider mon inscription'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
