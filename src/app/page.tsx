'use client';

import Link from 'next/link';
import { Users, ChevronRight, ShieldCheck, Clock, AlertTriangle, Zap, Trophy, Headphones, Flame, Timer, Gamepad2, FileText, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Your High-End Custom Gaming Wallpapers
const heroImages = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2070&auto=format&fit=crop'  
];

export default function Home() {
  const [latestTournaments, setLatestTournaments] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const supabase = createClient();

  useEffect(() => {
    const initPage = async () => {
      // 1. Fetch Latest Tournaments (EXCLUDING CANCELLED & COMPLETED)
      // UPGRADED SORTING: Order by match_time ascending so the nearest upcoming match is first.
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*, registrations(id)')
        .neq('status', 'CANCELLED')
        .neq('status', 'COMPLETED')
        .order('match_time', { ascending: true })
        .limit(4);
      if (tourneyData) setLatestTournaments(tourneyData);

      // 2. Check Auth & Fetch User's Upcoming Matches
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: regs } = await supabase
          .from('registrations')
          .select('slot_number, tournaments(*)')
          .eq('user_id', session.user.id);
        
        if (regs) {
          const activeMatches = regs.filter((r: any) => {
            const t = Array.isArray(r.tournaments) ? r.tournaments[0] : r.tournaments;
            // Hide if match is completed or cancelled
            return t && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
          });
          
          // Optionally, sort My Matches by match_time ascending as well
          activeMatches.sort((a, b) => {
             const tA = Array.isArray(a.tournaments) ? a.tournaments[0] : a.tournaments;
             const tB = Array.isArray(b.tournaments) ? b.tournaments[0] : b.tournaments;
             if (!tA.match_time) return 1;
             if (!tB.match_time) return -1;
             return new Date(tA.match_time).getTime() - new Date(tB.match_time).getTime();
          });

          setMyMatches(activeMatches);
        }
      }
    };
    
    initPage();

    // Auto-slide timer
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    
    // Live ticker running every second for card countdowns
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => {
      clearInterval(slideInterval);
      clearInterval(timeInterval);
    }
  }, []);

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

  return (
    <main className="bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* Cinematic Hero Section with Auto-Slider */}
      <section className="relative min-h-[85vh] md:h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden border-b border-zinc-900">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-40 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#050505]/40 to-[#050505]" />
        
        <div className="relative z-10 max-w-5xl mx-auto mt-8 md:mt-12 space-y-6 w-full">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 rounded-full text-orange-500 text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md animate-pulse">
            <Flame className="w-4 h-4 shrink-0" /> India&apos;s Premier BGMI Esports Hub
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[1] md:leading-[0.9] drop-shadow-2xl px-2">
            Compete. Conquer.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400">Be The Champion.</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-xl text-zinc-300 font-medium max-w-2xl mx-auto drop-shadow px-4">
            Join elite daily BGMI tournaments, battle top squads, and claim your instant cash payouts.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 w-full px-4 sm:px-0">
            <Link href="/tournaments" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-105">
              <Users className="w-5 h-5 shrink-0" /> Explore Tournaments
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all border border-zinc-700/80 backdrop-blur-md flex items-center justify-center gap-2 hover:border-orange-500/50">
              Player Portal
            </Link>
          </div>

          <div className="flex justify-center gap-2 pt-4 md:pt-6">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 md:w-10 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-2 md:w-2.5 bg-zinc-700 hover:bg-zinc-500'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- MY UPCOMING TOURNAMENTS WIDGET --- */}
      {user && (
        <section className="py-12 px-4 max-w-7xl mx-auto border-b border-zinc-900/80">
          <div className="flex flex-col items-center text-center mb-8 md:mb-10">
            <span className="text-emerald-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">Welcome Back</span>
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-wider">My Upcoming <span className="text-emerald-500">Drops</span></h2>
          </div>
          
          {myMatches.length === 0 ? (
            <div className="text-center py-10 md:py-12 px-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 backdrop-blur-sm">
              <p className="text-zinc-400 font-bold mb-6 text-xs sm:text-sm md:text-base">You don&apos;t have any active upcoming match.</p>
              <Link href="/tournaments" className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest px-6 py-3 md:px-8 md:py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105 text-sm md:text-base">
                Check Tournaments
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {myMatches.map((m: any, idx: number) => {
                const tourney = Array.isArray(m.tournaments) ? m.tournaments[0] : m.tournaments;
                if (!tourney) return null;
                return (
                  <div key={idx} className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 md:p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10">
                      Slot {m.slot_number} Locked
                    </div>
                    <div>
                      <h3 className="font-black italic text-lg md:text-xl tracking-wider text-white mb-2 pr-16">{tourney.name}</h3>
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold mb-4">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0" />
                        {tourney.match_time ? new Date(tourney.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                      </div>
                    </div>
                    <Link href={`/tournaments/${tourney.id}`} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-wider text-[10px] md:text-xs py-3 rounded-xl border border-zinc-700 text-center transition-colors">
                      View Match Details
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Latest Tournaments Section */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-10 md:mb-16">
          <span className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">Live Action</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-wider">Latest <span className="text-orange-500">Matches</span></h2>
          <div className="h-1 w-16 md:w-20 bg-orange-500 mt-3 md:mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestTournaments.map((t) => {
            // --- FREE ENTRY VARIABLES ---
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
            const isTimePassed = t.registration_closing_time && currentTime > new Date(t.registration_closing_time).getTime();
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
              <div key={t.id} className={`bg-zinc-900/80 border ${isClosed ? 'border-red-900/30' : 'border-zinc-800'} rounded-2xl overflow-hidden group hover:border-orange-500/80 transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] flex flex-col h-full backdrop-blur-sm`}>
                <div className="h-44 md:h-48 overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
                  <img src={t.map_img} alt={t.name} className={`w-full h-full object-cover transition-transform duration-700 ${isClosed ? 'grayscale opacity-75' : 'group-hover:scale-110'}`} />
                  
                  {/* FREE ENTRY BADGE */}
                  {isFree && (
                    <span className="absolute top-3 left-3 z-20 bg-emerald-500 text-black font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-lg">
                      FREE ENTRY
                    </span>
                  )}

                  <span className={`absolute top-3 right-3 z-20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase border ${
                     displayStatus === 'MATCH CONFIRMED' ? 'bg-emerald-500/80 text-black border-emerald-400' :
                     (displayStatus === 'MIN NOT REACHED' || (isClosed && !isFree)) ? 'bg-red-500/90 text-white border-red-400' :
                     'bg-black/60 text-orange-400 border-orange-500/30'
                  }`}>
                    {displayStatus}
                  </span>
                  
                  <h3 className="absolute bottom-3 left-4 z-20 font-black italic text-lg md:text-xl tracking-wider text-white drop-shadow-md">{t.name}</h3>
                </div>
                
                <div className="p-4 md:p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    
                    {/* 1. MATCH DETAILS */}
                    <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold pb-1">
                      <span className="border border-orange-500/30 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md flex items-center gap-1"><Users className="w-3 h-3 shrink-0" /> {t.type}</span>
                      <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md">{t.perspective}</span>
                      <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3 text-orange-500 shrink-0" />
                        {t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) : 'TBA'}
                      </span>
                    </div>

                    {/* 2. PRIZE POOL */}
                    <div className="bg-gradient-to-r from-orange-500/15 via-zinc-950 to-zinc-950 border border-orange-500/30 p-3 rounded-xl flex justify-between items-center shadow-inner">
                      <div>
                        <p className="text-[9px] font-black uppercase text-orange-400 tracking-wider">Total Prize Pool</p>
                        <p className="text-xl font-black text-emerald-400">₹{totalPrizePool}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">1st Place</p>
                        <p className="text-sm font-black text-amber-400">₹{activePrizes[0] || 0}</p>
                      </div>
                    </div>

                    {/* 3. ENTRY FEE & COUNTDOWN GRID */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Entry Fee</p>
                        <p className={`text-lg font-black ${isFree ? 'text-emerald-500' : 'text-orange-500'}`}>{isFree ? 'FREE' : `₹${t.fee}`}</p>
                      </div>
                      <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${isClosed ? 'bg-red-950/20 border-red-900/40 text-red-400' : 'bg-zinc-950 border-zinc-800 text-orange-400'}`}>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1"><Timer className="w-2.5 h-2.5"/> Closes In</p>
                        <p className="text-xs font-black uppercase tracking-tight">{isClosed ? 'CLOSED' : (countdown || 'OPEN')}</p>
                      </div>
                    </div>

                    {/* 4. FREE ENTRY MINIMUM SLOTS TRACKER */}
                    {isFree && (
                      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 flex justify-between items-center mt-2">
                         <div>
                           <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Slots Booked</p>
                           <p className="text-sm font-black text-white">{bookedCount} <span className="text-zinc-500 text-xs">/ {t.total_slots}</span></p>
                         </div>
                         <div className="text-right flex flex-col items-end">
                           <p className={`text-[10px] font-black uppercase flex items-center gap-1 ${isMinReached ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {isMinReached ? <CheckCircle2 className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                              {isMinReached ? 'Confirmed' : `Min ${minSlots} Reqd.`}
                           </p>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* 5. ACTIONS */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs transition-colors border border-zinc-700 flex items-center justify-center">
                      View Details
                    </Link>
                    
                    {isClosed ? (
                      <button disabled className="text-center bg-zinc-800 text-zinc-500 font-black uppercase tracking-wider py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs cursor-not-allowed border border-zinc-700 flex items-center justify-center">
                        CLOSED
                      </button>
                    ) : (
                      <Link href={`/tournaments/${t.id}`} className={`text-center font-black uppercase tracking-wider py-2.5 md:py-3 rounded-xl text-[10px] md:text-xs transition-colors flex items-center justify-center ${isFree ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}>
                        {isFree ? 'Join Free' : 'Join Match'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 md:mt-16 text-center">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-zinc-300 hover:text-orange-500 font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-orange-500 px-6 py-3.5 md:px-8 md:py-4 rounded-2xl bg-zinc-900/50 backdrop-blur-md shadow-lg text-xs md:text-sm">
            View All Scheduled Tournaments <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* --- SUPPORT & INFORMATION SECTION --- */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">Need Assistance?</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-wider">Support & <span className="text-orange-500">Information</span></h2>
          <div className="h-1 w-16 md:w-20 bg-orange-500 mt-3 md:mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          <Link href="/help" className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col items-start hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-300 group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-5 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-black uppercase tracking-wider text-white text-base md:text-lg mb-2 group-hover:text-orange-400 transition-colors">Help Center</h3>
            <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed flex-1">Find answers to common questions about tournaments, wallet, registration, results and withdrawals.</p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Read More <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/how-to-play" className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col items-start hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-300 group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-5 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-black uppercase tracking-wider text-white text-base md:text-lg mb-2 group-hover:text-orange-400 transition-colors">How To Play</h3>
            <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed flex-1">Learn how to deposit funds, join a tournament, get room details, submit results and receive winnings.</p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Read More <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/terms" className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col items-start hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-300 group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-5 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-black uppercase tracking-wider text-white text-base md:text-lg mb-2 group-hover:text-orange-400 transition-colors">Terms & Conditions</h3>
            <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed flex-1">Understand the rules, tournament conditions, entry fees, payouts, cancellations and player responsibilities.</p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Read More <ChevronRight className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/privacy" className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col items-start hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-300 group">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center mb-5 border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-black uppercase tracking-wider text-white text-base md:text-lg mb-2 group-hover:text-orange-400 transition-colors">Privacy Policy</h3>
            <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed flex-1">Learn how BGMI Arena collects, uses, protects and manages your account and transaction information.</p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
              Read More <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
          
        </div>
      </section>

      {/* --- RULES SECTION --- */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">Fair Play Guaranteed</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-wider">Tournament <span className="text-orange-500">Rules</span></h2>
          <div className="h-1 w-16 md:w-20 bg-orange-500 mt-3 md:mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { title: 'Fair Play', desc: 'Use of hacks, cheats or third-party tools is strictly banned.', icon: ShieldCheck },
            { title: 'Team Composition', desc: 'Ensure your complete squad is ready before start time.', icon: Users },
            { title: 'Match Schedule', desc: 'Be on time. Late check-ins lead to disqualification.', icon: Clock },
            { title: 'Disconnection', desc: 'No rematches granted for individual disconnections.', icon: AlertTriangle },
            { title: 'Decisions', desc: 'Tournament admin&apos;s final decision is binding.', icon: Zap },
          ].map((rule, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl text-center space-y-3 md:space-y-4 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                <rule.icon className="w-6 h-6 md:w-7 md:h-7 text-orange-500 group-hover:text-black transition-colors shrink-0" />
              </div>
              <h3 className="font-black uppercase tracking-wide text-xs md:text-sm">{rule.title}</h3>
              <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY PLAY WITH US SECTION --- */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">The Ultimate Advantage</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-wider">Why Play <span className="text-orange-500">With Us?</span></h2>
          <div className="h-1 w-16 md:w-20 bg-orange-500 mt-3 md:mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {[
            { title: 'Instant Payouts', desc: 'Winnings transferred directly instantly', icon: Zap },
            { title: 'Fair & Secure', desc: '100% secure anti-cheat environment', icon: ShieldCheck },
            { title: 'Exciting Prizes', desc: 'Massive daily cash pools for winners', icon: Trophy },
            { title: 'Easy to Join', desc: 'Lightning-fast automated slot booking', icon: Users },
            { title: '24/7 Support', desc: 'Dedicated admins ready to assist you', icon: Headphones },
          ].map((feature, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl text-center space-y-3 md:space-y-4 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-orange-500 group-hover:text-black transition-colors shrink-0" />
              </div>
              <h3 className="font-black uppercase tracking-wide text-xs md:text-sm">{feature.title}</h3>
              <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-10 md:mb-16">
          <span className="text-orange-500 text-[10px] md:text-xs font-black uppercase tracking-widest mb-2">Simple 4-Step Process</span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-wider">How It <span className="text-orange-500">Works?</span></h2>
          <div className="h-1 w-16 md:w-20 bg-orange-500 mt-3 md:mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { step: '1', title: 'Register', desc: 'Sign up with Google and setup your player profile' },
            { step: '2', title: 'Join Tournament', desc: 'Pick your preferred map, mode, and drop slot' },
            { step: '3', title: 'Play & Win', desc: 'Dominate the lobby and secure top placement' },
            { step: '4', title: 'Win Cash', desc: 'Collect instant rewards straight to your wallet' },
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-6 md:p-8 rounded-2xl text-center relative flex flex-col items-center hover:border-orange-500/40 transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-black font-black text-xl md:text-2xl rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)] shrink-0">
                {item.step}
              </div>
              <h3 className="font-black uppercase tracking-wider mb-2 text-white text-sm md:text-base">{item.title}</h3>
              <p className="text-zinc-400 text-[11px] md:text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA BANNER SECTION --- */}
      <section className="py-12 md:py-20 px-4 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-orange-950/40 to-zinc-900 border border-orange-500/30 p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-15" />
          <div className="relative z-10 text-center md:text-left space-y-2 md:space-y-3 w-full">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-tight leading-tight">Ready to Dominate the <span className="text-orange-500 block md:inline">Battleground?</span></h2>
            <p className="text-zinc-300 font-medium text-xs sm:text-sm md:text-base px-2 md:px-0">Gather your squad, lock in your drop slot, and start winning today.</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row w-full md:w-auto gap-3 md:gap-4 justify-center shrink-0">
            <Link href="/tournaments" className="w-full sm:w-auto text-center bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all shadow-[0_0_25px_rgba(249,115,22,0.5)] hover:scale-105 text-sm md:text-base">
              Register Squad
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto text-center bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-6 py-3.5 md:px-8 md:py-4 rounded-xl transition-all border border-zinc-700 text-sm md:text-base">
              Player Portal
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
