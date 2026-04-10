import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Persona Genius — Personal Branding LinkedIn',
  '/login': 'Connexion — Persona Genius',
  '/inscription': 'Inscription — Persona Genius',
  '/onboarding': 'Onboarding — Persona Genius',
  '/confirmation': 'Confirmation — Persona Genius',
  '/admin/dashboard': 'Dashboard — Persona Genius',
  '/admin/clients': 'Clients — Persona Genius',
  '/admin/posts': 'Posts — Persona Genius',
  '/admin/calendrier': 'Calendrier — Persona Genius',
  '/admin/shootings': 'Shootings — Persona Genius',
  '/admin/facturation': 'Facturation — Persona Genius',
  '/admin/analytics': 'Analytics — Persona Genius',
  '/admin/journal': 'Journal — Persona Genius',
  '/admin/parametres': 'Paramètres — Persona Genius',
  '/admin/contrats': 'Contrats — Persona Genius',
  '/admin/landing-page': 'Landing Page — Persona Genius',
  '/client/dashboard': 'Mon espace — Persona Genius',
  '/client/calendrier': 'Calendrier — Persona Genius',
  '/client/valides': 'Posts validés — Persona Genius',
  '/client/profil': 'Mon profil — Persona Genius',
  '/client/factures': 'Mes factures — Persona Genius',
  '/staff/dashboard': 'Dashboard Staff — Persona Genius',
};

export default function PageTitle() {
  const location = useLocation();
  useEffect(() => {
    const base = location.pathname.replace(/\/[0-9a-f-]{36}$/, '');
    const title = routeTitles[base] || 'Persona Genius';
    document.title = title;
  }, [location.pathname]);
  return null;
}
