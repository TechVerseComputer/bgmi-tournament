'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, ShieldCheck, Users, Clock, WifiOff, 
  AlertTriangle, Gamepad, Zap, Mail
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client'; // <-- DB Connection added

const heroImages = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop"
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tournaments, setTournaments] = useState<any[]>([]); // <-- State to hold real DB matches
  const supabase = createClient();

  // Slider Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Real Tournaments from Supabase
  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4); // Only show the latest 4 on the homepage
      
      if (data) setTournaments(data);
    };
    fetchTournaments();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      <nav className="absolute top-0 w-full z-50 p-4 lg:px-12 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Gamepad className="text-orange-500 w-8 h-8" />
          <div className="font-black text-2xl tracking-tighter">
            BGMI <span className="text-orange-500">ARENA</span>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide">
          <Link href="#" className="text-orange-500 border-b-2 border-orange-500 pb-1">HOME</Link>
          <Link href="/tournaments" className="hover:text-orange-400 transition-colors">TOURNAMENTS</Link>
          <Link href="/leaderboard" className="hover:text-orange-400 transition-colors">LEADERBOARD</Link>
          <Link href="/rules" className="hover:text-orange-400 transition-colors">RULES</Link>
          <Link href="/about" className="hover:text-orange-400 transition-colors">ABOUT US</Link>
        </div>
      </nav>

      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {heroImages.map((img, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img src={img} alt="Hero" className="w-full h-full object-cover" />
          </div>
        ))}
        <button onClick={prevSlide} className="absolute left-4 z-20 p-2 bg-black/50 hover:bg-orange-500 rounded-full transition-colors border border-white/10"><ChevronLeft className="w-6 h-6" /></button>
        <button onClick={nextSlide} className="absolute right-4 z-20 p-2 bg-black/50 hover:bg-orange-500 rounded-full transition-colors border border-white/10"><ChevronRight className="w-6 h-6" /></button>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
            Compete. Conquer. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Be The Champion!</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-2xl mx-auto">
            Join exciting BGMI tournaments, showcase your skills and win amazing prizes!
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register" className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-lg py-4 px-8 rounded flex items-center justify-center gap-3 transition-all uppercase tracking-wide transform hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Users className="w-5 h-5" /> Register Squad
            </Link>
            <button onClick={() => alert("To install the App: Tap the 'Share' or 'Menu' button in your browser and select 'Add to Home Screen'")} className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg py-4 px-8 rounded border-2 border-zinc-700 flex items-center justify-center gap-3 transition-all uppercase tracking-wide transform hover:scale-105">
              <Zap className="w-5 h-5 text-orange-500" /> Download App
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 max-w-7xl mx-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-widest flex items-center justify-center gap-4">
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
            ALL <span className="text-orange-500">TOURNAMENTS</span>
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['ALL', 'SOLO', 'DUO', 'SQUAD'].map((filter, i) => (
              <button key={i} className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider border ${i === 0 ? 'bg-orange-500 border-orange-500 text-black' : 'bg-transparent border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'} transition-all`}>{filter}</button>
            ))}
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center text-zinc-500 font-bold uppercase py-12">No tournaments scheduled right now. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tournaments.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-orange-500 transition-colors">
                <div className="h-32 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                  <img src={t.map_img} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <h3 className="absolute bottom-2 left-4 z-20 font-black italic text-xl tracking-wider">{t.name}</h3>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex gap-2 text-xs font-bold">
                    <span className="border border-orange-500 text-orange-500 px-2 py-1 rounded">{t.type}</span>
                    <span className="border border-zinc-700 text-gray-400 px-2 py-1 rounded">{t.perspective}</span>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                    <p className="text-2xl font-black text-orange-500">{t.fee === 0 ? 'FREE' : `₹${t.fee}`}</p>
                  </div>
                  
                  <div className="bg-black/50 p-3 rounded border border-zinc-800">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Prize Pool</p>
                    <div className="flex justify-between text-sm font-bold">
                      <span>1ST PRIZE</span><span className="text-orange-500">₹{t.first_prize}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-1">
                      <span>2ND PRIZE</span><span className="text-orange-500">₹{t.second_prize}</span>
                    </div>
                  </div>
                  <Link href="/register" className="block w-full text-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase py-3 rounded transition-all">Join Now</Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Redirect CTA to "All Tournaments" page */}
        {tournaments.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/tournaments" className="inline-block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold uppercase tracking-wider py-3 px-8 rounded transition-colors">
              View All Scheduled Tournaments →
            </Link>
          </div>
        )}
      </section>

      <footer className="bg-[#050505] py-12 px-4 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Gamepad className="text-orange-500 w-8 h-8" />
            <div className="font-black text-xl tracking-tighter text-gray-500">BGMI <span className="text-orange-700">ARENA</span></div>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 font-medium hover:text-orange-500 transition-colors">
            <Mail className="w-5 h-5" /> <a href="mailto:mail.bgmighost@gmail.com">mail.bgmighost@gmail.com</a>
          </div>
          <p className="text-zinc-600 text-sm font-medium">© 2026 BGMI Arena. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}