"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Magnet from "../ui/Magnet";
import { motion } from "framer-motion";

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
                    <Magnet intensity={0.2} padding={8}>
                        <Link href="/" className="nc-nav-logo" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>Netcatalog</Link>
                    </Magnet>

                    {/* Desktop nav links */}
                    <div className="nc-nav-links" style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                        {navLinks.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`nc-nav-link ${isActive ? 'active' : ''}`}
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {link.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-active-indicator"
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: "rgba(255, 255, 255, 0.15)",
                                                borderRadius: "6px",
                                                zIndex: -1
                                            }}
                                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Auth + Mobile toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {session ? (
                        <>
                            {(session.user as { role?: string }).role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="nc-nav-link"
                                    style={{ fontSize: "12.5px", color: "var(--amber-600)", fontWeight: 600, whiteSpace: "nowrap" }}
                                >
                                    Admin
                                </Link>
                            )}
                            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
                                <Magnet intensity={0.3}>
                                    <div style={{
                                        width: "32px", height: "32px", borderRadius: "50%",
                                        background: "var(--navy-700)", color: "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "12px", fontWeight: 700, border: "2px solid rgba(255,255,255,0.2)",
                                        overflow: "hidden", flexShrink: 0,
                                        transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease"
                                    }}>
                                        {session.user.image ? (
                                            <Image src={session.user.image} alt={session.user.name} width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            session.user.name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </Magnet>
                                <span className="nc-nav-links" style={{ fontSize: "13px", color: "rgba(242,224,208,0.85)", fontWeight: 500, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {session.user.name?.split(' ')[0]}
                                </span>
                            </Link>
                        </>
                    ) : null}

                    {/* Mobile hamburger */}
                    <button
                        className="nc-nav-toggle"
                        onClick={() => setOpen(!open)}
                        aria-label="Toggle menu"
                        aria-expanded={open}
                        style={{
                            display: "none", /* shown via CSS at mobile */
                            background: "transparent",
                            border: "none",
                            color: "var(--amber-smoke)",
                            fontSize: "22px",
                            cursor: "pointer",
                            padding: "8px",
                            lineHeight: 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <motion.span
                            key={open ? 'close' : 'open'}
                            initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                            animate={{ rotate: 0, opacity: 1, scale: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            style={{ display: "block" }}
                        >
                            {open ? '✕' : '☰'}
                        </motion.span>
                    </button>
                </div>
            </div>

            {/* Mobile menu — CSS animated via max-height transition */}
            <div className={`nc-nav-mobile-menu ${open ? 'open' : ''}`}>
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`nc-nav-link ${pathname === link.href ? 'active' : ''}`}
                        onClick={() => setOpen(false)}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
