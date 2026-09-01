-- RLS lockdown, table 2/10: payments (amounts, status, links to orders/
-- bookings) has no legitimate anon/authenticated use - all payment
-- creation/reads go through Flask, which now authenticates with the
-- service-role key (bypasses RLS) and does its own authorization.
--
-- To roll back:
--   CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY "anon_select_payments" ON payments;
DROP POLICY "anon_insert_payments" ON payments;
DROP POLICY "anon_update_payments" ON payments;
