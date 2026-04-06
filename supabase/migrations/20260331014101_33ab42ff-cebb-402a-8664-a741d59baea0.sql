
-- The post_validation_tokens table was already created in the previous attempt.
-- Just add the missing client post update policy if it doesn't exist.
-- Check and create only what's missing.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Client can update own posts' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "Client can update own posts" ON public.posts
      FOR UPDATE USING (EXISTS (
        SELECT 1 FROM clients WHERE clients.id = posts.client_id AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;
