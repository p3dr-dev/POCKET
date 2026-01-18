'use client';

import { useMemo, useState } from 'react';

interface HistoryItem {
  label: string;
  value: number;
}

export default function NetWorthChart({ 
  history = [],
  isLoading = false
}: { 
  history?: HistoryItem[], 
  isLoading?: boolean
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = history;

  // SVG Helpers
  const width = 100;
  const height = 50;
  const padding = 5;
  const graphWidth = width;
  const graphHeight = height - 10;

  const minVal = Math.min(...data.map(d => d.value)) * 0.95; // 5% de margem inferior
  const maxVal = Math.max(...data.map(d => d.value)) * 1.05; // 5% de margem superior
  const range = maxVal - minVal || 1;

  const getX = (index: number) => (index / (data.length - 1)) * graphWidth;
  const getY = (value: number) => graphHeight - ((value - minVal) / range) * graphHeight + padding;

  // Criar path da linha suave (Cubic Bezier)
  const linePath = useMemo(() => {
    if (data.length === 0) return '';
    
    let path = `M ${getX(0)} ${getY(data[0].value)}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x_mid = (getX(i) + getX(i + 1)) / 2;
      const y_mid = (getY(data[i].value) + getY(data[i + 1].value)) / 2;
      const cp_x1 = (x_mid + getX(i)) / 2;
      const cp_x2 = (x_mid + getX(i + 1)) / 2;
      
      path += ` Q ${cp_x1} ${getY(data[i].value)}, ${x_mid} ${y_mid}`;
      path += ` T ${getX(i + 1)} ${getY(data[i + 1].value)}`;
    }
    return path;
  }, [data, minVal, range]);

  // Área preenchida (fecha o path embaixo)
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative group">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Evolução Patrimonial</h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">6 Meses</span>
      </div>

      <div className="flex-1 relative min-h-[150px] w-full flex flex-col justify-end">
        {isLoading ? (
          <div className="w-full h-full flex items-end gap-2 animate-pulse">
            <div className="w-full h-[40%] bg-gray-100 rounded-t-3xl" />
            <div className="w-full h-[60%] bg-gray-100 rounded-t-3xl" />
            <div className="w-full h-[50%] bg-gray-100 rounded-t-3xl" />
            <div className="w-full h-[70%] bg-gray-100 rounded-t-3xl" />
            <div className="w-full h-[55%] bg-gray-100 rounded-t-3xl" />
            <div className="w-full h-[80%] bg-gray-100 rounded-t-3xl" />
          </div>
        ) : (
          <div className="relative w-full h-full">
             {/* SVG Graph */}
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                   </linearGradient>
                </defs>
                
                {/* Area Fill */}
                <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-1000 ease-out" />
                
                {/* Line Stroke */}
                <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 ease-out" />
                
                {/* Dots & Interactivity */}
                {data.map((d, i) => (
                  <g key={i}>
                     {/* Invisible Hit Area for easier hovering */}
                     <rect 
                        x={getX(i) - 5} 
                        y={0} 
                        width={10} 
                        height={height} 
                        fill="transparent" 
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                     />
                     {/* Visible Dot */}
                     <circle 
                        cx={getX(i)} 
                        cy={getY(d.value)} 
                        r={hoveredIndex === i ? 2 : 1} 
                        fill={hoveredIndex === i ? "#fff" : "#4f46e5"} 
                        stroke="#4f46e5" 
                        strokeWidth={hoveredIndex === i ? 1 : 0}
                        className="transition-all duration-300" 
                     />
                  </g>
                ))}
             </svg>

             {/* Tooltip Overlay */}
             {hoveredIndex !== null && (
               <div 
                 className="absolute bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-black pointer-events-none shadow-xl transform -translate-x-1/2 -translate-y-full transition-all duration-200 z-20"
                 style={{ 
                   left: `${(hoveredIndex / (data.length - 1)) * 100}%`, 
                   top: `${(getY(data[hoveredIndex].value) / height) * 100}%`,
                   marginTop: '-10px'
                 }}
               >
                 {formatCurrency(data[hoveredIndex].value)}
               </div>
             )}
             
             {/* X Axis Labels */}
             <div className="flex justify-between mt-2 px-1">
               {data.map((d, i) => (
                 <span key={i} className={`text-[8px] font-black uppercase tracking-wider transition-colors ${hoveredIndex === i ? 'text-indigo-600' : 'text-gray-300'}`}>
                   {d.label}
                 </span>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
