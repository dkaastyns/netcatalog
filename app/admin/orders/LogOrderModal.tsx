"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { ProductWithStock } from "@/types";

interface LogOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: ProductWithStock[];
    onSuccess: () => void;
}

export function LogOrderModal({ isOpen, onClose, products, onSuccess }: LogOrderModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);
    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        companyName: "",
        notes: "",
        productId: "",
        quantity: 1,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productId) {
            toast.error("Silakan pilih produk");
            return;
        }

        setIsLoading(true);
        try {
            const selectedProduct = Array.isArray(products) ? products.find(p => p.id === parseInt(formData.productId)) : null;
            if (!selectedProduct) throw new Error("Product not found");

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    companyName: formData.companyName,
                    notes: formData.notes,
                    items: [
                        {
                            id: selectedProduct.id,
                            quantity: formData.quantity,
                            price: selectedProduct.price
                        }
                    ]
                }),
            });

            if (res.ok) {
                toast.success("Pesanan berhasil dicatat");
                // BUG-09 FIX: Reset form setelah submit sukses
                setFormData({
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    companyName: "",
                    notes: "",
                    productId: "",
                    quantity: 1,
                });
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
                                <ShoppingBagIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Catat Pesanan Baru</h2>
                                <p className="text-sm text-slate-500">Rekam penjualan manual atau pemenuhan permintaan</p>
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

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="nc-label">Pilih Produk</label>
                                <select
                                    required
                                    className="nc-select"
                                    value={formData.productId}
                                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                >
                                    <option value="">Pilih produk...</option>
                                    {Array.isArray(products) && products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} - Rp {p.price.toLocaleString()} (Stok: {p.stockCount})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-32 space-y-2">
                                <label className="nc-label">Jumlah</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="nc-input"
                                    value={formData.quantity}
                                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
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

                        <div className="flex gap-3 pt-6 border-t border-slate-100">
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
                                {isLoading ? "Memproses..." : "Konfirmasi & Catat Pesanan"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
