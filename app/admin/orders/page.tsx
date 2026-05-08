export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import type { OrderWithDetails } from "@/types";
import OrderTable from "./OrderTable";

async function getOrders() {
    return await query<OrderWithDetails>(`
    SELECT o.*, 
           p."name" as "productName",
           (SELECT COUNT(*) FROM order_items oi WHERE oi."orderId" = o."id") as "itemCount"
    FROM orders o
    LEFT JOIN products p ON o."productId" = p."id"
    ORDER BY o."createdAt" DESC
  `);
}

export default async function AdminOrdersPage() {
    const orders = await getOrders();

    return (
        <div style={{ padding: "12px 0" }}>
            <OrderTable initialOrders={orders} />
        </div>
    );
}
