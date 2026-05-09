import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const db = supabaseAdmin();

    // Delete registrations first (foreign key constraint)
    await db.from("registrations").delete().eq("event_id", eventId);

    // Delete the event
    const { error } = await db.from("events").delete().eq("id", eventId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}