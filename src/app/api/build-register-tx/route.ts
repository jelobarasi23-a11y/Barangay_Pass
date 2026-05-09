import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { residentAddress, contractEventId, paymentAmountStroops } =
      await req.json();

    if (!residentAddress || contractEventId === undefined) {
      return NextResponse.json(
        { error: "Missing residentAddress or contractEventId" },
        { status: 400 }
      );
    }

    // Return the params — client will build+simulate using Freighter's own RPC
    return NextResponse.json({
      residentAddress,
      contractEventId: Number(contractEventId),
      paymentAmountStroops: paymentAmountStroops ?? "0",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 }
    );
  }
}
