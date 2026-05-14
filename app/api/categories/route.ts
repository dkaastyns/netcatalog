import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // BUG-03 FIX: Verifikasi session admin sebelum membuat kategori
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description } = await request.json();
    if (!name || !slug) return NextResponse.json({ message: "Name and slug are required" }, { status: 400 });

    const existing = await queryOne(`SELECT id FROM categories WHERE slug = $1`, [slug]);
    if (existing) return NextResponse.json({ message: "Category with this slug already exists" }, { status: 409 });

    const result = await queryOne(
      `INSERT INTO categories ("name", "slug", "description") VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, description]
    );
    return NextResponse.json({ data: result }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
