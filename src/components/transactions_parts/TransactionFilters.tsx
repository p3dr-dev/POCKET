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
    <div className="flex-none p-4 md:p-6 border-b border-gray-50 bg-gray-50/30 space-y-4">
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Filtrar por nome, categoria, pagador ou recebedor..." 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full bg-white border-2 border-gray-100 focus:border-black rounded-xl py-2.5 px-4 text-xs font-bold outline-none transition-all placeholder:text-gray-300" 
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Toggle */}
          <div className="flex bg-white border-2 border-gray-100 p-1 rounded-xl">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((type) => (
              <button 
                key={type} 
                onClick={() => onFilterTypeChange(type)} 
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  filterType === type ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'
                }`}
              >
                {type === 'ALL' ? 'Tudo' : type === 'INCOME' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <select 
              value={sortBy} 
              onChange={(e) => onSortByChange(e.target.value as any)} 
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all appearance-none cursor-pointer"
            >
              <option value="date">Data</option>
              <option value="amount">Valor</option>
            </select>
            <button 
              onClick={onToggleSortOrder} 
              className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:border-black transition-all active:scale-95"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
