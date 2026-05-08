import Link from "next/link";
import { query } from "@/lib/db";
import type { Category } from "@/types";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { headers } from "next/headers";

import {
  CommandLineIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  WifiIcon,
  CubeIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

async function getCategories() {
  return query<Category & { productCount: number }>(`
    SELECT c.*, COUNT(p."id")::INTEGER AS "productCount"
    FROM categories c LEFT JOIN products p ON p."categoryId"=c."id"
    GROUP BY c."id" ORDER BY c."name" ASC
  `);
}

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
  return (
    <div className={`nc-cat-icon ${key}`}>
      <Icon className={className || "w-6 h-6"} />
    </div>
  );
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar session={session} />

      <section style={{ padding: "80px 0" }}>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h1 style={{ fontSize: "42px", fontWeight: 800, color: "var(--navy-950)", letterSpacing: "-1px" }}>Kategori Peralatan</h1>
            <p style={{ fontSize: "17px", color: "var(--text-muted)", marginTop: "16px", maxWidth: "600px", margin: "16px auto 0", lineHeight: 1.6 }}>
              Jelajahi rangkaian lengkap perangkat keras jaringan kami yang diatur berdasarkan utilitas khusus dan tingkat performa.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px" }}>
            {categories.map((cat, idx) => (
              <div key={cat.id} className="nc-cat-card animate-fadeUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                <CategoryIcon slug={cat.slug} />

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--navy-950)", marginBottom: "12px" }}>{cat.name}</h3>
                  <p style={{ fontSize: "14.5px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>{cat.description}</p>
                </div>

                <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Inventaris</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--navy-800)" }}>{cat.productCount} Produk</span>
                  </div>
                  <Link
                    href={`/catalog?category=${cat.slug}`}
                    className="nc-btn-secondary"
                    style={{ padding: "8px 12px", borderRadius: "100px", fontSize: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    Jelajahi
                    <ChevronRightIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
