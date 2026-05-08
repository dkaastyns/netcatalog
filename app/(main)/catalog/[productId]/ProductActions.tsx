"use client";

import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

interface ProductActionsProps {
    productName: string;
}

export function ProductActions({ productName }: ProductActionsProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link
                href={`/contact?produk=${encodeURIComponent(productName)}`}
                className="nc-btn-primary"
                style={{
                    height: "56px",
                    justifyContent: "center",
                    fontSize: "16px",
                    background: "var(--blue-mirage)",
                    color: "#fff",
                    borderRadius: "12px",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                }}
            >
                <EnvelopeIcon className="w-5 h-5" />
                Hubungi untuk Penawaran
            </Link>
            <p style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "center", margin: 0 }}>
                Tim kami akan merespons dalam 1×24 jam
            </p>
        </div>
    );
}
