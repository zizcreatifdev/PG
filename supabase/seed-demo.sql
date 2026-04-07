-- ============================================================
-- PERSONA GENIUS — Seed de données de démonstration
-- ============================================================
-- Utilisation :
--   1. Créer les comptes auth via /setup ou le dashboard Supabase
--      admin@personagenius.sn / Admin2026!
--      staff@personagenius.sn  / Staff2026!
--   2. Copier/coller ce fichier dans l'éditeur SQL de Supabase
--      (Database > SQL Editor > New query)
--   3. Exécuter
-- ============================================================

-- ── Agency settings ──────────────────────────────────────────
INSERT INTO agency_settings (nom_agence, email_contact, seuil_alerte_images_global, notifs_email)
VALUES ('Persona Genius', 'contact@personagenius.sn', 5, true)
ON CONFLICT DO NOTHING;

-- ── Formules ─────────────────────────────────────────────────
INSERT INTO formules (id, nom, prix_xof, description, features, badge, actif, afficher_landing, contract_type)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'Essentiel', 150000,
   'Idéal pour démarrer votre présence LinkedIn',
   '["8 posts/mois", "Calendrier éditorial", "Validation en ligne", "Rapport mensuel"]',
   NULL, true, true, 'SOLO'),
  ('f1000000-0000-0000-0000-000000000002', 'Professionnel', 250000,
   'Pour les professionnels qui veulent accélérer leur visibilité',
   '["16 posts/mois", "1 shooting photo", "Stories LinkedIn", "Analytics détaillés", "Validation en ligne"]',
   'Populaire', true, true, 'SOLO'),
  ('f1000000-0000-0000-0000-000000000003', 'Premium', 450000,
   'L''accompagnement complet pour les dirigeants ambitieux',
   '["30 posts/mois", "2 shootings/trimestre", "Gestion complète du profil", "Newsletter mensuelle", "Coach dédié", "Analytics avancés"]',
   NULL, true, true, 'ENTREPRISE')
ON CONFLICT (id) DO NOTHING;

-- ── Clients fictifs ───────────────────────────────────────────
-- Les user_id seront NULL jusqu'à conversion du contrat
INSERT INTO clients (id, nom, email, titre_professionnel, secteur_activite, formule,
  montant_mensuel_xof, statut, statut_paiement, linkedin_url, whatsapp,
  biographie, piliers_contenu, ton_voix, objectifs_linkedin, stock_images, seuil_alerte_images)
VALUES
  -- Client 1 : Avocat
  ('c1000000-0000-0000-0000-000000000001',
   'Amadou Diallo', 'amadou.diallo@cabinet-diallo.sn',
   'Avocat d''affaires — Cabinet Diallo & Associés',
   'Droit des affaires', 'professionnel', 250000,
   'actif', 'paye',
   'https://linkedin.com/in/amadou-diallo', '+221771234501',
   'Avocat d''affaires avec 15 ans d''expérience en droit commercial, OHADA et arbitrage international.',
   '["Expertise métier", "Leadership", "Actualités secteur"]',
   'Formel', '["Notoriété", "Positionnement expert"]',
   6, 5),
  -- Client 2 : Entrepreneur
  ('c1000000-0000-0000-0000-000000000002',
   'Fatou Ndiaye', 'fatou@techsenegal.sn',
   'CEO & Fondatrice — TechSénégal',
   'Tech / Startups', 'essentiel', 150000,
   'actif', 'en_attente',
   'https://linkedin.com/in/fatou-ndiaye', '+221771234502',
   'Entrepreneuse tech, fondatrice de TechSénégal, accélérateur de startups africaines.',
   '["Personal / storytelling", "Leadership", "Inspiration"]',
   'Accessible', '["Génération de leads", "Recrutement"]',
   2, 5),
  -- Client 3 : Consultant
  ('c1000000-0000-0000-0000-000000000003',
   'Ibrahima Sow', 'ibrahima.sow@consult-partners.sn',
   'Directeur Associé — Consult & Partners',
   'Conseil en stratégie', 'premium', 450000,
   'actif', 'partiel',
   'https://linkedin.com/in/ibrahima-sow', '+221771234503',
   'Expert en transformation digitale et stratégie d''entreprise, 20 ans d''expérience en Afrique de l''Ouest.',
   '["Expertise métier", "Leadership", "Behind the scenes", "Actualités secteur"]',
   'Direct', '["Notoriété", "Génération de leads", "Positionnement expert"]',
   12, 8)
ON CONFLICT (id) DO NOTHING;

-- ── Posts (12 posts dans tous les statuts) ────────────────────
INSERT INTO posts (id, client_id, titre, contenu, statut, format, date_planifiee)
VALUES
  -- Amadou Diallo (client 1)
  ('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'La clause de non-concurrence en droit OHADA',
   'La clause de non-concurrence est souvent mal rédigée dans les contrats commerciaux au Sénégal. Voici les 3 erreurs les plus fréquentes que j''observe en tant qu''avocat d''affaires...

#DroitDesAffaires #OHADA #Avocat',
   'brouillon', 'texte', CURRENT_DATE + 5),

  ('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001',
   'Arbitrage international : pourquoi choisir Dakar ?',
   'Dakar s''impose comme une place arbitrale de référence en Afrique de l''Ouest. 3 raisons pour lesquelles vos contrats devraient prévoir l''arbitrage à Dakar...

#Arbitrage #Dakar #InvestirEnAfrique',
   'brouillon', 'texte', CURRENT_DATE + 8),

  ('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001',
   'Due diligence : les 5 documents indispensables',
   'Avant toute acquisition d''entreprise, voici les 5 documents juridiques que vous devez absolument auditer. J''ai vu des deals échouer par manque de rigueur sur ces points...

#DueDiligence #Acquisition #DroitCommercial',
   'propose', 'image', CURRENT_DATE + 12),

  ('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001',
   'Mon parcours : de Dakar à Paris et retour',
   'En 2010, j''ai quitté Dakar pour poursuivre un master en droit des affaires à Paris. En 2015, j''ai fait le choix de revenir. Ce choix a tout changé...

#Parcours #PersonalBranding #AvoireEnAfrique',
   'modifie', 'texte', CURRENT_DATE + 3),

  -- Fatou Ndiaye (client 2)
  ('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002',
   'TechSénégal lève 200M FCFA',
   'Aujourd''hui, je suis fière d''annoncer que TechSénégal a levé 200 millions de FCFA pour accélérer notre programme d''accompagnement des startups africaines...

#Startup #FinancementAfrique #TechSenegal',
   'valide', 'image', CURRENT_DATE - 2),

  ('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002',
   'Le syndrome de l''imposteur chez les entrepreneures',
   'On m''a souvent dit : "Tu es trop jeune pour ça." "Tu es une femme dans la tech." Voici comment j''ai appris à transformer ces doutes en moteur...

#Entrepreneuriat #Femmes #ImposteurSyndrome',
   'valide', 'texte', CURRENT_DATE - 5),

  ('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002',
   'Comment recruter les bons développeurs en Afrique',
   '5 conseils pratiques pour recruter des développeurs talentueux en Afrique de l''Ouest, sans passer par des plateformes internationales coûteuses...

#Recrutement #Tech #AfriqueOuest',
   'poste', 'texte', CURRENT_DATE - 10),

  ('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000002',
   'Présentation de notre nouveau programme',
   'Découvrez le programme Accélérateur 2026 de TechSénégal : 6 mois d''accompagnement intensif pour les startups early-stage...

#Accelerateur #Startup #TechSenegal',
   'propose', 'carrousel', CURRENT_DATE + 7),

  -- Ibrahima Sow (client 3)
  ('p1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003',
   'Transformation digitale : par où commencer ?',
   'La transformation digitale ne commence pas par la technologie. Elle commence par les hommes. Voici ma méthode en 5 étapes après 20 ans de conseil en stratégie...

#TransformationDigitale #Strategie #Management',
   'valide', 'texte', CURRENT_DATE - 1),

  ('p1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003',
   'Les 3 erreurs qui font échouer les projets de conseil',
   'Après 200+ projets de transformation, j''ai identifié 3 erreurs récurrentes qui font échouer les missions de conseil. La première vous surprendra...

#Conseil #Management #Transformation',
   'poste', 'image', CURRENT_DATE - 7),

  ('p1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000003',
   'Behind the scenes : une journée de mission',
   'Voici à quoi ressemble une journée type sur le terrain lors d''une mission de conseil stratégique. Rarement glamour, toujours intense...

#BehindTheScenes #Conseil #Strategie',
   'approuve', 'image', CURRENT_DATE + 2),

  ('p1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000003',
   'Inflation en Afrique de l''Ouest : impacts sur les PME',
   'L''inflation a grimpé de 8% en moyenne dans la zone UEMOA en 2025. Comment les PME doivent-elles adapter leur stratégie ?...

#Economie #UEMOA #PME #Strategie',
   'approuve', 'texte', CURRENT_DATE + 4)
ON CONFLICT (id) DO NOTHING;

-- ── Shootings ─────────────────────────────────────────────────
INSERT INTO shooting_history (id, client_id, date_shooting, lieu, nombre_photos, notes)
VALUES
  ('sh100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   CURRENT_DATE - 30, 'Studio Lumière, Plateau — Dakar', 35,
   'Costume bleu marine, fond blanc et fond gris. Très bonne session.'),
  ('sh100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003',
   CURRENT_DATE - 14, 'Terrasse Radisson Blu, Dakar', 48,
   'Session extérieure en plein air. Photos bureau et photos lifestyle.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shooting_plans (id, client_id, date_proposee, lieu, budget_estime_xof, option_type, statut)
VALUES
  ('sp100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
   CURRENT_DATE + 14, 'Studio BDG, Sacré-Cœur — Dakar', 75000, 'solo', 'planifie')
ON CONFLICT (id) DO NOTHING;

-- ── Images client 1 (6 images simulées) ──────────────────────
-- Note : les image_url sont des placeholders, remplacez par de vraies URLs
INSERT INTO client_images (client_id, image_url, shooting_history_id, used_in_post_id)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', 'sh100000-0000-0000-0000-000000000001', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'sh100000-0000-0000-0000-000000000001', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400', 'sh100000-0000-0000-0000-000000000001', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400', 'sh100000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400', 'sh100000-0000-0000-0000-000000000001', NULL),
  ('c1000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400', 'sh100000-0000-0000-0000-000000000001', NULL);

-- ── Invoices & paiements ──────────────────────────────────────
INSERT INTO invoices (id, client_id, numero, montant_xof, statut, date_emission, date_echeance)
VALUES
  ('i1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
   'PG-2026-001', 250000, 'paye',
   CURRENT_DATE - 35, CURRENT_DATE - 5),
  ('i1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002',
   'PG-2026-002', 150000, 'en_attente',
   CURRENT_DATE - 5, CURRENT_DATE + 25),
  ('i1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003',
   'PG-2026-003', 450000, 'en_retard',
   CURRENT_DATE - 45, CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_history (client_id, montant_xof, date_paiement, methode, notes)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 250000, CURRENT_DATE - 10, 'virement', 'Paiement intégral Mars 2026'),
  ('c1000000-0000-0000-0000-000000000003', 225000, CURRENT_DATE - 50, 'mobile_money', 'Acompte 50% — solde en attente');

-- ── Journal d'activité ────────────────────────────────────────
-- Note : user_id ci-dessous est un placeholder — remplacer par l'UUID admin réel
-- INSERT INTO activity_log (user_id, user_name, action_type, description, entity_type)
-- VALUES
--   ('00000000-0000-0000-0000-000000000000', 'Admin PG', 'client_create', 'Création client : Amadou Diallo', 'client'),
--   ('00000000-0000-0000-0000-000000000000', 'Admin PG', 'post_create', 'Post créé : La clause de non-concurrence', 'post'),
--   ('00000000-0000-0000-0000-000000000000', 'Admin PG', 'post_validate', 'Lien de validation envoyé pour le post de Fatou Ndiaye', 'post'),
--   ('00000000-0000-0000-0000-000000000000', 'Admin PG', 'shooting_plan', 'Shooting planifié pour Fatou Ndiaye le ' || (CURRENT_DATE + 14)::text, 'shooting'),
--   ('00000000-0000-0000-0000-000000000000', 'Admin PG', 'invoice_create', 'Facture PG-2026-001 créée pour Amadou Diallo', 'invoice');

-- Pour insérer les logs avec le vrai admin_id, exécutez ceci APRÈS avoir créé le compte admin :
-- UPDATE activity_log SET user_id = (SELECT id FROM auth.users WHERE email = 'admin@personagenius.sn')
--   WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- ── Résumé ───────────────────────────────────────────────────
-- Pour activer les données de démo, retirez les commentaires du bloc activity_log ci-dessus
-- et remplacez le user_id par le vrai UUID admin.
--
-- Vérification rapide :
--   SELECT COUNT(*) FROM clients;    -- doit retourner 3
--   SELECT COUNT(*) FROM posts;      -- doit retourner 12
--   SELECT COUNT(*) FROM invoices;   -- doit retourner 3
