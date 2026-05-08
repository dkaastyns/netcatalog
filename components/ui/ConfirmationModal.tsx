"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

import {
    TrashIcon,
    ExclamationTriangleIcon,
    ArrowLeftOnRectangleIcon
} from "@heroicons/react/24/outline";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "primary";
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false
}: ConfirmationModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const getIcon = () => {
        switch (variant) {
            case "danger":
                return (
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: "linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)",
                        color: "#e53e3e", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px", boxShadow: "0 10px 15px -3px rgba(245, 101, 101, 0.2)"
                    }}>
                        <TrashIcon className="w-[34px] h-[34px]" strokeWidth={1.8} />
                    </div>
                );
            case "warning":
                return (
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                        color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px", boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.2)"
                    }}>
                        <ExclamationTriangleIcon className="w-[34px] h-[34px]" strokeWidth={1.8} />
                    </div>
                );
            default:
                return (
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                        color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.2)"
                    }}>
                        <ArrowLeftOnRectangleIcon className="w-[34px] h-[34px]" strokeWidth={1.8} />
                    </div>
                );
        }
    };

    const getConfirmButtonStyle = () => {
        const base = { flex: 1, height: "48px", borderRadius: "14px", fontWeight: 700, fontSize: "14px", cursor: isLoading ? "wait" : "pointer", transition: "all 0.2s", opacity: isLoading ? 0.7 : 1 };
        switch (variant) {
            case "danger":
                return { ...base, background: "#ef4444", color: "white", border: "none", boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)" };
            case "warning":
                return { ...base, background: "#f59e0b", color: "white", border: "none", boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.3)" };
            default:
                return { ...base, background: "var(--navy-700)", color: "white", border: "none", boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.3)" };
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="nc-card"
                        style={{
                            width: "100%",
                            maxWidth: 400,
                            padding: 0,
                            textAlign: "center",
                            borderRadius: 28,
                            overflow: "hidden",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.2)",
                            background: "white"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: "40px 32px 32px" }}>
                            {getIcon()}
                            <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--navy-950)", marginBottom: 12, letterSpacing: "-0.5px" }}>{title}</h3>
                            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>{message}</p>
                        </div>

                        <div style={{ padding: "0 24px 24px", display: "flex", gap: 12 }}>
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="nc-btn-secondary"
                                style={{ flex: 1, height: "48px", borderRadius: "14px", fontWeight: 600, fontSize: "14px", border: "1px solid var(--border)" }}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                style={getConfirmButtonStyle() as React.CSSProperties}
                            >
                                {isLoading ? "Processing..." : confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (!mounted) return null;
    return createPortal(modalContent, document.body);
}
