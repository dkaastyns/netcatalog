"use client";

import { useState } from "react";
import type { Category } from "@/types";
import { useRouter } from "next/navigation";

import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface CategoryTableProps {
  initialCategories: (Category & { productCount: number; totalStock: number })[];
}

export default function CategoryTable({ initialCategories }: CategoryTableProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== categoryToDelete));
        setIsDeleteModalOpen(false);
        router.refresh();
      }
    } catch {
      alert("Gagal menghapus kategori");
    } finally {
      setLoading(false);
      setCategoryToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingCategory ? "PUT" : "POST";
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || "Terjadi kesalahan");
      }
    } catch {
      alert("Gagal menyimpan kategori");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Kategori</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2 }}>{categories.length} kategori terkonfigurasi</p>
        </div>
        <button onClick={openAddModal} className="nc-btn-primary" style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <PlusIcon className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Slug</th>
              <th>Produk</th>
              <th>Total Stok</th>
              <th style={{ textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</td>
                <td><code style={{ fontSize: 12, background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4 }}>{cat.slug}</code></td>
                <td><span className="nc-badge nc-badge-blue">{cat.productCount}</span></td>
                <td style={{ fontWeight: 700 }}>{cat.totalStock}</td>
                <td>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button onClick={() => openEditModal(cat)} style={{ width: 30, height: 30, border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(cat.id)} style={{ width: 30, height: 30, border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)", background: "#fff5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-600)" }}>
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="nc-card animate-scaleUp" style={{ width: "100%", maxWidth: 400, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{editingCategory ? "Ubah Kategori" : "Tambah Kategori"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Nama Kategori</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="nc-input" placeholder="misal: Saklar (Switches)" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Slug</label>
                  <input required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="nc-input" placeholder="e.g. switches" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Deskripsi</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="nc-input" style={{ minHeight: 80 }} />
                </div>
              </div>
              <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="nc-btn-secondary" style={{ flex: 1 }}>Batal</button>
                <button type="submit" disabled={loading} className="nc-btn-primary" style={{ flex: 2 }}>
                  {loading ? "Menyimpan..." : editingCategory ? "Perbarui" : "Buat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori"
        message="Apakah Anda yakin? Ini tidak akan menghapus produk, tetapi produk tersebut tidak akan memiliki kategori."
        confirmText="Hapus Kategori"
        isLoading={loading}
        variant="danger"
      />
    </>
  );
}
