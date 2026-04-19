'use client';
import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface Transaction {
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string;
}

interface DailyEntry {
  id: string;
  date: string;
  transactions: Transaction[];
  summary: {
    totalSpent: number;
    topCategories: Record<string, number>;
  };
  insights: string;
  suggestions: string[];
  notes?: string;
  analyzedAt: string;
}

interface UpiReportsProps {
  history: DailyEntry[];
  onViewDay: (entry: DailyEntry) => void;
}

// Custom Tooltip with Neon Dark Theme
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 min-w-[200px]">
        <p className="font-semibold text-zinc-300 mb-1">{data.name}</p>
        <p className="text-3xl font-bold" style={{ color: data.payload.fill }}>
          ₹{Number(data.value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

// Vibrant Neon Color Palette for the Pie Chart
const NEON_COLORS = [
  '#39FF14', // Neon Green
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FFFF00', // Yellow
  '#FF3131', // Neon Red
  '#9D00FF', // Purple
  '#FF6600'  // Neon Orange
];

export default function UpiReports({ history, onViewDay }: UpiReportsProps) {
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  useEffect(() => {
    if (history.length > 0 && !selectedEntry) {
      setSelectedEntry(history[0]);
    }
  }, [history, selectedEntry]);

  const pieData = useMemo(() => {
    if (!selectedEntry?.summary?.topCategories) return [];

    return Object.entries(selectedEntry.summary.topCategories)
      .map(([name, value]) => ({ 
        name, 
        value: Number(value) || 0 
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [selectedEntry]);

  if (history.length === 0) {
    return (
      <div className="bg-black text-white rounded-3xl shadow-xl p-12 text-center border border-zinc-800">
        <BarChart3 className="mx-auto w-16 h-16 text-zinc-600 mb-4" />
        <h3 className="text-xl font-medium text-zinc-400">No reports yet</h3>
        <p className="text-zinc-500 mt-2">Analyze some UPI screenshots first.</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white rounded-3xl shadow-xl p-8 border border-zinc-800">
      <h2 className="text-3xl font-semibold mb-8 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-[#39FF14]" />
        Daily Spending Reports
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Daily List */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="font-semibold text-lg mb-4 text-zinc-200">Recent Days</h3>
          {history.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={`p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                selectedEntry?.id === entry.id 
                  ? 'border-[#39FF14] bg-[#39FF14]/10' 
                  : 'border-transparent hover:border-zinc-700 bg-zinc-900'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-zinc-100">
                    {new Date(entry.date).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-zinc-400">{entry.transactions.length} transactions</p>
                </div>
                <p className="text-2xl font-bold text-[#39FF14]">
                  ₹{entry.summary?.totalSpent || 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart Area */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-zinc-200">
            <PieIcon className="w-5 h-5 text-[#00FFFF]" /> Category Breakdown
          </h3>

          {selectedEntry && pieData.length > 0 ? (
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    dataKey="value"
                    nameKey="name"
                    animationBegin={0}
                    animationDuration={800}
                    stroke="none" // Removes the white border around pie slices
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={NEON_COLORS[index % NEON_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={50} 
                    iconType="circle"
                    wrapperStyle={{ color: '#e4e4e7' }} // zinc-200 text for legend
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 h-[400px] rounded-3xl flex items-center justify-center text-center p-8">
              <div>
                <PieIcon className="mx-auto w-14 h-14 text-zinc-700 mb-4" />
                <p className="text-zinc-500">
                  {selectedEntry 
                    ? "No category data for this day" 
                    : "Click on any day above to see the pie chart"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}