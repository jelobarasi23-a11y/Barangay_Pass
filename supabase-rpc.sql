-- Add this function to your Supabase SQL editor
-- (in addition to the schema in supabase-schema.sql)

create or replace function increment_registered_count(event_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update events
  set registered_count = registered_count + 1
  where id = event_id;
end;
$$;
