export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Product } from "@/types";
import InventoryTable from "./InventoryTable";

async function getInventoryMovements() {
  return query<{
    id: number;
    productName: string;
    productSlug: string;
    quantity: number;
    type: string;
    notes: string;
    userName: string;
    createdAt: string;
  }>(`
    SELECT im.*, p."name" AS "productName", p."slug" AS "productSlug", u."name" AS "userName"
    FROM inventory_movements im
    LEFT JOIN products p ON p."id" = im."productId"
    LEFT JOIN "user" u ON u."id" = im."userId"
    ORDER BY im."createdAt" DESC
  `);
}

async function getProducts() {
  return query<Product>(`SELECT * FROM products ORDER BY name ASC`);
}

export default async function AdminInventoryPage() {
  const [movements, products, session] = await Promise.all([
    getInventoryMovements(),
    getProducts(),
    auth.api.getSession({ headers: await headers() })
  ]);

  if (!session) return null;

  return (
    <div style={{ padding: 28 }}>
      <InventoryTable 
        initialMovements={movements} 
        products={products} 
        userId={session.user.id} 
      />
    </div>
  );
}
