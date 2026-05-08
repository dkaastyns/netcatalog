import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="nc-footer" style={{ marginTop: 0 }}>
      <div className="container-xl">
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 32 }}>
          {/* Brand */}
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", color: "#fff", marginBottom: "6px", letterSpacing: "-0.3px" }}>Netcatalog</div>
            <div style={{ fontSize: "12px", color: "rgba(242,224,208,0.6)", lineHeight: 1.6 }}>
              Platform manajemen inventaris jaringan<br />untuk profesional modern.
            </div>
            <div style={{ fontSize: "11px", color: "rgba(242,224,208,0.4)", marginTop: 16 }}>
              © {year} Netcatalog Infrastructure Systems. Hak cipta dilindungi.
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 60, background: "rgba(255,255,255,0.1)" }} />

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 24, marginBottom: 4 }}>
              {["Katalog", "Kategori", "Tentang Kami", "Kontak"].map(l => (
                <Link key={l} href={l === "Katalog" ? "/catalog" : l === "Kategori" ? "/categories" : l === "Tentang Kami" ? "/about" : "/contact"} className="nc-footer-link" style={{ fontSize: "13px" }}>{l}</Link>
              ))}
            </div>
            <Link href="/login" className="nc-footer-link" style={{ fontSize: "11.5px", opacity: 0.5 }}>
              Akses Admin →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
