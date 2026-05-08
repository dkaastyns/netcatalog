import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";

        if (!q) {
            return NextResponse.json({ products: [], categories: [], users: [], orders: [] });
        }

        const searchQuery = `%${q}%`;

        const [products, categories, users, orders] = await Promise.all([
            // Search Products
            query(`
        SELECT id, name, slug, 'product' as type 
        FROM products 
        WHERE name ILIKE $1 OR slug ILIKE $1 
        LIMIT 5
      `, [searchQuery]),

            // Search Categories
            query(`
        SELECT id, name, slug, 'category' as type 
        FROM categories 
        WHERE name ILIKE $1 OR slug ILIKE $1 
        LIMIT 5
      `, [searchQuery]),

            // Search Users
            query(`
        SELECT id, name, email, 'user' as type 
        FROM "user" 
        WHERE name ILIKE $1 OR email ILIKE $1 
        LIMIT 5
      `, [searchQuery]),

            // Search Orders
            query(`
        SELECT id, "customerName" as name, 'order' as type 
        FROM orders 
        WHERE "customerName" ILIKE $1 OR CAST(id as TEXT) ILIKE $1 
        LIMIT 5
      `, [searchQuery]),
        ]);

        return NextResponse.json({
            products,
            categories,
            users,
            orders,
        });
    } catch (error) {
        console.error("GET /api/admin/search error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
