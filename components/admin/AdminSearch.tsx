"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    CubeIcon,
    FolderIcon,
    UsersIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface SearchResult {
    id: string;
    name?: string;
    slug?: string;
    email?: string;
    userName?: string;
    customerName?: string;
    type: 'product' | 'category' | 'user' | 'order';
}

export function AdminSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{
        products: SearchResult[];
        categories: SearchResult[];
        users: SearchResult[];
        orders: SearchResult[];
    }>({ products: [], categories: [], users: [], orders: [] });
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults({ products: [], categories: [], users: [], orders: [] });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const navigateTo = (type: string, id: string) => {
        setIsOpen(false);
        setQuery("");
        if (type === 'product') router.push(`/catalog/${id}`);
        else if (type === 'category') router.push(`/admin/categories?edit=${id}`);
        else if (type === 'user') router.push(`/admin/users`);
        else if (type === 'order') router.push(`/admin/orders`);
    };

    const hasResults = Object.values(results).some(arr => arr && arr.length > 0);

    return (
        <div ref={containerRef} className="relative z-[100]">
            <div className={`relative flex items-center transition-all duration-300 ${isOpen ? 'w-[400px]' : 'w-[240px]'}`}>
                <MagnifyingGlassIcon className={`w-4 h-4 absolute left-3 transition-colors ${isOpen ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    className="nc-search-input !pointer-events-auto"
                    placeholder="Cari data... (Ctrl+K)"
                    style={{ height: "40px", borderRadius: "12px", width: "100%", paddingLeft: "36px", paddingRight: "36px" }}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <AnimatePresence>
                    {(query || isOpen) && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => {
                                setQuery("");
                                setIsOpen(false);
                                inputRef.current?.blur();
                            }}
                            className="absolute right-3 p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-3.5 h-3.5 text-slate-400" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-[calc(100%+8px)] right-0 w-[480px] bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl overflow-hidden"
                        style={{ boxShadow: "0 20px 50px -12px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)" }}
                    >
                        <div className="max-height-[400px] overflow-y-auto custom-scrollbar">
                            {!query && (
                                <div className="p-4">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Pintasan Cepat</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <ShortcutItem icon={CubeIcon} label="Produk" onClick={() => router.push('/admin/products')} />
                                        <ShortcutItem icon={UsersIcon} label="Pengguna" onClick={() => router.push('/admin/users')} />
                                    </div>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <div className="nc-spinner-sm mb-3" />
                                    <span className="text-xs font-medium">Mencari...</span>
                                </div>
                            ) : query && !hasResults ? (
                                <div className="py-12 text-center text-slate-400 px-6">
                                    <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <div className="text-sm font-bold text-slate-600 mb-1">Hasil tidak ditemukan</div>
                                    <div className="text-xs">Kami tidak menemukan data untuk &quot;{query}&quot;</div>
                                </div>
                            ) : hasResults && (
                                <div className="py-2 space-y-4">
                                    {results.products.length > 0 && (
                                        <Section title="Produk">
                                            {results.products.map(p => (
                                                <ResultItem key={p.id} icon={CubeIcon} label={p.name!} sublabel={p.slug} onClick={() => navigateTo('product', p.slug || p.id.toString())} />
                                            ))}
                                        </Section>
                                    )}
                                    {results.categories.length > 0 && (
                                        <Section title="Kategori">
                                            {results.categories.map(c => (
                                                <ResultItem key={c.id} icon={FolderIcon} label={c.name!} sublabel={c.slug} onClick={() => navigateTo('category', c.id)} />
                                            ))}
                                        </Section>
                                    )}
                                    {results.users.length > 0 && (
                                        <Section title="Pengguna">
                                            {results.users.map(u => (
                                                <ResultItem key={u.id} icon={UsersIcon} label={u.name!} sublabel={u.email} onClick={() => navigateTo('user', u.id)} />
                                            ))}
                                        </Section>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Pencarian Global Netcatalog
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ShortcutItem({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">{label}</span>
        </button>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <div className="px-6 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
            </div>
            <div className="space-y-0.5">{children}</div>
        </div>
    );
}

function ResultItem({ label, sublabel, icon: Icon, onClick }: { label: string, sublabel?: string, icon: React.ElementType, onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full px-6 py-2.5 flex items-center gap-4 hover:bg-blue-50/50 transition-colors group text-left">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 shadow-sm transition-all">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-width-0">
                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-900 transition-colors truncate">{label}</span>
                {sublabel && <span className="text-[11px] text-slate-400 truncate">{sublabel}</span>}
            </div>
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
        </button>
    );
}


