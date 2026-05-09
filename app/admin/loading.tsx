export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg mb-2"></div>
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
      
      {/* Table Skeleton */}
      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
        <div className="h-14 border-b border-slate-200 bg-slate-50/50 flex items-center px-6 gap-4">
           <div className="h-4 w-24 bg-slate-200 rounded"></div>
           <div className="h-4 w-32 bg-slate-200 rounded ml-10"></div>
           <div className="h-4 w-20 bg-slate-200 rounded ml-auto"></div>
        </div>
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="h-20 border-b border-slate-100 flex items-center px-6 gap-6">
            <div className="h-11 w-11 bg-slate-100 rounded-xl flex-shrink-0"></div>
            <div className="space-y-2">
               <div className="h-4 w-40 bg-slate-200 rounded"></div>
               <div className="h-3 w-24 bg-slate-100 rounded"></div>
            </div>
            <div className="h-4 w-24 bg-slate-100 rounded ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
