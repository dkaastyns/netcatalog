import Link from "next/link";
import { auth } from "@/lib/auth";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { headers } from "next/headers";
import {
  CheckIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export default async function AboutPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar session={session} />

      {/* ── Hero Section ───────────────────────────── */}
      <section style={{
        background: "var(--blue-mirage)",
        color: "var(--amber-smoke)",
        padding: "100px 0",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(var(--amber-smoke) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container-xl animate-fadeUp" style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "48px", fontWeight: 800, marginBottom: "20px", color: "var(--amber-smoke)" }}>Membangun Tulang Punggung Kemajuan Digital</h1>
          <p style={{ fontSize: "18px", maxWidth: "700px", margin: "0 auto", lineHeight: 1.8, opacity: 0.9 }}>
            Netcatalog adalah tujuan utama untuk infrastruktur jaringan kelas perusahaan. Kami memberdayakan organisasi untuk berkembang dengan percaya diri melalui perangkat keras pilihan dan panduan ahli.
          </p>
        </div>
      </section>

      {/* ── Mission Section ────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="container-xl">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
            <div className="animate-fadeUp">
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue-mirage)", textTransform: "uppercase", letterSpacing: "1px" }}>Misi Kami</span>
              <h2 style={{ fontSize: "32px", fontWeight: 800, marginTop: "12px", marginBottom: "24px" }}>Mendefinisikan Ulang Akuisisi Infrastruktur</h2>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "20px" }}>
                Menemukan perangkat keras jaringan yang tepat tidak seharusnya menjadi tantangan. Di Netcatalog, kami telah menjembatani kesenjangan antara spesifikasi yang kompleks dan kebutuhan perusahaan. Platform kami dirancang untuk memberikan transparansi, kedalaman teknis, dan keunggulan logistik.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--amber-smoke)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckIcon className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700 }}>Keunggulan Terkurasi</h4>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Setiap produk diperiksa oleh teknisi sistem kami untuk performa puncak.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--amber-smoke)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckIcon className="w-5 h-5 text-slate-900 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700 }}>Intelijen Real-time</h4>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Pelacakan inventaris langsung dan riwayat mutasi untuk transparansi penuh.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-fadeUp delay-200">
              <div
                className="nc-card"
                style={{
                  borderRadius: "32px",
                  height: "460px",
                  overflow: "hidden",
                  position: "relative",
                  background: "var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                  border: "1px solid var(--border-strong)",
                  boxShadow: "0 40px 80px -15px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 40%)", zIndex: 2, pointerEvents: "none" }} />
                <Image
                  src="/images/about-mission.png"
                  alt="Misi Kami"
                  fill
                  style={{
                    objectFit: "cover",
                    transition: "transform 0.8s ease"
                  }}
                  className="hover:scale-110"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values Section ─────────────────────────── */}
      <section style={{ padding: "80px 0", background: "var(--surface-2)" }}>
        <div className="container-xl">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 800 }}>Nilai Inti</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
            {[
              { icon: ShieldCheckIcon, title: "Integritas", desc: "Kami memberikan spesifikasi teknis yang jujur dan waktu tunggu yang transparan untuk setiap pesanan." },
              { icon: LightBulbIcon, title: "Inovasi", desc: "Platform kami terus berkembang untuk menyediakan alat pelacakan dan katalogisasi yang lebih baik." },
              { icon: ClockIcon, title: "Keandalan", desc: "Kami memahami bahwa waktu henti jaringan bukanlah pilihan. Kami mengirimkan tepat waktu, setiap saat." }
            ].map((v, i) => (
              <div key={i} className="nc-card animate-fadeUp" style={{ padding: "40px", textAlign: "center", animationDelay: `${i * 0.1}s`, borderRadius: "24px", border: "1px solid var(--border)", boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--navy-900)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                  <v.icon className="w-8 h-8" />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>{v.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section style={{ padding: "100px 0", textAlign: "center" }}>
        <div className="container-xl">
          <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "24px" }}>Siap untuk mengembangkan jaringan Anda?</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
            <Link href="/catalog" className="nc-btn-primary" style={{ padding: "14px 36px", fontSize: "15px", borderRadius: "100px" }}>
              Jelajahi Katalog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
