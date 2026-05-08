import Link from "next/link";
import { query } from "@/lib/db";
import type { ProductWithStock, Category } from "@/types";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LandingAnimations } from "@/components/ui/LandingAnimations";

async function getStats() {
  const [[products], [categories], [stock], [published]] = await Promise.all([
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM products`),
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM categories`),
    query<{ total: number }>(`SELECT COALESCE(SUM("quantity"),0)::INTEGER AS total FROM inventory_movements`),
    query<{ count: number }>(`SELECT COUNT(*)::INTEGER AS count FROM products WHERE "status"='published'`),
  ]);
  return { products: products?.count ?? 0, categories: categories?.count ?? 0, totalStock: stock?.total ?? 0, published: published?.count ?? 0 };
}

async function getFeatured(): Promise<ProductWithStock[]> {
  return query<ProductWithStock>(`
    SELECT p.*, c."name" AS "categoryName",
      COALESCE((SELECT SUM(im."quantity") FROM inventory_movements im WHERE im."productId"=p."id"),0)::INTEGER AS "stockCount"
    FROM products p
    LEFT JOIN categories c ON p."categoryId"=c."id"
    WHERE p."status"='published'
    ORDER BY p."createdAt" DESC LIMIT 6
  `);
}

async function getCategories() {
  return query<Category & { productCount: number }>(`
    SELECT c.*, COUNT(p."id")::INTEGER AS "productCount"
    FROM categories c LEFT JOIN products p ON p."categoryId"=c."id"
    GROUP BY c."id" ORDER BY c."name" ASC
  `);
}

import {
  CommandLineIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  WifiIcon,
  CubeIcon,
  PhoneIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  routers: CommandLineIcon,
  switches: CpuChipIcon,
  security: ShieldCheckIcon,
  wireless: WifiIcon,
  default: CubeIcon,
};

function CategoryIcon({ slug, className }: { slug: string, className?: string }) {
  const key = Object.keys(categoryIcons).find(k => slug.includes(k)) ?? "default";
  const Icon = categoryIcons[key];
  return <Icon className={className} />;
}

export default async function HomePage() {
  const [stats, products, categories, session] = await Promise.all([
    getStats(),
    getFeatured(),
    getCategories(),
    auth.api.getSession({ headers: await headers() })
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar session={session} />

      {/* ── Hero ─────────────────────────────────── */}
      <section style={{ background: "var(--blue-mirage)", position: "relative", overflow: "hidden", padding: "110px 0 120px" }}>
        {/* Layered background shapes */}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "60%", background: "rgba(255,255,255,0.04)", borderTopLeftRadius: "80px", borderBottomLeftRadius: "80px", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)", zIndex: 0 }} />
        <div style={{ position: "absolute", top: -40, right: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.02)", zIndex: 0 }} />

        <div className="container-xl" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "72px", alignItems: "center" }}>
            <div className="animate-fadeUp">

              <h1 style={{ fontSize: "48px", fontWeight: 800, lineHeight: 1.1, color: "#ffffff", marginBottom: "20px", letterSpacing: "-1.5px" }}>
                Keunggulan Terkurasi<br />
                <span style={{ color: "var(--amber-smoke)" }}>untuk Profesional</span> Modern
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.8)", lineHeight: 1.8, marginBottom: "44px", maxWidth: "460px" }}>
                Temukan koleksi solusi jaringan kelas perusahaan yang dipilih secara teliti untuk meningkatkan infrastruktur dan alur kerja harian Anda.
              </p>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <Link href="/catalog" className="nc-btn-primary" style={{ fontSize: "15px", padding: "14px 32px", background: "var(--amber-smoke)", color: "var(--blue-mirage)", borderRadius: "12px", border: "none", fontWeight: 700 }}>
                  Jelajahi Katalog
                </Link>
                <Link href="/about" className="nc-btn-outline-white" style={{ fontSize: "15px", padding: "14px 32px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)", borderRadius: "12px" }}>
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </div>

            <div className="animate-fadeUp delay-200" style={{ position: "relative" }}>
              <div style={{
                background: "#ffffff",
                borderRadius: "28px",
                padding: "20px",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
                width: "100%",
                maxWidth: "520px",
                marginLeft: "auto"
              }}>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "340px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at center, rgba(110, 136, 176, 0.25) 0%, transparent 70%)" }} />
                  <Image
                    src="/images/hero-switch.png"
                    alt="Enterprise Network Infrastructure"
                    width={520}
                    height={340}
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 }}
                    unoptimized
                    priority
                  />
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────── */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0" }}>
        <div className="container-xl">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", textAlign: "center" }}>
            {[
              { v: stats.products, l: "Total Produk", icon: "📦" },
              { v: stats.categories, l: "Kategori", icon: "🗂️" },
              { v: stats.published, l: "Diterbitkan", icon: "✅" },
              { v: stats.totalStock, l: "Total Stok Unit", icon: "📊" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "24px 16px", borderRight: i < 3 ? "1px solid var(--border)" : "none" }} className={`animate-fadeUp delay-${(i+1)*100}`}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy-900)", lineHeight: 1, letterSpacing: "-0.5px" }}>
                  <AnimatedCounter value={s.v} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────── */}
      <section id="categories" style={{ padding: "80px 0", background: "var(--background)" }}>
        <div className="container-xl">
          <div style={{ marginBottom: "40px" }}>
            <h2 className="nc-section-title" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Telusuri Kategori</h2>
            <p className="nc-section-subtitle" style={{ marginTop: "8px", fontSize: "15px" }}>Temukan perangkat yang tepat berdasarkan kebutuhan infrastruktur Anda</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "16px" }}>
            {categories.map((cat, idx) => (
              <Link href={`/catalog?category=${cat.slug}`} key={cat.id} className={`nc-cat-card animate-fadeUp delay-${Math.min(idx * 50, 500)}`} style={{ padding: "24px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="nc-cat-icon">
                  <CategoryIcon slug={cat.slug} className="w-5 h-5" />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>{cat.name}</div>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "6px", lineHeight: 1.5, flex: 1 }}>{cat.description}</div>
                <div style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--navy-700)", marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>Inventaris</span>
                  <span style={{ color: "var(--navy-900)", background: "var(--surface-2)", padding: "2px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>{cat.productCount} Item</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Devices ───────────────────────── */}
      <section style={{ padding: "80px 0", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div className="container-xl">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
            <div>
              <h2 className="nc-section-title" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Perangkat Unggulan</h2>
              <p className="nc-section-subtitle" style={{ marginTop: "8px", fontSize: "15px" }}>Produk terbaru dan terpopuler dari koleksi kami</p>
            </div>
            <Link href="/catalog" style={{ fontSize: "13px", fontWeight: 600, color: "var(--navy-700)", display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", transition: "all 0.2s" }}>Lihat Semua →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {products.map((p, idx) => (
              <div key={p.id} className={`nc-product-card animate-fadeUp delay-${Math.min(idx * 100, 500)}`}>
                <div className="nc-product-card-image">
                  {idx === 0 && <span className="nc-product-badge new">Baru</span>}
                  {idx === 2 && <span className="nc-product-badge bestseller">Terlaris</span>}
                  {p.image ? (
                    <Image src={p.image} alt={p.name} width={400} height={300} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} unoptimized />
                  ) : (
                    <div style={{ color: "var(--navy-600)", opacity: .35 }}>
                      <CategoryIcon slug={p.slug} className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="nc-product-card-body">
                  <div className="nc-product-card-category">{p.categoryName}</div>
                  <div className="nc-product-card-name" style={{ marginTop: 6 }}>{p.name}</div>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
                  <div className="nc-product-card-specs" style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                    <div>
                      <div className="nc-product-card-spec-label">Stok</div>
                      <div className="nc-product-card-spec-value">{p.stockCount} unit</div>
                    </div>
                    <div>
                      <div className="nc-product-card-spec-label">Status</div>
                      <div className="nc-product-card-spec-value" style={{ color: p.stockCount > 0 ? "var(--green-600)" : "var(--red-600)" }}>
                        {p.stockCount > 0 ? "Tersedia" : "Stok Habis"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="nc-product-card-footer">
                  <span className="nc-product-price">{formatCurrency(p.price)}</span>
                  <Link href={`/catalog/${p.slug}`} className="nc-btn-primary" style={{ fontSize: "12px", padding: "7px 14px" }}>
                    Lihat Spesifikasi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section id="features" style={{ padding: "96px 0", background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 className="nc-section-title animate-fadeUp" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Mengapa Netcatalog?</h2>
            <p className="nc-section-subtitle animate-fadeUp delay-100" style={{ marginTop: "10px", fontSize: "15px", maxWidth: 520, margin: "10px auto 0" }}>Platform manajemen inventaris jaringan yang dirancang untuk keandalan enterprise</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {[
              { icon: ShieldCheckIcon, title: "Kelas Perusahaan", desc: "Perangkat keras yang dibuat untuk tahan lama di lingkungan pusat data 24/7 dengan dukungan garansi komprehensif.", color: "var(--navy-900)" },
              { icon: PhoneIcon, title: "Dukungan Ahli 24/7", desc: "Akses langsung ke insinyur jaringan L3 untuk bantuan penerapan dan penyelesaian masalah cepat.", color: "var(--blue-600)" },
              { icon: GlobeAltIcon, title: "Logistik Global", desc: "Gudang yang terletak strategis memastikan pengiriman cepat dan penggantian suku cadang di seluruh dunia.", color: "var(--green-600)" },
            ].map((f, i) => (
              <div key={i} className={`animate-fadeUp delay-${(i+1)*100}`} style={{ padding: "36px 32px", background: "var(--surface)", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 4px 20px -10px rgba(0,0,0,0.06)", transition: "all 0.3s ease", textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${f.color}12`, border: `1px solid ${f.color}30`, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section style={{ padding: "100px 0", background: "var(--blue-mirage)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)" }} />
        <div className="container-xl" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#ffffff", marginBottom: "16px", letterSpacing: "-0.5px" }} className="animate-fadeUp">Analisis Infrastruktur Anda</h2>
          <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.75)", marginBottom: "40px", lineHeight: 1.7, maxWidth: 520 }} className="animate-fadeUp delay-100">
            Jelajahi koleksi luas perangkat keras jaringan kelas perusahaan kami. Bandingkan statistik dan pantau tingkat inventaris secara real-time.
          </p>
          <Link href="/catalog" className="nc-btn-primary animate-fadeUp delay-200" style={{ fontSize: "15px", padding: "16px 40px", borderRadius: "100px", fontWeight: 700, background: "var(--amber-smoke)", color: "var(--blue-mirage)" }}>
            Buka Katalog Sekarang
          </Link>
        </div>
      </section>

      <Footer />
      <LandingAnimations />
    </div>
  );
}
