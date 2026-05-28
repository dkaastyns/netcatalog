"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function Footer() {
  const year = new Date().getFullYear();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;

  return (
    <footer className="nc-footer" style={{ marginTop: 0 }}>
      <style>{`
        .nc-footer-link {
          transition: opacity 0.2s ease;
        }
        .nc-footer-link:hover {
          opacity: 0.7;
        }
        .nc-footer-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 32px;
        }
        .nc-footer-links-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
        }
        .nc-footer-links-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        @media (max-width: 767px) {
          .nc-footer-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .nc-footer-divider {
            display: none;
          }
          .nc-footer-links-col {
            align-items: flex-start;
          }
          .nc-footer-links-row {
            justify-content: flex-start;
            gap: 14px;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .nc-footer-grid {
            grid-template-columns: 1fr auto 1fr;
            gap: 24px;
          }
        }
      `}</style>
      <div className="container-xl">
        <div className="nc-footer-grid">
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
          <div className="nc-footer-divider" style={{ width: 1, height: 60, background: "rgba(255,255,255,0.1)" }} />

          {/* Links */}
          <div className="nc-footer-links-col">
            <div className="nc-footer-links-row" style={{ marginBottom: 4 }}>
              {["Katalog", "Kategori", "Tentang Kami", "Kontak"].map(l => (
                <Link
                  key={l}
                  href={l === "Katalog" ? "/catalog" : l === "Kategori" ? "/categories" : l === "Tentang Kami" ? "/about" : "/contact"}
                  className="nc-footer-link"
                  style={{ fontSize: "13px" }}
                >
                  {l}
                </Link>
              ))}
            </div>
            {!isLoggedIn && (
              <Link href="/login" className="nc-footer-link" style={{ fontSize: "11.5px", opacity: 0.5 }}>
                Akses Admin →
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
