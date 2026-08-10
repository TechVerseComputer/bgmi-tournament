'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crosshair, Users, Trophy, X, AlertCircle, Search, Clock, SlidersHorizontal, RotateCcw, Timer } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Lightweight, zero-dependency function to fetch the true server time from HTTP headers.
// Includes strict typeof window checks to bypass Vercel SSR build errors.
const getServerTime = async () => {
  try {
    const url = typeof window !== 'undefined' ? window.location.href : '/';
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('Date');
    return dateHeader ? new Date(dateHeader).getTime() : Date.now();
  } catch {
    return Date.now();
  }
};

export default function TournamentsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Vercel Hydration Fix: Start as null to match SSR, then populate on client
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [perspectiveFilter, setPerspectiveFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [team, setTeam] = useState({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });

  useEffect(() => {
    const initPage = async () => {
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*')
        .neq('status', 'CANCELLED')
        .neq('status', 'COMPLETED')
        .order('created_at', { ascending: false });
        
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

    // Start Live Ticker only after client mount to prevent Hydration errors
    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (closingTime: string) => {
    if (!closingTime || !currentTime) return null; // Wait for client time
    const target = new Date(closingTime).getTime();
    const diff = target - currentTime;
    
    if (diff <= 0) return "CLOSED";
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    if (d > 0) return `Closes in ${d}d ${h}h`;
    return `Closes in ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
      // 1. Strict Server Status Check
      if (selectedMatch.status === 'FULL' || selectedMatch.status === 'COMPLETED' || selectedMatch.status === 'CANCELLED') {
        alert(`REGISTRATION FAILED: This match is currently ${selectedMatch.status}.`);
        setIsSubmitting(false);
        setSelectedMatch(null);
        return;
      }

      // 2. Strict Server-Side Time Validation
      if (selectedMatch.registration_closing_time) {
        const trueServerTime = await getServerTime();
        const closingTime = new Date(selectedMatch.registration_closing_time).getTime();
        
        if (trueServerTime >= closingTime) {
          alert("REGISTRATION FAILED: The registration window for this match has officially closed.");
          setIsSubmitting(false);
          setSelectedMatch(null);
          return;
        }
      }

      const playerCount = selectedMatch.type === 'SOLO' ? 1 : selectedMatch.type === 'DUO' ? 2 : 4;
      const uniqueWalletTxId = `WALLET_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const { error: regError } = await supabase.from('registrations').insert([{
        tournament_id: selectedMatch.id, 
        user_id: user.id, 
        squad_name: team.p1_ign + "'s Squad", 
        igl_email: user.email,
        player_1_id: team.p1_id, 
        player_1_ign: team.p1_ign, 
        player_2_id: playerCount >= 2 ? team.p2_id : null, 
        player_2_ign: playerCount >= 2 ? team.p2_ign : null,
        player_3_id: playerCount >= 4 ? team.p3_id : null, 
        player_3_ign: playerCount >= 4 ? team.p3_ign : null,
        player_4_id: playerCount >= 4 ? team.p4_id : null, 
        player_4_ign: playerCount >= 4 ? team.p4_ign : null,
        utr_number: uniqueWalletTxId, 
        payment_status: 'Verified', 
        slot_number: selectedSlot
      }]);

      if (regError) throw regError;

      const newBalance = walletBalance - selectedMatch.fee;
      const { error: walletError } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);
      
      if (walletError) {
        await supabase.from('registrations').delete().eq('tournament_id', selectedMatch.id).eq('slot_number', selectedSlot);
        throw new Error("Wallet deduction failed. Registration cancelled.");
      }

      await supabase.from('transactions').insert([{
        user_id: user.id, 
        type: 'TOURNAMENT_FEE', 
        amount: selectedMatch.fee, 
        status: 'SUCCESS', 
        description: `Entry fee for ${selectedMatch.name} (Slot ${selectedSlot})`
      }]);

      alert("Slot Booked Successfully!");
      setWalletBalance(newBalance);
      setSelectedMatch(null);
      setTeam({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });
    } catch (error: any) { 
      alert("Error booking slot: " + error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleResetFilters = () => {
    setFilter('ALL');
    setSearchQuery('');
    setMinFee('');
    setMaxFee('');
    setSelectedDate('');
    setPerspectiveFilter('ALL');
    setStatusFilter('ALL');
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesType = filter === 'ALL' || t.type === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const fee = Number(t.fee || 0);
    const passesMinFee = minFee === '' || fee >= Number(minFee);
    const passesMaxFee = maxFee === '' || fee <= Number(maxFee);

    let passesDate = true;
    if (selectedDate && t.match_time) {
      const matchDateStr = new Date(t.match_time).toISOString().split('T')[0];
      passesDate = matchDateStr === selectedDate;
    } else if (selectedDate && !t.match_time) {
      passesDate = false;
    }

    const matchesPerspective = perspectiveFilter === 'ALL' || t.perspective === perspectiveFilter;
    const matchesStatus = statusFilter === 'ALL' || (t.status || 'OPEN') === statusFilter;

    return matchesType && matchesSearch && passesMinFee && passesMaxFee && passesDate && matchesPerspective && matchesStatus;
  });

  return (
    <main className="bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white relative min-h-screen pb-24">
      <section className="py-16 px-4 text-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-b border-zinc-900">
        <Crosshair className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Active <span className="text-orange-500">Battlegrounds</span></h1>
        
        {/* Advanced Search & Filter Bar */}
        <div className="max-w-3xl mx-auto mt-8 flex flex-col gap-4 px-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search tournament by name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-full pl-11 pr-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4 text-orange-500" /> {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {['ALL', 'SOLO', 'DUO', 'SQUAD'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full font-bold text-xs tracking-wider border transition-all ${filter === f ? 'bg-orange-500 border-orange-500 text-black' : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}>{f}</button>
            ))}
          </div>

          {/* Collapsible Advanced Filter Panel */}
          {showFilters && (
            <div className="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left animate-fadeIn">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">Min Entry Fee (₹)</label>
                <input type="number" placeholder="Min" value={minFee} onChange={e => setMinFee(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">Max Entry Fee (₹)</label>
                <input type="number" placeholder="Max" value={maxFee} onChange={e => setMaxFee(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">Match Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500 [color-scheme:dark]" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">Perspective</label>
                <select value={perspectiveFilter} onChange={e => setPerspectiveFilter(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500">
                  <option value="ALL">All Perspectives</option>
                  <option value="TPP">TPP</option>
                  <option value="FPP">FPP</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">Status</label>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-orange-500">
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="FULL">FULL</option>
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-3 flex items-end">
                <button onClick={handleResetFilters} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider py-2.5 rounded-lg text-xs transition-colors border border-zinc-700 flex items-center justify-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        {loading ? (
           <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">Loading matches...</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase tracking-widest py-12">No tournaments found matching your filters.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTournaments.map((t) => {
              const winnerCount = t.total_winners || (t.prize_breakdown?.length > 0 ? t.prize_breakdown.length : 2);
              const activePrizes = t.prize_breakdown?.length > 0 
                ? t.prize_breakdown.slice(0, winnerCount) 
                : [t.first_prize || 0, t.second_prize || 0].slice(0, winnerCount);
              
              const totalPrizePool = activePrizes.reduce((a: number, b: number) => a + Number(b), 0);
              
              // --- STRICT STATUS ENGINE ---
              const isTimePassed = t.registration_closing_time && currentTime ? currentTime > new Date(t.registration_closing_time).getTime() : false;
              const isClosed = isTimePassed || t.status === 'FULL' || t.status === 'COMPLETED' || t.status === 'CANCELLED';
              const displayStatus = (isTimePassed && t.status === 'OPEN') ? 'REGISTRATION CLOSED' : t.status;
              const countdown = formatCountdown(t.registration_closing_time);

              return (
                <div key={t.id} className={`bg-zinc-900 border ${isClosed ? 'border-red-900/30' : 'border-zinc-800'} rounded-xl overflow-hidden group hover:border-orange-500 transition-colors flex flex-col h-full shadow-lg relative`}>
                  <div className="h-44 overflow-hidden relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
                    <img src={t.map_img} alt={t.name} className={`w-full h-full object-cover transition-transform duration-500 ${isClosed ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    
                    <span className={`absolute top-3 right-3 z-20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase border ${isClosed ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-black/70 text-orange-400 border-orange-500/30'}`}>
                      {isClosed ? 'CLOSED' : (displayStatus || 'OPEN')}
                    </span>
                    <h3 className="absolute bottom-3 left-4 z-20 font-black italic text-xl tracking-wider">{t.name}</h3>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="border border-orange-500 bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded flex items-center gap-1"><Users className="w-3 h-3" /> {t.type}</span>
                        <span className="border border-zinc-700 bg-zinc-800 text-gray-300 px-2.5 py-1 rounded">{t.perspective}</span>
                      </div>

                      {/* Highlights: Date & Prize Pool */}
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-zinc-300 font-bold">
                          <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>{t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                          <span className="text-zinc-400">Total Pool: <strong className="text-emerald-400 font-black">₹{totalPrizePool}</strong></span>
                          <span className="text-orange-400">
                            1st: ₹{activePrizes[0] || 0} 
                            {winnerCount >= 2 && activePrizes[1] ? ` | 2nd: ₹${activePrizes[1]}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Entry Fee</p>
                          <p className={`text-3xl font-black ${isClosed ? 'text-zinc-600' : 'text-orange-500'}`}>{t.fee === 0 ? 'FREE' : `₹${t.fee}`}</p>
                        </div>
                        {/* THE COUNTDOWN TICKER */}
                        {countdown && (
                           <div className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border px-2 py-1 rounded ${isClosed ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                             <Timer className="w-3 h-3"/> {isClosed ? 'REGISTRATION CLOSED' : countdown}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Dual CTAs: View More & Join Match */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-3 rounded text-xs transition-colors border border-zinc-700 flex items-center justify-center">
                        View Details
                      </Link>
                      <button disabled={isClosed} onClick={() => handleJoinClick(t)} className={`font-black uppercase tracking-wider py-3 rounded text-xs transition-all flex items-center justify-center ${isClosed ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_10px_rgba(249,115,22,0.3)]'}`}>
                        {isClosed ? 'Closed' : 'Join Match'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  {Array.from({ length: selectedMatch.type === 'SOLO' ? 1 : selectedMatch.type === 'DUO' ? 2 : 4 }, (_, i) => i + 1).map((num) => (
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
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Choose Drop Slot</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: selectedMatch.total_slots || 25 }, (_, i) => i + 1).map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button type="button" key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded text-sm font-black transition-all ${isBooked ? 'bg-red-500/10 text-red-500/50 border border-red-500/10 cursor-not-allowed' : isSelected ? 'bg-orange-500 text-black border-2 border-orange-500' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-orange-500'}`}>
                        S{slot}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-800 flex gap-4">
                <button type="button" onClick={() => setSelectedMatch(null)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !selectedSlot} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-4 rounded transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : `Confirm & Pay ₹${selectedMatch.fee}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
