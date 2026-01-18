'use client';

interface Category { id: string; name: string; }
interface Account { id: string; name: string; }

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterType: 'ALL' | 'INCOME' | 'EXPENSE';
  onFilterTypeChange: (val: 'ALL' | 'INCOME' | 'EXPENSE') => void;
  filterCategoryId: string;
  onFilterCategoryChange: (val: string) => void;
  filterAccountId: string;
  onFilterAccountChange: (val: string) => void;
  sortBy: 'date' | 'amount';
  onSortByChange: (val: 'date' | 'amount') => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  categories: Category[];
  accounts: Account[];
}

export default function TransactionFilters({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterCategoryId,
  onFilterCategoryChange,
  filterAccountId,
  onFilterAccountChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  categories,
  accounts
}: TransactionFiltersProps) {
  return (
    <div className="flex-none p-6 md:p-8 border-b border-gray-50 bg-white/50 backdrop-blur-xl sticky top-0 z-20 space-y-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Search */}
        <div className="flex-1 relative group">
          <input 
            type="text" 
            placeholder="Pesquisar transações..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full bg-gray-50/50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl py-4 pl-12 pr-6 text-sm font-bold outline-none transition-all placeholder:text-gray-300 shadow-sm" 
          />
          <svg className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {/* Category Filter */}
          <div className="relative">
            <select 
              value={filterCategoryId} 
              onChange={(e) => onFilterCategoryChange(e.target.value)}
              className="bg-white border-2 border-gray-100 rounded-2xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer text-gray-700 shadow-sm"
            >
              <option value="">Todas Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </div>

          {/* Account Filter */}
          <div className="relative">
            <select 
              value={filterAccountId} 
              onChange={(e) => onFilterAccountChange(e.target.value)}
              className="bg-white border-2 border-gray-100 rounded-2xl pl-4 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer text-gray-700 shadow-sm"
            >
              <option value="">Todas Contas</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </div>

          <div className="w-px h-10 bg-gray-100 hidden xl:block" />

          {/* Type Toggle */}
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
              <button 
                key={type} 
                onClick={() => onFilterTypeChange(type)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  filterType === type ? 'bg-white text-black shadow-lg shadow-black/5' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type === 'ALL' ? 'Tudo' : type === 'INCOME' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>

          <div className="w-px h-10 bg-gray-100 hidden xl:block" />

          {/* Sort Controls */}
          <div className="flex items-center gap-3 flex-1 md:flex-none">
            <div className="relative flex-1 md:flex-none">
              <select 
                value={sortBy} 
                onChange={(e) => onSortByChange(e.target.value as any)} 
                className="w-full md:w-auto bg-white border-2 border-gray-100 rounded-2xl pl-5 pr-10 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer shadow-sm text-gray-700"
              >
                <option value="date">Ordenar por Data</option>
                <option value="amount">Ordenar por Valor</option>
              </select>
              <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
            
            <button 
              onClick={onToggleSortOrder} 
              className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-500 hover:text-black hover:border-black transition-all active:scale-95 shadow-sm"
              title={sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            >
              {sortOrder === 'asc' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
