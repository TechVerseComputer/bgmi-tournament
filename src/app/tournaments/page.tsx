'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad, Crosshair, Users, Trophy } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const supabase = createClient();

  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setTournaments(data);
      setLoading(false);
    };
    fetchTournaments();
  }, []);

  const filteredTournaments = filter === 'ALL' 
    ? tournaments 
    : tournaments.filter(t => t.type === filter);

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
          <Link href="/tournaments" className="text-orange-500 border-b-2 border-orange-500 pb-1">TOURNAMENTS</Link>
          <Link href="/leaderboard" className="hover:text-orange-400 transition-colors">LEADERBOARD</Link>
          <Link href="/rules" className="hover:text-orange-400 transition-colors">RULES</Link>
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16 px-4 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-b border-zinc-900">
        <Crosshair className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
          Active <span className="text-orange-500">Battlegrounds</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto font-medium mb-8">
          Browse all upcoming scrims and tournaments. Find your match, register your squad, and claim the prize pool.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3">
          {['ALL', 'SOLO', 'DUO', 'SQUAD'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)} 
              className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider border transition-all ${
                filter === f 
                  ? 'bg-orange-500 border-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                  : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Tournaments Grid */}
      <section className="py-16 px-4 max-w-7xl mx-auto min-h-[50vh]">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">
            Loading matches...
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 p-12 rounded-lg max-w-2xl mx-auto">
            No {filter !== 'ALL' ? filter : ''} matches scheduled right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTournaments.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-orange-500 transition-colors flex flex-col h-full">
                <div className="h-40 overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                  <img src={t.map_img} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="absolute bottom-3 left-4 z-20 font-black italic text-xl tracking-wider">{t.name}</h3>
                </div>
                
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-2 text-xs font-bold mb-4">
                      <span className="border border-orange-500 bg-orange-500/10 text-orange-500 px-2 py-1 rounded flex items-center gap-1">
                        <Users className="w-3 h-3" /> {t.type}
                      </span>
                      <span className="border border-zinc-700 bg-zinc-800 text-gray-300 px-2 py-1 rounded">
                        {t.perspective}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                      <p className="text-3xl font-black text-orange-500">{t.fee === 0 ? 'FREE' : `₹${t.fee}`}</p>
                    </div>
                    
                    <div className="bg-black/50 p-4 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-orange-500" />
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Prize Pool</p>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-b border-zinc-800 pb-2 mb-2">
                        <span className="text-zinc-300">1ST PRIZE</span>
                        <span className="text-orange-500">₹{t.first_prize}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-zinc-500">2ND PRIZE</span>
                        <span className="text-orange-400">₹{t.second_prize}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href="/register" className="block w-full text-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest py-3 rounded transition-all mt-4">
                    Join Now
                  </Link>
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