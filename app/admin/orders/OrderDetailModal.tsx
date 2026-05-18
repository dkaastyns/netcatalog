"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, DocumentTextIcon, ArrowUpTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { OrderWithDetails, OrderStatus } from "@/types";
import Image from "next/image";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderWithDetails | null;
    onSuccess: () => void;
    onDelete: (id: number) => void;
}

// Animation variants
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } },
};

const panelVariants = {
    hidden: { scale: 0.96, opacity: 0, y: 24 },
    visible: {
        scale: 1, opacity: 1, y: 0,
        transition: { type: "spring", stiffness: 350, damping: 30, delay: 0.05 },
    },
    exit: {
        scale: 0.96, opacity: 0, y: 16,
        transition: { duration: 0.18, ease: "easeIn" },
    },
};

const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { type: "spring", stiffness: 300, damping: 28, delay: 0.15 + i * 0.07 },
    }),
};

const fieldVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.22, ease: "easeOut", delay: 0.2 + i * 0.05 },
    }),
};

export function OrderDetailModal({ isOpen, onClose, order, onSuccess, onDelete }: OrderDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [savePulse, setSavePulse] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        customerName: order?.customerName || "",
        customerEmail: order?.customerEmail || "",
        customerPhone: order?.customerPhone || "",
        companyName: order?.companyName || "",
        notes: order?.notes || "",
        customerAddress: order?.customerAddress || "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync formData when order changes
    useEffect(() => {
        if (order) {
            setFormData({
                customerName: order.customerName || "",
                customerEmail: order.customerEmail || "",
                customerPhone: order.customerPhone || "",
                companyName: order.companyName || "",
                notes: order.notes || "",
                customerAddress: order.customerAddress || "",
            });
        }
    }, [order?.id]);

    if (!mounted) return null;

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders/${order!.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSavePulse(true);
                setTimeout(() => setSavePulse(false), 600);
                toast.success("Info pelanggan diperbarui");
                onSuccess();
            } else {
                throw new Error("Gagal memperbarui");
            }
        } catch {
            toast.error("Gagal menyimpan perubahan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: OrderStatus) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders/${order!.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast.success(`Status diubah menjadi ${newStatus}`);
                onSuccess();
            } else {
                const data = await res.json();
                toast.error(data.message || "Gagal mengubah status");
            }
        } catch {
            toast.error("Terjadi kesalahan jaringan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading("Mengunggah bukti...");
        const fd = new FormData();
        fd.append("file", file);

        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) {
                const updateRes = await fetch(`/api/orders/${order!.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentProof: data.url }),
                });
                if (updateRes.ok) {
                    toast.success("Bukti pembayaran berhasil diunggah", { id: toastId });
                    onSuccess();
                } else {
                    throw new Error("Gagal update DB");
                }
            } else {
                throw new Error("Gagal upload");
            }
        } catch {
            toast.error("Gagal mengunggah", { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const statusConfig: Record<OrderStatus, { label: string; color: string; dot: string }> = {
        pending: { label: "Menunggu Verifikasi", color: "nc-badge-amber", dot: "#f59e0b" },
        preparing: { label: "Disiapkan", color: "nc-badge-blue", dot: "#3b82f6" },
        packing: { label: "Di Packing", color: "nc-badge-blue", dot: "#3b82f6" },
        shipped: { label: "Dihantar", color: "nc-badge-blue", dot: "#3b82f6" },
        out_for_delivery: { label: "Menuju Alamat", color: "nc-badge-blue", dot: "#6366f1" },
        delivered: { label: "Sampai", color: "nc-badge-green", dot: "#22c55e" },
        completed: { label: "Selesai", color: "nc-badge-green", dot: "#16a34a" },
        cancelled: { label: "Dibatalkan", color: "nc-badge-red", dot: "#ef4444" },
    };

    const isDocument = order?.paymentProof?.endsWith(".pdf") || order?.paymentProof?.endsWith(".doc");
    const formFields = [
        { label: "Nama", key: "customerName", type: "text", required: true },
        { label: "Email", key: "customerEmail", type: "email", required: true },
        { label: "Telepon", key: "customerPhone", type: "text", required: false },
    ] as const;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && order && (
                <motion.div
                    key="backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(15,23,42,0.55)",
                        backdropFilter: "blur(6px)",
                        zIndex: 50,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "16px", overflowY: "auto",
                    }}
                >
                    <motion.div
                        key="panel"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: "24px",
                            width: "100%",
                            maxWidth: "900px",
                            boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
                            overflow: "hidden",
                            margin: "32px 0",
                        }}
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.25 }}
                            style={{
                                padding: "24px 32px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
                                position: "sticky", top: 0, zIndex: 10,
                            }}
                        >
                            <div>
                                <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
                                    Pesanan #{order.id}
                                    <motion.span
                                        key={order.status}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`nc-badge ${statusConfig[order.status]?.color}`}
                                        style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span style={{
                                            width: "6px", height: "6px", borderRadius: "50%",
                                            background: statusConfig[order.status]?.dot,
                                            display: "inline-block",
                                            animation: order.status === "pending" ? "pulse 1.8s infinite" : "none"
                                        }} />
                                        {statusConfig[order.status]?.label}
                                    </motion.span>
                                </h2>
                                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                                    Dibuat pada {new Date(order.createdAt).toLocaleString("id-ID")}
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <motion.select
                                    whileFocus={{ scale: 1.02 }}
                                    className="nc-select bg-white font-medium shadow-sm"
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                                    disabled={isLoading}
                                    style={{ cursor: "pointer" }}
                                >
                                    {Object.entries(statusConfig).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </motion.select>
                                <motion.button
                                    whileHover={{ scale: 1.08, backgroundColor: "#e2e8f0" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    style={{
                                        padding: "8px", background: "#f1f5f9", border: "none",
                                        borderRadius: "12px", cursor: "pointer", display: "flex",
                                        alignItems: "center", justifyContent: "center", transition: "background 0.15s"
                                    }}
                                >
                                    <XMarkIcon style={{ width: "20px", height: "20px", color: "#64748b" }} />
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Body */}
                        <div style={{ padding: "32px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>

                            {/* Left: Customer Form */}
                            <motion.div
                                custom={0}
                                variants={sectionVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                            >
                                <form onSubmit={handleSaveInfo} style={{
                                    background: "#f8fafc", borderRadius: "16px",
                                    padding: "20px", border: "1px solid #e2e8f0",
                                    display: "flex", flexDirection: "column", gap: "14px"
                                }}>
                                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                                        <DocumentTextIcon style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
                                        Data Pelanggan
                                    </h3>

                                    {formFields.map((f, i) => (
                                        <motion.div key={f.key} custom={i} variants={fieldVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                            <motion.input
                                                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(59,130,246,0.15)" }}
                                                type={f.type}
                                                className="nc-input"
                                                style={{ fontSize: "13px", transition: "box-shadow 0.15s" }}
                                                value={formData[f.key]}
                                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                required={f.required}
                                            />
                                        </motion.div>
                                    ))}

                                    {[
                                        { label: "Alamat", key: "customerAddress" as const },
                                        { label: "Catatan", key: "notes" as const },
                                    ].map((f, i) => (
                                        <motion.div key={f.key} custom={formFields.length + i} variants={fieldVariants} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <label style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                                            <motion.textarea
                                                whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(59,130,246,0.15)" }}
                                                className="nc-input"
                                                style={{ fontSize: "13px", transition: "box-shadow 0.15s", resize: "vertical" }}
                                                value={formData[f.key]}
                                                onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                                rows={2}
                                            />
                                        </motion.div>
                                    ))}

                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        animate={savePulse ? { scale: [1, 1.04, 1] } : {}}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="nc-btn-secondary w-full justify-center"
                                        style={{ fontSize: "13px", marginTop: "4px" }}
                                    >
                                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                                    </motion.button>
                                </form>

                                <motion.button
                                    whileHover={{ scale: 1.02, backgroundColor: "#fee2e2" }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { onClose(); onDelete(order.id); }}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: "8px", padding: "12px 16px", borderRadius: "12px",
                                        border: "1px solid #fecaca", color: "#dc2626",
                                        background: "#fff1f2", fontWeight: 700, cursor: "pointer",
                                        fontSize: "14px", transition: "background 0.15s"
                                    }}
                                >
                                    <TrashIcon style={{ width: "18px", height: "18px" }} />
                                    Hapus Pesanan
                                </motion.button>
                            </motion.div>

                            {/* Right: Order Items + Payment */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {/* Items Table */}
                                <motion.div
                                    custom={1}
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    style={{ border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" }}
                                >
                                    <div style={{ background: "#f8fafc", padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
                                        <h3 style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "14px" }}>Rincian Barang</h3>
                                    </div>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
                                                {["Produk", "Kuantitas", "Harga", "Subtotal"].map((h, i) => (
                                                    <th key={h} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i >= 2 ? "right" : "left" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!order.items || order.items.length === 0) && order.productName && (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    style={{ background: "#fff" }}
                                                >
                                                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{order.productName}</td>
                                                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: "13px" }}>{order.quantity}</td>
                                                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", textAlign: "right" }}>Rp {((order as any).price)?.toLocaleString("id-ID")}</td>
                                                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontSize: "13px", textAlign: "right" }}>Rp {(((order as any).price || 0) * (order.quantity || 1)).toLocaleString("id-ID")}</td>
                                                </motion.tr>
                                            )}
                                            {order.items?.map((item: { productName?: string; productId: number; quantity: number; unitPrice: number }, idx: number) => (
                                                <motion.tr
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.28 + idx * 0.06 }}
                                                    whileHover={{ backgroundColor: "#f8fafc" }}
                                                    style={{ background: "#fff", cursor: "default" }}
                                                >
                                                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>{item.productName || `Product ID ${item.productId}`}</td>
                                                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: "13px" }}>{item.quantity}</td>
                                                    <td style={{ padding: "12px 16px", color: "#475569", fontSize: "13px", textAlign: "right" }}>Rp {item.unitPrice?.toLocaleString("id-ID")}</td>
                                                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a", fontSize: "13px", textAlign: "right" }}>Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}</td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.45 }}
                                                style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}
                                            >
                                                <td colSpan={3} style={{ padding: "14px 16px", fontWeight: 800, color: "#0f172a", textAlign: "right", fontSize: "14px" }}>Total Akhir</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 800, color: "#2563eb", textAlign: "right", fontSize: "16px" }}>
                                                    Rp {((order as any).totalAmount || (((order as any).price || 0) * (order.quantity || 1))).toLocaleString("id-ID")}
                                                </td>
                                            </motion.tr>
                                        </tfoot>
                                    </table>
                                </motion.div>

                                {/* Payment Proof */}
                                <motion.div
                                    custom={2}
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                        <h3 style={{ fontWeight: 700, color: "#0f172a", margin: 0, fontSize: "14px" }}>Bukti Pembayaran</h3>
                                        <motion.button
                                            whileHover={{ scale: 1.04, color: "#1d4ed8" }}
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            style={{
                                                fontSize: "13px", fontWeight: 700, color: "#2563eb",
                                                display: "flex", alignItems: "center", gap: "4px",
                                                background: "none", border: "none", cursor: "pointer",
                                                transition: "color 0.15s"
                                            }}
                                        >
                                            <ArrowUpTrayIcon style={{ width: "16px", height: "16px" }} />
                                            {isUploading ? "Mengunggah..." : order.paymentProof ? "Ganti Bukti" : "Unggah Bukti"}
                                        </motion.button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />

                                    <AnimatePresence mode="wait">
                                        {order.paymentProof ? (
                                            <motion.div
                                                key="proof"
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.96 }}
                                                transition={{ duration: 0.2 }}
                                                style={{
                                                    borderRadius: "12px", border: "1px solid #e2e8f0",
                                                    background: "#f8fafc", padding: "8px",
                                                    display: "flex", justifyContent: "center", alignItems: "center", minHeight: "160px",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                {isDocument ? (
                                                    <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#64748b", textDecoration: "none" }}>
                                                        <DocumentTextIcon style={{ width: "48px", height: "48px" }} />
                                                        <span style={{ fontSize: "13px", fontWeight: 600, textDecoration: "underline" }}>Buka Dokumen Bukti</span>
                                                    </a>
                                                ) : (
                                                    <a href={order.paymentProof} target="_blank" rel="noopener noreferrer">
                                                        <Image src={order.paymentProof} alt="Bukti Pembayaran" width={400} height={300} style={{ maxHeight: "240px", objectFit: "contain", borderRadius: "8px" }} unoptimized />
                                                    </a>
                                                )}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                style={{
                                                    borderRadius: "12px", border: "2px dashed #e2e8f0",
                                                    background: "#f8fafc", padding: "32px",
                                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                                                    color: "#94a3b8", gap: "8px"
                                                }}
                                            >
                                                <DocumentTextIcon style={{ width: "40px", height: "40px", opacity: 0.4 }} />
                                                <p style={{ fontSize: "13px", fontWeight: 500, margin: 0 }}>Belum ada bukti pembayaran diunggah</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
