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
    interface UpdateOrderPayload {
        status?: OrderStatus;
        customerName?: string;
        customerEmail?: string;
        customerPhone?: string;
        companyName?: string;
        customerAddress?: string;
        notes?: string;
        paymentProof?: string;
    }

    const body = await req.json() as UpdateOrderPayload;
    const { 
        status, 
        customerName, 
        customerEmail, 
        customerPhone, 
        companyName, 
        customerAddress, 
        notes, 
        paymentProof 
    } = body;

    try {
        // 1. Get current order state to check for status transitions
        const [currentOrder] = await query<Order>(
            `SELECT * FROM orders WHERE id = $1`,
            [id]
        );

        if (!currentOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // 2. Validate stock if transitioning to fulfilled
        const fulfilledStatuses = ["shipped", "completed", "delivered"];
        const wasFulfilled = fulfilledStatuses.includes(currentOrder.status);
        const isNowFulfilled = status ? fulfilledStatuses.includes(status) : false;

        let itemsToDeduct: OrderItem[] = [];
        let isLegacySingleProduct = false;

        if (!wasFulfilled && isNowFulfilled) {
            const items = await query<OrderItem>(
                `SELECT "productId", quantity FROM order_items WHERE "orderId" = $1`,
                [id]
            );

            if (items.length > 0) {
                for (const item of items) {
                    const [stockRow] = await query<{ stock: string }>(
                        `SELECT COALESCE(SUM(quantity), 0) as stock FROM inventory_movements WHERE "productId" = $1`,
                        [item.productId]
                    );
                    const currentStock = parseInt(stockRow?.stock || "0");
                    if (currentStock < item.quantity) {
                        return NextResponse.json({ message: `Stok produk ID ${item.productId} tidak mencukupi. Sisa stok: ${currentStock}` }, { status: 400 });
                    }
                }
                itemsToDeduct = items;
            } else if (currentOrder.productId && currentOrder.quantity) {
                const [stockRow] = await query<{ stock: string }>(
                    `SELECT COALESCE(SUM(quantity), 0) as stock FROM inventory_movements WHERE "productId" = $1`,
                    [currentOrder.productId]
                );
                const currentStock = parseInt(stockRow?.stock || "0");
                if (currentStock < currentOrder.quantity) {
                    return NextResponse.json({ message: `Stok tidak mencukupi. Sisa stok: ${currentStock}` }, { status: 400 });
                }
                isLegacySingleProduct = true;
            }
        }

        // 3. Update fields
        await query(
            `UPDATE orders SET 
                "customerName" = COALESCE($1, "customerName"),
                "customerEmail" = COALESCE($2, "customerEmail"),
                "customerPhone" = COALESCE($3, "customerPhone"),
                "companyName" = COALESCE($4, "companyName"),
                "customerAddress" = COALESCE($5, "customerAddress"),
                "notes" = COALESCE($6, "notes"),
                "paymentProof" = COALESCE($7, "paymentProof"),
                "status" = COALESCE($8, "status"),
                "updatedAt" = NOW() 
             WHERE id = $9`,
            [
                customerName ?? null, 
                customerEmail ?? null, 
                customerPhone ?? null, 
                companyName ?? null, 
                customerAddress ?? null, 
                notes ?? null, 
                paymentProof ?? null, 
                status ?? null, 
                id
            ]
        );

        // 4. Automation: Create inventory movement if transitioning to fulfilled
        if (!wasFulfilled && isNowFulfilled) {
            if (itemsToDeduct.length > 0) {
                for (const item of itemsToDeduct) {
                    await query(
                        `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.productId, -Math.abs(item.quantity), "out", `Auto-deduction from Order #${id}`, session.user.id]
                    );
                }
            } else if (isLegacySingleProduct && currentOrder.productId && currentOrder.quantity) {
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

export async function DELETE(
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

    try {
        const [currentOrder] = await query<Order>(
            `SELECT * FROM orders WHERE id = $1`,
            [id]
        );

        if (!currentOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 });
        }

        // If order was already fulfilled, we need to restock
        const fulfilledStatuses = ["shipped", "completed", "delivered"];
        const wasFulfilled = fulfilledStatuses.includes(currentOrder.status);

        if (wasFulfilled) {
            const items = await query<OrderItem>(
                `SELECT "productId", quantity FROM order_items WHERE "orderId" = $1`,
                [id]
            );

            if (items.length > 0) {
                for (const item of items) {
                    await query(
                        `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.productId, Math.abs(item.quantity), "in", `Restock dari penghapusan Order #${id}`, session.user.id]
                    );
                }
            } else if (currentOrder.productId && currentOrder.quantity) {
                await query(
                    `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                     VALUES ($1, $2, $3, $4, $5)`,
                    [currentOrder.productId, Math.abs(currentOrder.quantity), "in", `Restock dari penghapusan Order #${id}`, session.user.id]
                );
            }
        }

        // Delete order (cascades to order_items if foreign key is set up, but let's delete order_items explicitly just in case)
        await query(`DELETE FROM order_items WHERE "orderId" = $1`, [id]);
        await query(`DELETE FROM orders WHERE id = $1`, [id]);

        return NextResponse.json({ message: "Order deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Delete failed";
        console.error("Order Delete Error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
