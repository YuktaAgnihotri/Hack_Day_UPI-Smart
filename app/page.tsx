// app/page.tsx
'use client';

import { useState } from 'react';
import UpiAnalyzer from '@/components/Upi-Analyzer';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">UPI Smart</h1>
          <p className="mt-3 text-xl text-zinc-600 dark:text-zinc-400">
            Upload your UPI screenshot → Get smart spending insights
          </p>
          
        </div>

        <UpiAnalyzer />
      </div>
    </div>
  );
}