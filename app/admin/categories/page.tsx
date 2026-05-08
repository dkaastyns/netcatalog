import { query } from "@/lib/db";
import type { Category } from "@/types";
import CategoryTable from "./CategoryTable";

async function getCategories() {
  return query<Category & { productCount: number; totalStock: number }>(`
    SELECT c.*,
      COUNT(DISTINCT p."id")::INTEGER AS "productCount",
      COALESCE(SUM(im."quantity"),0)::INTEGER AS "totalStock"
    FROM categories c
    LEFT JOIN products p ON p."categoryId"=c."id"
    LEFT JOIN inventory_movements im ON im."productId"=p."id"
    GROUP BY c."id"
    ORDER BY c."name" ASC
  `);
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div style={{ padding: 28 }}>
      <CategoryTable initialCategories={categories} />
    </div>
  );
}
