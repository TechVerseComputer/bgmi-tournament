'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase.from('leaderboard').select('*').order('match_date', { ascending: false });
      if (data) setLeaderboards(data);
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-zinc-950">
        <Trophy className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">The <span className="text-orange-500">Hall of Fame</span></h1>
        <p className="text-zinc-400">Recent match winners and top squads.</p>
      </section>
      <section className="py-16 px-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center text-orange-500 font-bold animate-pulse">Loading rankings...</div>
        ) : (
          <div className="space-y-6">
            {leaderboards.map((l) => (
              <div key={l.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4 hover:border-orange-500/50 transition-colors">
                <div className="text-center md:text-left">
                  <span className="text-xs text-orange-500 font-black tracking-widest uppercase">{l.match_date} • {l.slot_time}</span>
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="font-black text-2xl text-white flex items-center justify-center md:justify-start gap-2">🥇 {l.winner_1_team}</p>
                    <p className="font-bold text-lg text-zinc-400 flex items-center justify-center md:justify-start gap-2">🥈 {l.winner_2_team}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}