"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

// framer-motion & Magnet removed — all animations use CSS transitions.
// This eliminates the framer-motion chunk from the critical rendering path,
// significantly reducing initial JS bundle size.

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
    const session = sessionData || (isPending ? initialSession : null);

    const navLinks = [
        { href: "/catalog", label: "Katalog" },
        { href: "/categories", label: "Kategori" },
        { href: "/about", label: "Tentang Kami" },
        { href: "/contact", label: "Kontak" },
    ];

    const [open, setOpen] = useState(false);

    return (
        <nav className="nc-nav" style={{ position: "sticky", top: 0, zIndex: 100 }}>
            <div className="container-xl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "16px" }}>

                {/* Left: Logo + Desktop Links */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                    <Link href="/" className="nc-nav-logo" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                        Netcatalog
                    </Link>

                    {/* Desktop nav links */}
                    <div className="nc-nav-links" style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                        {navLinks.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`nc-nav-link ${isActive ? "active" : ""}`}
                                    style={{ whiteSpace: "nowrap" }}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Auth + Mobile toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {session ? (
                        <>
                            {/* better-auth doesn't include 'role' in its default User type — assert it */}
                            {(session.user as { role?: string | null }).role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="nc-nav-link"
                                    style={{ fontSize: "12.5px", color: "var(--amber-600)", fontWeight: 600, whiteSpace: "nowrap" }}
                                >
                                    Admin
                                </Link>
                            )}
                            <Link
                                href="/profile"
                                style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}
                            >
                                {/* Avatar — CSS hover via .nc-nav-avatar class */}
                                <div className="nc-nav-avatar">
                                    {session.user.image ? (
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name}
                                            width={32}
                                            height={32}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        session.user.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span
                                    className="nc-nav-links"
                                    style={{
                                        fontSize: "13px",
                                        color: "rgba(242,224,208,0.85)",
                                        fontWeight: 500,
                                        maxWidth: "100px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {session.user.name?.split(" ")[0]}
                                </span>
                            </Link>
                        </>
                    ) : null}

                    {/* Mobile hamburger — CSS transition replaces framer-motion */}
                    <button
                        className="nc-nav-toggle"
                        onClick={() => setOpen(prev => !prev)}
                        aria-label={open ? "Tutup menu" : "Buka menu"}
                        aria-expanded={open}
                        style={{ display: "none" }} /* shown via @media CSS */
                    >
                        <span
                            className="nc-nav-hamburger-icon"
                            style={{
                                display: "block",
                                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                        >
                            {open ? "✕" : "☰"}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mobile menu — CSS animated via max-height + opacity transition */}
            <div className={`nc-nav-mobile-menu ${open ? "open" : ""}`}>
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`nc-nav-link ${pathname === link.href ? "active" : ""}`}
                        onClick={() => setOpen(false)}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
