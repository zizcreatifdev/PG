-- Create landing-assets storage bucket for hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the bucket
CREATE POLICY "landing-assets public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-assets');

-- Allow admin role to upload files
CREATE POLICY "landing-assets admin upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'landing-assets'
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- Allow admin role to delete files
CREATE POLICY "landing-assets admin delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'landing-assets'
  AND (auth.jwt() ->> 'role') = 'admin'
);
