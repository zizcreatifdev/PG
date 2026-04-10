import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  UserCheck,
  FileText,
  Send,
  Award,
  Pencil,
  CheckCircle,
  Check,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

type Formule = {
  id: string;
  nom: string;
  prix_xof: number;
  badge: string | null;
  description: string;
  features: string[];
};

const formatXOF = (n: number) =>
  n.toLocaleString('fr-FR').replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ') + ' XOF/mois';

export default function Landing() {
  const navigate = useNavigate();
  const [formules, setFormules] = useState<Formule[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [agencyEmail, setAgencyEmail] = useState('hello@personagenius.com');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const [formulesRes, configRes, agencyRes] = await Promise.all([
        supabase.from('formules').select('*').eq('actif', true).eq('afficher_landing', true).order('prix_xof'),
        supabase.from('landing_page_config').select('*').limit(1).single(),
        supabase.from('agency_settings').select('nom_agence, email_contact').limit(1).single(),
      ]);
      if (agencyRes.data) {
        setAgencyEmail(agencyRes.data.email_contact || 'hello@personagenius.com');
      }
      if (formulesRes.data) setFormules(formulesRes.data as Formule[]);
      if (configRes.data?.content) {
        const c = configRes.data.content as any;
        if (c.hero_image_url) setHeroImageUrl(c.hero_image_url);
      }
      setLoaded(true);
    })();
  }, []);

  const scrollToFormules = () => {
    document.getElementById('formules')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#0077B6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          boxShadow: scrolled ? '0 1px 12px rgba(3,4,94,0.10)' : 'none',
          borderBottom: scrolled ? '1px solid #E4E7F0' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-couleur.svg" alt="Persona Genius" className="h-8" />
            <span
              className="font-display font-bold text-sm tracking-wide hidden sm:block"
              style={{ color: '#03045E' }}
            >
              Persona Genius
            </span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-xl text-sm font-display font-semibold border-2 transition hover:bg-[#03045E] hover:text-white"
            style={{ borderColor: '#03045E', color: '#03045E' }}
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 min-h-[90vh] flex items-center"
        style={{ background: 'linear-gradient(160deg, #F0F6FC 0%, #EEF1F8 100%)' }}
      >
        <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left column */}
          <div className="lg:w-3/5 text-center lg:text-left">
            <h1
              className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold leading-tight mb-6"
              style={{ color: '#03045E' }}
            >
              Votre personal branding LinkedIn, géré par des experts
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-gray-600 mb-10 max-w-[560px] mx-auto lg:mx-0">
              Persona Genius crée, planifie et publie votre contenu LinkedIn. Vous vous concentrez sur votre métier.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate('/inscription')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-display font-semibold transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: '#8FC500', color: '#03045E' }}
              >
                Rejoindre Persona Genius <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={scrollToFormules}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-display font-semibold border-2 transition hover:bg-[#03045E]/5"
                style={{ borderColor: '#03045E', color: '#03045E' }}
              >
                Voir nos formules <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right column — hero image */}
          <div className="lg:w-2/5 w-full flex justify-center">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Persona Genius"
                className="rounded-3xl shadow-2xl w-full max-w-md object-cover"
              />
            ) : (
              <div
                className="rounded-3xl shadow-2xl w-full max-w-md aspect-[4/3] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #03045E 0%, #0077B6 100%)' }}
              >
                <img src="/logo-blanc.svg" alt="Persona Genius" className="h-20 opacity-80" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── VALUE BAR ── */}
      <section className="bg-white py-14 px-4 sm:px-6 border-y" style={{ borderColor: '#E4E7F0' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch justify-center divide-y sm:divide-y-0 sm:divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {[
            {
              title: 'Experts LinkedIn',
              desc: 'Spécialisés exclusivement sur LinkedIn',
            },
            {
              title: 'Contenu sur mesure',
              desc: 'Chaque post rédigé pour votre voix',
            },
            {
              title: 'Résultats mesurables',
              desc: 'Suivi de vos indicateurs chaque mois',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex-1 text-center px-8 py-6"
              style={{ borderColor: '#E4E7F0' }}
            >
              <p
                className="font-display font-bold text-base sm:text-lg mb-1"
                style={{ color: '#03045E' }}
              >
                {item.title}
              </p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section
        id="comment-ca-marche"
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ backgroundColor: '#EEF1F8' }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-16"
            style={{ color: '#03045E' }}
          >
            Comment ça marche
          </h2>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-start justify-between gap-10 sm:gap-4">
            {/* Connecting line on desktop */}
            <div
              className="hidden sm:block absolute top-[28px] left-[calc(16.66%)] right-[calc(16.66%)] h-px"
              style={{ backgroundColor: '#0077B6', opacity: 0.25 }}
            />

            {[
              {
                Icon: UserCheck,
                title: 'Candidature',
                desc: 'Remplissez notre formulaire en ligne. Nous étudions votre profil sous 24h.',
              },
              {
                Icon: FileText,
                title: 'Onboarding',
                desc: 'Entretien de découverte, shooting photo, stratégie éditoriale sur mesure.',
              },
              {
                Icon: Send,
                title: 'Publication LinkedIn',
                desc: 'Vous validez chaque post avant publication. Votre audience grandit.',
              },
            ].map((step, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative z-10">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-md"
                  style={{ backgroundColor: '#03045E' }}
                >
                  <step.Icon className="h-6 w-6 text-white" />
                </div>
                <h3
                  className="font-display text-lg font-bold mb-2"
                  style={{ color: '#03045E' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-[220px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULES ── */}
      <section id="formules" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-display text-3xl sm:text-4xl font-bold text-center mb-14"
            style={{ color: '#03045E' }}
          >
            Nos formules
          </h2>

          {formules.length === 0 ? (
            /* Skeleton */
            <div className="grid md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-8 animate-pulse"
                  style={{ border: '1px solid #E4E7F0', backgroundColor: '#F6F8FB' }}
                >
                  <div className="h-6 rounded bg-gray-200 w-1/2 mb-3" />
                  <div className="h-4 rounded bg-gray-200 w-3/4 mb-6" />
                  <div className="h-10 rounded bg-gray-200 w-2/3 mb-6" />
                  <div className="space-y-2 mb-8">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="h-3 rounded bg-gray-200 w-full" />
                    ))}
                  </div>
                  <div className="h-11 rounded-xl bg-gray-200 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {formules.map((f) => (
                <div
                  key={f.id}
                  className="relative rounded-2xl p-8 flex flex-col transition-all hover:shadow-xl bg-white"
                  style={{
                    border: f.badge ? '2px solid #8FC500' : '1px solid #E4E7F0',
                  }}
                >
                  {f.badge && (
                    <div
                      className="absolute -top-3.5 left-6 px-4 py-1 rounded-full text-xs font-display font-bold text-white"
                      style={{ backgroundColor: '#8FC500' }}
                    >
                      {f.badge}
                    </div>
                  )}
                  <h3
                    className="font-display text-2xl font-bold mb-1"
                    style={{ color: '#03045E' }}
                  >
                    {f.nom}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5">{f.description}</p>
                  <div className="mb-6">
                    <span className="font-display text-3xl font-bold" style={{ color: '#03045E' }}>
                      {formatXOF(f.prix_xof)}
                    </span>
                  </div>
                  <hr className="mb-6" style={{ borderColor: '#E4E7F0' }} />
                  <ul className="space-y-3 mb-8 flex-1">
                    {f.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm" style={{ color: '#03045E' }}>
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#8FC500' }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/inscription')}
                    className="w-full py-3.5 rounded-xl font-display font-semibold text-sm transition hover:opacity-90 inline-flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: f.badge ? '#8FC500' : '#03045E',
                      color: f.badge ? '#03045E' : 'white',
                    }}
                  >
                    Choisir cette formule <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── POURQUOI NOUS ── */}
      <section
        className="py-16 sm:py-24 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #03045E 0%, #023E8A 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-14">
            Pourquoi choisir Persona Genius ?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                Icon: Award,
                title: "Expert LinkedIn en Afrique de l'Ouest",
                desc: 'Nous connaissons les codes du business africain et les attentes des décideurs locaux.',
              },
              {
                Icon: Pencil,
                title: 'Contenu qui vous ressemble vraiment',
                desc: 'Chaque post est rédigé dans votre voix, validé par vous avant publication.',
              },
              {
                Icon: CheckCircle,
                title: 'Vous validez avant publication',
                desc: "Aucun post n'est publié sans votre accord. Vous gardez le contrôle total.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: 'rgba(143,197,0,0.15)' }}
                >
                  <item.Icon className="h-6 w-6" style={{ color: '#8FC500' }} />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white py-10 px-4 sm:px-6 border-t" style={{ borderColor: '#E4E7F0' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          {/* Left: logo */}
          <div className="flex items-center gap-2.5">
            <img src="/logo-couleur.svg" alt="Persona Genius" className="h-7" />
            <span className="font-display font-bold text-sm" style={{ color: '#03045E' }}>
              Persona Genius
            </span>
          </div>

          {/* Center: email */}
          <a
            href={`mailto:${agencyEmail}`}
            className="text-sm text-gray-500 hover:text-[#0077B6] transition"
          >
            {agencyEmail}
          </a>

          {/* Right: copyright + login */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-gray-400">
            <span>© 2026 Persona Genius</span>
            <span className="hidden sm:inline">·</span>
            <button
              onClick={() => navigate('/login')}
              className="hover:text-[#03045E] transition font-medium"
              style={{ color: '#0077B6' }}
            >
              Se connecter
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
