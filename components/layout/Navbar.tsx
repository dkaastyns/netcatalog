"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

interface NavbarProps {
    session: {
        user: {
            id: string;
            name: string;
            email: string;
            role?: string | null;
            image?: string | null;
        };
    } | null;
}



export function Navbar({ session: initialSession }: NavbarProps) {
    const pathname = usePathname();


    const { data: sessionData, isPending } = authClient.useSession();
    // Prefer sessionData if available, otherwise use initialSession if we're still loading
    const session = sessionData || (isPending ? initialSession : null);



    const navLinks = [
        { href: "/catalog", label: "Katalog" },
        { href: "/categories", label: "Kategori" },
        { href: "/about", label: "Tentang Kami" },
        { href: "/contact", label: "Kontak" },
    ];

    return (
        <nav className="nc-nav">
            <div className="container-xl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                    <Link href="/" className="nc-nav-logo">Netcatalog</Link>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nc-nav-link ${pathname === link.href ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

                    {session ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            {(session.user as { role?: string }).role === 'admin' && (
                                <Link href="/admin" className="nc-nav-link" style={{ fontSize: "13px", color: "var(--amber-600)", fontWeight: 600 }}>Admin Panel</Link>
                            )}
                            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                                <div style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    background: "var(--navy-700)", color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "12px", fontWeight: 700, border: "2px solid var(--border)",
                                    overflow: "hidden"
                                }}>
                                    {session.user.image ? (
                                        <Image src={session.user.image} alt={session.user.name} width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        session.user.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{session.user.name?.split(' ')[0]}</span>
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {/* Hidden from guests */}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
