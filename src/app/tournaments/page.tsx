'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crosshair, Users, Trophy, X, AlertCircle, Search, Clock, SlidersHorizontal, RotateCcw, Timer, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

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
      // UPGRADED SORTING: Order by match_time ascending (Nearest upcoming first)
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*, registrations(id)')
        .neq('status', 'CANCELLED')
        .neq('status', 'COMPLETED')
        .order('match_time', { ascending: true, nullsFirst: false });
        
      if (tourneyData) {
        // Strict client-side chronological sort + push TBA to bottom
        const sortedTourneys = tourneyData.sort((a, b) => {
          if (!a.match_time) return 1;
          if (!b.match_time) return -1;
          return new Date(a.match_time).getTime() - new Date(b.match_time).getTime();
        });
        setTournaments(sortedTourneys);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (wallet) setWalletBalance(wallet.balance);
      }
      setLoading(false);
    };
    initPage();

    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- NEW: ADMIN NOTIFICATION HELPER ---
  const notifyAdmin = async (type: string, message: string, amount: number | null = null) => {
    try {
      await supabase.from('admin_notifications').insert([{
        type,
        message,
        player_name: user?.email || team.p1_ign || 'Unknown Player',
        amount
      }]);
    } catch (err) {
      console.error("Admin notification failed silently", err);
    }
  };

  const formatCountdown = (closingTime: string) => {
    if (!closingTime || !currentTime) return null;
    const target = new Date(closingTime).getTime();
    const diff = target - currentTime;
    
    if (diff <= 0) return "CLOSED";
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    if (d > 0) return `${d}D ${h}H`;
    return `${h.toString().padStart(2, '0')}H ${m.toString().padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
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
    
    const isFreeMatch = selectedMatch.entry_type === 'FREE' || selectedMatch.fee === 0;

    if (!isFreeMatch && walletBalance < selectedMatch.fee) {
      return alert("Insufficient balance! Please add funds to your wallet.");
    }
    
    setIsSubmitting(true);
    try {
      if (selectedMatch.status === 'FULL' || selectedMatch.status === 'COMPLETED' || selectedMatch.status === 'CANCELLED' || selectedMatch.status === 'UNDER REVIEW') {
        alert(`REGISTRATION FAILED: This match is currently ${selectedMatch.status}.`);
        setIsSubmitting(false);
        setSelectedMatch(null);
        return;
      }

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
        utr_number: isFreeMatch ? `FREE_ENTRY_${Date.now()}` : uniqueWalletTxId, 
        payment_status: 'Verified', 
        slot_number: selectedSlot
      }]);

      if (regError) throw regError;

      // Only deduct wallet if it is a paid tournament
      if (!isFreeMatch) {
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

        setWalletBalance(newBalance);
      }

      alert("Slot Booked Successfully!");
      
      // --- NEW: TRIGGER NOTIFICATION ---
      await notifyAdmin('SLOT_BOOKING', `New Slot Booking: ${selectedMatch.name} (Slot S${selectedSlot})`, isFreeMatch ? 0 : selectedMatch.fee);
      
      setSelectedMatch(null);
      setTeam({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });
      
      // Refresh the specific tournament card count smoothly AND keep it sorted
      const { data: updatedTourney } = await supabase.from('tournaments').select('*, registrations(id)').eq('id', selectedMatch.id).single();
      if (updatedTourney) {
        setTournaments(prev => {
          const newArray = prev.map(t => t.id === updatedTourney.id ? updatedTourney : t);
          return newArray.sort((a, b) => {
            if (!a.match_time) return 1;
            if (!b.match_time) return -1;
            return new Date(a.match_time).getTime() - new Date(b.match_time).getTime();
          });
        });
      }

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

      <section className="py-12 md:py-16 px-1 sm:px-4 max-w-7xl mx-auto">
        {loading ? (
           <div className="text-center text-orange-500 font-bold animate-pulse uppercase tracking-widest">Loading matches...</div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase tracking-widest py-12">No tournaments found matching your filters.</div>
        ) : (
          {/* CSS GRID REFACTOR: 2 columns mobile, 3 tablet, 4 desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-1 md:px-0">
            {filteredTournaments.map((t) => {
              // --- VARIABLES & LOGIC (UNTOUCHED) ---
              const isFree = t.entry_type === 'FREE' || t.fee === 0;
              const bookedCount = t.registrations?.length || 0;
              const maxSlots = Number(t.total_slots || 25);
              const minSlots = Number(t.minimum_slots_required || maxSlots);
              const isMinReached = bookedCount >= minSlots;

              const winnerCount = t.total_winners || (t.prize_breakdown?.length > 0 ? t.prize_breakdown.length : 2);
              const activePrizes = t.prize_breakdown?.length > 0 
                ? t.prize_breakdown.slice(0, winnerCount) 
                : [t.first_prize || 0, t.second_prize || 0].slice(0, winnerCount);
              
              const totalPrizePool = activePrizes.reduce((a: number, b: number) => a + Number(b), 0);
              
              // --- STRICT STATUS & COUNTDOWN ENGINE ---
              const isTimePassed = t.registration_closing_time && currentTime ? currentTime > new Date(t.registration_closing_time).getTime() : false;
              const isUnderReview = t.status === 'UNDER REVIEW';
              const isMinFailed = isFree && isTimePassed && !isMinReached;
              
              const isClosed = isTimePassed || t.status === 'FULL' || t.status === 'COMPLETED' || t.status === 'CANCELLED' || isUnderReview || isMinFailed;
              
              let displayStatus = t.status || 'OPEN';
              if (isTimePassed && t.status === 'OPEN') {
                displayStatus = isMinFailed ? 'MIN NOT REACHED' : 'REGISTRATION CLOSED';
              } else if (isFree && t.status === 'OPEN') {
                displayStatus = isMinReached ? 'MATCH CONFIRMED' : 'WAITING FOR PLAYERS';
              }

              const countdown = formatCountdown(t.registration_closing_time);

              return (
                <div key={t.id} className={`bg-zinc-900 border ${isClosed ? 'border-red-900/30' : 'border-zinc-800'} rounded-xl overflow-hidden group hover:border-orange-500 transition-colors flex flex-col h-full shadow-lg relative`}>
                  
                  {/* COMPACT IMAGE WRAPPER */}
                  <div className="h-28 md:h-40 overflow-hidden relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
                    <img src={t.map_img} alt={t.name} className={`w-full h-full object-cover transition-transform duration-500 ${isClosed ? 'grayscale opacity-50' : 'group-hover:scale-110'}`} />
                    
                    {isFree && (
                      <span className="absolute top-2 left-2 z-20 bg-emerald-500 text-black font-black text-[8px] md:text-[10px] uppercase px-2 py-0.5 rounded shadow-lg">
                        FREE ENTRY
                      </span>
                    )}

                    <span className={`absolute top-2 right-2 z-20 backdrop-blur-md px-2 py-0.5 rounded text-[7px] md:text-[9px] font-black uppercase border truncate max-w-[60%] text-right ${
                       displayStatus === 'MATCH CONFIRMED' ? 'bg-emerald-500/80 text-black border-emerald-400' :
                       (displayStatus === 'MIN NOT REACHED' || (isClosed && !isFree)) ? 'bg-red-500/90 text-white border-red-400' :
                       'bg-black/70 text-orange-400 border-orange-500/30'
                    }`}>
                      {displayStatus}
                    </span>
                    <h3 className="absolute bottom-2 left-3 z-20 font-black italic text-sm md:text-xl tracking-wider text-white drop-shadow-md truncate w-[90%]">{t.name}</h3>
                  </div>

                  {/* COMPACT CONTENT WRAPPER */}
                  <div className="p-2.5 md:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      
                      {/* 1. MATCH DETAILS */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[8px] md:text-xs font-bold">
                        <span className="border border-orange-500/30 bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Users className="w-2.5 h-2.5 shrink-0" /> {t.type}</span>
                        <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">{t.perspective}</span>
                        <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-auto">
                          <Clock className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                          {t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }).replace(',', '') : 'TBA'}
                        </span>
                      </div>

                      {/* 2. PRIZE POOL */}
                      <div className="bg-gradient-to-r from-orange-500/15 via-zinc-950 to-zinc-950 border border-orange-500/30 p-2 md:p-3 rounded-lg flex justify-between items-center shadow-inner">
                        <div>
                          <p className="text-[8px] md:text-[9px] font-black uppercase text-orange-400 tracking-wider">Total Prize</p>
                          <p className="text-sm md:text-lg font-black text-emerald-400">₹{totalPrizePool}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] md:text-[9px] font-black uppercase text-zinc-400 tracking-wider">1st Place</p>
                          <p className="text-xs md:text-sm font-black text-amber-400">₹{activePrizes[0] || 0}</p>
                        </div>
                      </div>

                      {/* 3. ENTRY FEE & COUNTDOWN GRID */}
                      <div className="flex gap-1.5">
                        <div className="flex-1 bg-zinc-950 p-1.5 md:p-2.5 rounded border border-zinc-800/80 flex flex-col justify-center min-w-0">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider truncate">Entry</p>
                          <p className={`text-[11px] md:text-sm font-black truncate ${isFree ? 'text-emerald-500' : 'text-orange-500'}`}>{isFree ? 'FREE' : `₹${t.fee}`}</p>
                        </div>
                        <div className={`flex-1 p-1.5 md:p-2.5 rounded border flex flex-col justify-center min-w-0 ${isClosed ? 'bg-red-950/20 border-red-900/40 text-red-400' : 'bg-zinc-950 border-zinc-800 text-orange-400'}`}>
                          <p className="text-[8px] font-bold uppercase flex items-center gap-0.5 text-zinc-500 truncate"><Timer className="w-2.5 h-2.5 shrink-0"/> {isClosed ? 'Status' : 'Closes'}</p>
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-tight truncate">{isClosed ? 'CLOSED' : (countdown || 'OPEN')}</p>
                        </div>
                      </div>

                      {/* 4. UNIVERSAL SLOTS BOOKED */}
                      <div className="bg-zinc-950 p-1.5 md:p-2.5 rounded border border-zinc-800/80 flex justify-between items-center min-w-0">
                         <div className="min-w-0 pr-1">
                           <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider truncate">Slots Booked</p>
                           <p className="text-xs md:text-sm font-black text-white">{bookedCount} <span className="text-zinc-500 text-[10px]">/ {t.total_slots}</span></p>
                         </div>
                         {isFree && (
                           <div className="text-right flex flex-col items-end shrink-0">
                             <p className={`text-[8px] md:text-[9px] font-black uppercase flex items-center gap-0.5 ${isMinReached ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isMinReached ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0"/> : <AlertCircle className="w-2.5 h-2.5 shrink-0"/>}
                                {isMinReached ? 'Confirmed' : `Min ${minSlots}`}
                             </p>
                           </div>
                         )}
                      </div>

                    </div>

                    {/* 5. ACTIONS */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-zinc-800/80 mt-auto">
                      <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-1.5 md:py-2.5 rounded-lg text-[9px] md:text-[10px] transition-colors border border-zinc-700 flex items-center justify-center min-h-[32px] md:min-h-[40px]">
                        DETAILS
                      </Link>
                      
                      {isClosed ? (
                        <button disabled className="text-center bg-zinc-800 text-zinc-500 font-black uppercase tracking-wider py-1.5 md:py-2.5 rounded-lg text-[9px] md:text-[10px] cursor-not-allowed border border-zinc-700 flex items-center justify-center min-h-[32px] md:min-h-[40px]">
                          CLOSED
                        </button>
                      ) : (
                        <button onClick={() => handleJoinClick(t)} className={`font-black uppercase tracking-wider py-1.5 md:py-2.5 rounded-lg text-[9px] md:text-[10px] transition-all flex items-center justify-center min-h-[32px] md:min-h-[40px] ${isFree ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm' : 'bg-orange-500 hover:bg-orange-400 text-black shadow-sm'}`}>
                          {isFree ? 'JOIN FREE' : 'JOIN'}
                        </button>
                      )}
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
                <p className={`font-black text-xl ${selectedMatch.entry_type === 'FREE' || selectedMatch.fee === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {selectedMatch.entry_type === 'FREE' || selectedMatch.fee === 0 ? 'FREE' : `₹${selectedMatch.fee}`}
                </p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Entry Fee</p>
              </div>
            </div>
            
            {/* Hide Balance warning for Free entry */}
            {selectedMatch.entry_type !== 'FREE' && selectedMatch.fee > 0 && walletBalance < selectedMatch.fee && (
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
                <button 
                  type="submit" 
                  disabled={isSubmitting || !selectedSlot || (selectedMatch.entry_type !== 'FREE' && selectedMatch.fee > 0 && walletBalance < selectedMatch.fee)} 
                  className={`flex-[2] font-black uppercase tracking-widest py-4 rounded transition-colors disabled:opacity-50 ${selectedMatch.entry_type === 'FREE' || selectedMatch.fee === 0 ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}
                >
                  {isSubmitting ? 'Processing...' : (selectedMatch.entry_type === 'FREE' || selectedMatch.fee === 0) ? 'Confirm Registration' : `Confirm & Pay ₹${selectedMatch.fee}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
