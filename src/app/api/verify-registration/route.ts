import { NextRequest, NextResponse } from "next/server";
import { checkOnChainRegistration } from "@/lib/stellar";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { residentAddress, eventId, contractEventId } = await req.json();

    if (!residentAddress || !eventId) {
      return NextResponse.json(
        { error: "Missing residentAddress or eventId" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    // 1. Check database record
    const { data: dbRecord } = await db
      .from("registrations")
      .select("*, event:events(*)")
      .eq("event_id", eventId)
      .eq("resident_address", residentAddress)
      .maybeSingle();

    // 2. Check on-chain via verify_registration(event_id, resident)
    //    Resolve contractEventId from DB if not supplied by caller
    let ceid: number | undefined = contractEventId
      ? Number(contractEventId)
      : (dbRecord as any)?.event?.contract_event_id;

    let onChain = false;
    if (ceid !== undefined) {
      onChain = await checkOnChainRegistration(residentAddress, ceid);
    }

    // If on-chain is confirmed but DB wasn't flagged, update it
    if (onChain && dbRecord && !dbRecord.contract_confirmed) {
      await db
        .from("registrations")
        .update({ contract_confirmed: true })
        .eq("id", dbRecord.id);
    }

    const found = !!(dbRecord || onChain);

    return NextResponse.json({
      found,
      db_record: dbRecord || null,
      on_chain: onChain,
      resident_address: residentAddress,
      event_id: eventId,
    });
  } catch (err: any) {
    console.error("[verify-registration]", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
