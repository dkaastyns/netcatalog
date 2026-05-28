export const revalidate = 60; // ISR: revalidate every 60 seconds

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
      COALESCE(SUM(im."quantity"), 0)::INTEGER AS "stockCount"
    FROM products p
    LEFT JOIN categories c ON p."categoryId"=c."id"
    LEFT JOIN inventory_movements im ON im."productId" = p."id"
    WHERE p."status"='published'
    GROUP BY p."id", c."name"
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

      {/* ── Hero ───────────────────────────────────── */}
      <section className="nc-hero-section" style={{ background: "var(--blue-mirage)", position: "relative", overflow: "hidden" }}>
        <style>{`
          .nc-hero-section { padding: 90px 0 100px; }
          .nc-hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 56px; align-items: center; }
          .nc-hero-img-card { width: 100%; max-width: 480px; margin-left: auto; }
          .nc-hero-h1 { font-size: 48px; font-weight: 800; line-height: 1.1; color: #ffffff; margin-bottom: 20px; letter-spacing: -1.5px; }
          .nc-hero-p { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.8; margin-bottom: 40px; max-width: 460px; }
          .nc-hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
          .nc-hero-img-inner { position: relative; width: 100%; height: 320px; border-radius: 16px; overflow: hidden; background: var(--surface-2); display: flex; align-items: center; justify-content: center; }
          @media (max-width: 767px) {
            .nc-hero-section { padding: 56px 0 64px; }
            .nc-hero-grid { gap: 32px; grid-template-columns: 1fr; }
            .nc-hero-h1 { font-size: 32px; letter-spacing: -0.8px; }
            .nc-hero-p { font-size: 15px; margin-bottom: 28px; }
            .nc-hero-img-card { max-width: 100%; margin-left: 0; padding: 14px; }
            .nc-hero-img-inner { height: 220px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .nc-hero-section { padding: 70px 0 80px; }
            .nc-hero-grid { gap: 40px; }
            .nc-hero-h1 { font-size: 38px; }
            .nc-hero-img-inner { height: 280px; }
          }
        `}</style>
        {/* Layered background shapes */}
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "60%", background: "rgba(255,255,255,0.04)", borderTopLeftRadius: "80px", borderBottomLeftRadius: "80px", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.03)", zIndex: 0 }} />
        <div style={{ position: "absolute", top: -40, right: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.02)", zIndex: 0 }} />

        <div className="container-xl" style={{ position: "relative", zIndex: 1 }}>
          <div className="nc-hero-grid">
            <div className="animate-fadeUp">

              <h1 className="nc-hero-h1">
                Solusi Jaringan Terbaik<br />
                <span style={{ color: "var(--amber-smoke)" }}>untuk Kebutuhan</span> Anda
              </h1>
              <p className="nc-hero-p">
                Temukan koleksi solusi jaringan kelas perusahaan yang dipilih secara teliti untuk meningkatkan infrastruktur dan alur kerja harian Anda.
              </p>
              <div className="nc-hero-btns">
                <Link href="/catalog" className="nc-btn-primary" style={{ fontSize: "15px", padding: "14px 28px", background: "var(--amber-smoke)", color: "var(--blue-mirage)", borderRadius: "12px", border: "none", fontWeight: 700 }}>
                  Jelajahi Katalog
                </Link>
                <Link href="/about" className="nc-btn-outline-white" style={{ fontSize: "15px", padding: "14px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)", borderRadius: "12px" }}>
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </div>

            <div className="animate-fadeUp delay-200" style={{ position: "relative" }}>
              <div className="nc-hero-img-card" style={{
                background: "#ffffff",
                borderRadius: "28px",
                padding: "20px",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.1)",
              }}>
                <div className="nc-hero-img-inner">
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at center, rgba(110, 136, 176, 0.25) 0%, transparent 70%)" }} />
                  <Image
                    src="/images/hero-switch.png"
                    alt="Enterprise Network Infrastructure"
                    width={520}
                    height={340}
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1 }}
                    priority
                  />
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────── */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0" }}>
        <style>{`
          .nc-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
          .nc-stat-item { padding: 24px 16px; text-align: center; border-right: 1px solid var(--border); }
          .nc-stat-item:last-child { border-right: none; }
          @media (max-width: 767px) {
            .nc-stats-grid { grid-template-columns: repeat(2, 1fr); }
            .nc-stat-item { padding: 18px 12px; }
            .nc-stat-item:nth-child(2) { border-right: none; }
            .nc-stat-item:nth-child(3) { border-top: 1px solid var(--border); border-right: 1px solid var(--border); }
            .nc-stat-item:nth-child(4) { border-top: 1px solid var(--border); border-right: none; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .nc-stat-item { padding: 20px 12px; }
          }
        `}</style>
        <div className="container-xl">
          <div className="nc-stats-grid">
            {[
              { v: stats.products, l: "Total Produk", icon: "📦" },
              { v: stats.categories, l: "Kategori", icon: "🗂️" },
              { v: stats.published, l: "Diterbitkan", icon: "✅" },
              { v: stats.totalStock, l: "Total Stok Unit", icon: "📊" },
            ].map((s, i) => (
              <div key={i} className={`nc-stat-item animate-fadeUp delay-${(i+1)*100}`}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy-900)", lineHeight: 1, letterSpacing: "-0.5px" }}>
                  <AnimatedCounter value={s.v} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────── */}
      <section id="categories" className="nc-section-categories">
        <style>{`
          .nc-section-categories { padding: 80px 0; background: var(--background); }
          .nc-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
          @media (max-width: 767px) {
            .nc-section-categories { padding: 56px 0; }
            .nc-cat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .nc-section-categories { padding: 64px 0; }
            .nc-cat-grid { grid-template-columns: repeat(3, 1fr); }
          }
        `}</style>
        <div className="container-xl">
          <div style={{ marginBottom: "40px" }}>
            <h2 className="nc-section-title" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Telusuri Kategori</h2>
            <p className="nc-section-subtitle" style={{ marginTop: "8px", fontSize: "15px" }}>Temukan perangkat yang tepat berdasarkan kebutuhan infrastruktur Anda</p>
          </div>
          <div className="nc-cat-grid">
            {categories.map((cat, idx) => (
              <Link href={`/catalog?category=${cat.slug}`} key={cat.id} className={`nc-cat-card animate-fadeUp delay-${Math.min(idx * 50, 500)}`} style={{ padding: "22px 18px", display: "flex", flexDirection: "column", height: "100%" }}>
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

      {/* ── Featured Devices ───────────────────────────────── */}
      <section className="nc-section-featured" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <style>{`
          .nc-section-featured { padding: 80px 0; }
          .nc-featured-header { display: flex; align-items: flex-end; justifyContent: space-between; margin-bottom: 40px; gap: 16px; }
          .nc-featured-products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
          @media (max-width: 767px) {
            .nc-section-featured { padding: 56px 0; }
            .nc-featured-header { flex-direction: column; align-items: flex-start; margin-bottom: 24px; }
            .nc-featured-products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .nc-section-featured { padding: 64px 0; }
            .nc-featured-products-grid { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
        <div className="container-xl">
          <div className="nc-featured-header">
            <div>
              <h2 className="nc-section-title" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Perangkat Unggulan</h2>
              <p className="nc-section-subtitle" style={{ marginTop: "8px", fontSize: "15px" }}>Produk terbaru dan terpopuler dari koleksi kami</p>
            </div>
            <Link href="/catalog" style={{ fontSize: "13px", fontWeight: 600, color: "var(--navy-700)", display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0 }}>Lihat Semua →</Link>
          </div>
          <div className="nc-featured-products-grid">
            {products.map((p, idx) => (
              <div key={p.id} className={`nc-product-card animate-fadeUp delay-${Math.min(idx * 100, 500)}`}>
                <div className="nc-product-card-image">
                  {(new Date().getTime() - new Date(p.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
                    <span className="nc-product-badge new">Baru</span>
                  )}
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

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="nc-section-features" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <style>{`
          .nc-section-features { padding: 96px 0; }
          .nc-features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
          @media (max-width: 767px) {
            .nc-section-features { padding: 56px 0; }
            .nc-features-grid { grid-template-columns: 1fr; gap: 16px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .nc-section-features { padding: 72px 0; }
          }
        `}</style>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 className="nc-section-title animate-fadeUp" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>Mengapa Netcatalog?</h2>
            <p className="nc-section-subtitle animate-fadeUp delay-100" style={{ marginTop: "10px", fontSize: "15px", maxWidth: 520, margin: "10px auto 0" }}>Platform manajemen inventaris jaringan yang dirancang untuk keandalan enterprise</p>
          </div>
          <div className="nc-features-grid">
            {[
              { icon: ShieldCheckIcon, title: "Kelas Perusahaan", desc: "Perangkat keras yang dibuat untuk tahan lama di lingkungan pusat data 24/7 dengan dukungan garansi komprehensif." },
              { icon: PhoneIcon, title: "Dukungan Ahli 24/7", desc: "Akses langsung ke insinyur jaringan L3 untuk bantuan penerapan dan penyelesaian masalah cepat." },
              { icon: GlobeAltIcon, title: "Logistik Global", desc: "Gudang yang terletak strategis memastikan pengiriman cepat dan penggantian suku cadang di seluruh dunia." },
            ].map((f, i) => (
              <div key={i} className={`animate-fadeUp delay-${(i+1)*100}`} style={{ padding: "36px 28px", background: "var(--surface)", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "0 4px 20px -10px rgba(0,0,0,0.06)", transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)", textAlign: "center" }}>
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 mx-auto mb-6 border border-slate-100">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)", marginBottom: "12px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="nc-cta-section" style={{ background: "var(--blue-mirage)", position: "relative", overflow: "hidden" }}>
        <style>{`
          .nc-cta-section { padding: 100px 0; }
          .nc-cta-h2 { font-size: 36px; font-weight: 800; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.5px; }
          .nc-cta-p { font-size: 16px; color: rgba(255,255,255,0.75); margin-bottom: 40px; line-height: 1.7; max-width: 520px; }
          @media (max-width: 767px) {
            .nc-cta-section { padding: 64px 0; }
            .nc-cta-h2 { font-size: 26px; }
            .nc-cta-p { font-size: 15px; margin-bottom: 28px; }
          }
        `}</style>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)" }} />
        <div className="container-xl" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
          <h2 className="nc-cta-h2 animate-fadeUp">Analisis Infrastruktur Anda</h2>
          <p className="nc-cta-p animate-fadeUp delay-100">
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
