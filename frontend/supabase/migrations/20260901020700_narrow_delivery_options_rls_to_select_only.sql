-- RLS lockdown, table 8/10: delivery_options stays anon-readable (public
-- checkout needs to see the choices) but loses anon write access - all
-- create/update goes through admin-gated Flask endpoints (service role).
--
-- To roll back:
--   CREATE POLICY "anon_insert_delivery_options" ON delivery_options FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_delivery_options" ON delivery_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_delivery_options" ON delivery_options FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_insert_delivery_options" ON delivery_options;
DROP POLICY "anon_update_delivery_options" ON delivery_options;
DROP POLICY "anon_delete_delivery_options" ON delivery_options;
