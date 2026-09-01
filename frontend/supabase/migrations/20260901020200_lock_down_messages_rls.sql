-- RLS lockdown, table 3/10: messages (contact-form submissions) has no
-- legitimate anon/authenticated use - creation and reads go through
-- Flask, which now authenticates with the service-role key.
--
-- To roll back:
--   CREATE POLICY "anon_select_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
--   CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
--   CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);
DROP POLICY "anon_select_messages" ON messages;
DROP POLICY "anon_insert_messages" ON messages;
DROP POLICY "anon_delete_messages" ON messages;
