import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { OrderStatus, Order, OrderItem } from "@/types";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json() as { status: OrderStatus };

    try {
        // 1. Get current order state to check for status transitions
        const [currentOrder] = await query<Order>(
            `SELECT * FROM orders WHERE id = $1`,
            [id]
        );

        if (!currentOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // 2. Update status
        await query(
            `UPDATE orders SET status = $1, "updatedAt" = NOW() WHERE id = $2`,
            [status, id]
        );

        // 3. Automation: If order is fulfilled/shipped, create inventory movement
        // We only do this once when transitioning TO these statuses
        const fulfilledStatuses = ["shipped", "completed", "delivered"];
        const wasFulfilled = fulfilledStatuses.includes(currentOrder.status);
        const isNowFulfilled = fulfilledStatuses.includes(status);

        if (!wasFulfilled && isNowFulfilled) {
            // Check if it's a single-product order (from legacy schema support) or multi-product
            const items = await query<OrderItem>(
                `SELECT "productId", quantity FROM order_items WHERE "orderId" = $1`,
                [id]
            );

            // Handle multi-product items
            if (items.length > 0) {
                for (const item of items) {
                    await query(
                        `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.productId, -Math.abs(item.quantity), "out", `Auto-deduction from Order #${id}`, session.user.id]
                    );
                }
            }
            // Fallback for single-product field in orders table
            else if (currentOrder.productId && currentOrder.quantity) {
                await query(
                    `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                     VALUES ($1, $2, $3, $4, $5)`,
                    [currentOrder.productId, -Math.abs(currentOrder.quantity), "out", `Auto-deduction from Order #${id}`, session.user.id]
                );
            }
        }

        return NextResponse.json({ message: "Order updated successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Update failed";
        console.error("Order Update Error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
