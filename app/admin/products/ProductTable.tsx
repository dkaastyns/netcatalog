"use client";

import { useState, useRef } from "react";
import type { ProductWithStock, Category } from "@/types";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon,
  CubeIcon
} from "@heroicons/react/24/outline";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { formatCurrency } from "@/lib/format";

interface ProductTableProps {
  initialProducts: ProductWithStock[];
  categories: Category[];
}

export default function ProductTable({ initialProducts, categories }: ProductTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: 0,
    status: "draft",
    categoryId: "",
    initialStock: 0,
    formFactor: "",
    connectivity: "",
    management: "",
    warranty: "",
    stockAdjustment: 0,
    image: "",
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: 0,
      status: "draft",
      categoryId: "",
      initialStock: 0,
      formFactor: "Standard Rackmount",
      connectivity: "10/100/1000 Mbps",
      management: "Cloud Managed",
      warranty: "3-Year Advanced Replace",
      stockAdjustment: 0,
      image: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductWithStock) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price: Number(p.price),
      status: p.status,
      categoryId: p.categoryId?.toString() || "",
      initialStock: 0,
      formFactor: p.formFactor || "",
      connectivity: p.connectivity || "",
      management: p.management || "",
      warranty: p.warranty || "",
      stockAdjustment: 0,
      image: p.image || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== productToDelete));
        setIsDeleteModalOpen(false);
        router.refresh();
      }
    } catch {
      alert("Gagal menghapus produk");
    } finally {
      setLoading(false);
      setProductToDelete(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
      }
    } catch {
      alert("Unggah gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : null
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Terjadi kesalahan");
      }
    } catch {
      alert("Gagal menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge: Record<string, string> = {
    published: "nc-badge-green",
    draft: "nc-badge-amber",
    archived: "nc-badge-gray",
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Produk</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2 }}>{products.length} produk dalam katalog</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={openAddModal} className="nc-btn-primary" style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <PlusIcon className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </div>

      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface-2)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {p.image ? (
                        <Image src={p.image} alt={p.name} width={44} height={44} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                      ) : (
                        <CubeIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13.5 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td>{p.categoryName ?? <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                <td>
                  <span className={`nc-badge ${p.stockCount <= 0 ? "nc-badge-red" : p.stockCount < 10 ? "nc-badge-amber" : "nc-badge-green"}`}>
                    {p.stockCount} unit
                  </span>
                </td>
                <td><span className={`nc-badge ${statusBadge[p.status]}`}>{p.status}</span></td>
                <td>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button onClick={() => openEditModal(p)} style={{ width: 30, height: 30, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ width: 30, height: 30, border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-600)" }}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="nc-card"
              style={{ width: "100%", maxWidth: 600, padding: 0, maxHeight: "90vh", overflowY: "auto" }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--surface)", zIndex: 10 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{editingProduct ? "Ubah Produk" : "Tambah Produk Baru"}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: 24 }}>
                <div style={{ display: "grid", gap: 24 }}>
                  {/* Media & Images */}
                  <div style={{ display: "grid", gap: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: 0.5 }}>Media Produk</h3>
                    <div style={{ display: "flex", gap: 20, alignItems: "start" }}>
                      <div style={{ width: 120, height: 120, borderRadius: "var(--radius-xl)", border: "2px dashed var(--border)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                        {formData.image ? (
                          <>
                            <Image src={formData.image} alt="Preview" width={120} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                            <button type="button" onClick={() => setFormData({ ...formData, image: "" })} style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div style={{ textAlign: "center", padding: 10 }}>
                            <PhotoIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <div style={{ fontSize: 10, color: "var(--text-faint)" }}>Tanpa Gambar</div>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="nc-label">Unggah Gambar Baru</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} accept="image/*" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="nc-btn-secondary" style={{ width: "100%", justifyContent: "center", height: 42 }}>
                          {uploading ? "Mengunggah..." : "Pilih Berkas"}
                        </button>
                        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>Direkomendasikan: 800x800px. WebP, JPG, atau PNG.</p>
                        <input style={{ marginTop: 8 }} value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="nc-input" placeholder="Atau tempel URL Gambar di sini..." />
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  {/* Basic Info */}
                  <div style={{ display: "grid", gap: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: 0.5 }}>Informasi Dasar</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label className="nc-label">Nama Produk</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="nc-input" placeholder="misal: NexusCore 9000" />
                      </div>
                      <div>
                        <label className="nc-label">Slug (Unique ID)</label>
                        <input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="nc-input" placeholder="e.g. nexus-9000" />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <label className="nc-label">Harga (Rp)</label>
                        <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="nc-input" />
                      </div>
                      <div>
                        <label className="nc-label">Kategori</label>
                        <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="nc-select">
                          <option value="">Tanpa Kategori</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="nc-label">Status</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="nc-select">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="nc-label">Deskripsi</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="nc-input" style={{ minHeight: 80, resize: "vertical" }} placeholder="Ringkasan produk..." />
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  {/* Technical Specs */}
                  <div style={{ display: "grid", gap: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: 0.5 }}>Spesifikasi Teknis</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label className="nc-label">Faktor Bentuk</label>
                        <input value={formData.formFactor} onChange={e => setFormData({ ...formData, formFactor: e.target.value })} className="nc-input" placeholder="misal: Standard Rackmount" />
                      </div>
                      <div>
                        <label className="nc-label">Konektivitas</label>
                        <input value={formData.connectivity} onChange={e => setFormData({ ...formData, connectivity: e.target.value })} className="nc-input" placeholder="misal: 10/100/1000 Mbps" />
                      </div>
                      <div>
                        <label className="nc-label">Manajemen</label>
                        <input value={formData.management} onChange={e => setFormData({ ...formData, management: e.target.value })} className="nc-input" placeholder="misal: Cloud Managed" />
                      </div>
                      <div>
                        <label className="nc-label">Garansi</label>
                        <input value={formData.warranty} onChange={e => setFormData({ ...formData, warranty: e.target.value })} className="nc-input" placeholder="misal: 3-Year Advanced Replace" />
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  {/* Stock Management */}
                  <div style={{ display: "grid", gap: 16 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--text-faint)", letterSpacing: 0.5 }}>Manajemen Stok</h3>
                    {!editingProduct ? (
                      <div>
                        <label className="nc-label">Stok Awal</label>
                        <input type="number" value={formData.initialStock} onChange={e => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })} className="nc-input" placeholder="0" />
                        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Pergerakan inventaris awal akan dicatat.</p>
                      </div>
                    ) : (
                      <div style={{ background: "var(--surface-2)", padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Stok Saat Ini: {editingProduct.stockCount} unit</span>
                        </div>
                        <label className="nc-label">Penyesuaian Stok (±)</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <input type="number" value={formData.stockAdjustment} onChange={e => setFormData({ ...formData, stockAdjustment: parseInt(e.target.value) || 0 })} className="nc-input" style={{ flex: 1 }} placeholder="misal: 10 atau -5" />
                          <span style={{ fontSize: 12, color: formData.stockAdjustment > 0 ? "var(--green-600)" : formData.stockAdjustment < 0 ? "var(--red-600)" : "var(--text-faint)", fontWeight: 700 }}>
                            {formData.stockAdjustment > 0 ? `+${formData.stockAdjustment}` : formData.stockAdjustment} unit
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>Masukkan nilai positif untuk menambah, negatif untuk mengurangi stok. Tercatat sebagai &apos;opname&apos;.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 40, display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="nc-btn-secondary" style={{ flex: 1 }}>Batal</button>
                  <button type="submit" disabled={loading || uploading} className="nc-btn-primary" style={{ flex: 2 }}>
                    {loading ? "Menyimpan..." : editingProduct ? "Perbarui Produk" : "Buat Produk"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Penghapusan"
        message="Anda akan menghapus produk ini. Tindakan ini tidak dapat dibatalkan dan akan menghapus semua catatan infrastruktur terkait."
        confirmText="Hapus Item"
        isLoading={loading}
        variant="danger"
      />
    </>
  );
}
