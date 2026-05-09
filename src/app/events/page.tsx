"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types";
import { Calendar, MapPin, Users, Coins, ArrowRight, Loader2 } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });
      setEvents(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="mb-10">
          <h1
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Barangay Events
          </h1>
          <p className="text-gray-400">
            Register for upcoming community events using your Freighter wallet.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="glass rounded-xl p-16 text-center">
            <p className="text-gray-500 mb-4">No events available yet.</p>
            <Link href="/create-event" className="btn-primary inline-flex">
              Create the first event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const spotsLeft = event.max_slots - event.registered_count;
              const full = spotsLeft <= 0;

              return (
                <div
                  key={event.id}
                  className="glass rounded-xl p-6 hover:border-brand-500/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-white font-semibold text-lg leading-tight pr-4">
                      {event.title}
                    </h2>
                    {full ? (
                      <span className="badge-red flex-shrink-0">Full</span>
                    ) : (
                      <span className="badge-green flex-shrink-0">{spotsLeft} left</span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-400 mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand-400" />
                      {formatDate(event.date)} · {formatTime(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-400" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-brand-400" />
                      {event.registered_count} / {event.max_slots} registered
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins size={14} className="text-brand-400" />
                      {event.fee_xlm === 0 ? "Free" : `${event.fee_xlm} XLM`}
                    </div>
                  </div>

                  <Link
                    href={`/register?event=${event.id}`}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      full
                        ? "bg-dark-600 text-gray-500 cursor-not-allowed pointer-events-none"
                        : "btn-primary group-hover:bg-brand-600"
                    }`}
                  >
                    {full ? "Event Full" : "Register Now"}
                    {!full && <ArrowRight size={14} />}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
