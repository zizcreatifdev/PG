
-- Shooting plans table
CREATE TABLE public.shooting_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date_proposee date NOT NULL,
  lieu text NOT NULL DEFAULT '',
  budget_estime_xof integer NOT NULL DEFAULT 0,
  tenues_suggerees text,
  option_type text NOT NULL DEFAULT 'solo',
  statut text NOT NULL DEFAULT 'planifie',
  commentaire_client text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shooting_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage shooting_plans" ON public.shooting_plans FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage shooting_plans" ON public.shooting_plans FOR ALL USING (has_role(auth.uid(), 'staff'));
CREATE POLICY "Client can view own shooting_plans" ON public.shooting_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = shooting_plans.client_id AND clients.user_id = auth.uid())
);
CREATE POLICY "Client can update own shooting_plans" ON public.shooting_plans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = shooting_plans.client_id AND clients.user_id = auth.uid())
);

-- Moodboard images for shooting plans
CREATE TABLE public.moodboard_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shooting_plan_id uuid NOT NULL REFERENCES public.shooting_plans(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moodboard_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage moodboard_images" ON public.moodboard_images FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage moodboard_images" ON public.moodboard_images FOR ALL USING (has_role(auth.uid(), 'staff'));
CREATE POLICY "Client can view own moodboard_images" ON public.moodboard_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shooting_plans sp JOIN clients c ON c.id = sp.client_id
    WHERE sp.id = moodboard_images.shooting_plan_id AND c.user_id = auth.uid()
  )
);

-- Client image bank
CREATE TABLE public.client_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  shooting_history_id uuid REFERENCES public.shooting_history(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  used_in_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage client_images" ON public.client_images FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage client_images" ON public.client_images FOR ALL USING (has_role(auth.uid(), 'staff'));
CREATE POLICY "Client can view own images" ON public.client_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = client_images.client_id AND clients.user_id = auth.uid())
);

-- Storage bucket for shooting images
INSERT INTO storage.buckets (id, name, public) VALUES ('shooting-images', 'shooting-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Auth users can upload shooting images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shooting-images');
CREATE POLICY "Anyone can view shooting images" ON storage.objects FOR SELECT USING (bucket_id = 'shooting-images');
CREATE POLICY "Auth users can delete shooting images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shooting-images');
