import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { name, slug, description } = await request.json();
    
    const result = await queryOne(
      `UPDATE categories SET name=$1, slug=$2, description=$3, "updatedAt"=NOW() WHERE id=$4 RETURNING *`,
      [name, slug, description, parseInt(id)]
    );
    
    if (!result) return NextResponse.json({ message: "Category not found" }, { status: 404 });
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await queryOne(`DELETE FROM categories WHERE id=$1 RETURNING id`, [parseInt(id)]);
    if (!result) return NextResponse.json({ message: "Category not found" }, { status: 404 });
    return NextResponse.json({ message: "Category deleted" });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
