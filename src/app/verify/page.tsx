"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Event, Registration } from "@/types";
import toast from "react-hot-toast";
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Link,
  ExternalLink,
} from "lucide-react";

interface VerifyResult {
  found: boolean;
  db_record: (Registration & { event: Event }) | null;
  on_chain: boolean;
  resident_address: string;
  event_id: string;
}

export default function VerifyPage() {
  const [address, setAddress] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchEvents = async () => {
    if (!eventSearch.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .ilike("title", `%${eventSearch}%`)
      .limit(5);
    setEvents(data || []);
    setSearching(false);
  };

  const verify = async () => {
    if (!address.trim() || !selectedEvent) {
      toast.error("Enter a wallet address and select an event.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentAddress: address.trim(),
          eventId: selectedEvent.id,
          contractEventId: selectedEvent.contract_event_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Verify Registration
          </h1>
          <p className="text-gray-400">
            Check if a resident is registered by querying both the database and
            the Stellar blockchain.
          </p>
        </div>

        {/* Event selector */}
        <div className="glass rounded-xl p-6 mb-4">
          <h2 className="text-white font-semibold mb-4">Step 1: Select Event</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchEvents()}
              placeholder="Search event by name..."
              className="input flex-1"
            />
            <button
              onClick={searchEvents}
              disabled={searching}
              className="btn-primary px-4 py-3"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>

          {events.length > 0 && (
            <div className="space-y-2">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => { setSelectedEvent(ev); setEvents([]); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                    selectedEvent?.id === ev.id
                      ? "border-brand-500 bg-brand-500/10 text-brand-300"
                      : "border-dark-500 hover:border-dark-400 text-gray-300"
                  }`}
                >
                  <span className="font-medium">{ev.title}</span>
                  <span className="text-gray-500 ml-2 text-xs">
                    {new Date(ev.date).toLocaleDateString("en-PH")}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selectedEvent && (
            <div className="mt-2 flex items-center justify-between bg-brand-500/10 border border-brand-500/30 rounded-lg px-4 py-2">
              <span className="text-brand-300 text-sm font-medium">{selectedEvent.title}</span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Address input */}
        <div className="glass rounded-xl p-6 mb-4">
          <h2 className="text-white font-semibold mb-4">Step 2: Resident Wallet Address</h2>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="G... Stellar public key"
            className="input font-mono text-sm"
          />
        </div>

        <button
          onClick={verify}
          disabled={loading || !address || !selectedEvent}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-8"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Verifying...</>
          ) : (
            <><Search size={16} /> Verify Registration</>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-up">
            {/* Overall verdict */}
            <div
              className={`rounded-xl p-6 border ${
                result.found
                  ? "border-emerald-800/50 bg-emerald-900/10"
                  : "border-red-800/50 bg-red-900/10"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {result.found ? (
                  <CheckCircle size={28} className="text-emerald-400" />
                ) : (
                  <XCircle size={28} className="text-red-400" />
                )}
                <h3
                  className={`text-xl font-bold ${
                    result.found ? "text-emerald-400" : "text-red-400"
                  }`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {result.found ? "Valid Registration" : "Not Registered"}
                </h3>
              </div>
              <p className="text-gray-400 text-sm font-mono break-all">
                {result.resident_address}
              </p>
            </div>

            {/* Check breakdown */}
            <div className="glass rounded-xl p-5 space-y-3">
              <h4 className="text-white font-semibold text-sm mb-3">Verification Details</h4>

              {/* DB check */}
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-300">Database record</span>
                </div>
                {result.db_record ? (
                  <span className="badge-green">Found</span>
                ) : (
                  <span className="badge-red">Not found</span>
                )}
              </div>

              {/* On-chain check */}
              <div className="flex items-center justify-between py-2 border-b border-dark-600">
                <div className="flex items-center gap-2">
                  <Link size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-300">On-chain (Soroban)</span>
                </div>
                {result.on_chain ? (
                  <span className="badge-green">Confirmed</span>
                ) : (
                  <span className="badge-red">Not found</span>
                )}
              </div>

              {/* TX hash */}
              {result.db_record?.tx_hash && (
                <div className="py-2">
                  <p className="text-xs text-gray-500 mb-1">Transaction hash</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-brand-300 break-all flex-1">
                      {result.db_record.tx_hash}
                    </p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${result.db_record.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <ExternalLink size={14} className="text-gray-500 hover:text-brand-400" />
                    </a>
                  </div>
                </div>
              )}

              {/* Registered at */}
              {result.db_record?.registered_at && (
                <div className="py-1">
                  <p className="text-xs text-gray-500 mb-0.5">Registered at</p>
                  <p className="text-sm text-gray-300">
                    {new Date(result.db_record.registered_at).toLocaleString("en-PH")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
