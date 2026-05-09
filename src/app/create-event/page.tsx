"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    fee_xlm: "0",
    max_slots: "50",
    staff_secret: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.date || !form.location || !form.staff_secret) {
      toast.error("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");

      toast.success("Event created on-chain!");
      setCreated(true);
      setTimeout(() => router.push("/events"), 2500);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 px-4 max-w-lg mx-auto text-center py-20">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Event Created!
          </h2>
          <p className="text-gray-400">Redirecting to events list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create Event
          </h1>
          <p className="text-gray-400">
            Create a new barangay event. This will call the Soroban contract to register the event on-chain.
          </p>
        </div>

        <div className="glass rounded-xl p-6 space-y-5">
          <div>
            <label className="label">Event Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Barangay Basketball League 2025"
              className="input"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Event details, requirements, etc."
              className="input min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date & Time *</label>
              <input
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Max Slots *</label>
              <input
                type="number"
                name="max_slots"
                value={form.max_slots}
                onChange={handleChange}
                min="1"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Location *</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Barangay Gym, Parañaque"
              className="input"
            />
          </div>

          <div>
            <label className="label">Registration Fee (XLM)</label>
            <input
              type="number"
              name="fee_xlm"
              value={form.fee_xlm}
              onChange={handleChange}
              min="0"
              step="0.1"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Set to 0 for free events</p>
          </div>

          {/* Staff secret */}
          <div className="border-t border-dark-600 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-yellow-400 text-xs font-medium">Staff authorization required</span>
            </div>
            <label className="label">Staff Stellar Secret Key *</label>
            <input
              type="password"
              name="staff_secret"
              value={form.staff_secret}
              onChange={handleChange}
              placeholder="S... (your Stellar secret key)"
              className="input font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is used server-side to sign the contract transaction. Never stored.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Creating on Stellar...</>
            ) : (
              "Create Event on Stellar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
