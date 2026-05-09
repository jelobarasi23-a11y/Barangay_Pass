"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface FreighterState {
  isInstalled: boolean;
  isConnected: boolean;
  publicKey: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
}

interface FreighterContextType extends FreighterState {
  connect: () => Promise<string | null>;
  signXdr: (xdr: string) => Promise<string>;
  disconnect: () => void;
}

const FreighterContext = createContext<FreighterContextType | null>(null);

let freighterApi: any = null;
async function getApi() {
  if (freighterApi) return freighterApi;
  freighterApi = await import("@stellar/freighter-api");
  return freighterApi;
}

export function FreighterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FreighterState>({
    isInstalled: false,
    isConnected: false,
    publicKey: null,
    network: null,
    connecting: false,
    error: null,
  });

  // On mount — check if already connected and restore state
  useEffect(() => {
    const restore = async () => {
      try {
        const api = await getApi();
        const connResult = await api.isConnected();
        const installed = connResult?.isConnected === true || connResult === true;
        if (!installed) return;

        setState((s) => ({ ...s, isInstalled: true }));

        const addrResult = await api.getAddress();
        if (addrResult?.address && !addrResult?.error) {
          const netResult = await api.getNetworkDetails();
          setState((s) => ({
            ...s,
            isConnected: true,
            publicKey: addrResult.address,
            network: netResult?.networkPassphrase || null,
          }));
        }
      } catch {}
    };
    restore();
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const api = await getApi();
      const accessResult = await api.requestAccess();
      if (accessResult?.error) throw new Error(accessResult.error);

      // v5 returns address directly as string OR as { address }
      const address =
        typeof accessResult === "string"
          ? accessResult
          : accessResult?.address;

      if (!address) throw new Error("No address returned from Freighter.");

      const netResult = await api.getNetworkDetails();

      setState((s) => ({
        ...s,
        isInstalled: true,
        isConnected: true,
        publicKey: address,
        network: netResult?.networkPassphrase || null,
        connecting: false,
        error: null,
      }));

      return address;
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err?.message || "Connection failed",
      }));
      return null;
    }
  }, []);

  const signXdr = useCallback(async (xdr: string): Promise<string> => {
    const api = await getApi();
    const result = await api.signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    if (result?.error) throw new Error(result.error);
    if (result?.signedTxXdr) return result.signedTxXdr;
    if (typeof result === "string") return result;
    throw new Error("Freighter did not return a signed transaction.");
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({
      ...s,
      isConnected: false,
      publicKey: null,
      network: null,
    }));
  }, []);

  return (
    <FreighterContext.Provider
      value={{ ...state, connect, signXdr, disconnect }}
    >
      {children}
    </FreighterContext.Provider>
  );
}

export function useFreighter() {
  const ctx = useContext(FreighterContext);
  if (!ctx) throw new Error("useFreighter must be used inside FreighterProvider");
  return ctx;
}
