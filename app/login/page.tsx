"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Square3Stack3DIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import TextReveal from "@/components/ui/TextReveal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    // Background floating animation
    gsap.to(blob1Ref.current, {
      y: -30,
      x: 20,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    gsap.to(blob2Ref.current, {
      y: 40,
      x: -30,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1
    });

    // Staggered form field entry
    if (formRef.current) {
      gsap.fromTo(
        (formRef.current as any).children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.3 }
      );
    }
  }, []);

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", position: "relative", overflow: "hidden" }}>
      {/* Decorative background */}
      <div ref={blob1Ref} style={{ position: "absolute", top: -120, left: -120, width: 480, height: 480, borderRadius: "50%", background: "rgba(110,136,176,0.06)", zIndex: 0 }} />
      <div ref={blob2Ref} style={{ position: "absolute", bottom: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(110,136,176,0.04)", zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 440, background: "var(--surface)", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", padding: "48px", position: "relative", zIndex: 1, border: "1px solid var(--border)" }}
      >
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "var(--blue-mirage)", color: "var(--amber-smoke)", marginBottom: 20 }}
          >
            <Square3Stack3DIcon style={{ width: 32, height: 32 }} />
          </motion.div>
          
          <TextReveal text="Masuk ke Dasbor" delay={0.2} duration={0.6} className="login-title" />
          <style>{`.login-title { font-size: 26px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; justify-content: center; margin-bottom: 8px; }`}</style>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 8 }}>
            Masukkan kredensial administrator Netcatalog
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "12px", padding: "13px 16px", fontSize: 13.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}
          >
            <ExclamationCircleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </motion.div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: "100%", justifyContent: "center", padding: "15px", fontSize: 15, borderRadius: "12px", marginTop: 8, fontWeight: 700 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" opacity="0.25" /><path d="M4 12a8 8 0 0 1 8-8" opacity="0.75" /></svg>
                Mengautentikasi...
              </span>
            ) : "Masuk ke Dasbor"}
          </motion.button>
        </form>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <Link href="/" style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500, transition: "color 0.2s" }}>
            <ChevronLeftIcon style={{ width: 14, height: 14 }} />
            Kembali ke Katalog Publik
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
