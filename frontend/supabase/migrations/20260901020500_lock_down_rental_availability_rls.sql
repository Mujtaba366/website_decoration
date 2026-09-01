-- RLS lockdown, table 6/10: rental_availability. Confirmed dead - defined
-- in backend/app/view.py (get/create/update/delete_availability) and
-- exposed at /api/availability, but frontend/lib/api-client.ts's
-- availabilityAPI is never called from any page/component. Superseded by
-- the global blocked_dates calendar. No anon/authenticated policy needed;
-- if this table is ever revived, add narrow policies deliberately then.
--
-- To roll back:
--   CREATE POLICY "anon_select_rental_availability" ON rental_availability FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "anon_insert_rental_availability" ON rental_availability FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_rental_availability" ON rental_availability FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_rental_availability" ON rental_availability FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_select_rental_availability" ON rental_availability;
DROP POLICY "anon_insert_rental_availability" ON rental_availability;
DROP POLICY "anon_update_rental_availability" ON rental_availability;
DROP POLICY "anon_delete_rental_availability" ON rental_availability;
