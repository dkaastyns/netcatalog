"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";

import {
  HomeIcon,
  CubeIcon,
  ShoppingCartIcon,
  FolderIcon,
  QueueListIcon,
  UsersIcon,
  Bars3BottomLeftIcon,
  ArrowRightOnRectangleIcon,
  Square3Stack3DIcon
} from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/admin", label: "Dashboard", Icon: HomeIcon },
  { href: "/admin/products", label: "Produk", Icon: CubeIcon },
  { href: "/admin/orders", label: "Pesanan", Icon: ShoppingCartIcon },
  { href: "/admin/categories", label: "Kategori", Icon: FolderIcon },
  { href: "/admin/inventory", label: "Inventaris", Icon: QueueListIcon },
  { href: "/admin/users", label: "Pengguna", Icon: UsersIcon },
];

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { AdminSearch } from "@/components/admin/AdminSearch";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/login");
      } else if ((session.user as unknown as { role: string }).role !== "admin") {
        router.push("/");
      }
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.push("/login");
  };

  // BUG-14 FIX: Tampilkan loading spinner saat menunggu redirect, bukan layar kosong
  if (isPending || !session || (session.user as unknown as { role: string }).role !== "admin") {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--blue-mirage)",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Memuat...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      {/* ── Sidebar ─────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className={`nc-sidebar ${isCollapsed ? 'collapsed' : ''}`}
        style={{ boxShadow: "rgba(0,0,0,0.03) 4px 0px 20px", zIndex: 50 }}
      >
        <div className="nc-sidebar-logo" style={{ height: "70px", justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <motion.div
            layout
            style={{ width: 34, height: 34, borderRadius: 10, background: "var(--blue-mirage)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Square3Stack3DIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </motion.div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span className="nc-sidebar-logo-text" style={{ marginLeft: 4 }}>Netcatalog</span>
            </motion.div>
          )}
        </div>

        <nav style={{ flex: 1, paddingTop: 16 }}>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nc-sidebar-section">
              Infrastruktur
            </motion.div>
          )}
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`nc-sidebar-link ${isActive ? 'active' : ''}`} style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : "10px 20px" }} title={isCollapsed ? link.label : ""}>
                <link.Icon className="w-[18px] h-[18px] transition-all duration-200" />
                {!isCollapsed && (
                  <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                    {link.label}
                  </motion.span>
                )}
              </Link>
            );
          })}

          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nc-sidebar-section" style={{ marginTop: 16 }}>
              Sistem
            </motion.div>
          )}
          <Link href="/" className="nc-sidebar-link" style={{ justifyContent: isCollapsed ? "center" : "flex-start", padding: isCollapsed ? "10px 0" : "10px 20px" }} title={isCollapsed ? "Live Storefront" : ""}>
            <HomeIcon className="w-[18px] h-[18px]" />
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
                Halaman Depan
              </motion.span>
            )}
          </Link>

        </nav>

        {/* User Profile */}
        <div style={{ padding: isCollapsed ? "20px 0" : "20px", borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: isCollapsed ? "center" : "flex-start" }}>
            <motion.div
              layout
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--blue-mirage)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}
            >
              {session.user.name?.charAt(0).toUpperCase() ?? "U"}
            </motion.div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Administrator</div>
                </div>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  style={{ background: "transparent", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 4 }}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Main area ───────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="nc-admin-header" style={{ height: "70px", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 8, transition: "background 0.2s, color 0.2s" }}
              className="hover:bg-slate-100"
            >
              <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ type: "spring", damping: 20, stiffness: 180 }}>
                <Bars3BottomLeftIcon className="w-5 h-5" />
              </motion.div>
            </button>
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {pathname === "/admin" ? "Dashboard" : pathname.split("/").pop()?.replace("products", "Produk").replace("orders", "Pesanan").replace("categories", "Kategori").replace("inventory", "Inventaris").replace("users", "Pengguna").replace("-", " ")}
            </h2>
          </div>
          <div style={{ flex: 1 }} />
          <AdminSearch />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--blue-mirage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: 1, overflow: "auto", padding: "0 32px 32px" }}
        >
          {children}
        </motion.main>
      </div>



      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Keluar"
        message="Apakah Anda yakin ingin keluar dari dashboard admin?"
        confirmText="Keluar"
        isLoading={isLoggingOut}
        variant="primary"
      />
    </div>
  );
}
