"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { ProductWithStock } from "@/types";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeSync } from "@/lib/hooks/use-realtime-sync";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CubeIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CatalogClientProps {
  initialProducts: ProductWithStock[];
  categories: { name: string; slug: string }[];
}

export default function CatalogClient({ initialProducts, categories }: CatalogClientProps) {
  useRealtimeSync();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<{ inStock: boolean; outOfStock: boolean }>({
    inStock: false,
    outOfStock: false,
  });
  const [sortBy, setSortBy] = useState("Direkomendasikan");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const cat = categories.find(c => c.name === p.categoryName);
        return cat && selectedCategories.includes(cat.slug);
      });
    }
    if (minPrice) result = result.filter(p => Number(p.price) >= Number(minPrice));
    if (maxPrice) result = result.filter(p => Number(p.price) <= Number(maxPrice));
    if (stockFilter.inStock || stockFilter.outOfStock) {
      result = result.filter(p => {
        if (stockFilter.inStock && p.stockCount > 0) return true;
        if (stockFilter.outOfStock && p.stockCount <= 0) return true;
        return false;
      });
    }
    result.sort((a, b) => {
      if (sortBy === "Harga: Rendah ke Tinggi") return Number(a.price) - Number(b.price);
      if (sortBy === "Harga: Tinggi ke Rendah") return Number(b.price) - Number(a.price);
      if (sortBy === "Terbaru") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.name.localeCompare(b.name);
    });
    return result;
  }, [initialProducts, searchQuery, selectedCategories, stockFilter, sortBy, categories, minPrice, maxPrice]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = selectedCategories.length > 0 || stockFilter.inStock || stockFilter.outOfStock || minPrice || maxPrice || searchQuery;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setStockFilter({ inStock: false, outOfStock: false });
    setMinPrice(""); setMaxPrice(""); setSearchQuery(""); setCurrentPage(1);
  };

  return (
    <div className="container-xl" style={{ padding: "48px 24px", display: "grid", gridTemplateColumns: "288px 1fr", gap: "32px", alignItems: "start" }}>

      {/* ── Sidebar Filters ──────────────────────── */}
      <aside>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 24px", position: "sticky", top: "84px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AdjustmentsHorizontalIcon style={{ width: 18, height: 18, color: "var(--navy-700)" }} />
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>Filter</h3>
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={{ fontSize: 11, fontWeight: 600, color: "var(--red-600)", background: "var(--red-100)", border: "none", borderRadius: 20, padding: "3px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <XMarkIcon style={{ width: 12, height: 12 }} /> Hapus
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ position: "relative" }}>
              <MagnifyingGlassIcon style={{ width: 16, height: 16, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: "100%", height: "42px", padding: "0 12px 0 38px",
                  borderRadius: "12px", border: "1.5px solid var(--border)",
                  fontSize: "13.5px", background: "var(--background)", outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: "inherit",
                  color: "var(--text-primary)"
                }}
                onFocus={e => { e.target.style.borderColor = "var(--blue-mirage)"; e.target.style.boxShadow = "0 0 0 3px rgba(110,136,176,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", margin: "0 0 20px" }} />

          {/* Price Range */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "12px" }}>Rentang Harga</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number" placeholder="Min" value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }}
                style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "13px", outline: "none", fontFamily: "inherit", background: "var(--background)", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "var(--blue-mirage)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />
              <span style={{ color: "var(--text-faint)", flexShrink: 0 }}>—</span>
              <input
                type="number" placeholder="Maks" value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "13px", outline: "none", fontFamily: "inherit", background: "var(--background)", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "var(--blue-mirage)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "12px" }}>Kategori</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {categories.map(cat => (
                <label key={cat.slug} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer", padding: "6px 10px", borderRadius: 10, transition: "background 0.2s", background: selectedCategories.includes(cat.slug) ? "rgba(110,136,176,0.1)" : "transparent", border: `1px solid ${selectedCategories.includes(cat.slug) ? "rgba(110,136,176,0.3)" : "transparent"}` }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    style={{ width: "15px", height: "15px", accentColor: "var(--navy-600)", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: selectedCategories.includes(cat.slug) ? 600 : 400, color: selectedCategories.includes(cat.slug) ? "var(--navy-900)" : "var(--text-secondary)" }}>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "12px" }}>Status Stok</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { key: "inStock", label: "Tersedia", checked: stockFilter.inStock },
                { key: "outOfStock", label: "Stok Habis", checked: stockFilter.outOfStock },
              ].map(({ key, label, checked }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px", cursor: "pointer", padding: "6px 10px", borderRadius: 10, transition: "background 0.2s", background: checked ? "rgba(110,136,176,0.1)" : "transparent", border: `1px solid ${checked ? "rgba(110,136,176,0.3)" : "transparent"}` }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => { setStockFilter({ ...stockFilter, [key]: e.target.checked }); setCurrentPage(1); }}
                    style={{ width: "15px", height: "15px", accentColor: "var(--navy-600)", cursor: "pointer" }}
                  />
                  <span style={{ fontWeight: checked ? 600 : 400, color: checked ? "var(--navy-900)" : "var(--text-secondary)" }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      </aside>

      <main>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}
        >
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", color: "var(--text-primary)" }}>Katalog Produk</h1>
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginTop: "4px" }}>
              Menampilkan <strong style={{ color: "var(--text-primary)" }}>{paginatedProducts.length}</strong> dari <strong style={{ color: "var(--text-primary)" }}>{filteredProducts.length}</strong> produk
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 500 }}>Urutkan:</span>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              style={{ height: "38px", padding: "0 12px", borderRadius: 10, border: "1.5px solid var(--border)", fontSize: "13px", background: "var(--surface)", outline: "none", fontFamily: "inherit", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <option>Direkomendasikan</option>
              <option>Harga: Rendah ke Tinggi</option>
              <option>Harga: Tinggi ke Rendah</option>
              <option>Terbaru</option>
            </select>
          </div>
        </motion.div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {paginatedProducts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{ padding: "80px 0", textAlign: "center", background: "var(--surface)", borderRadius: "20px", border: "1px dashed var(--border)" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", color: "var(--text-faint)" }}>
                <MagnifyingGlassIcon style={{ width: 48, height: 48 }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Produk tidak ditemukan</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "14px" }}>Coba sesuaikan filter atau kata kunci pencarian Anda</p>
              <button onClick={clearAllFilters} className="nc-btn-primary" style={{ marginTop: 20, padding: "10px 24px" }}>Reset Filter</button>
            </motion.div>
          ) : (
            <motion.div
              key={`page-${currentPage}-${sortBy}-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}
            >
              {paginatedProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  className="nc-product-card"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/catalog/${p.slug}`}>
                    <div className="nc-product-card-image">
                      {idx % 5 === 0 && <span className="nc-product-badge new">Baru</span>}
                      {p.stockCount > 50 && <span className="nc-product-badge bestseller">Terlaris</span>}
                      {p.image ? (
                        <Image src={p.image} alt={p.name} width={400} height={300} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} unoptimized />
                      ) : (
                        <CubeIcon style={{ width: 48, height: 48 }} className="text-slate-800 opacity-30 stroke-[1.2]" />
                      )}
                    </div>
                  </Link>
                  <div className="nc-product-card-body">
                    <div className="nc-product-card-category">{p.categoryName}</div>
                    <Link href={`/catalog/${p.slug}`}>
                      <div className="nc-product-card-name" style={{ marginTop: 4, height: "44px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {p.name}
                      </div>
                    </Link>
                    <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "8px", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.6 }}>
                      {p.description}
                    </p>
                    <div className="nc-product-card-specs" style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                      <div>
                        <div className="nc-product-card-spec-label">Ketersediaan</div>
                        <div className="nc-product-card-spec-value" style={{ color: p.stockCount <= 0 ? "var(--red-600)" : p.stockCount < 5 ? "var(--amber-600)" : "var(--green-600)" }}>
                          {p.stockCount <= 0 ? "Stok Habis" : p.stockCount < 5 ? "Stok Rendah" : "Tersedia"}
                        </div>
                      </div>
                      <div>
                        <div className="nc-product-card-spec-label">Inventaris</div>
                        <div className="nc-product-card-spec-value" style={{ fontWeight: p.stockCount < 5 ? 800 : 600 }}>
                          {p.stockCount} unit
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="nc-product-card-footer">
                    <span className="nc-product-price">
                      {mounted ? formatCurrency(p.price) : Number(p.price)}
                    </span>
                    <Link href={`/catalog/${p.slug}`} className="nc-btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                      <EyeIcon style={{ width: 14, height: 14, marginRight: 4 }} />
                      Detail
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: "48px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
          >
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="nc-btn-secondary"
              style={{ width: "38px", height: "38px", padding: 0, justifyContent: "center", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              <ChevronLeftIcon style={{ width: 16, height: 16 }} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <motion.button
                key={page}
                onClick={() => handlePageChange(page)}
                whileTap={{ scale: 0.95 }}
                className={currentPage === page ? "nc-btn-primary" : "nc-btn-secondary"}
                style={{ width: "38px", height: "38px", padding: 0, justifyContent: "center" }}
              >
                {page}
              </motion.button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="nc-btn-secondary"
              style={{ width: "38px", height: "38px", padding: 0, justifyContent: "center", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >
              <ChevronRightIcon style={{ width: 16, height: 16 }} />
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
