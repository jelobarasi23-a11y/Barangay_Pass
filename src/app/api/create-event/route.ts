import { NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  Networks,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { buildCreateEventTx, server } from "@/lib/stellar";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      description,
      date,
      location,
      fee_xlm,
      max_slots,
      staff_secret,
    } = await req.json();

    if (!title || !date || !location || !staff_secret) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate staff secret key
    let staffKeypair: Keypair;
    try {
      staffKeypair = Keypair.fromSecret(staff_secret);
    } catch {
      return NextResponse.json(
        { error: "Invalid Stellar secret key" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    // Generate a unique u32 contract event ID from current row count
    const { count } = await db
      .from("events")
      .select("*", { count: "exact", head: true });
    const contractEventId = (count || 0) + 1;

    // Convert XLM fee to stroops (i128): 1 XLM = 10,000,000 stroops
    const feeXlm = parseFloat(fee_xlm || "0");
    const feeStroops = BigInt(Math.round(feeXlm * 10_000_000));

    // Build create_event(event_id: u32, fee: i128) — admin-authed
    const xdr = await buildCreateEventTx(
      staffKeypair.publicKey(),
      contractEventId,
      feeStroops
    );

    // Sign server-side with staff keypair
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    tx.sign(staffKeypair);

    // Submit
    const submitRes = await server.sendTransaction(tx);
    if (submitRes.status === "ERROR") {
      throw new Error(
        `Stellar submit error: ${JSON.stringify(submitRes.errorResult)}`
      );
    }

    const txHash = submitRes.hash;

    // Brief wait for ledger confirmation
    await new Promise((r) => setTimeout(r, 3000));

    // Save to database
    const { data: newEvent, error: dbError } = await db
      .from("events")
      .insert({
        title,
        description: description || null,
        date: new Date(date).toISOString(),
        location,
        fee_xlm: feeXlm,
        max_slots: parseInt(max_slots || "50"),
        registered_count: 0,
        contract_event_id: contractEventId,
        organizer_address: staffKeypair.publicKey(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("[create-event] DB error:", dbError);
      return NextResponse.json(
        { error: "Event created on-chain but DB save failed", txHash },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: newEvent, txHash });
  } catch (err: any) {
    console.error("[create-event]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
