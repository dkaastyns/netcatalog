export const dynamic = 'force-dynamic';

import { query } from "@/lib/db";
import Link from "next/link";
import {
  CubeIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ListBulletIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

async function getDashboardData() {
  const [[products], [categories], [published], [draft], [totalStock], recentMovements, lowStock, fastMoving] = await Promise.all([
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM products`),
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM categories`),
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM products WHERE "status"='published'`),
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM products WHERE "status"='draft'`),
    query<{ total: number }>(`SELECT COALESCE(SUM("quantity"),0)::INTEGER AS total FROM inventory_movements`),
    query<{ productName: string; quantity: number; type: string; createdAt: string; userName: string }>(`
      SELECT im."quantity", im."type", im."createdAt",
        p."name" AS "productName", u."name" AS "userName"
      FROM inventory_movements im
      LEFT JOIN products p ON im."productId"=p."id"
      LEFT JOIN "user" u ON im."userId"=u."id"
      ORDER BY im."createdAt" DESC LIMIT 5
    `),
    query<{ name: string; slug: string; stockCount: number }>(`
      SELECT p."name", p."slug",
        COALESCE(SUM(im."quantity"),0)::INTEGER AS "stockCount"
      FROM products p
      LEFT JOIN inventory_movements im ON im."productId"=p."id"
      GROUP BY p."id",p."name",p."slug"
      HAVING COALESCE(SUM(im."quantity"),0) < 10
      ORDER BY "stockCount" ASC LIMIT 5
    `),
    query<{ name: string; totalOut: number }>(`
      SELECT p."name", ABS(SUM(im."quantity"))::INTEGER AS "totalOut"
      FROM inventory_movements im
      JOIN products p ON im."productId" = p."id"
      WHERE im."type" = 'out'
      GROUP BY p."id", p."name"
      ORDER BY "totalOut" DESC
      LIMIT 5
    `),
  ]);
  return {
    products: products?.count ?? 0, categories: categories?.count ?? 0,
    published: published?.count ?? 0, draft: draft?.count ?? 0,
    totalStock: totalStock?.total ?? 0, recentMovements, lowStock,
    fastMoving: fastMoving ?? [],
  };
}

export default async function AdminDashboard() {
  const d = await getDashboardData();

  const stats = [
    { label: "Total Produk", value: d.products, delta: "+2 minggu ini", up: true, color: "var(--navy-900)", bg: "rgba(42,59,84,0.1)", icon: CubeIcon },
    { label: "Diterbitkan", value: d.published, delta: "Aktif di katalog", up: true, color: "var(--green-600)", bg: "rgba(22,163,74,0.1)", icon: CheckIcon },
    { label: "Draf", value: d.draft, delta: "Menunggu tinjauan", up: false, color: "var(--amber-600)", bg: "rgba(217,119,6,0.1)", icon: ExclamationCircleIcon },
    { label: "Total Stok Unit", value: d.totalStock, delta: "Semua produk", up: true, color: "var(--blue-600)", bg: "rgba(37,99,235,0.1)", icon: ListBulletIcon },
  ];

  return (
    <div style={{ padding: "32px 28px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Dasbor</h1>
          <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>Selamat datang kembali — berikut adalah ikhtisar katalog Anda.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/products" className="nc-btn-primary" style={{ fontSize: 13, gap: 6 }}>
            <PlusIcon style={{ width: 15, height: 15 }} /> Produk Baru
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="nc-stat-card animate-fadeUp" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="nc-stat-label">{s.label}</span>
              <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                <s.icon style={{ width: 20, height: 20 }} />
              </div>
            </div>
            <div className="nc-stat-value">{s.value.toLocaleString()}</div>
            <div className={`nc-stat-delta ${s.up ? "up" : "down"}`}>
              <ArrowTrendingUpIcon style={{ width: 12, height: 12, transform: s.up ? "none" : "rotate(180deg)" }} />
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column lower */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Recent Movements */}
        <div className="nc-card animate-fadeUp delay-300" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Laporan Mutasi Stok</h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>5 pergerakan inventaris terbaru</p>
            </div>
            <Link href="/admin/inventory" style={{ fontSize: 12.5, color: "var(--navy-700)", fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", transition: "all 0.2s" }}>Lihat semua →</Link>
          </div>
          <table className="nc-table">
            <thead>
              <tr><th>Produk</th><th>Tipe</th><th>Jumlah</th><th>Oleh</th><th>Tanggal</th></tr>
            </thead>
            <tbody>
              {d.recentMovements.map((m, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.productName}</td>
                  <td>
                    <span className={`nc-badge ${m.type === "in" ? "nc-badge-green" : m.type === "out" ? "nc-badge-red" : "nc-badge-blue"}`}>
                      {m.type === "in" ? "Masuk" : m.type === "out" ? "Keluar" : m.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: m.quantity > 0 ? "var(--green-600)" : "var(--red-600)" }}>
                    {m.quantity > 0 ? "+" : ""}{m.quantity}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{m.userName}</td>
                  <td style={{ color: "var(--text-faint)", fontSize: 12 }}>{new Date(m.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                </tr>
              ))}
              {d.recentMovements.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-faint)", padding: "32px" }}>Belum ada pergerakan inventaris</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sidebar Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Low Stock */}
          <div className="nc-card animate-fadeUp delay-400" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--red-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ExclamationCircleIcon style={{ width: 18, height: 18, color: "var(--red-600)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Stok Rendah</h2>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Produk dengan &lt; 10 unit</p>
              </div>
            </div>
            <div>
              {d.lowStock.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{p.name}</div>
                  <span className={`nc-badge ${p.stockCount <= 0 ? "nc-badge-red" : p.stockCount < 5 ? "nc-badge-amber" : "nc-badge-gray"}`}>
                    {p.stockCount} unit
                  </span>
                </div>
              ))}
              {d.lowStock.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-faint)", fontSize: 13 }}>
                  ✓ Semua stok cukup
                </div>
              )}
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              <Link href="/admin/inventory" className="nc-btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 12.5, padding: "8px" }}>
                Sesuaikan Stok
              </Link>
            </div>
          </div>

          {/* Fast Moving */}
          <div className="nc-card animate-fadeUp delay-500" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowTrendingUpIcon style={{ width: 18, height: 18, color: "var(--blue-600)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Produk Terlaris</h2>
                <p style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Top 5 pengeluaran terbanyak</p>
              </div>
            </div>
            <div>
              {d.fastMoving.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{p.name}</div>
                  </div>
                  <span className="nc-badge nc-badge-blue">{p.totalOut} unit</span>
                </div>
              ))}
              {d.fastMoving.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-faint)", fontSize: 13 }}>
                  Belum ada data pergerakan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
        <Link href="/admin/products" className="nc-btn-secondary" style={{ fontSize: 13, gap: 6 }}>
          <PlusIcon style={{ width: 15, height: 15 }} /> Tambah Produk
        </Link>
        <Link href="/admin/categories" className="nc-btn-secondary" style={{ fontSize: 13, gap: 6 }}>
          <PlusIcon style={{ width: 15, height: 15 }} /> Tambah Kategori
        </Link>
        <Link href="/admin/inventory" className="nc-btn-secondary" style={{ fontSize: 13, gap: 6 }}>
          <PlusIcon style={{ width: 15, height: 15 }} /> Catat Mutasi
        </Link>
      </div>
    </div>
  );
}
