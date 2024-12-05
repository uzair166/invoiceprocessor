// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const invoices = await Invoice.find({}).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching invoices" },
      { status: 500 }
    );
  }
}
