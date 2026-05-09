import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import {
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

export default async function ContactPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar session={session} />

            <main className="flex-grow container-xl py-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 animate-fadeUp">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Hubungi Tim Kami</h1>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Dukungan infrastruktur ahli dan pertanyaan katalog. Kami di sini untuk memastikan jaringan Anda tetap unggul.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        <div className="nc-card p-8 text-center flex flex-col items-center hover:border-slate-300 transition-colors animate-fadeUp" style={{ animationDelay: "0.1s" }}>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 mb-6 border border-slate-100">
                                <EnvelopeIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Email Kami</h3>
                            <p className="text-sm text-slate-500">support@netcatalog.info</p>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Dukungan Cepat</p>
                        </div>

                        <div className="nc-card p-8 text-center flex flex-col items-center hover:border-slate-300 transition-colors animate-fadeUp" style={{ animationDelay: "0.2s" }}>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 mb-6 border border-slate-100">
                                <PhoneIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Telepon Langsung</h3>
                            <p className="text-sm text-slate-500">+1 (555) 789-2244</p>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Sen - Jum, 9-6</p>
                        </div>

                        <div className="nc-card p-8 text-center flex flex-col items-center hover:border-slate-300 transition-colors animate-fadeUp" style={{ animationDelay: "0.3s" }}>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 mb-6 border border-slate-100">
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">WhatsApp</h3>
                            <p className="text-sm text-slate-500">+62 821-4456-9908</p>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Tersedia Sekarang</p>
                        </div>

                        <div className="nc-card p-8 text-center flex flex-col items-center hover:border-slate-300 transition-colors animate-fadeUp" style={{ animationDelay: "0.4s" }}>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-800 mb-6 border border-slate-100">
                                <MapPinIcon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">Kantor</h3>
                            <p className="text-sm text-slate-500">Netcatalog</p>
                            <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">Semarang, Indonesia</p>
                        </div>
                    </div>

                    <div className="nc-card py-16 px-8 sm:px-12 text-center bg-slate-50/50 border-dashed border-slate-200 animate-fadeUp mb-8" style={{ animationDelay: "0.5s" }}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Mencari Spesifikasi Teknis?</h2>
                        <p className="text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">Jelajahi katalog ekstensif perangkat keras jaringan kelas perusahaan dan solusi infrastruktur kami.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/catalog" className="nc-btn-primary h-12 px-8 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-medium">Lihat Katalog</Link>
                            <Link href="/about" className="nc-btn-secondary h-12 px-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all font-medium text-slate-700">Cerita Kami</Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
