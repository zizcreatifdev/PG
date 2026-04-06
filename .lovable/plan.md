
# Persona Genius — Application SaaS de Personal Branding LinkedIn

## Design System
- **Fond** : dégradé pastel chaud (#F0F6FC → #EEF1F8) avec glassmorphisme léger (cartes semi-transparentes, blur, bordures subtiles)
- **Fonts** : Syne (titres, 600/700) + Plus Jakarta Sans (corps, 300/400/500) via Google Fonts
- **Palette** : Navy #03045E (primaire), #023E8A (secondaire), #0077B6 (accent bleu), #8FC500 (vert CTA, max 10%), #E6F1FB/#F0F6FC (fonds clairs)
- **Logo** : SVG fourni en haut à gauche de la sidebar
- **Langue** : 100% français, devise XOF partout

## Authentification & Rôles (Lovable Cloud)
- Page de login : fond dégradé navy, logo centré, champs email/mot de passe, bouton CTA vert #8FC500
- 3 rôles via table `user_roles` : Admin, Staff, Client
- Redirection post-login : `/admin/dashboard`, `/staff/dashboard`, `/client/dashboard`
- Seed du compte Admin : admin@personagenius.sn / Admin2026!
- Protection des routes par rôle (composant ProtectedRoute)

## Navigation — Sidebar glassmorphique
- Logo PG + "PERSONA GENIUS" en haut
- Liens contextuels selon le rôle
- Icônes Lucide, hover doux, indicateur actif en vert

## Pages Admin
1. **Dashboard** — KPIs : nombre de clients actifs, posts planifiés ce mois, revenus XOF, taux de complétion
2. **Gestion des clients** — Tableau avec nom, entreprise, statut (Actif/Pause/Terminé), date d'ajout, actions (voir/modifier/supprimer). Formulaire d'ajout avec détails LinkedIn
3. **Calendrier éditorial** — Vue calendrier mensuelle avec posts planifiés par client. Création de post : client, date, contenu, statut (Brouillon/Validé/Publié)
4. **Facturation** — Liste des factures en XOF (numéro, client, montant, statut Payée/En attente/En retard). Création de facture avec lignes de prestation
5. **Analytics** — Graphiques : évolution followers, engagement rate, posts publiés par mois (données simulées)
6. **Gestion Staff** — Créer/gérer les comptes Staff (max 2)

## Pages Staff (même layout, sans facturation ni gestion staff)
- Dashboard opérationnel (clients assignés, posts à valider)
- Clients, Calendrier éditorial, Analytics

## Pages Client (interface épurée, lecture seule)
- Dashboard personnel : résumé de leur branding (posts planifiés, prochaine publication)
- Calendrier de leurs posts
- Historique des factures

## Base de données (Lovable Cloud)
- `profiles` (id, user_id, nom, prénom, rôle ref)
- `user_roles` (id, user_id, role enum)
- `clients` (id, nom, entreprise, email, linkedin_url, statut, notes, created_at)
- `posts` (id, client_id, contenu, date_planifiée, statut, created_by)
- `invoices` (id, client_id, numéro, montant_xof, statut, date_émission, date_échéance)
- `invoice_lines` (id, invoice_id, description, quantité, prix_unitaire_xof)
- RLS sur toutes les tables
