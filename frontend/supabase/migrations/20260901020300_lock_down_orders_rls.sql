-- RLS lockdown, table 4/10: orders (customer name, contact, items, total)
-- has no legitimate anon/authenticated use - creation, admin listing, and
-- cancel/delete all go through Flask, which now authenticates with the
-- service-role key.
--
-- To roll back:
--   CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_select_orders" ON orders;
DROP POLICY "anon_insert_orders" ON orders;
DROP POLICY "anon_update_orders" ON orders;
DROP POLICY "anon_delete_orders" ON orders;
