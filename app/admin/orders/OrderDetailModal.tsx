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

export function OrderDetailModal({ isOpen, onClose, order, onSuccess, onDelete }: OrderDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted || !isOpen || !order) return null;

    const handleSaveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
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
            const res = await fetch(`/api/orders/${order.id}`, {
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
                const updateRes = await fetch(`/api/orders/${order.id}`, {
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
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
        pending: { label: "Menunggu Verifikasi", color: "nc-badge-amber" },
        preparing: { label: "Disiapkan", color: "nc-badge-blue" },
        packing: { label: "Di Packing", color: "nc-badge-blue" },
        shipped: { label: "Dihantar", color: "nc-badge-blue" },
        out_for_delivery: { label: "Menuju Alamat", color: "nc-badge-blue" },
        delivered: { label: "Sampai", color: "nc-badge-green" },
        completed: { label: "Selesai", color: "nc-badge-green" },
        cancelled: { label: "Dibatalkan", color: "nc-badge-red" },
    };

    const isDocument = order.paymentProof?.endsWith('.pdf') || order.paymentProof?.endsWith('.doc');

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                                Pesanan #{order.id}
                                <span className={`nc-badge ${statusConfig[order.status]?.color} text-sm px-3 py-1 rounded-lg`}>
                                    {statusConfig[order.status]?.label}
                                </span>
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                className="nc-select bg-white font-medium shadow-sm"
                                value={order.status}
                                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                                disabled={isLoading}
                            >
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                <XMarkIcon className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Kolom Kiri: Informasi Pelanggan & Form */}
                        <div className="lg:col-span-1 space-y-6">
                            <form onSubmit={handleSaveInfo} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
                                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                                    Data Pelanggan
                                </h3>
                                
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Nama</label>
                                    <input type="text" className="nc-input text-sm" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                                    <input type="email" className="nc-input text-sm" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Telepon</label>
                                    <input type="text" className="nc-input text-sm" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Alamat</label>
                                    <textarea className="nc-input text-sm" value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} rows={2}></textarea>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Catatan</label>
                                    <textarea className="nc-input text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2}></textarea>
                                </div>

                                <button type="submit" disabled={isLoading} className="nc-btn-secondary w-full justify-center text-sm">
                                    Simpan Perubahan
                                </button>
                            </form>

                            <button onClick={() => { onClose(); onDelete(order.id); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors">
                                <TrashIcon className="w-5 h-5" />
                                Hapus Pesanan
                            </button>
                        </div>

                        {/* Kolom Kanan: Daftar Barang & Pembayaran */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h3 className="font-bold text-slate-900">Rincian Barang</h3>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100 text-xs uppercase text-slate-500">
                                            <th className="px-6 py-3 font-semibold">Produk</th>
                                            <th className="px-6 py-3 font-semibold">Kuantitas</th>
                                            <th className="px-6 py-3 font-semibold text-right">Harga</th>
                                            <th className="px-6 py-3 font-semibold text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Untuk order manual lama yang belum masuk ke order_items (Legacy Support) */}
                                        {(!order.items || order.items.length === 0) && order.productName && (
                                            <tr className="bg-white">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{order.productName}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{order.quantity}</td>
                                                <td className="px-6 py-4 text-slate-600 text-right">Rp {order.price?.toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900 text-right">Rp {((order.price || 0) * (order.quantity || 1)).toLocaleString('id-ID')}</td>
                                            </tr>
                                        )}
                                        {/* Untuk pesanan multi-item */}
                                        {order.items?.map((item: { productName?: string, productId: number, quantity: number, unitPrice: number }, idx: number) => (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{item.productName || `Product ID ${item.productId}`}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{item.quantity}</td>
                                                <td className="px-6 py-4 text-slate-600 text-right">Rp {item.unitPrice?.toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900 text-right">Rp {(item.unitPrice * item.quantity).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50 border-t border-slate-200">
                                            <td colSpan={3} className="px-6 py-4 font-extrabold text-slate-900 text-right">Total Akhir</td>
                                            <td className="px-6 py-4 font-extrabold text-blue-600 text-right text-lg">
                                                Rp {(order.totalAmount || ((order.price || 0) * (order.quantity || 1))).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900">Bukti Pembayaran</h3>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700"
                                    >
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        {order.paymentProof ? "Ganti Bukti" : "Unggah Bukti"}
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />

                                {order.paymentProof ? (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center items-center overflow-hidden min-h-[200px]">
                                        {isDocument ? (
                                            <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-slate-500 hover:text-blue-600">
                                                <DocumentTextIcon className="w-12 h-12" />
                                                <span className="text-sm font-semibold underline">Buka Dokumen Bukti</span>
                                            </a>
                                        ) : (
                                            <a href={order.paymentProof} target="_blank" rel="noopener noreferrer">
                                                <Image src={order.paymentProof} alt="Bukti Pembayaran" width={400} height={300} className="max-h-[300px] object-contain rounded-lg" unoptimized />
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 flex flex-col items-center justify-center text-slate-400">
                                        <DocumentTextIcon className="w-12 h-12 mb-2 opacity-50" />
                                        <p className="text-sm font-medium">Belum ada bukti pembayaran diunggah</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
