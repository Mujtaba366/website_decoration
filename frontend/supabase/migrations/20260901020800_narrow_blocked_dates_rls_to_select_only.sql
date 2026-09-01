-- RLS lockdown, table 9/10: blocked_dates stays anon-readable (the public
-- booking calendar needs to show which dates are unavailable) but loses
-- anon write access - manual blocking and the booking-creation "claim the
-- date" write both go through Flask, which now authenticates with the
-- service-role key.
--
-- To roll back:
--   CREATE POLICY "anon_insert_blocked_dates" ON blocked_dates FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_blocked_dates" ON blocked_dates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
--   CREATE POLICY "anon_delete_blocked_dates" ON blocked_dates FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_insert_blocked_dates" ON blocked_dates;
DROP POLICY "anon_update_blocked_dates" ON blocked_dates;
DROP POLICY "anon_delete_blocked_dates" ON blocked_dates;
