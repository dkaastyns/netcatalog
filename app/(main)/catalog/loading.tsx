import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function CatalogLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Navbar fallback */}
      <Navbar session={null} />
      
      <div className="container-xl" style={{ padding: "48px 24px", display: "grid", gridTemplateColumns: "288px 1fr", gap: "32px", alignItems: "start" }}>
        
        {/* Sidebar Filter Skeleton */}
        <aside className="h-[600px] bg-white border border-slate-200 rounded-[20px] p-7 shadow-sm">
           <div className="animate-pulse">
             <div className="flex justify-between items-center mb-6">
               <div className="h-5 w-20 bg-slate-200 rounded"></div>
             </div>
             
             <div className="h-11 w-full bg-slate-100 rounded-xl mb-6"></div>
             <div className="h-[1px] w-full bg-slate-200 mb-5"></div>
             
             <div className="h-3 w-28 bg-slate-200 rounded mb-4"></div>
             <div className="flex gap-2 mb-6">
               <div className="h-9 w-full bg-slate-100 rounded-xl"></div>
               <div className="h-9 w-full bg-slate-100 rounded-xl"></div>
             </div>

             <div className="h-[1px] w-full bg-slate-200 mb-5"></div>

             <div className="h-3 w-24 bg-slate-200 rounded mb-4"></div>
             <div className="space-y-3">
               <div className="h-4 w-full bg-slate-100 rounded"></div>
               <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
               <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
               <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
             </div>
           </div>
        </aside>
        
        {/* Main Grid Skeleton */}
        <main>
           <div className="flex justify-between items-center mb-8 animate-pulse">
             <div>
               <div className="h-8 w-56 bg-slate-200 rounded-lg mb-2"></div>
               <div className="h-4 w-40 bg-slate-100 rounded"></div>
             </div>
             <div className="h-10 w-44 bg-slate-100 rounded-xl"></div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {Array.from({length: 6}).map((_, i) => (
               <div key={i} className="h-[360px] bg-white border border-slate-100 rounded-[20px] shadow-sm animate-pulse p-4 flex flex-col">
                 <div className="h-40 bg-slate-100 rounded-xl mb-4"></div>
                 <div className="h-4 w-20 bg-slate-200 rounded mb-2"></div>
                 <div className="h-5 w-full bg-slate-200 rounded mb-2"></div>
                 <div className="h-10 w-full bg-slate-100 rounded mt-auto"></div>
               </div>
             ))}
           </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
