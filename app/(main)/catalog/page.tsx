export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import type { ProductWithStock } from "@/types";
import CatalogClient from "./CatalogClient";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

async function getProducts() {
  return query<ProductWithStock>(`
    SELECT p.*, c."name" AS "categoryName",
      COALESCE(SUM(im."quantity"), 0)::INTEGER AS "stockCount"
    FROM products p
    LEFT JOIN categories c ON p."categoryId"=c."id"
    LEFT JOIN inventory_movements im ON im."productId" = p."id"
    WHERE p."status"='published'
    GROUP BY p."id", c."name"
    ORDER BY p."name" ASC
  `);
}

async function getCategories() {
  return query<{ name: string; slug: string }>(`SELECT name, slug FROM categories ORDER BY name ASC`);
}

export default async function CatalogPage() {
  const [products, categories, session] = await Promise.all([
    getProducts(),
    getCategories(),
    auth.api.getSession({ headers: await headers() })
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar session={session} />

      <CatalogClient initialProducts={products} categories={categories} />

      <Footer />
    </div>
  );
}
