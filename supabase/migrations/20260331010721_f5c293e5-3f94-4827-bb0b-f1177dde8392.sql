
-- Onboarding tokens table
CREATE TABLE public.onboarding_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- Admin can manage tokens
CREATE POLICY "Admin can manage onboarding_tokens" ON public.onboarding_tokens
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Staff can view tokens
CREATE POLICY "Staff can view onboarding_tokens" ON public.onboarding_tokens
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

-- Notifications table for in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket for client profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-photos', 'client-photos', true);

-- Anyone can read (public bucket)
CREATE POLICY "Public read client photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-photos');

-- Authenticated users can upload
CREATE POLICY "Auth users can upload client photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-photos');

-- Anon can also upload (for onboarding form)
CREATE POLICY "Anon can upload client photos" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'client-photos');
