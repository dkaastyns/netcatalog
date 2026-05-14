import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ProductWithStock } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/products/[id] ─────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await queryOne<ProductWithStock>(
      `SELECT
        p.*,
        c."name" AS "categoryName",
        COALESCE(
          (SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId" = p."id"),
          0
        )::INTEGER AS "stockCount"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c."id"
      WHERE p."id" = $1`,
      [productId]
    );

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PUT /api/products/[id] ─────────────────────────────────
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name, slug, description, price, status, categoryId,
      formFactor, connectivity, management, warranty,
      stockAdjustment, image
    } = body;

    // Build dynamic SET clause
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      setClauses.push(`"name" = $${paramIndex++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      // Check uniqueness of the new slug (excluding current product)
      const existing = await queryOne<{ id: number }>(
        `SELECT "id" FROM products WHERE "slug" = $1 AND "id" != $2`,
        [slug, productId]
      );
      if (existing) {
        return NextResponse.json(
          { message: "A product with this slug already exists" },
          { status: 409 }
        );
      }
      setClauses.push(`"slug" = $${paramIndex++}`);
      values.push(slug);
    }
    if (description !== undefined) {
      setClauses.push(`"description" = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      setClauses.push(`"price" = $${paramIndex++}`);
      values.push(price);
    }
    if (status !== undefined) {
      setClauses.push(`"status" = $${paramIndex++}`);
      values.push(status);
    }
    if (categoryId !== undefined) {
      setClauses.push(`"categoryId" = $${paramIndex++}`);
      values.push(categoryId);
    }
    if (formFactor !== undefined) {
      setClauses.push(`"formFactor" = $${paramIndex++}`);
      values.push(formFactor);
    }
    if (connectivity !== undefined) {
      setClauses.push(`"connectivity" = $${paramIndex++}`);
      values.push(connectivity);
    }
    if (management !== undefined) {
      setClauses.push(`"management" = $${paramIndex++}`);
      values.push(management);
    }
    if (warranty !== undefined) {
      setClauses.push(`"warranty" = $${paramIndex++}`);
      values.push(warranty);
    }
    if (image !== undefined) {
      setClauses.push(`"image" = $${paramIndex++}`);
      values.push(image);
    }

    if (setClauses.length > 0) {
      setClauses.push(`"updatedAt" = NOW()`);
      values.push(productId);

      await query(
        `UPDATE products SET ${setClauses.join(", ")} WHERE "id" = $${paramIndex}`,
        values
      );
    }

    // Handle stock adjustment
    if (stockAdjustment && stockAdjustment !== 0) {
      await query(
        `INSERT INTO inventory_movements ("productId", "quantity", "type", "notes", "userId")
         VALUES ($1, $2, 'opname', 'Manual adjustment via admin', $3)`,
        [productId, stockAdjustment, session.user.id]
      );
    }

    const updatedProduct = await queryOne<ProductWithStock>(
      `SELECT
        p.*,
        c."name" AS "categoryName",
        COALESCE(
          (SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId" = p."id"),
          0
        )::INTEGER AS "stockCount"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c."id"
      WHERE p."id" = $1`,
      [productId]
    );

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found after update" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedProduct });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/products/[id] ──────────────────────────────
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // BUG-01 FIX: Verifikasi session & role sebelum menghapus
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const deleted = await queryOne(
      `DELETE FROM products WHERE "id" = $1 RETURNING "id"`,
      [productId]
    );

    if (!deleted) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
