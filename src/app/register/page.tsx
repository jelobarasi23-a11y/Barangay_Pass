"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useFreighter } from "@/lib/useFreighter";
import { supabase } from "@/lib/supabase";
import { Event } from "@/types";
import toast from "react-hot-toast";
import {
  Wallet,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Copy,
  ShieldCheck,
} from "lucide-react";

type Step = "connect" | "review" | "signing" | "submitting" | "done" | "error";

function RegisterForm() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");
  const { isConnected, publicKey, connect, connecting, signXdr } = useFreighter();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>("connect");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()
      .then(({ data }) => setEvent(data));
  }, [eventId]);

  useEffect(() => {
    if (isConnected) setStep("review");
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !publicKey || !eventId) return;
    supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("resident_address", publicKey)
      .maybeSingle()
      .then(({ data }) => setAlreadyRegistered(!!data));
  }, [isConnected, publicKey, eventId]);

  const handleRegister = async () => {
    if (!event || !publicKey) return;
    setError(null);

    try {
      setStep("signing");

      const StellarSdk = await import("@stellar/stellar-sdk");
      const { rpc } = await import("@stellar/stellar-sdk");

      const server = new rpc.Server("https://soroban-testnet.stellar.org");
      const contract = new StellarSdk.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ID!
      );

      const account = await server.getAccount(publicKey);
      const paymentAmount = BigInt(Math.round(event.fee_xlm * 10_000_000));

      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "1000000",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          contract.call(
            "register_resident",
            StellarSdk.nativeToScVal(event.contract_event_id, { type: "u32" }),
            new StellarSdk.Address(publicKey).toScVal(),
            StellarSdk.nativeToScVal(paymentAmount, { type: "i128" })
          )
        )
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx) as any;

      if (sim.error && !sim.transactionData) {
        throw new Error(`Simulation failed: ${sim.error}`);
      }

      const assembled = rpc.assembleTransaction(tx, sim).build();
      const xdr = assembled.toXDR();
      const signedXdr = await signXdr(xdr);

      setStep("submitting");
      const saveRes = await fetch("/api/save-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedXdr,
          eventId: event.id,
          residentAddress: publicKey,
        }),
      });

      if (!saveRes.ok) {
        const { error } = await saveRes.json();
        throw new Error(error || "Transaction failed");
      }

      const { txHash } = await saveRes.json();
      setTxHash(txHash);
      setStep("done");
      toast.success("Registration confirmed on-chain!");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("error");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (!eventId) {
    return (
      <div className="pt-24 px-4 max-w-lg mx-auto text-center py-20">
        <p className="text-gray-400">
          No event selected.{" "}
          <a href="/events" className="text-brand-400 underline">
            Browse events
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 max-w-xl mx-auto">
      <h1
        className="text-3xl font-bold text-white mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Register for Event
      </h1>
      <p className="text-gray-400 mb-8">
        Your registration will be recorded on Stellar.
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {(["connect", "review", "signing", "submitting", "done"] as Step[]).map(
          (s, i) => {
            const steps = ["connect", "review", "signing", "submitting", "done"];
            const current = steps.indexOf(step);
            const pos = steps.indexOf(s);
            const labels = ["Connect", "Review", "Sign", "Submit", "Done"];
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    pos < current
                      ? "bg-brand-500 text-white"
                      : pos === current
                      ? "bg-brand-500/20 border border-brand-500 text-brand-400"
                      : "bg-dark-600 text-gray-600"
                  }`}
                >
                  {pos < current ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    pos === current ? "text-brand-400" : "text-gray-600"
                  }`}
                >
                  {labels[i]}
                </span>
                {i < 4 && (
                  <div
                    className={`h-px w-4 ${
                      pos < current ? "bg-brand-500" : "bg-dark-600"
                    }`}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Event card */}
      {event && (
        <div className="glass rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-1">{event.title}</h2>
          <p className="text-gray-400 text-sm mb-3">
            {new Date(event.date).toLocaleDateString("en-PH", {
              dateStyle: "full",
            })}{" "}
            · {event.location}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Registration fee</span>
            <span className="text-brand-300 font-mono font-semibold">
              {event.fee_xlm === 0 ? "Free" : `${event.fee_xlm} XLM`}
            </span>
          </div>
        </div>
      )}

      {/* Already registered */}
      {alreadyRegistered && (
        <div className="glass rounded-xl p-4 mb-6 border border-emerald-800/50 bg-emerald-900/10">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm font-medium">
              You are already registered for this event.
            </p>
          </div>
        </div>
      )}

      {/* Connect step */}
      {step === "connect" && (
        <div className="glass rounded-xl p-8 text-center">
          <Wallet size={32} className="text-brand-400 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">Connect your wallet</h3>
          <p className="text-gray-400 text-sm mb-6">
            You need Freighter wallet installed to register.
          </p>
          <button
            onClick={connect}
            disabled={connecting}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Wallet size={16} />
            {connecting ? "Connecting..." : "Connect Freighter"}
          </button>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-gray-500 mt-3 hover:text-gray-400"
          >
            Don't have Freighter? Install it here →
          </a>
        </div>
      )}

      {/* Review & register step */}
      {step === "review" && !alreadyRegistered && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Your wallet</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-300 bg-dark-700 px-2 py-1 rounded">
                {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
              </span>
              <button
                onClick={() => copyToClipboard(publicKey || "", "Address")}
                className="text-gray-500 hover:text-brand-400 transition-colors"
                title="Copy full address"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-gray-400 text-sm">Transaction type</span>
            <span className="text-sm text-white">Soroban contract call</span>
          </div>
          <button
            onClick={handleRegister}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Register & Pay{" "}
            {event?.fee_xlm ? `${event.fee_xlm} XLM` : "(Free)"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Signing step */}
      {step === "signing" && (
        <div className="glass rounded-xl p-8 text-center">
          <Loader2 size={32} className="text-brand-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-white font-semibold mb-2">Waiting for signature</h3>
          <p className="text-gray-400 text-sm">
            Check your Freighter extension and approve the transaction.
          </p>
        </div>
      )}

      {/* Submitting step */}
      {step === "submitting" && (
        <div className="glass rounded-xl p-8 text-center">
          <Loader2 size={32} className="text-brand-400 mx-auto mb-4 animate-spin" />
          <h3 className="text-white font-semibold mb-2">Submitting to Stellar</h3>
          <p className="text-gray-400 text-sm">
            Your transaction is being confirmed on-chain. This may take a few
            seconds.
          </p>
        </div>
      )}

      {/* Done step */}
      {step === "done" && txHash && (
        <div className="space-y-4">
          {/* Success header */}
          <div className="glass rounded-xl p-6 text-center border border-emerald-800/40 bg-emerald-900/10">
            <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
            <h3
              className="text-white font-semibold text-xl mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You're registered!
            </h3>
            <p className="text-gray-400 text-sm">
              Your registration has been recorded on the Stellar blockchain.
            </p>
          </div>

          {/* Wallet address for verification — prominent */}
          <div className="glass rounded-xl p-5 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-brand-400" />
              <p className="text-sm font-semibold text-white">
                Your verification wallet address
              </p>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Show this address to barangay staff when checking in. They will use it to verify your registration.
            </p>
            <div className="bg-dark-700 rounded-lg p-3 flex items-center justify-between gap-3">
              <p className="font-mono text-xs text-brand-300 break-all flex-1">
                {publicKey}
              </p>
              <button
                onClick={() => copyToClipboard(publicKey || "", "Wallet address")}
                className="flex-shrink-0 p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 transition-colors"
                title="Copy address"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* Transaction hash */}
          <div className="glass rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-2">Transaction hash</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-brand-300 break-all flex-1">
                {txHash}
              </p>
              <button
                onClick={() => copyToClipboard(txHash, "Transaction hash")}
                className="flex-shrink-0 text-gray-500 hover:text-brand-400 transition-colors"
              >
                <Copy size={13} />
              </button>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-400 text-xs hover:underline mt-3"
            >
              View on Stellar Expert <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Error step */}
      {step === "error" && error && (
        <div className="glass rounded-xl p-6 border border-red-800/40 bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold text-sm mb-1">
                Registration failed
              </p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setStep("review");
              setError(null);
            }}
            className="mt-4 btn-ghost text-sm py-2"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Suspense
        fallback={
          <div className="pt-24 px-4 text-gray-500">Loading...</div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
