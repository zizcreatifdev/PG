-- RLS policies for financial tables (invoices, payment_history, expenses)
-- Only admin can access payment_history and expenses
-- Clients can read their own invoices; admin can read/write all invoices

-- ============================================================
-- invoices
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_invoices_all" ON invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Client: read own invoices
CREATE POLICY "client_invoices_read_own" ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE c.id = invoices.client_id
        AND ur.role = 'client'
        AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- payment_history
-- ============================================================
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Admin only: full access
CREATE POLICY "admin_payment_history_all" ON payment_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- expenses
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Admin only: full access
CREATE POLICY "admin_expenses_all" ON expenses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
