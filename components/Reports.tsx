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

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-5 min-w-[200px]">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{data.name}</p>
        <p className="text-3xl font-bold text-emerald-600">
          ₹{Number(data.value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ['#10b981', '#14b8a6', '#22d3ee', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export default function UpiReports({ history, onViewDay }: UpiReportsProps) {
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  // Auto-select the most recent day when history changes (FIX: Removed onViewDay)
  useEffect(() => {
    if (history.length > 0 && !selectedEntry) {
      setSelectedEntry(history[0]);
    }
  }, [history, selectedEntry]);

  // Pie Chart Data for selected day
  const pieData = useMemo(() => {
    if (!selectedEntry?.summary?.topCategories) return [];

    return Object.entries(selectedEntry.summary.topCategories)
      .map(([name, value]) => ({ 
        name, 
        value: Number(value) || 0 
      }))
      .filter(item => item.value > 0)          // Hide zero values
      .sort((a, b) => b.value - a.value);
  }, [selectedEntry]);

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
        <BarChart3 className="mx-auto w-16 h-16 text-zinc-300 mb-4" />
        <h3 className="text-xl font-medium text-zinc-500">No reports yet</h3>
        <p className="text-zinc-500 mt-2">Analyze some UPI screenshots first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-3xl font-semibold mb-8 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-emerald-600" />
        Daily Spending Reports
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Daily List */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="font-semibold text-lg mb-4">Recent Days</h3>
          {history.map((entry) => (
            <div
              key={entry.id}
              onClick={() => {
                setSelectedEntry(entry); // FIX: Removed onViewDay so it doesn't tab-switch
              }}
              className={`p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                selectedEntry?.id === entry.id 
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950' 
                  : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-950'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    {new Date(entry.date).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-zinc-500">{entry.transactions.length} transactions</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{entry.summary?.totalSpent || 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart Area */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <PieIcon className="w-5 h-5" /> Category Breakdown
          </h3>

          {selectedEntry && pieData.length > 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl">
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
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={50} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-950 h-[400px] rounded-3xl flex items-center justify-center text-center p-8">
              <div>
                <PieIcon className="mx-auto w-14 h-14 text-zinc-300 mb-4" />
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