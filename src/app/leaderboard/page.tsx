'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad, Trophy, Medal, Crown, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LeaderboardPage() {
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('match_date', { ascending: false });
      
      if (data) setLeaderboards(data);
      setLoading(false);
    };
    fetchLeaderboard();
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
          <Link href="/leaderboard" className="text-orange-500 border-b-2 border-orange-500 pb-1">LEADERBOARD</Link>
          <Link href="/rules" className="hover:text-orange-400 transition-colors">RULES</Link>
        </div>
      </nav>

      {/* Header Section */}
      <section className="py-16 px-4 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-b border-zinc-900">
        <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
          Hall of <span className="text-orange-500">Champions</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto font-medium">
          The most dominant squads in the arena. Check recent match results and see who took home the prize pool.
        </p>
      </section>

      {/* Leaderboard List */}
      <section className="py-16 px-4 max-w-4xl mx-auto min-h-[50vh]">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">
            Loading results...
          </div>
        ) : leaderboards.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-800 p-12 rounded-lg">
            No match results posted yet. Check back after the next tournament!
          </div>
        ) : (
          <div className="space-y-6">
            {leaderboards.map((l, index) => (
              <div 
                key={l.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 relative overflow-hidden group hover:border-orange-500/50 transition-colors"
              >
                {/* Highlight top result if it's the newest one */}
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10">
                    Latest Match
                  </div>
                )}
                
                <div className="bg-zinc-950 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-3 w-full md:w-1/4">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <Calendar className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-300">{l.match_date}</p>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{l.slot_time}</p>
                    </div>
                  </div>

                  {/* Winners */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1st Place */}
                    <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-4 rounded flex items-center gap-4">
                      <Crown className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">1st Place Squad</p>
                        <p className="font-black text-xl text-white tracking-wide">{l.winner_1_team}</p>
                      </div>
                    </div>

                    {/* 2nd Place */}
                    <div className="bg-gradient-to-r from-zinc-800/50 to-transparent border-l-4 border-zinc-500 p-4 rounded flex items-center gap-4">
                      <Medal className="w-8 h-8 text-zinc-400" />
                      <div>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">2nd Place Squad</p>
                        <p className="font-bold text-lg text-zinc-200 tracking-wide">{l.winner_2_team}</p>
                      </div>
                    </div>
                  </div>

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