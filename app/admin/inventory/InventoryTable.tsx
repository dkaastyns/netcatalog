"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import {
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface Movement {
  id: number;
  productName: string;
  productSlug: string;
  quantity: number;
  type: string;
  notes: string;
  userName: string;
  createdAt: string;
}

interface InventoryTableProps {
  initialMovements: Movement[];
  products: Product[];
  userId: string;
}

export default function InventoryTable({ initialMovements, products, userId }: InventoryTableProps) {
  // BUG-07+08 FIX: Tambah setter dan sinkronisasi state saat props berubah
  const [movements, setMovements] = useState(initialMovements);
  const router = useRouter();
  // Sinkronisasi state lokal saat server data berubah (setelah router.refresh)
  useEffect(() => {
    setMovements(initialMovements);
  }, [initialMovements]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productId: "",
    quantity: 0,
    type: "in",
    notes: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(movements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMovements = movements.slice(startIndex, endIndex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalQuantity = parseInt(formData.quantity.toString());
      if (formData.type === "out") {
        finalQuantity = -Math.abs(finalQuantity);
      }

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(formData.productId),
          quantity: finalQuantity,
          type: formData.type,
          notes: formData.notes,
          userId: userId
        }),
      });

      if (res.ok) {
        // BUG-07 FIX: Gunakan router.refresh() bukan window.location.reload()
        // BUG-08 FIX: Reset form setelah submit sukses
        setFormData({ productId: "", quantity: 0, type: "in", notes: "" });
        setIsModalOpen(false);
        router.refresh();
      } else {
        alert("Gagal menyimpan mutasi");
      }
    } catch {
      alert("Terjadi kesalahan saat menyimpan mutasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Mutasi Inventaris</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 2 }}>Pantau setiap transaksi stok di seluruh infrastruktur</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setIsModalOpen(true)} className="nc-btn-primary" style={{ fontSize: 13, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <PlusIcon className="w-4 h-4" />
            Tambah Penyesuaian
          </button>
        </div>
      </div>

      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Produk</th>
              <th>Tipe</th>
              <th>Jumlah</th>
              <th>Pengguna</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {currentMovements.map((m: Movement) => (
              <tr key={m.id}>
                <td style={{ color: "var(--text-faint)", fontSize: 12 }}>
                  {new Date(m.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.productName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>/{m.productSlug}</div>
                </td>
                <td>
                  <span className={`nc-badge ${m.type === 'in' ? 'nc-badge-green' :
                    m.type === 'out' ? 'nc-badge-red' : 'nc-badge-amber'
                    }`}>
                    {m.type.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: m.quantity > 0 ? "var(--green-600)" : "var(--red-600)" }}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </td>
                <td style={{ fontSize: 13 }}>{m.userName}</td>
                <td style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination UI */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface-2)"
        }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Menampilkan <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{movements.length > 0 ? startIndex + 1 : 0}</span> sampai <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{Math.min(endIndex, movements.length)}</span> dari <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{movements.length}</span> entri
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="nc-btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12, height: 32, opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Sebelumnya
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: currentPage === i + 1 ? "var(--blue-mirage)" : "white",
                    color: currentPage === i + 1 ? "white" : "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="nc-btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12, height: 32, opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="nc-card animate-scaleUp" style={{ width: "100%", maxWidth: 400, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Tambah Penyesuaian</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)" }}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Produk</label>
                  <select required value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} className="nc-select">
                    <option value="">Pilih produk...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Tipe</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="nc-select">
                      <option value="in">STOK MASUK</option>
                      <option value="out">STOK KELUAR</option>
                      <option value="opname">OPNAME</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Jumlah</label>
                    <input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="nc-input" />
                    {formData.type === "opname" && (
                      <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>
                        Gunakan tanda negatif (-) untuk barang hilang, positif (+) untuk kelebihan stok yang ditemukan.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-muted)" }}>Catatan</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="nc-input" style={{ minHeight: 80 }} placeholder="Alasan penyesuaian..." />
                </div>
              </div>
              <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="nc-btn-secondary" style={{ flex: 1 }}>Batal</button>
                <button type="submit" disabled={loading} className="nc-btn-primary" style={{ flex: 2 }}>
                  {loading ? "Menyimpan..." : "Simpan Penyesuaian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
