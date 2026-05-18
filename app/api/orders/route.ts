import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { CreateOrderInput } from "@/types";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json()) as CreateOrderInput;
        const { customerName, customerEmail, customerPhone, companyName, notes, items, status } = body;
        
        const initialStatus = status || "pending";

        // 1. Create the main order
        // For simplicity, if there's only 1 item, we also populate the legacy productId/quantity fields
        const firstItem = items[0];

        const [order] = await query<{ id: number }>(
            `INSERT INTO orders (
                "customerName", 
                "customerEmail", 
                "customerPhone", 
                "companyName", 
                "notes", 
                "status", 
                "productId", 
                "quantity",
                "isReadByAdmin"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
                customerName,
                customerEmail,
                customerPhone || null,
                companyName || null,
                notes || null,
                initialStatus,
                items.length === 1 ? firstItem.id : null,
                items.length === 1 ? firstItem.quantity : null,
                true // Since it's created by admin, mark as read
            ]
        );

        // 2. Create order items and handle stock if fulfilled
        const isFulfilled = ["shipped", "delivered", "completed"].includes(initialStatus);

        if (items && items.length > 0) {
            for (const item of items) {
                await query(
                    `INSERT INTO order_items ("orderId", "productId", quantity, "unitPrice")
                     VALUES ($1, $2, $3, $4)`,
                    [order.id, item.id, item.quantity, item.price]
                );

                if (isFulfilled) {
                    await query(
                        `INSERT INTO inventory_movements ("productId", quantity, type, notes, "userId")
                         VALUES ($1, $2, $3, $4, $5)`,
                        [item.id, -Math.abs(item.quantity), "out", `Pesanan Manual: Order #${order.id}`, session.user.id]
                    );
                }
            }
        }

        return NextResponse.json({
            message: "Order logged successfully",
            orderId: order.id
        }, { status: 201 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create order";
        console.error("Create Order Error:", error);
        return NextResponse.json({ message }, { status: 500 });
    }
}
