'use client';

import Link from 'next/link';
import { Users, ChevronRight, ShieldCheck, Clock, AlertTriangle, Zap, Trophy, Headphones, Flame, Key } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const heroImages = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2070&auto=format&fit=crop'
];

export default function Home() {
  const [latestTournaments, setLatestTournaments] = useState<any[]>([]);
  const [userMatches, setUserMatches] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) setLatestTournaments(data);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: regData } = await supabase
          .from('registrations')
          .select('*, tournaments (*)')
          .eq('user_id', session.user.id);
        if (regData) {
          setUserMatches(regData.map(r => ({ ...r.tournaments, slot: r.slot_number, squadName: r.squad_name })));
        }
      }
    };
    fetchData();

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    return () => clearInterval(slideInterval);
  }, []);

  return (
    <main className="bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* Cinematic Hero Section with Auto-Slider */}
      <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden border-b border-zinc-900">
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
        
        <div className="relative z-10 max-w-5xl mx-auto mt-12 space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 rounded-full text-orange-500 text-xs font-black uppercase tracking-widest backdrop-blur-md animate-pulse">
            <Flame className="w-4 h-4" /> India's Premier BGMI Esports Hub
          </div>

          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
            Compete. Conquer.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400">Be The Champion.</span>
          </h1>
          
          <p className="text-base md:text-xl text-zinc-300 font-medium max-w-2xl mx-auto drop-shadow">
            Join elite daily BGMI tournaments, battle top squads, and claim your instant cash payouts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/tournaments" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-105">
              <Users className="w-5 h-5" /> Explore Tournaments
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all border border-zinc-700/80 backdrop-blur-md flex items-center justify-center gap-2 hover:border-orange-500/50">
              Player Portal
            </Link>
          </div>

          <div className="flex justify-center gap-2.5 pt-6">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-10 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'w-2.5 bg-zinc-700 hover:bg-zinc-500'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Active Registered Matches Banner */}
      {userMatches.length > 0 && (
        <section className="py-8 px-4 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-orange-950/40 via-zinc-900 to-orange-950/40 border border-orange-500/40 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-orange-500 text-xs font-black uppercase tracking-widest">Active Player Status</span>
                <h3 className="text-2xl font-black italic uppercase tracking-wider flex items-center gap-2 text-white mt-1">
                  <Trophy className="w-6 h-6 text-orange-500"/> Your Registered Matches ({userMatches.length})
                </h3>
              </div>
              <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all">
                Manage in Dashboard &rarr;
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userMatches.map((m) => (
                <div key={m.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-orange-500/40 transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full">Slot S{m.slot}</span>
                      <span className="text-xs text-zinc-400 font-bold">{m.squadName}</span>
                    </div>
                    <h4 className="font-black text-lg text-white uppercase italic">{m.name}</h4>
                    <div className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0"/>
                      <span>{m.match_time ? new Date(m.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                    {m.room_id ? (
                      <div className="text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5"/> ID: {m.room_id} | Pass: {m.room_password}
                      </div>
                    ) : (
                      <span className="text-[11px] text-orange-400 font-bold">Room ID unlocks soon</span>
                    )}
                    <Link href={`/tournaments/${m.id}`} className="bg-orange-500 hover:bg-orange-400 text-black font-black text-xs px-4 py-2 rounded-xl uppercase transition-all">
                      Lobby
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Tournaments */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Live Action</span>
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">Latest <span className="text-orange-500">Matches</span></h2>
          <div className="h-1 w-20 bg-orange-500 mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestTournaments.map((t) => {
            const activePrizes = t.prize_breakdown?.length > 0 ? t.prize_breakdown : [t.first_prize || 0, t.second_prize || 0];
            const totalPrizePool = activePrizes.reduce((a: number, b: number) => a + Number(b), 0);

            return (
              <div key={t.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-orange-500/80 transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] flex flex-col h-full backdrop-blur-sm">
                <div className="h-48 overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent z-10" />
                  <img src={t.map_img} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <span className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {t.status || 'OPEN'}
                  </span>
                  <h3 className="absolute bottom-3 left-4 z-20 font-black italic text-xl tracking-wider text-white drop-shadow-md">{t.name}</h3>
                </div>
                
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex gap-2 text-xs font-bold">
                      <span className="border border-orange-500/30 bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-md flex items-center gap-1"><Users className="w-3 h-3" /> {t.type}</span>
                      <span className="border border-zinc-700 bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-md">{t.perspective}</span>
                    </div>

                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{t.match_time ? new Date(t.match_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900">
                        <span className="text-zinc-400">Total Pool: <strong className="text-emerald-400 font-black">₹{totalPrizePool}</strong></span>
                        <span className="text-orange-400">1st: ₹{activePrizes[0] || 0}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Entry Fee</p>
                      <p className="text-3xl font-black text-orange-500">{t.fee === 0 ? 'FREE' : `₹{t.fee}`}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-3 rounded-xl text-xs transition-colors border border-zinc-700 flex items-center justify-center">
                      View More
                    </Link>
                    <Link href="/tournaments" className="text-center bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wider py-3 rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center">
                      Join Match
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-zinc-300 hover:text-orange-500 font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-orange-500 px-8 py-4 rounded-2xl bg-zinc-900/50 backdrop-blur-md shadow-lg">
            View All Scheduled Tournaments <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-16">
          <span className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Fair Play Guaranteed</span>
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">Tournament <span className="text-orange-500">Rules</span></h2>
          <div className="h-1 w-20 bg-orange-500 mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Fair Play', desc: 'Use of hacks, cheats or third-party tools is strictly banned.', icon: ShieldCheck },
            { title: 'Team Composition', desc: 'Ensure your complete squad is ready before start time.', icon: Users },
            { title: 'Match Schedule', desc: 'Be on time. Late check-ins lead to disqualification.', icon: Clock },
            { title: 'Disconnection', desc: 'No rematches granted for individual disconnections.', icon: AlertTriangle },
            { title: 'Decisions', desc: "Tournament admin's final decision is binding.", icon: Zap },
          ].map((rule, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl text-center space-y-4 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                <rule.icon className="w-7 h-7 text-orange-500 group-hover:text-black transition-colors" />
              </div>
              <h3 className="font-black uppercase tracking-wide text-sm">{rule.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Play With Us */}
      <section className="py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-16">
          <span className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">The Ultimate Advantage</span>
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">Why Play <span className="text-orange-500">With Us?</span></h2>
          <div className="h-1 w-20 bg-orange-500 mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Instant Payouts', desc: 'Winnings transferred directly instantly', icon: Zap },
            { title: 'Fair & Secure', desc: '100% secure anti-cheat environment', icon: ShieldCheck },
            { title: 'Exciting Prizes', desc: 'Massive daily cash pools for winners', icon: Trophy },
            { title: 'Easy to Join', desc: 'Lightning-fast automated slot booking', icon: Users },
            { title: '24/7 Support', desc: 'Dedicated admins ready to assist you', icon: Headphones },
          ].map((feature, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl text-center space-y-4 hover:border-orange-500/50 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                <feature.icon className="w-7 h-7 text-orange-500 group-hover:text-black transition-colors" />
              </div>
              <h3 className="font-black uppercase tracking-wide text-sm">{feature.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 max-w-7xl mx-auto border-t border-zinc-900/80">
        <div className="text-center mb-16">
          <span className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Simple 4-Step Process</span>
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-wider">How It <span className="text-orange-500">Works?</span></h2>
          <div className="h-1 w-20 bg-orange-500 mt-4 mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Register', desc: 'Sign up with Google and setup your player profile' },
            { step: '2', title: 'Join Tournament', desc: 'Pick your preferred map, mode, and drop slot' },
            { step: '3', title: 'Play & Win', desc: 'Dominate the lobby and secure top placement' },
            { step: '4', title: 'Win Cash', desc: 'Collect instant rewards straight to your wallet' },
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl text-center relative flex flex-col items-center hover:border-orange-500/40 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 text-black font-black text-2xl rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                {item.step}
              </div>
              <h3 className="font-black uppercase tracking-wider mb-2 text-white">{item.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
