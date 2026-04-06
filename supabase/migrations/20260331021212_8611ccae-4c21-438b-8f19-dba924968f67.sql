
-- Create submission_status enum
CREATE TYPE public.submission_status AS ENUM ('en_attente', 'signed', 'converti', 'rejete');

-- Create formules table
CREATE TABLE public.formules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prix_xof integer NOT NULL DEFAULT 0,
  badge text,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  actif boolean NOT NULL DEFAULT true,
  afficher_landing boolean NOT NULL DEFAULT true,
  contract_type text NOT NULL DEFAULT 'SOLO',
  contract_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.formules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage formules" ON public.formules FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read active formules" ON public.formules FOR SELECT TO public
  USING (actif = true AND afficher_landing = true);

-- Create contract_templates table
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  nom text NOT NULL,
  contenu text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage contract_templates" ON public.contract_templates FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read contract_templates" ON public.contract_templates FOR SELECT TO public
  USING (true);

-- Create prospect_submissions table
CREATE TABLE public.prospect_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom text NOT NULL,
  nom text NOT NULL,
  profession text NOT NULL DEFAULT '',
  email text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  linkedin_url text,
  message text,
  formule_id uuid REFERENCES public.formules(id),
  formule_name text NOT NULL DEFAULT '',
  status submission_status NOT NULL DEFAULT 'en_attente',
  signature_image text,
  signed_at timestamptz,
  client_id uuid,
  accepted_terms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage prospect_submissions" ON public.prospect_submissions FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can insert prospect_submissions" ON public.prospect_submissions FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public can read own submission by id" ON public.prospect_submissions FOR SELECT TO public
  USING (true);

CREATE POLICY "Public can update submission for signing" ON public.prospect_submissions FOR UPDATE TO public
  USING (status = 'en_attente'::submission_status);

-- Seed default formules
INSERT INTO public.formules (nom, prix_xof, badge, description, features, contract_type) VALUES
(
  'Solo',
  100000,
  NULL,
  'Pour les professionnels et dirigeants individuels',
  ARRAY[
    '2 posts LinkedIn / semaine',
    'Stratégie de contenu personnalisée',
    'Calendrier éditorial mensuel',
    'Validation et retours rapides',
    'Reporting mensuel',
    'Option shooting photo (supplément)'
  ],
  'SOLO'
),
(
  'Entreprise',
  200000,
  'Populaire',
  'Pour les marques et dirigeants avec communication visuelle',
  ARRAY[
    '3 à 4 posts LinkedIn / semaine',
    'Création de visuels personnalisés incluse',
    '1 shooting trimestriel inclus',
    'Stratégie de contenu avancée',
    'Calendrier éditorial mensuel',
    'Reporting bi-mensuel',
    'Support WhatsApp prioritaire'
  ],
  'ENTREPRISE'
);

-- Seed contract templates
INSERT INTO public.contract_templates (type, nom, contenu) VALUES
(
  'SOLO',
  'Contrat Solo',
  E'CONTRAT DE PRESTATION DE SERVICES\nEN PERSONAL BRANDING\n\nEntre les soussignés :\n\nPrestataire\nNom : Abdoul Aziz FALL\nStructure : PersonaGenius — Label des Créatifs SN\nAdresse : Cité Marguery Derklé, Dakar\nEmail : hello@abdoulazizfall.com\n\nEt\n\nClient\nNom : {CLIENT_NOM}\nProfession : {CLIENT_PROFESSION}\nEmail : {CLIENT_EMAIL}\n\nArticle 1 – Objet du contrat\nLe présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire accompagne le Client dans une démarche de développement de son Personal Branding, à travers des prestations de conseil, de production de contenu et d''accompagnement personnalisé.\n\nArticle 2 – Nature des prestations — Formule {FORMULE_NOM}\nLes prestations comprennent :\n- 2 publications LinkedIn par semaine\n- Stratégie de contenu personnalisée\n- Calendrier éditorial mensuel\n- Validation de chaque post avant publication\n- Reporting mensuel de performance\n- Option shooting photo disponible en supplément\n\nArticle 3 – Durée\nLe présent contrat prend effet le {DATE_DEBUT} et est reconduit tacitement chaque mois. Résiliation possible avec 30 jours de préavis écrit.\n\nArticle 4 – Tarif et modalités de paiement\nLe montant mensuel est fixé à {FORMULE_MONTANT}.\nPaiement par virement bancaire, espèces ou mobile money en début de mois.\nUn acompte de 50% est dû à la signature du présent contrat.\n\nArticle 5 – Engagements du Prestataire\nLe Prestataire s''engage à fournir les prestations convenues avec professionnalisme, respecter les délais établis et maintenir la confidentialité des informations transmises par le Client.\n\nArticle 6 – Engagements du Client\nLe Client s''engage à participer activement (questionnaires, retours, validations), fournir les informations nécessaires et respecter le calendrier convenu.\n\nArticle 7 – Propriété intellectuelle\nLes contenus produits sont transmis au Client à usage personnel et professionnel. Toute reproduction commerciale ou transfert à un tiers est interdit sans accord écrit du Prestataire.\n\nArticle 8 – Résiliation\nRésiliation possible avec préavis écrit de 30 jours. L''acompte versé reste acquis au Prestataire.\n\nArticle 9 – Droit applicable\nLe présent contrat est régi par le droit sénégalais.\n\nFait à Dakar, le {DATE_SIGNATURE}\n\nSignature du Prestataire                    Signature du Client\nAbdoul Aziz FALL                           {CLIENT_NOM}\n\n[SIGNATURE PRESTATAIRE]                    [SIGNATURE_IMAGE_CLIENT]'
),
(
  'ENTREPRISE',
  'Contrat Entreprise',
  E'CONTRAT DE PRESTATION DE SERVICES\nEN PERSONAL BRANDING\n\nEntre les soussignés :\n\nPrestataire\nNom : Abdoul Aziz FALL\nStructure : PersonaGenius — Label des Créatifs SN\nAdresse : Cité Marguery Derklé, Dakar\nEmail : hello@abdoulazizfall.com\n\nEt\n\nClient\nNom : {CLIENT_NOM}\nProfession : {CLIENT_PROFESSION}\nEmail : {CLIENT_EMAIL}\n\nArticle 1 – Objet du contrat\nLe présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire accompagne le Client dans une démarche de développement de son Personal Branding, à travers des prestations de conseil, de production de contenu et d''accompagnement personnalisé.\n\nArticle 2 – Nature des prestations — Formule {FORMULE_NOM}\nLes prestations comprennent :\n- 3 à 4 publications LinkedIn par semaine\n- Création de visuels personnalisés incluse\n- 1 shooting photo trimestriel inclus\n- Stratégie de contenu avancée\n- Calendrier éditorial mensuel\n- Reporting bi-mensuel de performance\n- Support WhatsApp prioritaire\n\nArticle 3 – Durée\nLe présent contrat prend effet le {DATE_DEBUT} et est reconduit tacitement chaque mois. Résiliation possible avec 30 jours de préavis écrit.\n\nArticle 4 – Tarif et modalités de paiement\nLe montant mensuel est fixé à {FORMULE_MONTANT}.\nPaiement par virement bancaire, espèces ou mobile money en début de mois.\nUn acompte de 50% est dû à la signature du présent contrat.\n\nArticle 5 – Engagements du Prestataire\nLe Prestataire s''engage à fournir les prestations convenues avec professionnalisme, respecter les délais établis et maintenir la confidentialité des informations transmises par le Client.\n\nArticle 6 – Engagements du Client\nLe Client s''engage à participer activement (questionnaires, retours, validations), fournir les informations nécessaires et respecter le calendrier convenu.\n\nArticle 7 – Propriété intellectuelle\nLes contenus produits sont transmis au Client à usage personnel et professionnel. Toute reproduction commerciale ou transfert à un tiers est interdit sans accord écrit du Prestataire.\n\nArticle 8 – Résiliation\nRésiliation possible avec préavis écrit de 30 jours. L''acompte versé reste acquis au Prestataire.\n\nArticle 9 – Droit applicable\nLe présent contrat est régi par le droit sénégalais.\n\nFait à Dakar, le {DATE_SIGNATURE}\n\nSignature du Prestataire                    Signature du Client\nAbdoul Aziz FALL                           {CLIENT_NOM}\n\n[SIGNATURE PRESTATAIRE]                    [SIGNATURE_IMAGE_CLIENT]'
);
