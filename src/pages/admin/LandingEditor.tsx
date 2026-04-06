import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, Check, ArrowRight, ExternalLink, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

type Testimonial = { nom: string; titre: string; texte: string };
type FaqItem = { question: string; reponse: string };

type LandingConfig = {
  headline: string;
  subtitle: string;
  cta_text: string;
  cta_final_text: string;
  testimonials: Testimonial[];
  faq: FaqItem[];
};

type DBFormule = {
  id: string;
  nom: string;
  prix_xof: number;
  badge: string | null;
  description: string;
  features: string[];
  actif: boolean;
  afficher_landing: boolean;
};

const defaultConfig: LandingConfig = {
  headline: 'Développez votre influence sur LinkedIn',
  subtitle: 'Persona Genius accompagne les dirigeants, avocats et entrepreneurs africains dans leur stratégie de contenu LinkedIn.',
  cta_text: 'Je démarre',
  cta_final_text: 'Prêt à développer votre marque personnelle ?',
  testimonials: [
    { nom: 'Fatou N.', titre: 'CEO TechAfrica', texte: 'Persona Genius a transformé ma visibilité LinkedIn. En 3 mois, mes publications atteignent 10x plus de personnes.' },
    { nom: 'Moussa D.', titre: "Avocat d'affaires", texte: "Enfin une agence qui comprend les codes du business africain. Mon réseau a doublé en 2 mois." },
  ],
  faq: [
    { question: 'Combien de temps avant de voir des résultats ?', reponse: 'Les premiers résultats sont visibles après 4 à 8 semaines de publication régulière.' },
    { question: 'Dois-je avoir un compte LinkedIn actif ?', reponse: "Oui, ou nous vous aidons à en créer un lors de l'onboarding." },
    { question: 'Est-ce que je valide les posts avant publication ?', reponse: "Absolument. Chaque post passe par votre validation via notre plateforme avant d'être publié." },
    { question: 'Comment se passe le paiement ?', reponse: 'Paiement mensuel en Franc CFA par virement ou mobile money. Aucune carte bancaire requise.' },
  ],
};

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');

export default function AdminLandingEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [configId, setConfigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formules, setFormules] = useState<DBFormule[]>([]);

  useEffect(() => {
    (async () => {
      const [configRes, formulesRes] = await Promise.all([
        supabase.from('landing_page_config').select('*').limit(1).single(),
        supabase.from('formules').select('*').order('prix_xof'),
      ]);
      if (configRes.data) {
        setConfigId(configRes.data.id);
        const content = configRes.data.content as any;
        if (content && content.headline !== undefined) {
          setConfig({
            headline: content.headline || defaultConfig.headline,
            subtitle: content.subtitle || defaultConfig.subtitle,
            cta_text: content.cta_text || defaultConfig.cta_text,
            cta_final_text: content.cta_final_text || defaultConfig.cta_final_text,
            testimonials: content.testimonials?.length ? content.testimonials : defaultConfig.testimonials,
            faq: content.faq?.length ? content.faq : defaultConfig.faq,
          });
        }
      }
      if (formulesRes.data) setFormules(formulesRes.data as DBFormule[]);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (configId) {
        const { error } = await supabase.from('landing_page_config').update({
          content: config as any,
          updated_by: user?.id,
        }).eq('id', configId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_page_config').insert({
          content: config as any,
          updated_by: user?.id,
        });
        if (error) throw error;
      }
      toast.success('Landing page publiée !');
    } catch {
      toast.error('Erreur de sauvegarde');
    }
    setSaving(false);
  };

  const addTestimonial = () => setConfig({ ...config, testimonials: [...config.testimonials, { nom: '', titre: '', texte: '' }] });
  const removeTestimonial = (i: number) => setConfig({ ...config, testimonials: config.testimonials.filter((_, j) => j !== i) });
  const updateTestimonial = (i: number, field: string, value: string) => {
    const t = [...config.testimonials];
    (t[i] as any)[field] = value;
    setConfig({ ...config, testimonials: t });
  };

  const addFaq = () => setConfig({ ...config, faq: [...config.faq, { question: '', reponse: '' }] });
  const removeFaq = (i: number) => setConfig({ ...config, faq: config.faq.filter((_, j) => j !== i) });
  const updateFaq = (i: number, field: string, value: string) => {
    const f = [...config.faq];
    (f[i] as any)[field] = value;
    setConfig({ ...config, faq: f });
  };

  const landingFormules = formules.filter(f => f.actif && f.afficher_landing);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Éditeur Landing Page</h1>
          <p className="text-muted-foreground mt-1 text-sm">Modifiez le contenu de votre page publique</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.open('/', '_blank')} className="gap-2 flex-1 sm:flex-none">
            <ExternalLink className="h-4 w-4" /> Voir la page
          </Button>
          <Button onClick={save} disabled={saving} style={{ backgroundColor: '#8FC500' }} className="text-white font-display font-semibold gap-2 flex-1 sm:flex-none">
            <Save className="h-4 w-4" /> {saving ? 'Publication…' : 'Enregistrer & publier'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ─── LEFT: EDITOR ─── */}
        <div className="space-y-6">
          {/* Hero */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground">🎯 Hero</h3>
            <div className="space-y-2">
              <Label className="text-[13px] font-display font-semibold">Headline</Label>
              <Input value={config.headline} onChange={e => setConfig({ ...config, headline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-display font-semibold">Sous-titre</Label>
              <Textarea value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-display font-semibold">Texte bouton CTA</Label>
                <Input value={config.cta_text} onChange={e => setConfig({ ...config, cta_text: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-display font-semibold">Texte CTA final</Label>
                <Input value={config.cta_final_text} onChange={e => setConfig({ ...config, cta_final_text: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Formules (read-only from DB) */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">💎 Formules affichées sur la landing</h3>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/contrats')} className="gap-1.5">
                <Settings2 className="h-3.5 w-3.5" /> Gérer les formules
              </Button>
            </div>
            {landingFormules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune formule active à afficher. <button onClick={() => navigate('/admin/contrats')} className="underline" style={{ color: '#0077B6' }}>Créer une formule</button>
              </p>
            ) : (
              <div className="space-y-3">
                {landingFormules.map(f => (
                  <div key={f.id} className="rounded-xl border border-border p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold" style={{ color: '#03045E' }}>{f.nom}</span>
                        {f.badge && <span className="text-[10px] font-display font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#8FC500' }}>{f.badge}</span>}
                      </div>
                      <span className="font-display font-bold text-sm" style={{ color: '#03045E' }}>{formatXOF(f.prix_xof)} XOF/mois</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{f.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {f.features.map((feat, j) => (
                        <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-background border border-border">{feat}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Les formules sont gérées depuis <button onClick={() => navigate('/admin/contrats')} className="underline" style={{ color: '#0077B6' }}>Contrats → Gestion des formules</button>. Activez "Afficher sur la landing page" pour qu'elles apparaissent.
            </p>
          </div>

          {/* Testimonials */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">💬 Témoignages</h3>
              <Button size="sm" variant="outline" onClick={addTestimonial}><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
            </div>
            {config.testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex gap-2">
                  <Input value={t.nom} onChange={e => updateTestimonial(i, 'nom', e.target.value)} placeholder="Nom" className="text-sm" />
                  <Input value={t.titre} onChange={e => updateTestimonial(i, 'titre', e.target.value)} placeholder="Titre / Poste" className="text-sm" />
                  <Button size="icon" variant="ghost" onClick={() => removeTestimonial(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Textarea value={t.texte} onChange={e => updateTestimonial(i, 'texte', e.target.value)} rows={2} placeholder="Texte du témoignage" className="text-sm" />
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">❓ FAQ</h3>
              <Button size="sm" variant="outline" onClick={addFaq}><Plus className="h-3 w-3 mr-1" /> Ajouter</Button>
            </div>
            {config.faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex gap-2">
                  <Input value={f.question} onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="Question" className="text-sm" />
                  <Button size="icon" variant="ghost" onClick={() => removeFaq(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <Textarea value={f.reponse} onChange={e => updateFaq(i, 'reponse', e.target.value)} rows={2} placeholder="Réponse" className="text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: LIVE PREVIEW ─── */}
        <div className="hidden xl:block">
          <div className="sticky top-6 rounded-2xl overflow-hidden shadow-xl border border-border" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div style={{ background: 'linear-gradient(180deg, #F0F6FC 0%, #EEF1F8 100%)', transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%' }}>
              {/* Mini nav */}
              <div className="px-8 py-5 flex items-center justify-between" style={{ background: 'rgba(3,4,94,0.95)' }}>
                <div className="flex items-center gap-2">
                  <img src="/logo-blanc.svg" alt="" className="h-8" />
                  <span className="font-display text-sm font-bold uppercase tracking-wide text-white">Persona Genius</span>
                </div>
                <div className="px-5 py-2 rounded-xl text-sm font-display font-semibold" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>{config.cta_text}</div>
              </div>

              {/* Hero preview */}
              <div className="py-16 px-8" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
                <div className="max-w-lg">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6 border" style={{ backgroundColor: 'rgba(143,197,0,0.15)', borderColor: '#8FC500', color: '#8FC500' }}>
                    🏆 Agence #1 Personal Branding
                  </div>
                  <h1 className="font-display text-4xl font-bold leading-tight mb-4 text-white">{config.headline || 'Votre headline ici'}</h1>
                  <p className="text-base mb-8 text-white/70">{config.subtitle || 'Votre sous-titre ici'}</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-display font-bold" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
                    {config.cta_text || 'Je démarre'} <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Formules preview */}
              {landingFormules.length > 0 && (
                <div className="px-8 py-12 bg-white">
                  <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: '#03045E' }}>Nos formules</h2>
                  <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {landingFormules.map(f => (
                      <div key={f.id} className="rounded-xl p-6 bg-white" style={{ border: f.badge ? '2px solid #8FC500' : '1px solid #E4E7F0' }}>
                        {f.badge && <div className="text-[10px] font-display font-bold text-white px-3 py-0.5 rounded-full inline-block mb-2" style={{ backgroundColor: '#8FC500' }}>{f.badge}</div>}
                        <h3 className="font-display text-lg font-bold mb-1" style={{ color: '#03045E' }}>{f.nom}</h3>
                        <p className="font-display text-2xl font-bold mb-4" style={{ color: '#03045E' }}>{formatXOF(f.prix_xof)} <span className="text-xs font-normal opacity-50">XOF/mois</span></p>
                        <ul className="space-y-1.5">
                          {f.features.map((feat, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs" style={{ color: '#03045E' }}>
                              <Check className="h-3 w-3 shrink-0 mt-0.5" style={{ color: '#8FC500' }} />{feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testimonials preview */}
              {config.testimonials.length > 0 && (
                <div className="px-8 py-12 text-center" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
                  <h2 className="font-display text-2xl font-bold text-white mb-8">Ce que disent nos clients</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {config.testimonials.slice(0, 2).map((t, i) => (
                      <div key={i} className="rounded-xl p-6 text-left" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <p className="text-white/90 text-sm italic mb-3">"{t.texte}"</p>
                        <p className="font-display font-bold text-white text-xs">{t.nom}</p>
                        <p className="text-white/50 text-[10px]">{t.titre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ preview */}
              {config.faq.length > 0 && (
                <div className="px-8 py-12 bg-white">
                  <h2 className="font-display text-2xl font-bold text-center mb-8" style={{ color: '#03045E' }}>Questions fréquentes</h2>
                  <div className="max-w-2xl mx-auto space-y-2">
                    {config.faq.map((f, i) => (
                      <div key={i} className="rounded-lg px-4 py-3 text-sm" style={{ border: '1px solid #E4E7F0' }}>
                        <p className="font-display font-semibold" style={{ color: '#03045E' }}>{f.question}</p>
                        <p className="mt-1 text-xs" style={{ color: '#023E8A', opacity: 0.6 }}>{f.reponse}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA final preview */}
              <div className="px-8 py-12" style={{ backgroundColor: '#EEF1F8' }}>
                <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
                  <h2 className="font-display text-2xl font-bold text-white mb-4">{config.cta_final_text || 'Votre CTA final ici'}</h2>
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-display font-bold" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
                    {config.cta_text || 'Je démarre'} <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
