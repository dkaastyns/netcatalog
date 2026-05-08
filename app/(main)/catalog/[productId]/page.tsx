import Link from "next/link";
import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import type { ProductWithStock } from "@/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";

async function getProduct(slug: string) {
  const [product] = await query<ProductWithStock>(`
    SELECT p.*, c."name" AS "categoryName", c."slug" AS "categorySlug",
      COALESCE((SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId"=p."id"),0)::INTEGER AS "stockCount"
    FROM products p
    LEFT JOIN categories c ON p."categoryId"=c."id"
    WHERE p."slug" = $1
  `, [slug]);
  return product;
}

import {
  ChevronRightIcon,
  CheckIcon,
  InformationCircleIcon,
  CommandLineIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  WifiIcon,
  CubeIcon
} from "@heroicons/react/24/outline";

// Icons for category (matching HomePage)
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  routers: CommandLineIcon,
  switches: CpuChipIcon,
  security: ShieldCheckIcon,
  wireless: WifiIcon,
  default: CubeIcon,
};

function CategoryIcon({ slug, className }: { slug: string, className?: string }) {
  const key = Object.keys(categoryIcons).find(k => slug?.includes(k)) ?? "default";
  const Icon = categoryIcons[key];
  return <Icon className={className} />;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* ── Navigation ─────────────────────────────── */}
      <Navbar session={session} />

      <main className="container-xl" style={{ padding: "48px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "40px" }}>
          <Link href="/" style={{ opacity: 0.8 }}>Home</Link>
          <ChevronRightIcon className="w-3 h-3" />
          <Link href="/catalog" style={{ opacity: 0.8 }}>Katalog</Link>
          <ChevronRightIcon className="w-3 h-3" />
          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{product.name}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: "64px", alignItems: "start" }}>

          <div className="animate-fadeUp">
            {/* Product Visual Hero */}
            <div style={{
              background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-2xl)",
              padding: product.image ? "0" : "100px 64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              boxShadow: "var(--shadow-lg)",
              position: "relative",
              overflow: "hidden",
              minHeight: "400px"
            }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.4, backgroundImage: "radial-gradient(circle at 50% 50%, var(--blue-100) 0%, transparent 70%)" }} />
              {product.image ? (
                <Image src={product.image} alt={product.name} width={800} height={400} style={{ width: "100%", height: "100%", objectFit: "contain", position: "relative", zIndex: 1 }} unoptimized />
              ) : (
                <div style={{ color: "var(--blue-mirage)", position: "relative", zIndex: 1, filter: "drop-shadow(0 10px 20px rgba(110, 136, 176, 0.2))" }}>
                  <CategoryIcon slug={product.categorySlug || 'default'} className="w-20 h-20" />
                </div>
              )}
            </div>

            {/* Description & Details */}
            <div className="nc-card" style={{ padding: "40px", border: "none", boxShadow: "var(--shadow-sm)" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "var(--navy-950)" }}>Ringkasan Produk</h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "32px" }}>
                {product.description || "Solusi infrastruktur jaringan berkinerja tinggi yang dirancang untuk lingkungan perusahaan modern. Memberikan keandalan, skalabilitas, dan fitur keamanan yang luar biasa untuk mendukung operasional bisnis kritis Anda."}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                <div>
                  <h4 style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Fitur Utama</h4>
                  <ul style={{ padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {["Keandalan Perusahaan", "Arsitektur Skalabel", "Keamanan Lanjutan", "Performa Latensi Rendah"].map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 500 }}>
                        <CheckIcon className="w-4 h-4 text-green-600 stroke-[3]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Kompatibilitas</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    Sepenuhnya kompatibel dengan sistem rackmount standar dan protokol manajemen jaringan perusahaan (SNMP, NETCONF).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="animate-fadeUp" style={{ animationDelay: "0.1s" }}>
            <div className="nc-card" style={{ padding: "40px", position: "sticky", top: "100px", border: "1px solid var(--border-strong)" }}>
              <div className="nc-badge nc-badge-gray" style={{ marginBottom: "16px" }}>{product.categoryName}</div>
              <h1 style={{ fontSize: "32px", fontWeight: 800, lineHeight: 1.2, color: "var(--navy-950)", letterSpacing: "-0.5px" }}>{product.name}</h1>

              <div style={{ margin: "32px 0", padding: "32px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {formatCurrency(product.price)}
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>IDR / unit</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: product.stockCount > 0 ? "var(--green-600)" : "var(--red-600)", boxShadow: `0 0 8px ${product.stockCount > 0 ? "var(--green-600)" : "var(--red-600)"}` }} />
                  <span style={{ fontSize: "15px", fontWeight: 600, color: product.stockCount > 0 ? "var(--green-600)" : "var(--red-600)" }}>
                    {product.stockCount > 0 ? `Dikirim dalam 24-48 jam (${product.stockCount} unit tersedia)` : "Tersedia untuk Pesan Inden"}
                  </span>
                </div>
              </div>

              <div style={{ marginTop: "32px", padding: "20px", background: "var(--surface-2)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                <Link href="/contact" className="nc-btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none", background: "var(--navy-700)", color: "#fff" }}>
                  Hubungi untuk Penawaran
                </Link>
              </div>

              <div style={{ marginTop: "40px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-faint)", marginBottom: "20px" }}>Spesifikasi Teknis</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Faktor Bentuk", value: product.formFactor || "Standard Rackmount" },
                    { label: "Konektivitas", value: product.connectivity || "10/100/1000 Mbps" },
                    { label: "Manajemen", value: product.management || "Cloud Managed" },
                    { label: "Garansi", value: product.warranty || "3-Year Advanced Replace" }
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", paddingBottom: "12px", borderBottom: "1px solid var(--surface-2)" }}>
                      <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
                      <span style={{ fontWeight: 600, color: "var(--navy-800)" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "32px", padding: "20px", background: "var(--accent-100)", borderRadius: "var(--radius-lg)", border: "1px solid var(--accent-400)" }}>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", display: "flex", gap: "10px" }}>
                  <InformationCircleIcon className="w-[18px] h-[18px] text-blue-900" />
                  Butuh konfigurasi khusus? Bicaralah dengan arsitek solusi kami untuk harga grosir.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}
