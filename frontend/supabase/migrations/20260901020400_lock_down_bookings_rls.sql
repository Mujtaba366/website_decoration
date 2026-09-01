-- RLS lockdown, table 5/10: bookings (customer name, contact, address) has
-- no legitimate anon/authenticated use - creation, admin listing, and
-- cancel/delete all go through Flask, which now authenticates with the
-- service-role key.
--
-- To roll back:
--   CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_select_bookings" ON bookings;
DROP POLICY "anon_insert_bookings" ON bookings;
DROP POLICY "anon_update_bookings" ON bookings;
DROP POLICY "anon_delete_bookings" ON bookings;
