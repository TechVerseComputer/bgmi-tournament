'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, Clock, ShieldAlert, ArrowLeft, CheckCircle, AlertCircle, Timer, UploadCloud, ImageIcon, CheckCircle2, X, ChevronRight, ChevronLeft } from 'lucide-react';

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

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  // Modal & Booking States
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingStep, setBookingStep] = useState(1);
  
  const [team, setTeam] = useState({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });

  // Screenshot Submission States
  const [myResult, setMyResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [isUploadingResult, setIsUploadingResult] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      const { data: tourneyData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (tourneyData) setTournament(tourneyData);

      const { data: regData } = await supabase.from('registrations').select('*').eq('tournament_id', id);
      if (regData) setRegistrations(regData);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (wallet) setWalletBalance(wallet.balance);

        const { data: resultData } = await supabase.from('match_results').select('*').eq('tournament_id', id).eq('user_id', session.user.id);
        if (resultData && resultData.length > 0) setMyResult(resultData[0]);
      }

      setLoading(false);
    };
    fetchDetails();

    setCurrentTime(Date.now());
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [id]);

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

  // SECURE: Calculates if user is registered in this page's state
  const myRegistration = user ? registrations.find(r => r.user_id === user.id) : null;

  const handleOpenModal = () => {
    if (!user) {
      alert("You must be logged in to join a match.");
      router.push('/dashboard');
      return;
    }
    
    // SECURE: Double-check registration before opening modal
    if (myRegistration) {
      alert("You are already registered for this match.");
      return;
    }

    setBookingStep(1);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleNextToStep2 = () => {
    const type = tournament?.type || 'SQUAD';
    const numPlayers = type === 'SOLO' ? 1 : type === 'DUO' ? 2 : 4;
    for (let i = 1; i <= numPlayers; i++) {
      const ignKey = `p${i}_ign` as keyof typeof team;
      const idKey = `p${i}_id` as keyof typeof team;
      if (!team[ignKey] || !team[idKey]) {
        return alert(`Please enter In-Game Name and Game ID for Player ${i}`);
      }
    }
    setBookingStep(2);
  };

  const handleNextToStep3 = () => {
    if (!selectedSlot) return alert("Please select a drop slot!");
    setBookingStep(3);
  };

  const handleConfirmBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSlot) return alert("Please select a drop slot!");
    
    // SECURE: Final frontend check to prevent duplicate submission
    if (myRegistration) {
      alert("You are already registered for this match.");
      setShowModal(false);
      return;
    }

    const isFree = tournament.entry_type === 'FREE' || tournament.fee === 0;
    
    if (!isFree && walletBalance < tournament.fee) {
      return alert("Insufficient balance! Please add funds to your wallet.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tournaments/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          userId: user.id,
          userEmail: user.email,
          selectedSlot,
          team
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Slot Booked Successfully!");
      setShowModal(false);
      setBookingStep(1); 
      setTeam({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });

      const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
      if (wallet) setWalletBalance(wallet.balance);
      
      const { data: regData } = await supabase.from('registrations').select('*').eq('tournament_id', id);
      if (regData) setRegistrations(regData);

    } catch (error: any) { 
      // If backend throws the 409 Duplicate Error, catch it cleanly
      if (error.message.includes("already joined")) {
        const { data: regData } = await supabase.from('registrations').select('*').eq('tournament_id', id);
        if (regData) setRegistrations(regData);
        setShowModal(false);
      }
      alert("Error booking slot: " + error.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleResultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResultFile(file);
      setResultPreview(URL.createObjectURL(file));
    }
  };

  const submitMatchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultFile || !myRegistration) return alert("Please select an image first.");
    
    setIsUploadingResult(true);
    try {
      const fileExt = resultFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('match-results').upload(filePath, resultFile);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('match-results').getPublicUrl(filePath);

      const res = await fetch('/api/tournaments/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          registrationId: myRegistration.id,
          userId: user.id,
          imageUrl: publicUrlData.publicUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Result submitted successfully! Our admins will review it shortly.");
      setShowResultModal(false);
      setResultFile(null);
      setResultPreview(null);
      
      const { data: newResult } = await supabase.from('match_results').select('*').eq('tournament_id', id).eq('user_id', user.id);
      if (newResult && newResult.length > 0) setMyResult(newResult[0]);
    } catch (err: any) {
      alert("Upload Error: " + err.message);
    } finally {
      setIsUploadingResult(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-orange-500 font-bold flex items-center justify-center animate-pulse">Loading Match Details...</div>;
  if (!tournament) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-bold">Match not found.</div>;

  const isFree = tournament.entry_type === 'FREE' || tournament.fee === 0;
  const bookedSlotNumbers = registrations.map(r => r.slot_number).filter(s => s !== null);
  const bookedCount = registrations.length;
  const maxSlots = Number(tournament.total_slots || 25);
  const minSlots = Number(tournament.minimum_slots_required || maxSlots);
  const isMinReached = bookedCount >= minSlots;
  
  const maxPool = !isFree && tournament.fee > 0 ? Math.floor(maxSlots * Number(tournament.fee || 0) * 0.85) : 0;
  const totalLivePool = !isFree && bookedCount > 0 ? Math.floor(bookedCount * Number(tournament.fee || 0) * 0.85) : 0;
  const winnerCount = tournament.total_winners || (tournament.prize_breakdown?.length > 0 ? tournament.prize_breakdown.length : 2);

  let maxPrizes: number[] = [];
  if (!isFree && tournament.fee > 0 && maxPool > 0) {
    if (winnerCount === 1) {
      maxPrizes = [maxPool];
    } else if (winnerCount === 2) {
      const p1 = Math.floor(maxPool * 0.70);
      maxPrizes = [p1, maxPool - p1];
    } else if (winnerCount === 3) {
      const p1 = Math.floor(maxPool * 0.55);
      const p2 = Math.floor(maxPool * 0.30);
      maxPrizes = [p1, p2, maxPool - p1 - p2];
    } else if (winnerCount === 4) {
      const p1 = Math.floor(maxPool * 0.50);
      const p2 = Math.floor(maxPool * 0.25);
      const p3 = Math.floor(maxPool * 0.15);
      maxPrizes = [p1, p2, p3, maxPool - p1 - p2 - p3];
    } else if (winnerCount === 5) {
      const p1 = Math.floor(maxPool * 0.45);
      const p2 = Math.floor(maxPool * 0.25);
      const p3 = Math.floor(maxPool * 0.15);
      const p4 = Math.floor(maxPool * 0.10);
      maxPrizes = [p1, p2, p3, p4, maxPool - p1 - p2 - p3 - p4];
    } else if (winnerCount >= 6) {
      const p1 = Math.floor(maxPool * 0.45);
      const p2 = Math.floor(maxPool * 0.25);
      const p3 = Math.floor(maxPool * 0.15);
      const p4 = Math.floor(maxPool * 0.10);
      const p5 = Math.floor(maxPool * 0.03); 
      maxPrizes = [p1, p2, p3, p4, p5, maxPool - p1 - p2 - p3 - p4 - p5];
    }
  } else {
    maxPrizes = tournament.prize_breakdown?.length > 0 
      ? tournament.prize_breakdown.slice(0, winnerCount) 
      : [tournament.first_prize || 0, tournament.second_prize || 0].slice(0, winnerCount);
  }
  const maxTotalPool = maxPrizes.reduce((a, b) => a + Number(b), 0);

  let activePrizes: number[] = [];
  if (!isFree && tournament.fee > 0 && totalLivePool > 0) {
    if (winnerCount === 1) {
      activePrizes = [totalLivePool];
    } else if (winnerCount === 2) {
      const p1 = Math.floor(totalLivePool * 0.70);
      activePrizes = [p1, totalLivePool - p1];
    } else if (winnerCount === 3) {
      const p1 = Math.floor(totalLivePool * 0.55);
      const p2 = Math.floor(totalLivePool * 0.30);
      activePrizes = [p1, p2, totalLivePool - p1 - p2];
    } else if (winnerCount === 4) {
      const p1 = Math.floor(totalLivePool * 0.50);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      activePrizes = [p1, p2, p3, totalLivePool - p1 - p2 - p3];
    } else if (winnerCount === 5) {
      const p1 = Math.floor(totalLivePool * 0.45);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      const p4 = Math.floor(totalLivePool * 0.10);
      activePrizes = [p1, p2, p3, p4, totalLivePool - p1 - p2 - p3 - p4];
    } else if (winnerCount >= 6) {
      const p1 = Math.floor(totalLivePool * 0.45);
      const p2 = Math.floor(totalLivePool * 0.25);
      const p3 = Math.floor(totalLivePool * 0.15);
      const p4 = Math.floor(totalLivePool * 0.10);
      const p5 = Math.floor(totalLivePool * 0.03); 
      activePrizes = [p1, p2, p3, p4, p5, totalLivePool - p1 - p2 - p3 - p4 - p5];
    }
  } else {
    activePrizes = tournament.prize_breakdown?.length > 0 
      ? tournament.prize_breakdown.slice(0, winnerCount) 
      : [tournament.first_prize || 0, tournament.second_prize || 0].slice(0, winnerCount);
  }

  const isTimePassed = tournament.registration_closing_time && currentTime ? currentTime > new Date(tournament.registration_closing_time).getTime() : false;
  const isUnderReview = tournament.status === 'UNDER REVIEW';
  const isMinFailed = isTimePassed && !isMinReached; 
  
  const isClosed = isTimePassed || tournament.status === 'FULL' || tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED' || isUnderReview || isMinFailed;
  
  let displayStatus = tournament.status || 'OPEN';
  if (isTimePassed && tournament.status === 'OPEN') {
    displayStatus = isMinFailed ? 'MIN NOT REACHED' : 'REGISTRATION CLOSED';
  } else if (tournament.status === 'OPEN') {
    displayStatus = isMinReached ? 'MATCH CONFIRMED' : 'WAITING FOR PLAYERS';
  }

  const countdown = formatCountdown(tournament.registration_closing_time);
  
  let reviewTimeLeft = 0;
  if (isUnderReview && tournament.review_started_at && currentTime) {
    const reviewStart = new Date(tournament.review_started_at).getTime();
    const reviewEnd = reviewStart + (30 * 60 * 1000); 
    reviewTimeLeft = reviewEnd - currentTime;
    if (reviewTimeLeft < 0) reviewTimeLeft = 0;
  }

  const formatReviewTimer = (ms: number) => {
    if (ms <= 0) return "Review Complete. Awaiting Payouts.";
    const m = Math.floor((ms / 1000 / 60) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} remaining`;
  };

  const isMatchActiveOrCompleted = tournament.status === 'FULL' || tournament.status === 'COMPLETED' || isUnderReview;

  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <div className="relative h-72 md:h-96 overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10" />
        <img src={tournament.map_img} alt={tournament.name} className={`w-full h-full object-cover filter brightness-75 ${isClosed ? 'grayscale' : ''}`} />
        
        <div className="absolute bottom-6 left-4 lg:px-12 z-20 max-w-7xl mx-auto w-full">
          <button onClick={() => router.push('/tournaments')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider mb-4 transition-colors bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4"/> Back to Tournaments
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {isFree ? (
              <span className="bg-emerald-500 text-black font-black text-xs uppercase px-3 py-1 rounded">FREE ENTRY</span>
            ) : (
              <span className="bg-orange-500 text-black font-black text-xs uppercase px-3 py-1 rounded">{tournament.type}</span>
            )}
            <span className="bg-zinc-800 text-zinc-300 font-bold text-xs uppercase px-3 py-1 rounded border border-zinc-700">{tournament.perspective}</span>
            <span className={`font-bold text-xs uppercase px-3 py-1 rounded border ${
              tournament.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              isUnderReview ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
              (isClosed || isMinFailed) ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
              'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              {displayStatus}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">{tournament.name}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {isUnderReview && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div>
                <h3 className="font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5"/> Match Under Review
                </h3>
                <p className="text-zinc-400 text-sm mt-1 font-medium">
                  Admins are currently verifying screenshots and match results. Payouts will be released shortly.
                </p>
              </div>
              <div className="bg-amber-950/50 border border-amber-900/50 px-4 py-2 rounded-lg text-amber-400 font-mono font-black text-center whitespace-nowrap">
                {formatReviewTimer(reviewTimeLeft)}
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entry Fee</p>
              <p className={`text-2xl font-black ${isClosed && !isFree ? 'text-zinc-500' : isFree ? 'text-emerald-500' : 'text-orange-500'}`}>
                {isFree ? 'FREE ENTRY' : `₹${tournament.fee}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Match Time (IST)</p>
              <p className="text-lg font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500"/> 
                {tournament.match_time ? new Date(tournament.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Slots: {bookedCount} / {maxSlots}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-1 ${isMinReached ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isMinReached ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}
                {isMinReached ? 'Match Confirmed' : `Min ${minSlots} Reqd.`}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-orange-500">
                  <Trophy className="w-5 h-5"/> Prize Pool Distribution
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Total Prize Pool: <strong className="text-emerald-400 font-black">₹{maxTotalPool}</strong> {isFree ? '(Fixed Manual Prize)' : '(Maximum when full)'}
                </p>
              </div>
              {!isFree && tournament.fee > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400">
                  Live Scaling: ₹{totalLivePool} based on {bookedCount} entries
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
                {isFree ? 'Fixed Prize Breakdown:' : `Current Live Breakdown (${bookedCount} Booked):`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePrizes.map((prize: number, idx: number) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-zinc-400">
                      {idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : idx === 2 ? '🥉 3rd Place' : `# ${idx + 1} Place`}
                    </span>
                    <span className="font-black text-xl text-orange-500">₹{prize}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider mb-1">Drop Slot Availability & Roster</h2>
              <p className="text-xs text-zinc-500">Check active squad registrations for this match.</p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-5 gap-3">
              {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotNum) => {
                const booking = registrations.find(r => r.slot_number === slotNum);
                const isBooked = !!booking;

                return (
                  <div key={slotNum} className={`p-3 rounded-lg border text-center transition-all flex flex-col justify-between h-20 ${isBooked ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                    <span className="text-xs font-black">S{slotNum}</span>
                    <span className="text-[10px] font-bold uppercase truncate px-1">
                      {isBooked ? booking.squad_name : 'Available'}
                    </span>
                    <span className={`text-[9px] font-bold px-1 rounded ${isBooked ? 'bg-orange-500 text-black font-black' : 'text-zinc-600'}`}>
                      {isBooked ? 'BOOKED' : 'OPEN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24 space-y-6">
            <h3 className="font-black uppercase tracking-wider text-sm border-b border-zinc-800 pb-4">Match Control</h3>
            
            {!isUnderReview && countdown && tournament.status !== 'COMPLETED' && (
               <div className={`p-4 rounded-lg border text-center font-black uppercase tracking-widest ${isClosed ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                 <Timer className="w-5 h-5 mx-auto mb-2" />
                 {isClosed ? 'REGISTRATION CLOSED' : countdown}
               </div>
            )}

            <div className="space-y-3 text-sm font-bold">
              <div className="flex justify-between text-zinc-400">
                <p>Entry Fee</p>
                <p className={isFree ? 'text-emerald-500' : 'text-white'}>{isFree ? 'FREE' : `₹${tournament.fee}`}</p>
              </div>
              {user && <div className="flex justify-between text-zinc-400"><p>Wallet Balance</p><p className="text-emerald-500">₹{walletBalance}</p></div>}
            </div>

            {myRegistration ? (
              <div className="border-t border-zinc-800 pt-4 space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Your Squad</p>
                    <p className="font-bold text-white text-sm">{myRegistration.squad_name}</p>
                  </div>
                  <div className="bg-emerald-500 text-black font-black px-3 py-1 rounded text-xs">
                    S{myRegistration.slot_number}
                  </div>
                </div>

                {isMatchActiveOrCompleted && (
                  <>
                    {myResult && (
                      <div className={`p-3 rounded-lg border ${
                        myResult.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                        myResult.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                        'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {myResult.status === 'PENDING' && <Clock className="w-4 h-4" />}
                          {myResult.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4" />}
                          {myResult.status === 'REJECTED' && <AlertCircle className="w-4 h-4" />}
                          <p className="text-xs font-black uppercase tracking-wider">Result: {myResult.status}</p>
                        </div>
                        {myResult.status === 'REJECTED' && myResult.admin_note && (
                          <p className="text-[10px] mt-2 font-bold text-red-400 bg-red-950/40 p-2 rounded">Note: {myResult.admin_note}</p>
                        )}
                      </div>
                    )}

                    {(!myResult || myResult.status === 'REJECTED') && (
                      <button onClick={() => setShowResultModal(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors">
                        <UploadCloud className="w-4 h-4" /> Submit Result
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button disabled={isClosed} onClick={handleOpenModal} className={`w-full font-black uppercase tracking-widest py-4 rounded-xl transition-all ${isClosed ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : isFree ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]'}`}>
                {isClosed ? 'Match Closed' : isFree ? 'Join for Free' : 'Join Match Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Step Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111116] w-full max-w-2xl rounded-xl border border-zinc-800 relative my-8 overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full z-10"><X className="w-5 h-5"/></button>
            
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="pr-8">
                <h2 className="text-xl font-black uppercase tracking-wide text-white truncate">{tournament.name}</h2>
                <p className="text-zinc-500 text-xs font-bold">{tournament.type} • {tournament.perspective}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-black text-xl ${isFree ? 'text-emerald-500' : 'text-orange-500'}`}>{isFree ? 'FREE' : `₹${tournament.fee}`}</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Entry Fee</p>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center text-[10px] sm:text-xs font-black uppercase tracking-widest">
              <div className={`flex flex-col items-center gap-1 ${bookingStep >= 1 ? 'text-orange-500' : 'text-zinc-600'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${bookingStep >= 1 ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-700 bg-zinc-800'}`}>1</span>
                <span className="hidden sm:block">Details</span>
              </div>
              <div className={`flex-1 h-px mx-4 ${bookingStep >= 2 ? 'bg-orange-500/50' : 'bg-zinc-800'}`}></div>
              <div className={`flex flex-col items-center gap-1 ${bookingStep >= 2 ? 'text-orange-500' : 'text-zinc-600'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${bookingStep >= 2 ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-700 bg-zinc-800'}`}>2</span>
                <span className="hidden sm:block">Slot</span>
              </div>
              <div className={`flex-1 h-px mx-4 ${bookingStep >= 3 ? 'bg-orange-500/50' : 'bg-zinc-800'}`}></div>
              <div className={`flex flex-col items-center gap-1 ${bookingStep === 3 ? 'text-orange-500' : 'text-zinc-600'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${bookingStep === 3 ? 'border-orange-500 bg-orange-500/20' : 'border-zinc-700 bg-zinc-800'}`}>3</span>
                <span className="hidden sm:block">Review</span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              
              {bookingStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Squad Details</h3>
                  {Array.from({ length: tournament.type === 'SOLO' ? 1 : tournament.type === 'DUO' ? 2 : 4 }, (_, i) => i + 1).map((num) => (
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
                  <div className="pt-4 mt-4 border-t border-zinc-800 flex gap-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors">Cancel</button>
                    <button type="button" onClick={handleNextToStep2} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black uppercase py-4 rounded transition-colors flex items-center justify-center gap-2">Next <ChevronRight className="w-4 h-4"/></button>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Choose Drop Slot</h3>
                  <div className="grid grid-cols-5 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slot) => {
                      const isBooked = bookedSlotNumbers.includes(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button type="button" key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)} className={`py-3 rounded text-sm font-black transition-all ${isBooked ? 'bg-red-500/10 text-red-500/50 border border-red-500/10 cursor-not-allowed' : isSelected ? 'bg-orange-500 text-black border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-orange-500'}`}>
                          S{slot}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-4 mt-4 border-t border-zinc-800 flex gap-4">
                    <button type="button" onClick={() => setBookingStep(1)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4"/> Back</button>
                    <button type="button" onClick={handleNextToStep3} className="flex-1 bg-orange-500 hover:bg-orange-400 text-black font-black uppercase py-4 rounded transition-colors flex items-center justify-center gap-2">Next <ChevronRight className="w-4 h-4"/></button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-2">Review & Confirm</h3>
                  
                  <div className="bg-zinc-900/50 p-5 rounded-lg border border-zinc-800/50 space-y-4">
                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-zinc-400 text-xs font-bold uppercase">Match</span>
                      <span className="text-white text-sm font-black uppercase text-right">{tournament.name} <br/><span className="text-orange-500 text-[10px]">{tournament.type} • {tournament.perspective}</span></span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-zinc-400 text-xs font-bold uppercase">Time</span>
                      <span className="text-white text-xs font-bold">{tournament.match_time ? new Date(tournament.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-zinc-400 text-xs font-bold uppercase">Team</span>
                      <span className="text-white text-xs font-bold">{team.p1_ign}'s Squad</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-3">
                      <span className="text-zinc-400 text-xs font-bold uppercase">Drop Slot</span>
                      <span className="text-orange-500 text-sm font-black">S{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-zinc-400 text-xs font-bold uppercase">Total Entry Fee</span>
                      <span className={`text-xl font-black ${isFree ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {isFree ? 'FREE ENTRY' : `₹${tournament.fee}`}
                      </span>
                    </div>
                  </div>

                  {!isFree && walletBalance < tournament.fee && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-500 text-sm font-bold"><AlertCircle className="w-5 h-5" /> Insufficient Wallet Balance (₹{walletBalance})</div>
                      <button onClick={() => router.push('/dashboard')} className="bg-red-500 text-white text-xs font-black uppercase px-4 py-2 rounded hover:bg-red-600 transition-colors">Add Funds</button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-800 flex gap-4">
                    <button type="button" onClick={() => setBookingStep(2)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4"/> Back</button>
                    <button 
                      type="button" 
                      onClick={handleConfirmBooking}
                      disabled={isSubmitting || !selectedSlot || (!isFree && walletBalance < tournament.fee)} 
                      className={`flex-[2] font-black uppercase tracking-widest py-4 rounded transition-colors shadow-lg disabled:opacity-50 ${isFree ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}
                    >
                      {isSubmitting ? 'Processing...' : isFree ? 'JOIN FREE' : `JOIN & PAY ₹${tournament.fee}`}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- RESULT UPLOAD MODAL --- */}
      {showResultModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button onClick={() => { setShowResultModal(false); setResultFile(null); setResultPreview(null); }} className="absolute top-4 right-4 bg-zinc-900 p-2 rounded-full text-zinc-400 hover:text-white transition-colors z-10">
              <X className="w-4 h-4"/>
            </button>
            
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-500"/> Submit Match Result
              </h3>
              {myRegistration && <p className="text-xs font-bold text-zinc-500 mt-1">Slot {myRegistration.slot_number} • {myRegistration.squad_name}</p>}
            </div>

            <form onSubmit={submitMatchResult} className="p-6 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl p-6 text-center">
                {!resultPreview ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-300">Upload Screenshot Evidence</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">JPG, PNG up to 5MB</p>
                    </div>
                    <label className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded cursor-pointer transition-colors mt-2">
                      Browse Files
                      <input type="file" accept="image/*" className="hidden" onChange={handleResultImageChange} />
                    </label>
                  </div>
                ) : (
                  <div className="relative group rounded-lg overflow-hidden border border-zinc-700">
                    <img src={resultPreview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-black" />
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs uppercase tracking-wider">
                      <UploadCloud className="w-4 h-4 mr-2"/> Replace Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleResultImageChange} />
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 text-sm text-blue-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs leading-relaxed font-medium">Please ensure the screenshot clearly shows your squad's placement and total kills. Fraudulent submissions will result in a permanent ban.</p>
              </div>

              <button type="submit" disabled={isUploadingResult || !resultFile} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {isUploadingResult ? 'Uploading Evidence...' : 'Submit Evidence for Review'}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
