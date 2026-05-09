import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  scValToNative,
  Keypair,
} from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL, { allowHttp: false });
const getContract = () => new Contract(CONTRACT_ID);

function isSimError(sim: any): boolean {
  return sim && (sim.error !== undefined || sim.status === "error");
}

export async function buildRegisterTx(
  residentAddress: string,
  eventId: number,
  paymentAmount: bigint
): Promise<string> {
  const account = await server.getAccount(residentAddress);
  const contract = getContract();

  const tx = new TransactionBuilder(account, {
    fee: "1000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "register_resident",
        nativeToScVal(eventId, { type: "u32" }),
        new Address(residentAddress).toScVal(),
        nativeToScVal(paymentAmount, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx) as any;

  // If simulation has sorobanData (footprint), attach it even if there's an auth error
  // assembleTransaction handles both success and auth-only failures
  if (sim.error && !sim.transactionData) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  // assembleTransaction attaches footprint + auth entries
  // Freighter signing then satisfies require_auth()
  const assembled = rpc.assembleTransaction(tx, sim).build();
  return assembled.toXDR();
}

export async function submitAndConfirm(
  signedXdr: string
): Promise<{ txHash: string; success: boolean }> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);
  const txHash = response.hash;

  if (response.status === "ERROR") {
    throw new Error(`Submit error: ${JSON.stringify(response.errorResult)}`);
  }

  let attempts = 0;
  while (attempts < 20) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const status = await server.getTransaction(txHash);
      const s = String(status.status);
      if (s === "SUCCESS") return { txHash, success: true };
      if (s === "FAILED") throw new Error("Transaction failed on-chain");
    } catch (e: any) {
      if (
        e?.message?.includes("NOT_FOUND") ||
        e?.message?.includes("Bad union") ||
        e?.message?.includes("not found")
      ) {
        // Still pending, keep polling
      } else {
        throw e;
      }
    }
    attempts++;
  }

  return { txHash, success: false };
}

export async function checkOnChainRegistration(
  residentAddress: string,
  eventId: number
): Promise<boolean> {
  try {
    const account = await server.getAccount(residentAddress);
    const contract = getContract();

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "verify_registration",
          nativeToScVal(eventId, { type: "u32" }),
          new Address(residentAddress).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (isSimError(sim)) return false;

    const result = (sim as any).result;
    if (!result) return false;
    return scValToNative(result.retval) === true;
  } catch {
    return false;
  }
}

export async function buildCreateEventTx(
  adminAddress: string,
  eventId: number,
  feeStroops: bigint
): Promise<string> {
  const account = await server.getAccount(adminAddress);
  const contract = getContract();

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_event",
        nativeToScVal(eventId, { type: "u32" }),
        nativeToScVal(feeStroops, { type: "i128" })
      )
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (isSimError(sim)) {
    throw new Error(`Simulation failed: ${(sim as any).error}`);
  }

  return rpc.assembleTransaction(tx, sim as any).build().toXDR();
}