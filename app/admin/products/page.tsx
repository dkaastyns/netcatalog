export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import type { ProductWithStock, Category } from "@/types";
import ProductTable from "./ProductTable";

async function getProducts(): Promise<ProductWithStock[]> {
  return query<ProductWithStock>(`
    SELECT p.*, c."name" AS "categoryName",
      COALESCE((SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId"=p."id"),0)::INTEGER AS "stockCount"
    FROM products p
    LEFT JOIN categories c ON p."categoryId"=c."id"
    ORDER BY p."createdAt" DESC
  `);
}

async function getCategories(): Promise<Category[]> {
  return query<Category>(`SELECT * FROM categories ORDER BY name ASC`);
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  return (
    <div style={{ padding: 28 }}>
      <ProductTable initialProducts={products} categories={categories} />
    </div>
  );
}
