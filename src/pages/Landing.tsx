import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Check, ArrowRight, ChevronDown, Quote } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import heroImage from '@/assets/hero-landing.jpg';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Formule = {
  id: string;
  nom: string;
  prix_xof: number;
  badge: string | null;
  description: string;
  features: string[];
};

const formatXOF = (n: number) => n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');

type Testimonial = { nom: string; titre: string; texte: string };
type FaqItem = { question: string; reponse: string };

const defaultTestimonials: Testimonial[] = [
  { nom: 'Fatou N.', titre: 'CEO TechAfrica', texte: 'Persona Genius a transformé ma visibilité LinkedIn. En 3 mois, mes publications atteignent 10x plus de personnes.' },
  { nom: 'Moussa D.', titre: "Avocat d'affaires", texte: "Enfin une agence qui comprend les codes du business africain. Mon réseau a doublé en 2 mois." },
];

const defaultFAQ: FaqItem[] = [
  { question: 'Combien de temps avant de voir des résultats ?', reponse: 'Les premiers résultats sont visibles après 4 à 8 semaines de publication régulière.' },
  { question: 'Dois-je avoir un compte LinkedIn actif ?', reponse: "Oui, ou nous vous aidons à en créer un lors de l'onboarding." },
  { question: 'Est-ce que je valide les posts avant publication ?', reponse: "Absolument. Chaque post passe par votre validation via notre plateforme avant d'être publié." },
  { question: 'Comment se passe le paiement ?', reponse: 'Paiement mensuel en Franc CFA par virement ou mobile money. Aucune carte bancaire requise.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [formules, setFormules] = useState<Formule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inscriptionRef = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);
  const [faq, setFaq] = useState<FaqItem[]>(defaultFAQ);
  const [headline, setHeadline] = useState('Développez votre influence sur LinkedIn');
  const [subtitle, setSubtitle] = useState('Persona Genius accompagne les dirigeants, avocats et entrepreneurs africains dans leur stratégie de contenu LinkedIn — de la rédaction au shooting photo.');
  const [ctaText, setCtaText] = useState('Je démarre');
  const [ctaFinalText, setCtaFinalText] = useState('Prêt à développer votre marque personnelle ?');

  // Form state
  const [selectedFormuleId, setSelectedFormuleId] = useState('');
  const [form, setForm] = useState({ prenom: '', nom: '', profession: '', email: '', whatsapp: '', linkedin_url: '', message: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [formulesRes, configRes] = await Promise.all([
        supabase.from('formules').select('*').eq('actif', true).eq('afficher_landing', true).order('prix_xof'),
        supabase.from('landing_page_config').select('*').limit(1).single(),
      ]);
      if (formulesRes.data && formulesRes.data.length > 0) setFormules(formulesRes.data as Formule[]);
      if (configRes.data) {
        const c = configRes.data.content as any;
        if (c) {
          if (c.headline) setHeadline(c.headline);
          if (c.subtitle) setSubtitle(c.subtitle);
          if (c.cta_text) setCtaText(c.cta_text);
          if (c.cta_final_text) setCtaFinalText(c.cta_final_text);
          if (c.testimonials?.length) setTestimonials(c.testimonials);
          if (c.faq?.length) setFaq(c.faq);
        }
      }
      setLoaded(true);
    })();
  }, []);

  const scrollToInscription = (formuleId?: string) => {
    if (formuleId) setSelectedFormuleId(formuleId);
    inscriptionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prenom || !form.nom || !form.profession || !form.email || !form.whatsapp) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Veuillez accepter les conditions');
      return;
    }
    setSubmitting(true);
    try {
      const selectedFormule = formules.find(f => f.id === selectedFormuleId);
      const { data, error } = await supabase.from('prospect_submissions').insert({
        prenom: form.prenom,
        nom: form.nom,
        profession: form.profession,
        email: form.email,
        whatsapp: form.whatsapp,
        linkedin_url: form.linkedin_url || null,
        message: form.message || null,
        formule_id: selectedFormuleId || null,
        formule_name: selectedFormule?.nom || 'Je ne sais pas encore',
        accepted_terms: true,
      }).select('id').single();

      if (error) throw error;
      if (data?.id) {
        navigate(`/contrat/${data.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    }
    setSubmitting(false);
  };

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
    </div>
  );

  return (
    <div className="min-h-screen font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4" style={{ background: 'rgba(3,4,94,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-blanc.svg" alt="Persona Genius" className="h-8 sm:h-9" />
            <span className="font-display text-sm font-bold tracking-wide uppercase text-white hidden sm:block">Persona Genius</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#comment-ca-marche" className="text-sm font-medium text-white/70 hover:text-white transition">Comment ça marche</a>
            <a href="#formules" className="text-sm font-medium text-white/70 hover:text-white transition">Formules</a>
            <a href="#faq" className="text-sm font-medium text-white/70 hover:text-white transition">FAQ</a>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-white/70 hover:text-white transition">Connexion</button>
          </div>
          <button onClick={() => scrollToInscription()} className="px-5 py-2.5 rounded-xl text-sm font-display font-semibold transition hover:opacity-90 shadow-lg" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
            {ctaText}
          </button>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(143,197,0,0.08)', filter: 'blur(120px)' }} />
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(0,119,182,0.10)', filter: 'blur(100px)' }} />

        <div className="max-w-6xl mx-auto w-full relative z-10 pt-28 pb-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left text */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium mb-8 border" style={{ backgroundColor: 'rgba(143,197,0,0.15)', borderColor: '#8FC500', color: '#8FC500' }}>
              🏆 Agence #1 Personal Branding — Afrique de l'Ouest
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold leading-tight mb-6 text-white">
              {headline}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-[520px] mx-auto lg:mx-0 mb-10 text-white/70">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <button onClick={() => scrollToInscription()} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-display font-semibold transition-all hover:scale-105 shadow-xl" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
                Choisir ma formule <ArrowRight className="h-5 w-5" />
              </button>
              <a href="#comment-ca-marche" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-display font-semibold text-white border border-white/30 hover:bg-white/5 transition">
                Voir comment ça marche
              </a>
            </div>
          </div>
          {/* Right image */}
          <div className="lg:w-1/2">
            <img src={heroImage} alt="Professionnels africains en stratégie LinkedIn" className="rounded-3xl shadow-2xl w-full max-w-lg mx-auto" width={1280} height={720} />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/40" />
        </div>
      </section>

      {/* SECTION 2 — PREUVES SOCIALES */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-0 sm:divide-x divide-border">
          {[
            { number: '50+', label: 'Posts publiés / mois' },
            { number: '15+', label: 'Clients accompagnés' },
            { number: '3x', label: 'Plus de visibilité en moyenne' },
          ].map((stat, i) => (
            <div key={i} className="text-center px-8 sm:px-12">
              <div className="font-display text-4xl sm:text-5xl font-bold" style={{ color: '#03045E' }}>{stat.number}</div>
              <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-16 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: '#EEF1F8' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-14" style={{ color: '#03045E' }}>Comment ça marche</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Choisissez votre formule', desc: "Sélectionnez l'offre adaptée à votre profil et vos objectifs LinkedIn." },
              { num: '2', title: 'On crée votre stratégie', desc: 'Shooting, rédaction, calendrier éditorial complet — on gère tout pour vous.' },
              { num: '3', title: 'Votre audience grandit', desc: 'Vous validez, on publie, votre réseau vous découvre.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 font-display text-xl font-bold text-white" style={{ backgroundColor: '#03045E' }}>
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-bold mb-3" style={{ color: '#03045E' }}>{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — FORMULES */}
      <section id="formules" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-3" style={{ color: '#03045E' }}>Nos formules</h2>
          <p className="text-center text-sm text-muted-foreground mb-14">Montants en Franc CFA. Facturation manuelle — aucune CB requise.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {formules.map((f) => (
              <div key={f.id} className="relative rounded-2xl p-8 transition-all hover:shadow-xl bg-white" style={{ border: f.badge ? '2px solid #8FC500' : '1px solid #E4E7F0' }}>
                {f.badge && (
                  <div className="absolute -top-3.5 left-6 px-4 py-1 rounded-full text-xs font-display font-bold text-white" style={{ backgroundColor: '#8FC500' }}>
                    {f.badge}
                  </div>
                )}
                <h3 className="font-display text-2xl font-bold mb-1" style={{ color: '#03045E' }}>{f.nom}</h3>
                <p className="text-sm text-muted-foreground mb-4">{f.description}</p>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold" style={{ color: '#03045E' }}>{formatXOF(f.prix_xof)}</span>
                  <span className="text-sm ml-1 text-muted-foreground">/mois</span>
                </div>
                <hr className="mb-6 border-border" />
                <ul className="space-y-3 mb-8">
                  {f.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm" style={{ color: '#03045E' }}>
                      <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#8FC500' }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollToInscription(f.id)} className="w-full py-3.5 rounded-xl font-display font-semibold transition hover:opacity-90" style={{ backgroundColor: f.badge ? '#8FC500' : '#03045E', color: f.badge ? '#03045E' : 'white' }}>
                  Choisir cette formule <ArrowRight className="h-4 w-4 inline ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — FORMULAIRE D'INSCRIPTION */}
      <section id="inscription" ref={inscriptionRef} className="py-16 sm:py-20 px-4 sm:px-6" style={{ backgroundColor: '#EEF1F8' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-3" style={{ color: '#03045E' }}>Commençons ensemble</h2>
          <p className="text-center text-sm text-muted-foreground mb-10">Remplissez ce formulaire — nous revenons vers vous sous 24h.</p>

          <form onSubmit={handleSubmit} className="rounded-2xl p-6 sm:p-8 bg-white shadow-sm" style={{ border: '1px solid #E4E7F0' }}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-display font-semibold">Prénom *</Label>
                <Input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-display font-semibold">Nom *</Label>
                <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5 mb-4">
              <Label className="text-[13px] font-display font-semibold">Profession / Titre professionnel *</Label>
              <Input value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-display font-semibold">Email professionnel *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-display font-semibold">Numéro WhatsApp *</Label>
                <Input type="tel" placeholder="+221 77 000 00 00" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5 mb-4">
              <Label className="text-[13px] font-display font-semibold">Lien profil LinkedIn</Label>
              <Input type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <div className="space-y-1.5 mb-4">
              <Label className="text-[13px] font-display font-semibold">Formule choisie *</Label>
              <Select value={selectedFormuleId} onValueChange={setSelectedFormuleId}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez une formule" /></SelectTrigger>
                <SelectContent>
                  {formules.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nom} — {formatXOF(f.prix_xof)} XOF/mois</SelectItem>
                  ))}
                  <SelectItem value="indecis">Je ne sais pas encore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 mb-6">
              <Label className="text-[13px] font-display font-semibold">Message libre</Label>
              <Textarea placeholder="Parlez-nous de votre projet..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} />
            </div>
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <Checkbox checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(v === true)} className="mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                J'accepte de signer le contrat de prestation qui me sera présenté à l'étape suivante
              </span>
            </label>
            <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl font-display font-bold text-base transition hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
              {submitting ? 'Envoi en cours…' : 'Continuer vers le contrat →'}
            </button>
          </form>
        </div>
      </section>

      {/* SECTION 6 — TÉMOIGNAGES */}
      <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-14">Ce que disent nos clients</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Quote className="h-8 w-8 mb-4" style={{ color: '#8FC500' }} />
                <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-6 italic">"{t.texte}"</p>
                <p className="font-display font-bold text-white">{t.nom}</p>
                <p className="text-white/50 text-sm">{t.titre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-14" style={{ color: '#03045E' }}>Questions fréquentes</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl px-6 bg-white" style={{ border: '1px solid #E4E7F0' }}>
                <AccordionTrigger className="font-display font-semibold text-left py-5 hover:no-underline" style={{ color: '#03045E' }}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed pb-5 text-muted-foreground">
                  {item.reponse}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* SECTION 8 — CTA FINAL */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6">{ctaFinalText}</h2>
          <button onClick={() => scrollToInscription()} className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-display font-bold transition-all hover:scale-105 shadow-xl" style={{ backgroundColor: '#8FC500', color: '#03045E' }}>
            {ctaText} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 sm:px-6 border-t" style={{ borderColor: '#E4E7F0' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-couleur.svg" alt="PG" className="h-7" />
            <span className="font-display text-xs font-bold tracking-wide uppercase" style={{ color: '#03045E' }}>Persona Genius</span>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground">hello@personagenius.com</p>
            <p className="text-xs text-muted-foreground mt-1">© {new Date().getFullYear()} Persona Genius — Dakar, Sénégal</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
