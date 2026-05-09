-- ============================================================
-- Barangay Pass — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Events table
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date timestamptz not null,
  location text not null,
  fee_xlm numeric(12,7) not null default 0,
  max_slots integer not null default 100,
  registered_count integer not null default 0,
  contract_event_id integer not null unique,  -- u32 on-chain ID
  organizer_address text not null,
  created_at timestamptz default now()
);

-- Registrations table
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  resident_address text not null,
  tx_hash text not null,
  contract_confirmed boolean not null default false,
  registered_at timestamptz default now(),
  unique(event_id, resident_address)  -- no duplicates
);

-- Indexes
create index if not exists idx_registrations_event on registrations(event_id);
create index if not exists idx_registrations_address on registrations(resident_address);
create index if not exists idx_registrations_tx on registrations(tx_hash);
create index if not exists idx_events_contract_id on events(contract_event_id);

-- Row Level Security (enable but allow anon reads for demo)
alter table events enable row level security;
alter table registrations enable row level security;

-- Policies: public read, service role write
create policy "Public read events" on events for select using (true);
create policy "Service role manage events" on events for all using (auth.role() = 'service_role');

create policy "Public read registrations" on registrations for select using (true);
create policy "Service role manage registrations" on registrations for all using (auth.role() = 'service_role');

-- RPC function to atomically increment registered_count
create or replace function increment_registration_count(event_id_param uuid)
returns void as $$
  update events
  set registered_count = registered_count + 1
  where id = event_id_param;
$$ language sql security definer;
