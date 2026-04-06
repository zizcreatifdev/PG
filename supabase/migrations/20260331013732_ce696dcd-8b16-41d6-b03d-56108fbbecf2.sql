
-- Activity log table for staff action tracking
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  action_type text NOT NULL DEFAULT 'autre',
  description text NOT NULL DEFAULT '',
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view activity_log" ON public.activity_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can insert activity_log" ON public.activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'));

CREATE POLICY "Admin can insert activity_log" ON public.activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Agency settings table (single row)
CREATE TABLE public.agency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_agence text NOT NULL DEFAULT 'Persona Genius',
  email_contact text NOT NULL DEFAULT 'contact@personagenius.sn',
  seuil_alerte_images_global integer NOT NULL DEFAULT 8,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage agency_settings" ON public.agency_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.agency_settings (nom_agence, email_contact) VALUES ('Persona Genius', 'contact@personagenius.sn');
