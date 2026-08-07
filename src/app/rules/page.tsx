'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function RulesPage() {
  const supabase = createClient();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase.from('rules').select('*').order('created_at', { ascending: true });
      if (data) setRules(data);
      setLoading(false);
    };
    fetchRules();
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-zinc-950">
        <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Tournament <span className="text-orange-500">Rules</span></h1>
        <p className="text-zinc-400">Read carefully before participating in any match.</p>
      </section>
      <section className="py-16 px-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse">Loading rules...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {rules.map((r, index) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg flex gap-6">
                <div className="text-4xl font-black text-zinc-800">
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-xl font-black text-orange-500 uppercase tracking-widest mb-3">{r.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}