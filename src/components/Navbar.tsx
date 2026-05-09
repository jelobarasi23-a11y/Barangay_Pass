"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFreighter } from "@/lib/useFreighter";
import { Wallet, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, publicKey, connect, connecting, disconnect } =
    useFreighter();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/register", label: "Register" },
    { href: "/verify", label: "Verify" },
    { href: "/dashboard", label: "Staff Dashboard" },
  ];

  const shortKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 text-xs font-bold font-mono">BP</span>
          </div>
          <span
            className="font-display text-lg font-semibold text-white group-hover:text-brand-300 transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Barangay Pass
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-brand-400 bg-brand-500/10"
                  : "text-gray-400 hover:text-white hover:bg-dark-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet button */}
        <div className="hidden md:flex items-center gap-3">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-dark-500 hover:border-brand-500 text-sm transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs text-brand-300">{shortKey}</span>
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="btn-primary flex items-center gap-2 py-2 text-sm"
            >
              <Wallet size={16} />
              {connecting ? "Connecting..." : "Connect Freighter"}
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-400"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-white/5 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === link.href
                  ? "text-brand-400 bg-brand-500/10"
                  : "text-gray-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-dark-600 mt-1">
            {isConnected ? (
              <button
                onClick={disconnect}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-brand-300"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-xs">{shortKey}</span>
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-sm"
              >
                <Wallet size={16} />
                {connecting ? "Connecting..." : "Connect Freighter"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
