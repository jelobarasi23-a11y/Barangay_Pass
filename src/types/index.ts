export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  fee_xlm: number;
  max_slots: number;
  registered_count: number;
  contract_event_id: number;
  organizer_address: string;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  resident_address: string;
  tx_hash: string;
  contract_confirmed: boolean;
  registered_at: string;
  event?: Event;
}

export interface VerificationResult {
  found: boolean;
  db_record: Registration | null;
  on_chain: boolean;
  resident_address: string;
  event_id: string;
}

export interface FreighterNetwork {
  network: string;
  networkUrl: string;
  networkPassphrase: string;
}
