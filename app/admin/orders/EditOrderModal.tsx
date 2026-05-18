"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { OrderWithDetails } from "@/types";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderWithDetails | null;
    onSuccess: () => void;
}

export function EditOrderModal({ isOpen, onClose, order, onSuccess }: EditOrderModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);
    const [formData, setFormData] = useState({
        customerName: order?.customerName || "",
        customerEmail: order?.customerEmail || "",
        customerPhone: order?.customerPhone || "",
        companyName: order?.companyName || "",
        notes: order?.notes || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    companyName: formData.companyName,
                    notes: formData.notes,
                }),
            });

            if (res.ok) {
                toast.success("Pesanan berhasil diperbarui");
                onSuccess();
            } else {
                throw new Error("Gagal mencatat pesanan");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Terjadi kesalahan";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div 
                className="nc-modal-overlay" 
                onClick={onClose} 
                style={{ 
                    position: "fixed", 
                    inset: 0, 
                    background: "rgba(15, 23, 42, 0.4)", 
                    backdropFilter: "blur(4px)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    zIndex: 10000, 
                    padding: 20 
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="nc-modal-content"
                    style={{ width: "100%", maxWidth: "600px", padding: 0, overflow: "hidden" }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="nc-modal-header" style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <PencilSquareIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Edit Pesanan</h2>
                                <p className="text-sm text-slate-500">Ubah rincian pesanan #{order?.id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <XMarkIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: "32px" }} className="space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="nc-label">Nama Pelanggan</label>
                                <input
                                    required
                                    type="text"
                                    className="nc-input"
                                    placeholder="misal: John Doe"
                                    value={formData.customerName}
                                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="nc-label">Alamat Email</label>
                                <input
                                    required
                                    type="email"
                                    className="nc-input"
                                    placeholder="john@example.com"
                                    value={formData.customerEmail}
                                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="nc-label">Nomor Telepon</label>
                                <input
                                    type="text"
                                    className="nc-input"
                                    placeholder="+62 ..."
                                    value={formData.customerPhone}
                                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="nc-label">Perusahaan (Opsional)</label>
                                <input
                                    type="text"
                                    className="nc-input"
                                    placeholder="Nama Perusahaan"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="nc-label">Catatan / Instruksi</label>
                            <textarea
                                className="nc-input"
                                rows={3}
                                placeholder="Tambahkan persyaratan khusus atau detail kesepakatan..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ height: "auto", paddingTop: "12px" }}
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="nc-btn-secondary flex-1 h-12 rounded-xl font-bold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="nc-btn-primary flex-[2] h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
