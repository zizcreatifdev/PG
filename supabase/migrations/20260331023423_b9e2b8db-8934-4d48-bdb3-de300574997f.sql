
-- Fix: DROP the old UPDATE policy that fails because WITH CHECK defaults to USING
DROP POLICY IF EXISTS "Public can update submission for signing" ON public.prospect_submissions;

-- Recreate with proper WITH CHECK allowing status change from en_attente to signed
CREATE POLICY "Public can update submission for signing"
ON public.prospect_submissions
FOR UPDATE
TO anon, authenticated
USING (status = 'en_attente'::submission_status)
WITH CHECK (status = 'signed'::submission_status);
