'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crosshair, Users, Trophy, X, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function TournamentsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [team, setTeam] = useState({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });

  useEffect(() => {
    const initPage = async () => {
      const { data: tourneyData } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
      if (tourneyData) setTournaments(tourneyData);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (wallet) setWalletBalance(wallet.balance);
      }
      setLoading(false);
    };
    initPage();
  }, []);

  const handleJoinClick = async (match: any) => {
    if (!user) {
      alert("You must be logged in to join a match. Redirecting to Player Portal...");
      router.push('/dashboard');
      return;
    }
    setSelectedMatch(match);
    setSelectedSlot(null);
    const { data: regs } = await supabase.from('registrations').select('slot_number').eq('tournament_id', match.id);
    if (regs) setBookedSlots(regs.map(r => r.slot_number).filter(s => s !== null));
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert("Please select a drop slot!");
    if (walletBalance < selectedMatch.fee) return alert("Insufficient balance! Please add funds to your wallet.");
    
    setIsSubmitting(true);
    try {
      const newBalance = walletBalance - selectedMatch.fee;
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);
      
      await supabase.from('transactions').insert([{
        user_id: user.id, type: 'TOURNAMENT_FEE', amount: selectedMatch.fee, status: 'SUCCESS', description: `Entry fee for ${selectedMatch.name} (Slot ${selectedSlot})`
      }]);

      const { error: regError } = await supabase.from('registrations').insert([{
        tournament_id: selectedMatch.id, user_id: user.id, squad_name: team.p1_ign + "'s Squad", igl_email: user.email,
        player_1_id: team.p1_id, player_1_ign: team.p1_ign, player_2_id: team.p2_id, player_2_ign: team.p2_ign,
        player_3_id: team.p3_id, player_3_ign: team.p3_ign, player_4_id: team.p4_id, player_4_ign: team.p4_ign,
        utr_number: 'PAID_VIA_WALLET', payment_status: 'Verified', slot_number: selectedSlot
      }]);

      if (regError) throw regError;
      alert("Slot Booked Successfully!");
      setWalletBalance(newBalance);
      setSelectedMatch(null);
      setTeam({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });
    } catch (error: any) { alert("Error booking slot: " + error.message); } finally { setIsSubmitting(false); }
  };

  const filteredTournaments = filter === 'ALL' ? tournaments : tournaments.filter(t => t.type === filter);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white relative">
      <section className="py-16 px-4 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-b border-zinc-900">
        <Crosshair className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Active <span className="text-orange-500">Battlegrounds</span></h1>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['ALL', 'SOLO', 'DUO', 'SQUAD'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider border transition-all ${filter === f ? 'bg-orange-500 border-orange-500 text-black' : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}>{f}</button>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto min-h-[50vh]">
        {loading ? (
           <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">Loading matches...</div>
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
                      <span className="border border-orange-500 bg-orange-500/10 text-orange-500 px-2 py-1 rounded flex items-center gap-1"><Users className="w-3 h-3" /> {t.type}</span>
                      <span className="border border-zinc-700 bg-zinc-800 text-gray-300 px-2 py-1 rounded">{t.perspective}</span>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                      <p className="text-3xl font-black text-orange-500">{t.fee === 0 ? 'FREE' : `₹${t.fee}`}</p>
                    </div>
                  </div>

                  {/* Dual CTAs: View More & Join Match */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-3 rounded text-xs transition-colors border border-zinc-700 flex items-center justify-center">
                      View More
                    </Link>
                    <button onClick={() => handleJoinClick(t)} className="bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wider py-3 rounded text-xs transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)] flex items-center justify-center">
                      Join Match
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Booking Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111116] w-full max-w-2xl rounded-xl border border-zinc-800 relative my-8">
            <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full"><X className="w-5 h-5"/></button>
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wide text-white">{selectedMatch.name}</h2>
                <p className="text-zinc-500 text-xs font-bold">{selectedMatch.type} • {selectedMatch.perspective}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-500 font-black text-xl">₹{selectedMatch.fee}</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Entry Fee</p>
              </div>
            </div>
            {walletBalance < selectedMatch.fee && (
              <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold"><AlertCircle className="w-5 h-5" /> Insufficient Wallet Balance (₹{walletBalance})</div>
                <button onClick={() => router.push('/dashboard')} className="bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded hover:bg-red-600 transition-colors">Add Funds</button>
              </div>
            )}
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Squad Details</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                      <p className="text-xs font-bold text-orange-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        {num === 1 && <Trophy className="w-3 h-3"/>} Player {num} {num === 1 && '(Captain)'}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="text" placeholder="In-Game Name (IGN)" value={team[`p${num}_ign` as keyof typeof team]} onChange={e => setTeam({...team, [`p${num}_ign`]: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-orange-500 outline-none text-zinc-300" />
                        <input required type="text" placeholder="Game ID (Numbers)" value={team[`p${num}_id` as keyof typeof team]} onChange={e => setTeam({...team, [`p${num}_id`]: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-orange-500 outline-none font-mono text-zinc-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Choose Drop Slot <span className="text-red-500">*</span></h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: selectedMatch.total_slots || 25 }, (_, i) => i + 1).map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button type="button" key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded text-sm font-black transition-all ${isBooked ? 'bg-red-500/10 text-red-500/50 border border-red-500/10 cursor-not-allowed' : isSelected ? 'bg-orange-500 text-black border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-orange-500/50 hover:text-white'}`}>
                        S{slot}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex gap-4">
                <button type="button" onClick={() => setSelectedMatch(null)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors border border-zinc-800">Cancel</button>
                <button type="submit" disabled={isSubmitting || walletBalance < selectedMatch.fee || !selectedSlot} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-4 rounded transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : `Join Match - ₹${selectedMatch.fee}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}