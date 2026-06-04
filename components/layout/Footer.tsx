"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function Footer() {
  const year = new Date().getFullYear();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  return (
    <footer className="nc-footer" style={{ marginTop: 0 }}>
      <div className="container-xl">
        <div className="nc-footer-grid">
          {/* Brand */}
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", color: "#fff", marginBottom: "6px", letterSpacing: "-0.3px" }}>Netcatalog</div>
            <div style={{ fontSize: "12px", color: "rgba(242, 224, 208, 0.85)", lineHeight: 1.6 }}>
              Platform manajemen inventaris jaringan<br />untuk profesional modern.
            </div>
            <div style={{ fontSize: "11px", color: "rgba(242, 224, 208, 0.65)", marginTop: 16 }}>
              © {year} Netcatalog Infrastructure Systems. Hak cipta dilindungi.
            </div>
          </div>

          {/* Divider */}
          <div className="nc-footer-divider" style={{ width: 1, height: 60, background: "rgba(255, 255, 255, 0.15)" }} />

          {/* Links */}
          <div className="nc-footer-links-col">
            <div className="nc-footer-links-row" style={{ marginBottom: 4 }}>
              {[
                { label: "Katalog", href: "/catalog" },
                { label: "Kategori", href: "/categories" },
                { label: "Tentang Kami", href: "/about" },
                { label: "Kontak", href: "/contact" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="nc-footer-link"
                  style={{ fontSize: "13px" }}
                >
                  {label}
                </Link>
              ))}
            </div>
            {!isLoggedIn && (
              <Link href="/login" className="nc-footer-link" style={{ fontSize: "11.5px", opacity: 0.75 }}>
                Akses Admin →
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
