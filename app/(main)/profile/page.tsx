import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "80px" }}>
      <Navbar session={session} />

      {/* ── Profile Content ────────────────────────── */}
      <main className="container-xl" style={{ marginTop: "48px", maxWidth: "800px" }}>
        <style>{`
          .profile-card { padding: 48px; }
          .profile-avatar-wrap { width: 100px; height: 100px; border-radius: 32px; font-size: 40px; }
          .profile-h1 { font-size: 32px; }
          @media (max-width: 767px) {
            .profile-card { padding: 24px 20px; }
            .profile-avatar-wrap { width: 72px; height: 72px; border-radius: 20px; font-size: 28px; margin-bottom: 16px; }
            .profile-h1 { font-size: 24px; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .profile-card { padding: 32px; }
          }
        `}</style>
        <div className="nc-card profile-card animate-fadeUp" style={{ textAlign: "center" }}>
          <div className="profile-avatar-wrap" style={{
            background: "linear-gradient(135deg, var(--navy-700) 0%, var(--navy-900) 100%)",
            margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, color: "#fff",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "4px solid var(--surface-2)",
            transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
          }}>
            {session.user.name?.charAt(0).toUpperCase()}
          </div>

          <h1 className="profile-h1" style={{ fontWeight: 800, marginBottom: "8px" }}>{session.user.name}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px" }}>{session.user.email}</p>

          <div className="profile-grid" style={{ display: "grid", gap: "16px", marginBottom: "40px", textAlign: "left" }}>
            <div style={{ padding: "20px", background: "var(--surface-2)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Account Type</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: session.user.role === 'admin' ? "var(--amber-600)" : "var(--text-primary)" }}>
                {session.user.role === 'admin' ? "Administrator" : "Standard User"}
              </div>
            </div>
            <div style={{ padding: "20px", background: "var(--surface-2)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Member Since</div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>
                {new Date(session.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {session.user.role === 'admin' && (
              <Link href="/admin" className="nc-btn-primary" style={{ padding: "12px 24px" }}>
                Go to Admin Dashboard
              </Link>
            )}
            <ProfileClient />
          </div>
        </div>
      </main>
    </div>
  );
}
