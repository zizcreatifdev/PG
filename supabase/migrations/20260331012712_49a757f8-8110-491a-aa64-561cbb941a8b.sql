
-- Expenses table for admin-only financial tracking
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categorie text NOT NULL DEFAULT 'autre',
  montant_xof integer NOT NULL DEFAULT 0,
  date_depense date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage expenses" ON public.expenses
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Allow admin to insert notifications for relance
CREATE POLICY "Admin can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
