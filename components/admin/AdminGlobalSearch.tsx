"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    CubeIcon,
    FolderIcon,
    UsersIcon,
    ChevronRightIcon,
    DocumentTextIcon
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

export function AdminGlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{
        products: SearchResult[];
        categories: SearchResult[];
        users: SearchResult[];
        orders: SearchResult[];
    }>({ products: [], categories: [], users: [], orders: [] });
    const [isLoading, setIsLoading] = useState(false);
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
            handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const navigateTo = (type: string, id: string) => {
        onClose();
        if (type === 'product') router.push(`/admin/products/${id}`);
        else if (type === 'category') router.push(`/admin/categories?edit=${id}`);
        else if (type === 'user') router.push(`/admin/users`);
        else if (type === 'order') router.push(`/admin/orders`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="nc-search-overlay" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="nc-search-modal"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="nc-search-header">
                        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search products, orders, users..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="nc-search-modal-input"
                        />
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <XMarkIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="nc-search-results">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="nc-spinner-sm mb-4" />
                                <div className="text-sm font-medium">Searching records...</div>
                            </div>
                        ) : query && Object.values(results).every(arr => !arr || arr.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-8">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                    <MagnifyingGlassIcon className="w-8 h-8 text-slate-300" />
                                </div>
                                <div className="text-sm font-bold text-slate-600 mb-1">No results found</div>
                                <div className="text-xs">We couldn&apos;t find anything matching &quot;{query}&quot;</div>
                            </div>
                        ) : !query ? (
                            <div className="px-6 py-4">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                        <MagnifyingGlassIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700">Quick Search</div>
                                        <div className="text-[11px] text-slate-500">Find products, categories, users, or orders instantly.</div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Recent Searches</div>
                                    <div className="flex flex-wrap gap-2">
                                        {['Products', 'Active Orders', 'Inventory'].map(tag => (
                                            <button key={tag} onClick={() => setQuery(tag)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-100 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all">
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-4">
                                {results.products.length > 0 && (
                                    <Section title="Products" icon={CubeIcon}>
                                        {results.products.map(p => (
                                            <ResultItem key={p.id} icon={CubeIcon} label={p.name!} sublabel={p.slug} onClick={() => navigateTo('product', p.id)} />
                                        ))}
                                    </Section>
                                )}
                                {results.categories.length > 0 && (
                                    <Section title="Categories" icon={FolderIcon}>
                                        {results.categories.map(c => (
                                            <ResultItem key={c.id} icon={FolderIcon} label={c.name!} sublabel={`${c.slug}`} onClick={() => navigateTo('category', c.id)} />
                                        ))}
                                    </Section>
                                )}
                                {results.users.length > 0 && (
                                    <Section title="Users" icon={UsersIcon}>
                                        {results.users.map(u => (
                                            <ResultItem key={u.id} icon={UsersIcon} label={u.name!} sublabel={u.email} onClick={() => navigateTo('user', u.id)} />
                                        ))}
                                    </Section>
                                )}
                                {results.orders && results.orders.length > 0 && (
                                    <Section title="Orders" icon={DocumentTextIcon}>
                                        {results.orders.map(o => (
                                            <ResultItem key={o.id} icon={DocumentTextIcon} label={`Order #${o.id}`} sublabel={`Customer: ${o.customerName}`} onClick={() => navigateTo('order', o.id)} />
                                        ))}
                                    </Section>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="nc-search-footer">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="nc-kbd">ESC</span>
                                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Close</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="nc-kbd">ENTER</span>
                                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Select</span>
                            </div>
                        </div>
                        <div className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Netcatalog Search
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-center gap-2 px-4 mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
            </div>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function ResultItem({ label, sublabel, icon: Icon, onClick }: { label: string; sublabel?: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }) {
    return (
        <button onClick={onClick} className="nc-search-result-item group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-900 transition-colors">{label}</span>
                {sublabel && <span className="text-[11px] text-slate-400">{sublabel}</span>}
            </div>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
        </button>
    );
}
