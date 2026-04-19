// components/UpiAnalyzer.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, Volume2, RefreshCw } from 'lucide-react';

interface Transaction {
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes: string;
}

export default function UpiAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [userNotes, setUserNotes] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImageBase64(base64);
      setPreviewUrl(base64);
      // Reset previous results
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
const text = await res.text();
console.log("parsed json", text);

let data;
    try {
      data = JSON.parse(text);
      console.log("Parsed JSON:", data);
    } catch (e) {
      console.error("Response is NOT valid JSON!", text.substring(0, 500));
      setFeedback('❌ API returned invalid JSON. Check server console.');
      return;
    }

    if (!res.ok) throw new Error('API error');

    //const data = await res.json();   // ← Now we get full JSON directly

    // Update state
    setTransactions(data.transactions || []);
    setSummary(data.summary);
    setInsights(data.insights || '');
    setSuggestions(data.suggestions || []);

    // Voice feedback
    if (data.insights) {
      const utterance = new SpeechSynthesisUtterance(data.insights);
      utterance.rate = 1.05;
      speechSynthesis.speak(utterance);
    }

    setFeedback('');
  } catch (err) {
    console.error(err);
    setFeedback('❌ Analysis failed. Please try again or check the screenshot.');
  } finally {
    setLoading(false);
  }
};
  

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-3xl p-12 text-center">
        {previewUrl ? (
          <div className="space-y-4">
            <img src={previewUrl} alt="UPI Screenshot" className="mx-auto max-h-96 rounded-2xl shadow" />
            <button
              onClick={() => { setPreviewUrl(''); setImageBase64(''); }}
              className="text-sm text-red-500 hover:underline"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-medium">Upload UPI Screenshot</h3>
            <p className="text-zinc-500 mt-2">GPay, PhonePe, or any transaction list screenshot</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-medium flex items-center gap-2 mx-auto"
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-400 text-white font-medium py-4 rounded-2xl transition"
          >
            {loading ? 'Analyzing...' : 'Analyze Spending'}
          </button>
        </div>
      )}

      {feedback && <p className="mt-4 text-center text-sm text-emerald-600">{feedback}</p>}

      {/* Results */}
      {transactions.length > 0 && (
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left">Date</th>
                    <th className="py-3 text-left">Merchant / Name</th>
                    <th className="py-3 text-right">Amount</th>
                    <th className="py-3 text-left">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3">{t.date}</td>
                      <td className="py-3 font-medium">{t.merchant}</td>
                      <td className="py-3 text-right font-mono">₹{t.amount}</td>
                      <td className="py-3">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
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
              <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl">
                <p className="text-sm text-zinc-500">Total Spent</p>
                <p className="text-4xl font-bold text-emerald-600">₹{summary.totalSpent}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl">
                <p className="text-sm text-zinc-500 mb-3">Top Categories</p>
                {Object.entries(summary.topCategories || {}).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between text-sm mb-1">
                    <span>{cat}</span>
                    <span className="font-medium"> Rs{ Number(amt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights && (
            <div className="bg-emerald-50 dark:bg-emerald-950 p-6 rounded-2xl">
              <h3 className="font-medium mb-3">💡 Insights</h3>
              <p className="leading-relaxed">{insights}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">💰 Smart Suggestions</h3>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-emerald-500">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improve Accuracy Section */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6">
            <h3 className="font-medium mb-2">Improve Accuracy</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Many entries show only names like "Rahul" or "Aunty". Add quick notes below (e.g., "kirana shop", "vegetable vendor", "evening snacks") and re-analyze.
            </p>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Example: Rahul = kirana shop near home, Aunty = vegetable vendor"
              className="w-full h-24 p-4 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
            <button
              onClick={() => analyzeSpending(true)}
              disabled={loading || !userNotes.trim()}
              className="mt-4 flex items-center gap-2 bg-zinc-800 hover:bg-black text-white px-6 py-3 rounded-2xl disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Re-analyze with Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}