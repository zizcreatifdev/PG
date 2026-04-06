
-- Landing page config table (single row, JSON content)
CREATE TABLE public.landing_page_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.landing_page_config ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage landing_page_config" ON public.landing_page_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Public read for the landing page
CREATE POLICY "Public can read landing_page_config" ON public.landing_page_config
  FOR SELECT USING (true);

-- Seed default content
INSERT INTO public.landing_page_config (content) VALUES ('{
  "headline": "Développez votre marque personnelle sur LinkedIn",
  "subtitle": "Persona Genius accompagne les leaders africains dans leur stratégie de personal branding LinkedIn avec une approche sur-mesure.",
  "cta_text": "Je démarre",
  "cta_final_text": "Prêt à transformer votre présence LinkedIn ?",
  "formules": [
    {
      "nom": "Essentiel",
      "prix": 250000,
      "features": ["2 posts par semaine", "Rédaction optimisée LinkedIn", "Calendrier éditorial mensuel", "Reporting mensuel"],
      "shooting": "Shooting photo en option"
    },
    {
      "nom": "Premium",
      "prix": 450000,
      "features": ["3-4 posts par semaine", "1 shooting trimestriel inclus", "Stratégie de contenu avancée", "Calendrier éditorial mensuel", "Reporting bi-mensuel", "Support WhatsApp prioritaire"],
      "shooting": "1 shooting trimestriel inclus",
      "popular": true
    }
  ],
  "testimonials": [
    {"nom": "Fatou N.", "titre": "CEO, TechAfrica", "texte": "Persona Genius a transformé ma visibilité sur LinkedIn. En 3 mois, mes publications atteignent 10x plus de personnes."},
    {"nom": "Ibrahima D.", "titre": "Consultant Finance", "texte": "Une équipe professionnelle qui comprend les enjeux du marché africain. Mon personal branding n''a jamais été aussi impactant."},
    {"nom": "Aminata K.", "titre": "Directrice Marketing", "texte": "Le suivi est excellent et les contenus sont toujours pertinents. Je recommande sans hésiter."}
  ],
  "faq": [
    {"question": "Combien de temps faut-il pour voir des résultats ?", "reponse": "Les premiers résultats sont généralement visibles après 4 à 6 semaines de publication régulière."},
    {"question": "Est-ce que je garde le contrôle sur mes publications ?", "reponse": "Absolument. Chaque post vous est soumis pour validation avant publication. Vous pouvez modifier ou commenter."},
    {"question": "Comment se passe le shooting photo ?", "reponse": "Nous organisons une session photo professionnelle adaptée à votre image. Les photos sont ensuite utilisées pour illustrer vos publications."},
    {"question": "Puis-je changer de formule ?", "reponse": "Oui, vous pouvez upgrader ou ajuster votre formule à tout moment en contactant votre gestionnaire."}
  ]
}'::jsonb);
