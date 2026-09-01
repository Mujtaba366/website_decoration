-- RLS lockdown, table 7/10: products stays anon-readable (genuinely public
-- catalog data the storefront needs) but loses anon write access - all
-- product create/update/delete goes through admin-gated Flask endpoints,
-- which now authenticate with the service-role key.
--
-- To roll back:
--   CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_insert_products" ON products;
DROP POLICY "anon_update_products" ON products;
DROP POLICY "anon_delete_products" ON products;
