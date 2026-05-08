import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { role } = await request.json();
    
    const result = await queryOne(
      `UPDATE "user" SET role=$1, "updatedAt"=NOW() WHERE id=$2 RETURNING *`,
      [role, id]
    );
    
    if (!result) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await queryOne(`DELETE FROM "user" WHERE id=$1 RETURNING id`, [id]);
    if (!result) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
