"use client";
import { useState, useEffect } from "react";
import type { OrderWithDetails, OrderStatus } from "@/types";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import {
    EnvelopeIcon,
    DocumentTextIcon,
    MapPinIcon,
    PlusIcon
} from "@heroicons/react/24/outline";
import { LogOrderModal } from "./LogOrderModal";
import type { ProductWithStock } from "@/types";

export default function OrderTable({ initialOrders }: { initialOrders: OrderWithDetails[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const router = useRouter();
    // BUG-13 FIX: pathname tidak lagi digunakan sebagai dependency

    useEffect(() => {
        // BUG-13 FIX: Hanya fetch sekali saat komponen mount, bukan setiap navigasi
        fetch("/api/products?limit=100")
            .then(res => res.json())
            .then(data => setProducts(data.data || []))
            .catch(() => { });
    }, []); // dependency array kosong = hanya sekali saat mount

    const handleStatusChange = async (id: number, newStatus: OrderStatus) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
                toast.success(`Status pesanan diperbarui ke ${newStatus}`);
                router.refresh();
            } else {
                throw new Error("Gagal memperbarui");
            }
        } catch {
            toast.error("Gagal memperbarui status");
        } finally {
            setUpdatingId(null);
        }
    };

    const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
        pending: { label: "Menunggu Verifikasi", color: "nc-badge-amber" },
        preparing: { label: "Pesanan Disiapkan", color: "nc-badge-blue" },
        packing: { label: "Di Packing", color: "nc-badge-blue" },
        shipped: { label: "Dihantar", color: "nc-badge-blue" },
        out_for_delivery: { label: "Menuju Alamat", color: "nc-badge-blue" },
        delivered: { label: "Pesanan Sampai", color: "nc-badge-green" },
        completed: { label: "Transaksi Selesai", color: "nc-badge-green" },
        cancelled: { label: "Dibatalkan", color: "nc-badge-red" },
    };

    return (
        <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--navy-950)", letterSpacing: "-0.5px" }}>
                        Manajemen Pesanan
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Kelola pesanan pelanggan dan pelacakan pengiriman</p>
                </div>
                <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="nc-btn-primary"
                    style={{ gap: "8px", height: "44px", padding: "0 20px" }}
                >
                    <PlusIcon className="w-4 h-4" />
                    Catat Pesanan Baru
                </button>
            </div>

            <div className="nc-card" style={{ padding: 0, overflow: "hidden", borderRadius: "16px" }}>
                <table className="nc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--surface-2)" }}>
                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Tanggal</th>
                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Pelanggan</th>
                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Item / Paket</th>
                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Pembayaran</th>
                            <th style={{ textAlign: "left", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Status</th>
                            <th style={{ textAlign: "right", padding: "16px 24px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody style={{ verticalAlign: "middle" }}>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "64px", color: "var(--text-faint)" }}>
                                    Belum ada pesanan.
                                </td>
                            </tr>
                        ) : (
                            orders.map(o => (
                                <tr key={o.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}>
                                    <td style={{ padding: "24px", position: "relative" }}>
                                        {!o.isReadByAdmin && (
                                            <div style={{ width: "6px", height: "6px", background: "var(--red-500)", borderRadius: "50%", position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
                                        )}
                                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                                            {format(new Date(o.createdAt), "MMM dd, yyyy")}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "2px" }}>
                                            {format(new Date(o.createdAt), "HH:mm")}
                                        </div>
                                    </td>
                                    <td style={{ padding: "24px" }}>
                                        <div style={{ fontWeight: 700, color: "var(--navy-950)", fontSize: "14px", marginBottom: "2px" }}>{o.customerName}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <EnvelopeIcon className="w-3.5 h-3.5" />
                                            {o.customerEmail}
                                        </div>
                                        {o.customerPhone && (
                                            <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "2px" }}>{o.customerPhone}</div>
                                        )}
                                        {o.customerAddress && (
                                            <div style={{
                                                fontSize: "11px", color: "var(--navy-700)", marginTop: "8px",
                                                padding: "6px 10px", background: "var(--surface-2)", borderRadius: "8px",
                                                maxWidth: "220px", lineHeight: "1.4", border: "1px solid var(--border)",
                                                display: "flex", alignItems: "start", gap: 6
                                            }}>
                                                <MapPinIcon className="w-3 h-3 mt-0.5" />
                                                <span>{o.customerAddress}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: "24px" }}>
                                        <div style={{ fontWeight: 700, color: "var(--navy-900)", fontSize: "14px" }}>
                                            {o.itemCount > 1
                                                ? `${o.itemCount} Paket Item`
                                                : o.productName || "Pesanan Langsung"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                                            {o.itemCount > 1 ? "Lingkungan multi-produk" : `Jumlah: ${o.quantity} Unit`}
                                        </div>
                                    </td>
                                    <td style={{ padding: "24px" }}>
                                        {o.paymentProof ? (
                                            <a
                                                href={o.paymentProof} target="_blank" rel="noopener noreferrer"
                                                className="nc-btn-secondary"
                                                style={{
                                                    display: "inline-flex", alignItems: "center", gap: "8px",
                                                    fontSize: "12px", fontWeight: 700, padding: "8px 12px", borderRadius: "10px",
                                                    background: "white"
                                                }}
                                            >
                                                <DocumentTextIcon className="w-3.5 h-3.5" />
                                                Lihat Bukti
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "var(--text-faint)", fontStyle: "italic" }}>Menunggu unggahan</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "24px" }}>
                                        <span className={`nc-badge ${statusConfig[o.status]?.color || 'nc-badge-amber'}`} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 700 }}>
                                            {statusConfig[o.status]?.label || o.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "24px", textAlign: "right" }}>
                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <select
                                                className="nc-select"
                                                style={{
                                                    width: "180px", height: "38px", fontSize: "13px", padding: "0 12px",
                                                    borderRadius: "10px", border: "1px solid var(--border)",
                                                    cursor: "pointer"
                                                }}
                                                value={o.status}
                                                onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                                                disabled={updatingId === o.id}
                                            >
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <option key={key} value={key}>{config.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LogOrderModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                products={products}
                onSuccess={() => {
                    setIsLogModalOpen(false);
                    router.refresh();
                }}
            />
        </>
    );
}
