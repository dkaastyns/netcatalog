import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ProductWithStock } from "@/types";

// ── GET /api/products ──────────────────────────────────────
// Fetch products with dynamic stock count & category name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const offset = (page - 1) * limit;

    // BUG-05 FIX: Cek apakah request datang dari admin
    const session = await auth.api.getSession({ headers: request.headers });
    const isAdmin = session?.user?.role === "admin";

    // Build WHERE clauses dynamically
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Jika bukan admin, hanya tampilkan produk yang sudah published
    if (!isAdmin) {
      conditions.push(`p."status" = 'published'`);
    }

    if (search) {
      conditions.push(`(p."name" ILIKE $${paramIndex} OR p."slug" ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && isAdmin) {
      // Filter by status hanya tersedia untuk admin
      conditions.push(`p."status" = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`p."categoryId" = $${paramIndex}`);
      params.push(parseInt(categoryId));
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Main query: products + LEFT JOIN categories + subquery for stock
    const dataQuery = `
      SELECT
        p.*,
        c."name" AS "categoryName",
        COALESCE(
          (SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId" = p."id"),
          0
        )::INTEGER AS "stockCount"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c."id"
      ${whereClause}
      ORDER BY p."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*)::INTEGER AS total
      FROM products p
      ${whereClause}
    `;

    const products = await query<ProductWithStock>(dataQuery, [
      ...params,
      limit,
      offset,
    ]);

    const countResult = await queryOne<{ total: number }>(countQuery, params);
    const total = countResult?.total ?? 0;

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/products ─────────────────────────────────────
// Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, slug, description, price, status, categoryId, initialStock,
      formFactor, connectivity, management, warranty, image
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { message: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await queryOne(
      `SELECT "id" FROM products WHERE "slug" = $1`,
      [slug]
    );
    if (existing) {
      return NextResponse.json(
        { message: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const result = await queryOne<ProductWithStock>(
      `INSERT INTO products (
        "name", "slug", "description", "price", "status", "categoryId", "createdBy",
        "formFactor", "connectivity", "management", "warranty", "image"
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        slug,
        description || null,
        price || 0,
        status || "draft",
        categoryId || null,
        session.user.id,
        formFactor || "Standard Rackmount",
        connectivity || "10/100/1000 Mbps",
        management || "Cloud Managed",
        warranty || "3-Year Advanced Replace",
        image || null
      ]
    );

    if (result && initialStock > 0) {
      await query(
        `INSERT INTO inventory_movements ("productId", "quantity", "type", "notes", "userId")
         VALUES ($1, $2, 'in', 'Initial stock entry', $3)`,
        [result.id, initialStock, session.user.id]
      );
    }

    return NextResponse.json(
      { data: { ...result, categoryName: null, stockCount: initialStock || 0 } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
