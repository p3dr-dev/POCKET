'use client';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterType: 'ALL' | 'INCOME' | 'EXPENSE';
  onFilterTypeChange: (val: 'ALL' | 'INCOME' | 'EXPENSE') => void;
  sortBy: 'date' | 'amount';
  onSortByChange: (val: 'date' | 'amount') => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
}

export default function TransactionFilters({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder
}: TransactionFiltersProps) {
  return (
    <div className="flex-none p-4 md:p-6 border-b border-gray-50 bg-white/50 backdrop-blur-xl sticky top-0 z-20 space-y-4">
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Pesquisar transações..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full bg-white border border-gray-100 focus:border-black rounded-2xl py-3 pl-10 pr-4 text-xs font-bold outline-none transition-all placeholder:text-gray-300 shadow-sm" 
          />
          <svg className="w-4 h-4 text-gray-300 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Type Toggle */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
              <button 
                key={type} 
                onClick={() => onFilterTypeChange(type)} 
                className={`px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterType === type ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type === 'ALL' ? 'Tudo' : type === 'INCOME' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-100 hidden md:block" />

          {/* Sort Controls */}
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <div className="relative flex-1 md:flex-none">
              <select 
                value={sortBy} 
                onChange={(e) => onSortByChange(e.target.value as any)} 
                className="w-full md:w-auto bg-white border border-gray-100 rounded-xl pl-4 pr-8 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer shadow-sm text-gray-700"
              >
                <option value="date">Data</option>
                <option value="amount">Valor</option>
              </select>
              <svg className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
            
            <button 
              onClick={onToggleSortOrder} 
              className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-gray-500 hover:text-black hover:border-black transition-all active:scale-95 shadow-sm"
              title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              {sortOrder === 'asc' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
