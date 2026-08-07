'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from('rules')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setRules(data);
      setLoading(false);
    };
    fetchRules();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="w-full z-50 p-4 lg:px-12 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 sticky top-0">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad className="text-orange-500 w-8 h-8" />
          <div className="font-black text-2xl tracking-tighter">
            BGMI <span className="text-orange-500">ARENA</span>
          </div>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide">
          <Link href="/" className="hover:text-orange-400 transition-colors">HOME</Link>
          <Link href="/tournaments" className="hover:text-orange-400 transition-colors">TOURNAMENTS</Link>
          <Link href="/leaderboard" className="hover:text-orange-400 transition-colors">LEADERBOARD</Link>
          <Link href="/rules" className="text-orange-500 border-b-2 border-orange-500 pb-1">RULES</Link>
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16 px-4 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-b border-zinc-900">
        <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
          Official <span className="text-orange-500">Rulebook</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto font-medium">
          Read our strict guidelines to ensure fair play. Violating these rules will result in immediate disqualification.
        </p>
      </section>

      {/* Rules List */}
      <section className="py-16 px-4 max-w-4xl mx-auto min-h-[50vh]">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">
            Loading rules...
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 p-12 rounded-lg">
            No rules have been published yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div 
                key={rule.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex gap-4 items-start group hover:border-orange-500/50 transition-colors"
              >
                <div className="bg-zinc-950 p-2 rounded-full border border-zinc-800 shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide uppercase mb-2">
                    {index + 1}. {rule.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Footer */}
      <footer className="bg-[#050505] py-8 border-t border-zinc-900 text-center">
         <p className="text-zinc-600 text-sm font-medium">© 2026 BGMI Arena. All Rights Reserved.</p>
      </footer>

    </main>
  );
}