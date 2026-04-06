
-- Extend clients table with new fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS titre_professionnel TEXT,
  ADD COLUMN IF NOT EXISTS secteur_activite TEXT,
  ADD COLUMN IF NOT EXISTS audience_cible TEXT,
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS biographie TEXT,
  ADD COLUMN IF NOT EXISTS piliers_contenu TEXT[],
  ADD COLUMN IF NOT EXISTS ton_voix TEXT,
  ADD COLUMN IF NOT EXISTS style_ecriture TEXT,
  ADD COLUMN IF NOT EXISTS sujets_a_eviter TEXT,
  ADD COLUMN IF NOT EXISTS objectifs_linkedin TEXT[],
  ADD COLUMN IF NOT EXISTS formule TEXT DEFAULT 'essentiel',
  ADD COLUMN IF NOT EXISTS date_debut DATE,
  ADD COLUMN IF NOT EXISTS date_renouvellement DATE,
  ADD COLUMN IF NOT EXISTS frequence_q1 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequence_q2 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequence_q3 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequence_q4 INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_mensuel_xof INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes_internes TEXT,
  ADD COLUMN IF NOT EXISTS stock_images INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seuil_alerte_images INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS statut_paiement TEXT DEFAULT 'en_attente',
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Create shooting history table
CREATE TABLE public.shooting_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date_shooting DATE NOT NULL,
  lieu TEXT NOT NULL DEFAULT '',
  nombre_photos INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shooting_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage shooting_history" ON public.shooting_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view shooting_history" ON public.shooting_history FOR SELECT USING (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Staff can insert shooting_history" ON public.shooting_history FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'staff'));

-- Create payment history table
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  montant_xof INTEGER NOT NULL DEFAULT 0,
  date_paiement DATE NOT NULL,
  methode TEXT,
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage payment_history" ON public.payment_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));
