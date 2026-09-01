-- RLS lockdown, table 10/10: site_settings stays anon-readable (genuinely
-- public content - site name, contact info, page hero text) but loses
-- anon write access - admin settings updates go through Flask, which now
-- authenticates with the service-role key. No DELETE policy existed for
-- anon here to begin with.
--
-- To roll back:
--   CREATE POLICY "anon_insert_site_settings" ON site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_update_site_settings" ON site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY "anon_insert_site_settings" ON site_settings;
DROP POLICY "anon_update_site_settings" ON site_settings;
