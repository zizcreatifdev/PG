
-- Extend post_status enum with new statuses
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'propose';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'modifie';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'approuve';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'poste';

-- Add format and media columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS format text NOT NULL DEFAULT 'texte',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS sondage_question text,
  ADD COLUMN IF NOT EXISTS sondage_options text[],
  ADD COLUMN IF NOT EXISTS heure_publication timestamptz;

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true) ON CONFLICT DO NOTHING;

-- Storage policies for post-media
CREATE POLICY "Authenticated users can upload post media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "Anyone can view post media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated users can delete post media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media');
