import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // BUG-02 FIX: Verifikasi session admin & ambil userId dari session (bukan body)
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity, type, notes } = await request.json();
    
    if (!productId || quantity === undefined || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await queryOne(
      `INSERT INTO inventory_movements ("productId", "quantity", "type", "notes", "userId")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productId, quantity, type, notes || null, session.user.id]
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
