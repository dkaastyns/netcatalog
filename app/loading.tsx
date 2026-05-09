export default function GlobalLoading() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-widest">Memuat Halaman</p>
      </div>
    </div>
  );
}
