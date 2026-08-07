'use client';

import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const [latestTournaments, setLatestTournaments] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) setLatestTournaments(data);
    };
    fetchLatest();
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]" />
        
        <div className="relative z-10 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
            Compete. Conquer.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Be The Champion.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-2xl mx-auto">
            Join elite BGMI tournaments, showcase your squad's skills, and win massive prize pools every single day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/tournaments" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Users className="w-5 h-5" /> View Matches
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-8 py-4 rounded transition-all border border-zinc-800 flex items-center justify-center gap-2">
              Player Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Tournaments Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-[1px] w-12 bg-orange-500" />
          <h2 className="text-3xl font-black italic uppercase tracking-wider">Latest <span className="text-orange-500">Matches</span></h2>
          <div className="h-[1px] w-12 bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestTournaments.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-orange-500 transition-colors flex flex-col h-full">
              <div className="h-40 overflow-hidden relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                <img src={t.map_img} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <h3 className="absolute bottom-3 left-4 z-20 font-black italic text-xl tracking-wider">{t.name}</h3>
              </div>
              
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 text-xs font-bold mb-4">
                    <span className="border border-orange-500 bg-orange-500/10 text-orange-500 px-2 py-1 rounded flex items-center gap-1"><Users className="w-3 h-3" /> {t.type}</span>
                    <span className="border border-zinc-700 bg-zinc-800 text-gray-300 px-2 py-1 rounded">{t.perspective}</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                    <p className="text-3xl font-black text-orange-500">{t.fee === 0 ? 'FREE' : `₹${t.fee}`}</p>
                  </div>
                </div>
                <Link href="/tournaments" className="block text-center w-full bg-zinc-800 hover:bg-orange-500 text-white hover:text-black font-black uppercase tracking-widest py-3 rounded transition-colors mt-4">
                  Join Match
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-orange-500 px-6 py-3 rounded-full bg-zinc-900">
            View All Scheduled Tournaments <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}