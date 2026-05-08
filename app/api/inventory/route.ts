import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { productId, quantity, type, notes, userId } = await request.json();
    
    if (!productId || quantity === undefined || !type || !userId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const result = await queryOne(
      `INSERT INTO inventory_movements ("productId", "quantity", "type", "notes", "userId")
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productId, quantity, type, notes || null, userId]
    );

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
