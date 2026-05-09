import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, Shield, Zap, Users, CheckCircle } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Shield size={22} className="text-brand-400" />,
      title: "Tamper-Proof Records",
      desc: "Every registration is stored on the Stellar blockchain via Soroban smart contracts — immutable and verifiable.",
    },
    {
      icon: <Zap size={22} className="text-brand-400" />,
      title: "Instant Verification",
      desc: "Barangay staff verify attendance in seconds by checking both database and on-chain state simultaneously.",
    },
    {
      icon: <Users size={22} className="text-brand-400" />,
      title: "No Duplicates",
      desc: "Smart contract logic prevents any resident from registering twice for the same event.",
    },
    {
      icon: <CheckCircle size={22} className="text-brand-400" />,
      title: "Wallet-Linked",
      desc: "Residents use Freighter wallet. Registration is tied to their Stellar address — no fake names.",
    },
  ];

  const steps = [
    { n: "01", title: "Staff creates event", desc: "Set the event name, date, location, registration fee, and max slots." },
    { n: "02", title: "Resident connects wallet", desc: "Open Freighter, connect to the site, and browse available events." },
    { n: "03", title: "Pay & register on-chain", desc: "Pay the event fee in XLM. The Soroban contract records your registration." },
    { n: "04", title: "Show up & get verified", desc: "Staff scans your wallet address. Verification checks both the database and blockchain." },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Built on Stellar · Soroban Smart Contracts
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.05] animate-fade-up"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Community events,{" "}
            <span className="text-brand-400">on-chain</span>.
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-up delay-100">
            Barangay Pass replaces paper lists and manual spreadsheets with
            blockchain-verified event registration. Residents register with
            their Stellar wallet. Staff verify in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up delay-200">
            <Link href="/events" className="btn-primary flex items-center justify-center gap-2">
              Browse Events <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn-ghost flex items-center justify-center gap-2">
              Staff Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-white text-center mb-12"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Why Barangay Pass?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="glass rounded-xl p-6 hover:border-brand-500/20 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-dark-700">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl font-bold text-white text-center mb-16"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How it works
          </h2>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-xl border border-brand-500/30 bg-brand-500/10 flex items-center justify-center"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className="text-brand-400 font-bold text-sm">{step.n}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-dark-700 text-center">
        <p className="text-gray-600 text-sm font-mono">
          Barangay Pass · Built on Stellar Testnet · For Parañaque, Las Piñas & Muntinlupa
        </p>
      </footer>
    </div>
  );
}
