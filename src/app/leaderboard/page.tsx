'use client';

import { useEffect, useState } from 'react';
import { Trophy, Calendar, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Strictly fetch only PUBLISHED official winners
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('status', 'Published')
        .order('match_date', { ascending: false });
      
      if (data) setLeaderboards(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="bg-[#050505] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-3xl mx-auto">
          <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            Official <span className="text-orange-500">Hall of Fame</span>
          </h1>
          <p className="text-zinc-400 font-bold text-sm md:text-base">
            Verified Chicken Dinner winners and top squads across all premium tournaments.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest flex flex-col items-center gap-3">
            <Trophy className="w-8 h-8 animate-bounce" /> Loading Official Records...
          </div>
        ) : leaderboards.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center max-w-2xl mx-auto backdrop-blur-sm">
            <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-wider text-zinc-500 mb-2">No Verified Winners Yet</h3>
            <p className="text-zinc-500 font-bold text-sm">Official match results will appear here once verified and published by admins.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaderboards.map((l) => {
              // Backward compatibility for old rows before the schema update
              const displayTeamName = l.team_name || l.winner_1_team || 'Unknown Team';
              
              return (
                <div key={l.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 shadow-xl flex flex-col">
                  
                  {/* Screenshot Header */}
                  <div className="h-48 relative bg-zinc-950 border-b border-zinc-800 shrink-0">
                    {l.screenshot_url ? (
                      <img src={l.screenshot_url} alt={`${displayTeamName} Win`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                        <Trophy className="w-12 h-12 opacity-20 mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Evidence Verified</span>
                      </div>
                    )}
                    
                    {/* Absolute Badges */}
                    <div className="absolute top-3 left-3 bg-orange-500 text-black font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded shadow-lg">
                      🥇 1st Place
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-emerald-500/30 text-emerald-400 font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded flex items-center gap-1 shadow-lg">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-wide mb-1 break-words">
                        {displayTeamName}
                      </h3>
                      {l.team_id && (
                        <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">
                          ID: {l.team_id}
                        </p>
                      )}

                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold">
                          <span className="text-zinc-500">Tournament</span>
                          <span className="text-zinc-300 text-right">{l.tournament_name || 'Legacy Match'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold border-t border-zinc-900 pt-3">
                          <span className="text-zinc-500 flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Date</span>
                          <span className="text-zinc-300">{l.match_date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Prize Highlight Footer */}
                    {l.prize_won && (
                      <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Prize Awarded</span>
                        <span className="text-xl font-black text-emerald-400">₹{l.prize_won}</span>
                      </div>
                    )}
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
