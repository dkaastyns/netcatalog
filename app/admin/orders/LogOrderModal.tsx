"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ShoppingBagIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import type { ProductWithStock } from "@/types";
import Image from "next/image";

interface LogOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: ProductWithStock[];
    onSuccess: () => void;
}

export function LogOrderModal({ isOpen, onClose, products, onSuccess }: LogOrderModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        status: "completed",
        paymentProof: "",
    });

    const selectedProductObj = Array.isArray(products) && formData.productId
        ? products.find(p => p.id === parseInt(formData.productId))
        : null;
    const totalPrice = selectedProductObj ? selectedProductObj.price * formData.quantity : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productId || !formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.companyName || !formData.notes || !formData.paymentProof) {
            toast.error("Silakan lengkapi semua informasi termasuk bukti pembayaran");
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
                    ],
                    status: formData.status,
                    paymentProof: formData.paymentProof || undefined,
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
                    status: "completed",
                    paymentProof: "",
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) {
                setFormData(prev => ({ ...prev, paymentProof: data.url }));
                toast.success("Bukti pembayaran berhasil diunggah");
            }
        } catch {
            toast.error("Gagal mengunggah bukti pembayaran");
        } finally {
            setIsUploading(false);
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
                    style={{ width: "100%", maxWidth: "600px", padding: 0, maxHeight: "90vh", overflowY: "auto" }}
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
                                    required
                                    type="text"
                                    className="nc-input"
                                    placeholder="+62 ..."
                                    value={formData.customerPhone}
                                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="nc-label">Perusahaan</label>
                                <input
                                    required
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
                            <div className="flex gap-6">
                                <div className="w-1/3 space-y-2">
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
                                <div className="w-2/3 space-y-2">
                                    <label className="nc-label">Status Awal</label>
                                    <select
                                        className="nc-select"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="pending">Menunggu Verifikasi</option>
                                        <option value="completed">Transaksi Selesai (Langsung potong stok)</option>
                                        <option value="shipped">Dihantar (Langsung potong stok)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="nc-label">Catatan / Instruksi</label>
                            <textarea
                                required
                                className="nc-input"
                                rows={3}
                                placeholder="Tambahkan persyaratan khusus atau detail kesepakatan..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ height: "auto", paddingTop: "12px" }}
                            />
                        </div>

                        {/* Payment Proof */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label className="nc-label">Bukti Pembayaran</label>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept="image/*,.pdf" />
                            <div style={{ display: "flex", gap: 12, alignItems: "start" }}>
                                {formData.paymentProof ? (
                                    <div style={{ width: 80, height: 80, borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                                        <Image src={formData.paymentProof} alt="Bukti" width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        <button type="button" onClick={() => setFormData({ ...formData, paymentProof: "" })} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed var(--border)", background: "var(--surface-2, #f8f9fa)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <PhotoIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="nc-btn-secondary" style={{ width: "100%", justifyContent: "center", height: 38, fontSize: 13 }}>
                                        {isUploading ? "Mengunggah..." : formData.paymentProof ? "Ganti Bukti" : "Unggah Bukti Pembayaran"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                            {selectedProductObj && (
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm font-medium text-slate-500">Estimasi Total Pembayaran</span>
                                    <span className="text-xl font-extrabold text-slate-900">
                                        Rp {totalPrice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            )}
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
                                    {isLoading ? "Memproses..." : "Konfirmasi & Catat Pesanan"}
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
