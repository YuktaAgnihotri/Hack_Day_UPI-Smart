'use client';
import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, RefreshCw, TrendingUp } from 'lucide-react';
import UpiReports from './Reports';

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

export default function UpiAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageBase64, setImageBase64] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [history, setHistory] = useState<DailyEntry[]>([]);
  const [showReports, setShowReports] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [userNotes, setUserNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('upiHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('upiHistory', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImageBase64(base64);
      setPreviewUrl(base64);
      
      setTransactions([]);
      setSummary(null);
      setInsights('');
      setSuggestions([]);
    };
    reader.readAsDataURL(file);
  };

  const analyzeSpending = async (withNotes = false) => {
    if (!imageBase64) return;

    setLoading(true);
    setFeedback(withNotes ? 'Re-analyzing with your notes...' : 'Analyzing UPI screenshot...');

    try {
      const res = await fetch('/api/analyze-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          notes: withNotes ? userNotes : ''
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const today = new Date().toISOString().split('T')[0];

      const newEntry: DailyEntry = {
        id: `${today}-${Date.now()}`,
        date: today,
        transactions: data.transactions || [],
        summary: data.summary || { totalSpent: 0, topCategories: {} },
        insights: data.insights || '',
        suggestions: data.suggestions || [],
        notes: withNotes ? userNotes : '',
        analyzedAt: new Date().toISOString(),
      };

      setHistory(prev => [newEntry, ...prev]);

      setTransactions(data.transactions || []);
      setSummary(data.summary);
      setInsights(data.insights || '');
      setSuggestions(data.suggestions || []);

      if (data.insights) {
        const utterance = new SpeechSynthesisUtterance(data.insights);
        utterance.rate = 1.05;
        speechSynthesis.speak(utterance);
      }

      setFeedback('');
    } catch (err: any) {
      console.error(err);
      setFeedback(`❌ ${err.message || 'Analysis failed. Please check the screenshot and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDay = (entry: DailyEntry) => {
    setTransactions(entry.transactions);
    setSummary(entry.summary);
    setInsights(entry.insights);
    setSuggestions(entry.suggestions);
    setShowReports(false);
  };

  const clearHistory = () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem('upiHistory');
      setTransactions([]);
      setSummary(null);
      setInsights('');
      setSuggestions([]);
    }
  };

  return (
    <div className="bg-black text-white rounded-3xl shadow-xl p-8 border border-zinc-800">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 mb-8">
        <button
          onClick={() => setShowReports(false)}
          className={`flex-1 pb-4 text-lg font-medium transition ${!showReports 
            ? 'border-b-4 border-[#39FF14] text-[#39FF14]' 
            : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Analyzer
        </button>
        <button
          onClick={() => setShowReports(true)}
          className={`flex-1 pb-4 text-lg font-medium transition ${showReports 
            ? 'border-b-4 border-[#39FF14] text-[#39FF14]' 
            : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Reports
        </button>
      </div>

      {/* ==================== ANALYZER SECTION ==================== */}
      {!showReports && (
        <>
          {/* Upload Area */}
          <div className="border-2 border-dashed border-zinc-700 hover:border-[#39FF14] transition-colors rounded-3xl p-12 text-center bg-zinc-900/50">
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="UPI Screenshot" className="mx-auto max-h-96 rounded-2xl shadow-2xl border border-zinc-800" />
                <button
                  onClick={() => {
                    setPreviewUrl('');
                    setImageBase64('');
                  }}
                  className="text-sm text-red-500 hover:text-red-400 hover:underline"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto w-16 h-16 text-[#39FF14] mb-4 opacity-80" />
                <h3 className="text-xl font-medium text-zinc-100">Upload UPI Screenshot</h3>
                <p className="text-zinc-400 mt-2">GPay, PhonePe, or any transaction list screenshot</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 bg-[#39FF14] hover:bg-[#32e011] text-black px-8 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto transition-transform hover:scale-105 shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                >
                  <Camera className="w-5 h-5" />
                  Choose Screenshot
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {imageBase64 && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => analyzeSpending(false)}
                disabled={loading}
                className="flex-1 bg-[#39FF14] hover:bg-[#32e011] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-2xl transition shadow-[0_0_15px_rgba(57,255,20,0.3)] disabled:shadow-none"
              >
                {loading ? 'Analyzing...' : 'Analyze Spending'}
              </button>
            </div>
          )}

          {feedback && (
            <p className="mt-4 text-center text-sm text-[#39FF14]">{feedback}</p>
          )}

          {/* Results */}
          {transactions.length > 0 && (
            <div className="mt-10 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">Your Transactions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="py-3 text-left text-zinc-400">Date</th>
                        <th className="py-3 text-left text-zinc-400">Merchant / Name</th>
                        <th className="py-3 text-right text-zinc-400">Amount</th>
                        <th className="py-3 text-left text-zinc-400 px-4">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                          <td className="py-4 text-zinc-300">{t.date}</td>
                          <td className="py-4 font-medium text-white">{t.merchant}</td>
                          <td className="py-4 text-right font-mono text-[#39FF14] text-base">₹{t.amount}</td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-zinc-800 text-[#00FFFF] border border-zinc-700 rounded-full text-xs font-medium tracking-wide">
                              {t.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-sm text-zinc-400">Total Spent</p>
                    <p className="text-4xl font-bold text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.3)] mt-1">₹{summary.totalSpent}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
                    <p className="text-sm text-zinc-400 mb-4">Top Categories</p>
                    {Object.entries(summary.topCategories || {}).map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between text-sm mb-2 pb-2 border-b border-zinc-800/50 last:border-0 last:pb-0 last:mb-0">
                        <span className="text-zinc-300">{cat}</span>
                        <span className="font-medium text-white">₹{Number(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights && (
                <div className="bg-zinc-900 border-l-4 border-[#FF00FF] p-6 rounded-r-2xl shadow-lg">
                  <h3 className="font-medium mb-3 text-[#FF00FF] flex items-center gap-2">
                    💡 Insights
                  </h3>
                  <p className="leading-relaxed text-zinc-300">{insights}</p>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg">
                  <h3 className="font-medium mb-4 text-white">💰 Smart Suggestions</h3>
                  <ul className="space-y-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-zinc-300">
                        <span className="text-[#FFFF00] font-bold">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improve Accuracy */}
              <div className="border border-zinc-800 bg-black rounded-2xl p-6">
                <h3 className="font-medium mb-2 text-white">Improve Accuracy</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Add notes for unclear names (e.g., "Rahul = kirana shop", "Aunty = vegetable vendor")
                </p>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Example: Rahul = kirana shop near home, Aunty = vegetable vendor"
                  className="w-full h-24 p-4 rounded-2xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-600 focus:outline-none focus:border-[#00FFFF] transition-colors"
                />
                <button
                  onClick={() => analyzeSpending(true)}
                  disabled={loading || !userNotes.trim()}
                  className="mt-4 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-2xl disabled:opacity-50 transition-colors border border-zinc-700"
                >
                  <RefreshCw className="w-4 h-4 text-[#00FFFF]" />
                  Re-analyze with Notes
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== REPORTS SECTION ==================== */}
      {showReports && (
        <UpiReports 
          history={history} 
          onViewDay={loadDay} 
        />
      )}

      {/* Clear History Button */}
      {history.length > 0 && showReports && (
        <div className="mt-8 text-center">
          <button
            onClick={clearHistory}
            className="text-sm text-red-500 hover:text-red-400 hover:underline px-4 py-2"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
}