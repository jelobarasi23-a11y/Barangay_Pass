"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Event, Registration } from "@/types";
import {
  Users,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";

interface EventWithRegistrations extends Event {
  registrations: Registration[];
  expanded: boolean;
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*, registrations(*)")
        .order("date", { ascending: false });

      setEvents(
        (eventsData || []).map((e: any) => ({
          ...e,
          registrations: e.registrations || [],
          expanded: false,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
    );
  };

  const totalRegistrations = events.reduce(
    (sum, e) => sum + e.registrations.length,
    0
  );

  const filteredRegs = searchAddress.trim()
    ? events.flatMap((e) =>
        e.registrations
          .filter((r) =>
            r.resident_address
              .toLowerCase()
              .includes(searchAddress.toLowerCase())
          )
          .map((r) => ({ ...r, event: e }))
      )
    : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1
              className="text-4xl font-bold text-white mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Staff Dashboard
            </h1>
            <p className="text-gray-400">Manage events and verify registrations.</p>
          </div>
          <Link href="/create-event" className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            New Event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className="glass rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Total Events</p>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {events.length}
            </p>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">Total Registrations</p>
            <p className="text-3xl font-bold text-brand-400" style={{ fontFamily: "var(--font-display)" }}>
              {totalRegistrations}
            </p>
          </div>
          <div className="glass rounded-xl p-5 col-span-2 md:col-span-1">
            <p className="text-gray-400 text-sm mb-1">Upcoming Events</p>
            <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: "var(--font-display)" }}>
              {events.filter((e) => new Date(e.date) > new Date()).length}
            </p>
          </div>
        </div>

        {/* Address search */}
        <div className="glass rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3">Quick Lookup by Address</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Paste resident Stellar address..."
              className="input font-mono text-sm flex-1"
            />
            <div className="flex items-center px-3">
              <Search size={16} className="text-gray-500" />
            </div>
          </div>
          {searchAddress && (
            <div className="mt-3 space-y-2">
              {filteredRegs.length === 0 ? (
                <div className="flex items-center gap-2 text-red-400 text-sm py-2">
                  <XCircle size={14} />
                  No registrations found for this address
                </div>
              ) : (
                filteredRegs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-2.5 text-sm"
                  >
                    <div>
                      <span className="text-white font-medium">{(r as any).event?.title}</span>
                      <span className="text-gray-500 ml-2 text-xs">
                        {new Date(r.registered_at).toLocaleDateString("en-PH")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.contract_confirmed ? (
                        <span className="badge-green"><CheckCircle size={10} /> On-chain</span>
                      ) : (
                        <span className="badge-yellow">Pending</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Events list */}
        <div>
          <h2 className="text-white font-semibold mb-4">All Events</h2>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          ) : events.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <p className="text-gray-500 mb-4">No events yet.</p>
              <Link href="/create-event" className="btn-primary inline-flex gap-2">
                <Plus size={16} /> Create Event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(event.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-dark-700/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 text-left">
                      <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar size={16} className="text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{event.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{new Date(event.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
                          <span>·</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={13} className="text-brand-400" />
                        <span className="text-white font-semibold">{event.registrations.length}</span>
                        <span className="text-gray-500">/ {event.max_slots}</span>
                      </div>
                      {event.expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                    </div>
                  </button>

                  {event.expanded && (
                    <div className="border-t border-dark-600 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-400">Registered Residents</h4>
                        <Link href="/verify" className="text-xs text-brand-400 hover:underline">Verify a resident →</Link>
                      </div>
                      {event.registrations.length === 0 ? (
                        <p className="text-gray-600 text-sm py-4 text-center">No registrations yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {event.registrations.map((reg) => (
                            <div key={reg.id} className="flex items-center justify-between bg-dark-700/60 rounded-lg px-4 py-2.5">
                              <div>
                                <p className="font-mono text-xs text-brand-300">
                                  {reg.resident_address.slice(0, 8)}...{reg.resident_address.slice(-6)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(reg.registered_at).toLocaleString("en-PH")}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {reg.contract_confirmed ? (
                                  <span className="badge-green"><CheckCircle size={10} /> Confirmed</span>
                                ) : (
                                  <span className="badge-yellow">Pending</span>
                                )}
                                {reg.tx_hash && (
                                  <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${reg.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink size={13} className="text-gray-500 hover:text-brand-400" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
