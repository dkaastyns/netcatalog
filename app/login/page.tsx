"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Square3Stack3DIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await signIn.email({ email, password });
      if (res.error) { setError(res.error.message ?? "Kredensial tidak valid"); return; }
      router.push("/admin");
    } catch { setError("Terjadi kesalahan. Coba lagi."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--blue-mirage)", position: "relative", overflow: "hidden" }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -120, left: -120, width: 480, height: 480, borderRadius: "50%", background: "rgba(255,255,255,0.04)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.03)", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 80%, rgba(242,224,208,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)" }} />

      {/* Left branding panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px", position: "relative", zIndex: 1 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 64, textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Square3Stack3DIcon style={{ width: 22, height: 22, color: "var(--amber-smoke)" }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--amber-smoke)", letterSpacing: "-0.3px" }}>Netcatalog</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20 }}>
            Selamat datang<br />
            <span style={{ color: "var(--amber-smoke)" }}>Administrator</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 380 }}>
            Masuk untuk mengelola produk, inventaris, dan pengguna dalam sistem Netcatalog.
          </p>
        </motion.div>

        <div style={{ marginTop: 64, display: "flex", gap: 40 }}>
          {[
            { label: "Total Modul", value: "6" },
            { label: "Hak Akses", value: "Penuh" },
            { label: "Status", value: "Aktif" },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{stat.value}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2, letterSpacing: "0.3px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: "100%" }}
        >
          <div style={{ marginBottom: "36px" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Masuk ke Dasbor</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>Masukkan kredensial administrator Anda</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "12px", padding: "13px 16px", fontSize: 13.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}
            >
              <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: 6 }}>
                <EnvelopeIcon style={{ width: 14, height: 14 }} /> Email Administrator
              </label>
              <input
                id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@netcatalog.com"
                style={{ width: "100%", height: "48px", padding: "0 16px", borderRadius: "12px", border: "1.5px solid var(--border)", fontSize: "14px", background: "var(--background)", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: "inherit", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "var(--blue-mirage)"; e.target.style.boxShadow = "0 0 0 3px rgba(110,136,176,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: 6 }}>
                <LockClosedIcon style={{ width: 14, height: 14 }} /> Kata Sandi
              </label>
              <input
                id="login-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width: "100%", height: "48px", padding: "0 16px", borderRadius: "12px", border: "1.5px solid var(--border)", fontSize: "14px", background: "var(--background)", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: "inherit", color: "var(--text-primary)" }}
                onFocus={e => { e.target.style.borderColor = "var(--blue-mirage)"; e.target.style.boxShadow = "0 0 0 3px rgba(110,136,176,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <motion.button
              type="submit"
              className="nc-btn-primary"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              style={{ width: "100%", justifyContent: "center", padding: "15px", fontSize: 15, borderRadius: "12px", marginTop: 4, fontWeight: 700 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M4 12a8 8 0 0 1 8-8" opacity="0.75" /></svg>
                  Mengautentikasi...
                </span>
              ) : "Masuk ke Dasbor"}
            </motion.button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <Link href="/" style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, transition: "color 0.2s" }}>
              <ChevronLeftIcon style={{ width: 14, height: 14 }} />
              Kembali ke Katalog Publik
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
