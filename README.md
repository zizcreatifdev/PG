# Persona Genius — Personal Branding LinkedIn

Plateforme SaaS de personal branding LinkedIn pour les professionnels africains.  
Stack : **React + Vite + TypeScript + Supabase + shadcn/ui + Tailwind CSS**

---

## Prérequis

- Node.js ≥ 18
- Compte [Supabase](https://supabase.com) (projet créé)
- Compte [Resend](https://resend.com) pour les emails transactionnels (optionnel en dev)

---

## Installation locale

```bash
# 1. Cloner le dépôt
git clone https://github.com/zizcreatifdev/PG.git
cd PG

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies clés (voir section Variables ci-dessous)

# 4. Lancer le serveur de développement
npm run dev
```

L'app est disponible sur `http://localhost:5173`.

---

## Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=VOTRE_PROJECT_ID
```

> Les clés se trouvent dans le dashboard Supabase → Project Settings → API

**Secrets pour les Edge Functions** (Dashboard Supabase → Edge Functions → Manage secrets) :

| Clé | Description |
|---|---|
| `RESEND_API_KEY` | Clé API Resend pour les emails transactionnels |
| `APP_URL` | URL de l'app déployée (ex: `https://pg-nu-virid.vercel.app`) |

> `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement.

---

## Créer le premier compte admin

Après le premier déploiement :

1. Accéder à `/setup` sur votre app
2. Saisir `admin@personagenius.sn` et le mot de passe souhaité
3. Si l'insertion dans `user_roles` échoue (erreur RLS), exécuter dans le SQL Editor :

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'admin@personagenius.sn'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Seed de données de démonstration

Pour peupler la base avec des données de démo, copier-coller le contenu de `supabase/seed-demo.sql` dans le SQL Editor de Supabase (Database → SQL Editor → New query) et exécuter.

Le seed crée :
- **Agency settings** : "Persona Genius", contact@personagenius.sn
- **3 formules** : Essentiel (150 000 XOF), Professionnel (250 000), Premium (450 000)
- **3 clients fictifs** : avocat, entrepreneur tech, consultant
- **12 posts** dans tous les statuts (brouillon, proposé, modifié, approuvé, validé, posté)
- **2 shootings** + **6 images** pour le client 1
- **3 factures** (payée, en attente, en retard) + historique de paiements

---

## Déployer les edge functions

```bash
# Installer la CLI Supabase
npm install -g supabase

# Lier au projet
supabase link --project-ref VOTRE_PROJECT_ID

# Déployer les fonctions
supabase functions deploy send-validation-email
supabase functions deploy validate-post
supabase functions deploy send-onboarding-email
supabase functions deploy onboarding
supabase functions deploy send-relance-email
supabase functions deploy send-contrat-email
supabase functions deploy convert-to-client
```

---

## Build de production

```bash
npm run build
# Les fichiers de sortie sont dans /dist
```

---

## Déploiement sur Vercel

Le fichier `vercel.json` est préconfiguré (routing SPA + répertoire `dist`).  
Connecter le dépôt GitHub à Vercel et définir les variables `VITE_SUPABASE_*` dans les paramètres du projet.

---

## Architecture

```
src/
├── pages/
│   ├── admin/       Dashboard, Posts, Clients, Facturation, Shootings, Contrats...
│   ├── staff/       Dashboard staff (accès limité)
│   ├── client/      Dashboard, Profil, Calendrier, Validés...
│   └── ...          Landing, Inscription, ContratSignature, ValidatePost...
├── components/      AppSidebar, NotificationBell, LinkedInPreview...
├── hooks/           useAuth (rôles : admin | staff | client)
└── integrations/
    └── supabase/    Client Supabase + types générés

supabase/
├── functions/       Edge functions Deno (emails, conversions...)
├── migrations/      Migrations SQL (RLS, tables...)
└── seed-demo.sql    Données de démonstration
```

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Accès complet |
| `staff` | Dashboard, Clients, Posts, Calendrier, Shootings |
| `client` | Ses posts, Calendrier, Validés, Profil + Mes photos |

---

## Contact

**Persona Genius** — Dakar, Sénégal — contact@personagenius.sn
