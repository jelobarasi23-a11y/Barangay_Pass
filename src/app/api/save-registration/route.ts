import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { submitAndConfirm } from "@/lib/stellar";

export async function POST(req: NextRequest) {
  try {
    const { signedXdr, eventId, residentAddress } = await req.json();

    if (!signedXdr || !eventId || !residentAddress) {
      return NextResponse.json(
        { error: "signedXdr, eventId, and residentAddress are required" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    // Check for duplicate registration
    const { data: existing } = await db
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("resident_address", residentAddress)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    // Submit to Stellar and wait for confirmation
    const { txHash, success } = await submitAndConfirm(signedXdr);

    // Save registration to DB regardless of on-chain timeout
    // (tx hash is the source of truth)
    const { error: insertError } = await db.from("registrations").insert({
      event_id: eventId,
      resident_address: residentAddress,
      tx_hash: txHash,
      contract_confirmed: success,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json(
        { error: "Transaction submitted but failed to save record." },
        { status: 500 }
      );
    }

    // Increment registered_count on the event
    await db.rpc("increment_registration_count", { event_id_param: eventId });

    return NextResponse.json({ txHash, confirmed: success });
  } catch (err: any) {
    console.error("save-registration error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
