'use client';

import Link from 'next/link';
import { Users, ChevronRight, ShieldCheck, Clock, AlertTriangle, Zap, Trophy, Headphones } from 'lucide-react';
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) setLatestTournaments(data);
    };
    fetchLatest();

    // Auto-slide timer (Changes slide every 4 seconds)
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => clearInterval(slideInterval);
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Hero Section with 4-Image Auto-Slider */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-30 scale-105' : 'opacity-0 scale-100'
            }`}
            style={{ backgroundImage: `url(${img})`, transition: 'opacity 1s ease-in-out, transform 6s ease-in-out' }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]" />
        
        <div className="relative z-10 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
            Compete. Conquer.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Be The Champion.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-2xl mx-auto">
            Join elite BGMI tournaments, showcase your squad's skills, and win massive prize pools every single day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/tournaments" className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Users className="w-5 h-5" /> View Matches
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-8 py-4 rounded transition-all border border-zinc-800 flex items-center justify-center gap-2">
              Player Portal
            </Link>
          </div>

          {/* Slider Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-zinc-700'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Tournaments Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-[1px] w-12 bg-orange-500" />
          <h2 className="text-3xl font-black italic uppercase tracking-wider">Latest <span className="text-orange-500">Matches</span></h2>
          <div className="h-[1px] w-12 bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestTournaments.map((t) => (
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
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link href={`/tournaments/${t.id}`} className="text-center bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wider py-2.5 rounded text-xs transition-colors border border-zinc-700 flex items-center justify-center">
                    View More
                  </Link>
                  <Link href="/tournaments" className="text-center bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wider py-2.5 rounded text-xs transition-colors flex items-center justify-center">
                    Join Match
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/tournaments" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 font-bold uppercase tracking-wider transition-colors border border-zinc-800 hover:border-orange-500 px-6 py-3 rounded-full bg-zinc-900">
            View All Scheduled Tournaments <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* --- TOURNAMENT RULES SECTION --- */}
      <section className="py-20 px-4 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black italic uppercase tracking-wider">Tournament <span className="text-orange-500">Rules</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Fair Play', desc: 'Use of hacks, cheats or any third-party tools is strictly prohibited.', icon: ShieldCheck },
            { title: 'Team Composition', desc: 'Ensure your squad is complete before the tournament starts.', icon: Users },
            { title: 'Match Schedule', desc: 'Be on time. Late entries may lead to disqualification.', icon: Clock },
            { title: 'Disconnection', desc: 'No rematches will be granted for disconnections or network issues.', icon: AlertTriangle },
            { title: 'Decisions', desc: "The tournament admin's decision will be final and binding.", icon: Zap },
          ].map((rule, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-xl text-center space-y-4 hover:border-orange-500/50 transition-colors">
              <rule.icon className="w-10 h-10 text-orange-500 mx-auto" />
              <h3 className="font-black uppercase tracking-wide text-sm">{rule.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY PLAY WITH US SECTION --- */}
      <section className="py-20 px-4 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black italic uppercase tracking-wider">Why Play <span className="text-orange-500">With Us?</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Instant Payouts', desc: 'Winnings directly in your account', icon: Zap },
            { title: 'Fair & Secure', desc: '100% fair play with anti-cheat system', icon: ShieldCheck },
            { title: 'Exciting Prizes', desc: 'Real cash prizes for top performers', icon: Trophy },
            { title: 'Easy to Join', desc: 'Simple registration and quick match', icon: Users },
            { title: '24/7 Support', desc: "We're here to help you anytime", icon: Headphones },
          ].map((feature, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-xl text-center space-y-4 hover:border-orange-500/50 transition-colors">
              <feature.icon className="w-10 h-10 text-orange-500 mx-auto" />
              <h3 className="font-black uppercase tracking-wide text-sm">{feature.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="py-20 px-4 max-w-7xl mx-auto border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black italic uppercase tracking-wider">How It <span className="text-orange-500">Works?</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {[
            { step: '1', title: 'Register', desc: 'Sign up and create your squad' },
            { step: '2', title: 'Join Tournament', desc: 'Choose any tournament and join' },
            { step: '3', title: 'Play & Win', desc: 'Compete and be the last squad standing' },
            { step: '4', title: 'Win Cash', desc: 'Get amazing rewards and cash prizes' },
          ].map((item, idx) => (
            <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl text-center relative flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-500 text-black font-black text-xl rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                {item.step}
              </div>
              <h3 className="font-black uppercase tracking-wider mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA BANNER SECTION --- */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-zinc-900 via-orange-950/30 to-zinc-900 border border-orange-500/30 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-2">Ready to Dominate the <span className="text-orange-500">Battleground?</span></h2>
            <p className="text-zinc-400 font-medium">Gather your squad and join the battle now!</p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-4 justify-center">
            <Link href="/tournaments" className="bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              Register Squad
            </Link>
            <Link href="/tournaments" className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all border border-zinc-700">
              Download App
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}