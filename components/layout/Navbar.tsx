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
    // Prefer sessionData if available, otherwise use initialSession if we're still loading
    const session = sessionData || (isPending ? initialSession : null);

    const navLinks = [
        { href: "/catalog", label: "Katalog" },
        { href: "/categories", label: "Kategori" },
        { href: "/about", label: "Tentang Kami" },
        { href: "/contact", label: "Kontak" },
    ];

    const [open, setOpen] = useState(false);

    return (
        <nav className="nc-nav">
            <div className="container-xl" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", position: "relative" }}>
                    <Magnet intensity={0.2} padding={8}>
                        <Link href="/" className="nc-nav-logo">Netcatalog</Link>
                    </Magnet>

                    <button className="md:hidden text-[#f2e0d0] text-2xl p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
                        {open ? '✕' : '☰'}
                    </button>

                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`nc-nav-link ${isActive ? 'active' : ''}`}
                                    style={{
                                        position: "relative",
                                        padding: "6px 12px",
                                        zIndex: 1
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
                                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile menu (toggle-controlled) */}
                    {open && (
                        <div className="md:hidden absolute top-[64px] left-0 right-0 bg-[#6e88b0] border-b border-white/10 flex flex-col p-4 z-50 shadow-xl">
                            {navLinks.map(link => (
                                <Link key={link.href} href={link.href} className="nc-nav-link text-base border-b border-white/5 last:border-0" onClick={() => setOpen(false)} style={{ padding: '12px 16px' }}>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

                    {session ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            {(session.user as { role?: string }).role === 'admin' && (
                                <Magnet intensity={0.15}>
                                    <Link href="/admin" className="nc-nav-link" style={{ fontSize: "13px", color: "var(--amber-600)", fontWeight: 600 }}>Admin Panel</Link>
                                </Magnet>
                            )}
                            <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                                <Magnet intensity={0.3}>
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
                                </Magnet>
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
