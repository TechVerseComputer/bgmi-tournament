'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Users, Clock, ShieldAlert, ArrowLeft, CheckCircle, AlertCircle, Key, Lock } from 'lucide-react';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [tournament, setTournament] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Booking States
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team, setTeam] = useState({ p1_ign: '', p1_id: '', p2_ign: '', p2_id: '', p3_ign: '', p3_id: '', p4_ign: '', p4_id: '' });

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      // 1. Fetch Tournament details
      const { data: tourneyData } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (tourneyData) setTournament(tourneyData);

      // 2. Fetch existing registrations for this match
      const { data: regData } = await supabase.from('registrations').select('*').eq('tournament_id', id);
      if (regData) setRegistrations(regData);

      // 3. Fetch User session & Wallet
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (wallet) setWalletBalance(wallet.balance);
      }

      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  // Replace your existing handleOpenModal function with this:
  const handleOpenModal = () => {
    if (!user) {
      // Force Google account picker and redirect back to this exact match page
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      return;
    }
    setShowModal(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return alert("Please select a drop slot!");
    if (walletBalance < tournament.fee) return alert("Insufficient balance! Please add funds to your wallet.");

    setIsSubmitting(true);
    try {
      const newBalance = walletBalance - tournament.fee;
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);

      await supabase.from('transactions').insert([{
        user_id: user.id, type: 'TOURNAMENT_FEE', amount: tournament.fee, status: 'SUCCESS', description: `Entry fee for ${tournament.name} (Slot ${selectedSlot})`
      }]);

      const playerCount = tournament.type === 'SOLO' ? 1 : tournament.type === 'DUO' ? 2 : 4;
      const { error: regError } = await supabase.from('registrations').insert([{
        tournament_id: tournament.id, user_id: user.id, squad_name: team.p1_ign + "'s Squad", igl_email: user.email,
        player_1_id: team.p1_id, player_1_ign: team.p1_ign, 
        player_2_id: playerCount >= 2 ? team.p2_id : null, player_2_ign: playerCount >= 2 ? team.p2_ign : null,
        player_3_id: playerCount >= 4 ? team.p3_id : null, player_3_ign: playerCount >= 4 ? team.p3_ign : null,
        player_4_id: playerCount >= 4 ? team.p4_id : null, player_4_ign: playerCount >= 4 ? team.p4_ign : null,
        utr_number: 'PAID_VIA_WALLET', payment_status: 'Verified', slot_number: selectedSlot
      }]);

      if (regError) throw regError;
      alert("Slot Booked Successfully!");
      setWalletBalance(newBalance);
      setShowModal(false);
      
      const { data: regData } = await supabase.from('registrations').select('*').eq('tournament_id', id);
      if (regData) setRegistrations(regData);

    } catch (error: any) { alert("Error booking slot: " + error.message); } finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-orange-500 font-bold flex items-center justify-center animate-pulse">Loading Match Details...</div>;
  if (!tournament) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-bold">Match not found.</div>;

  const bookedSlotNumbers = registrations.map(r => r.slot_number).filter(s => s !== null);
  const userRegistration = user ? registrations.find(r => r.user_id === user.id) : null;

  // Dynamic Live Prize Pool Calculation
  const bookedCount = registrations.length;
  const totalLivePool = bookedCount > 0 ? Math.floor(bookedCount * Number(tournament.fee || 0) * 0.85) : 0;
  
  const activePrizes = tournament.fee > 0 && totalLivePool > 0 ? [
    Math.floor(totalLivePool * 0.55),
    Math.floor(totalLivePool * 0.30),
    totalLivePool - Math.floor(totalLivePool * 0.55) - Math.floor(totalLivePool * 0.30)
  ].filter(p => p > 0) : (tournament.prize_breakdown?.length > 0 ? tournament.prize_breakdown : [tournament.first_prize || 0, tournament.second_prize || 0]);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      {/* Top Banner Header */}
      <div className="relative h-72 md:h-96 overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10" />
        <img src={tournament.map_img} alt={tournament.name} className="w-full h-full object-cover filter brightness-75" />
        
        <div className="absolute bottom-6 left-4 lg:px-12 z-20 max-w-7xl mx-auto w-full">
          <button onClick={() => router.push('/tournaments')} className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider mb-4 transition-colors bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4"/> Back to Tournaments
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="bg-orange-500 text-black font-black text-xs uppercase px-3 py-1 rounded">{tournament.type}</span>
            <span className="bg-zinc-800 text-zinc-300 font-bold text-xs uppercase px-3 py-1 rounded border border-zinc-700">{tournament.perspective}</span>
            <span className="bg-emerald-500/10 text-emerald-500 font-bold text-xs uppercase px-3 py-1 rounded border border-emerald-500/20">{tournament.status}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">{tournament.name}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Overview, Prize Pool, & Slot Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Match Info Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entry Fee</p>
              <p className="text-2xl font-black text-orange-500">{tournament.fee === 0 ? 'FREE' : `₹${tournament.fee}`}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Match Time (IST)</p>
              <p className="text-lg font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500"/> 
                {tournament.match_time ? new Date(tournament.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Slots</p>
              <p className="text-lg font-bold text-white flex items-center gap-1.5"><Users className="w-4 h-4 text-orange-500"/> {tournament.total_slots || 25} Slots</p>
            </div>
          </div>

          {/* Prize Pool Breakdown */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-orange-500"><Trophy className="w-5 h-5"/> Prize Pool Distribution</h2>
              {tournament.fee > 0 && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">Live Scaling Active ({bookedCount} Booked)</span>}
            </div>
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

          {/* Visual Slot Matrix */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider mb-1">Drop Slot Availability & Roster</h2>
              <p className="text-xs text-zinc-500">Click any booked slot to inspect the registered squad leader.</p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-5 gap-3">
              {Array.from({ length: tournament.total_slots || 25 }, (_, i) => i + 1).map((slotNum) => {
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

        {/* Right Col: Action Sidebar & Secure Room Credentials Box */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24 space-y-6">
            <h3 className="font-black uppercase tracking-wider text-sm border-b border-zinc-800 pb-4">Match Control</h3>
            
            <div className="space-y-3 text-sm font-bold">
              <div className="flex justify-between text-zinc-400"><p>Entry Fee</p><p className="text-white">₹{tournament.fee}</p></div>
              <div className="flex justify-between text-zinc-400"><p>Wallet Balance</p><p className="text-emerald-500">₹{walletBalance}</p></div>
            </div>

            {userRegistration ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4"/> Slot Successfully Booked (Slot {userRegistration.slot_number})
                </div>
                <div className="text-zinc-300 text-xs font-bold">{userRegistration.squad_name}</div>
              </div>
            ) : (
              <button onClick={handleOpenModal} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all">
                Join Match Now
              </button>
            )}

            {/* --- SECURE ROOM CREDENTIALS DISPLAY BOX --- */}
            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-500">
                <Key className="w-4 h-4"/> Custom Room Credentials
              </div>

              {userRegistration ? (
                tournament.room_id ? (
                  <div className="bg-zinc-950 border border-orange-500/40 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-bold">Room ID:</span>
                      <strong className="text-white font-mono text-sm bg-zinc-900 px-2 py-1 rounded">{tournament.room_id}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-bold">Password:</span>
                      <strong className="text-white font-mono text-sm bg-zinc-900 px-2 py-1 rounded">{tournament.room_password || 'None'}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center text-xs text-zinc-400 font-medium">
                    Room ID & Password will be published here 10-15 minutes before match time. Stay tuned!
                  </div>
                )
              ) : (
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-center space-y-2">
                  <Lock className="w-5 h-5 text-zinc-600 mx-auto"/>
                  <p className="text-[11px] text-zinc-400 font-medium">Join this match and book your slot to reveal the Room ID & Password.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111116] w-full max-w-2xl rounded-xl border border-zinc-800 relative my-8">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 p-2 rounded-full">✕</button>
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-black uppercase tracking-wide text-white">Book Slot - {tournament.name}</h2>
            </div>
            <form onSubmit={handleConfirmBooking} className="p-6 space-y-6">
              <div className="space-y-4">
                {Array.from({ length: tournament.type === 'SOLO' ? 1 : tournament.type === 'DUO' ? 2 : 4 }, (_, i) => i + 1).map((num) => (
                  <div key={num} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50">
                    <p className="text-xs font-bold text-orange-500 mb-3 uppercase tracking-wider">Player {num} {num === 1 && '(Captain)'}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="In-Game Name (IGN)" value={team[`p${num}_ign` as keyof typeof team]} onChange={e => setTeam({...team, [`p${num}_ign`]: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-orange-500 outline-none text-zinc-300" />
                      <input required type="text" placeholder="Game ID (Numbers)" value={team[`p${num}_id` as keyof typeof team]} onChange={e => setTeam({...team, [`p${num}_id`]: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-sm focus:border-orange-500 outline-none font-mono text-zinc-300" />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Choose Drop Slot</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: tournament.total_slots || 25 }, (_, i) => i + 1).map((slot) => {
                    const isBooked = bookedSlotNumbers.includes(slot);
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
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-900 text-white font-bold uppercase py-4 rounded hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !selectedSlot} className="flex-[2] bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-4 rounded transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : `Confirm & Pay ₹${tournament.fee}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
