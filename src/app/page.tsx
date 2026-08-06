'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, ShieldCheck, Users, Clock, WifiOff, 
  AlertTriangle, IndianRupee, Trophy, Gamepad2, Wallet, Headphones,
  Gamepad, Shield, Zap
} from 'lucide-react';

// Placeholder Images for the Hero Slider (Replace these URLs later with your own images in the /public folder)
const heroImages = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506069992138-5c6214f44558?q=80&w=2070&auto=format&fit=crop"
];

const tournaments = [
  { name: 'ERANGEL', mapImg: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop', type: 'SQUAD', perspective: 'TPP', fee: 50, firstPrize: 3000, secondPrize: 1000 },
  { name: 'MIRAMAR', mapImg: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800&auto=format&fit=crop', type: 'SQUAD', perspective: 'TPP', fee: 80, firstPrize: 5000, secondPrize: 1500 },
  { name: 'SANHOK', mapImg: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop', type: 'SQUAD', perspective: 'TPP', fee: 40, firstPrize: 2000, secondPrize: 700 },
  { name: 'VIKENDI', mapImg: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=80&w=800&auto=format&fit=crop', type: 'DUO', perspective: 'TPP', fee: 60, firstPrize: 3000, secondPrize: 1000 },
  { name: 'TDM WAREHOUSE', mapImg: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800&auto=format&fit=crop', type: 'SQUAD', perspective: 'TPP', fee: 30, firstPrize: 1500, secondPrize: 500 },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto Slider Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 p-4 lg:px-12 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <Gamepad className="text-orange-500 w-8 h-8" />
          <div className="font-black text-2xl tracking-tighter">
            BGMI <span className="text-orange-500">ARENA</span>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide">
          <Link href="#" className="text-orange-500 border-b-2 border-orange-500 pb-1">HOME</Link>
          <Link href="#" className="hover:text-orange-400 transition-colors">TOURNAMENTS</Link>
          <Link href="#" className="hover:text-orange-400 transition-colors">LEADERBOARD</Link>
          <Link href="#" className="hover:text-orange-400 transition-colors">RULES</Link>
          <Link href="#" className="hover:text-orange-400 transition-colors">ABOUT US</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/admin" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider bg-white/10 px-4 py-2 rounded">
            Admin
          </Link>
        </div>
      </nav>

      {/* Hero Section with Auto Slider */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Images */}
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/60 z-10" /> {/* Dark Overlay */}
            <img src={img} alt="Hero" className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Slider Controls */}
        <button onClick={prevSlide} className="absolute left-4 z-20 p-2 bg-black/50 hover:bg-orange-500 rounded-full transition-colors border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={nextSlide} className="absolute right-4 z-20 p-2 bg-black/50 hover:bg-orange-500 rounded-full transition-colors border border-white/10">
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
            Compete. Conquer. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Be The Champion!
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium mb-10 max-w-2xl mx-auto">
            Join exciting BGMI tournaments, showcase your skills and win amazing prizes!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register" className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-lg py-4 px-8 rounded flex items-center justify-center gap-3 transition-all uppercase tracking-wide transform hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <Users className="w-5 h-5" />
              Register Squad
            </Link>
            <button 
              onClick={() => alert("To install the App: Tap the 'Share' or 'Menu' button in your browser and select 'Add to Home Screen'")}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg py-4 px-8 rounded border-2 border-zinc-700 flex items-center justify-center gap-3 transition-all uppercase tracking-wide transform hover:scale-105"
            >
              <Zap className="w-5 h-5 text-orange-500" />
              Download App
            </button>
          </div>
        </div>

        {/* Slider Dots */}
        <div className="absolute bottom-8 z-20 flex gap-2">
          {heroImages.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-widest flex items-center justify-center gap-4">
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
            ALL <span className="text-orange-500">TOURNAMENTS</span>
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
          </h2>
          
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['ALL', 'SOLO', 'DUO', 'SQUAD', 'TDM', 'PC/EMULATOR'].map((filter, i) => (
              <button key={i} className={`px-6 py-2 rounded-full font-bold text-sm tracking-wider border ${i === 0 ? 'bg-orange-500 border-orange-500 text-black' : 'bg-transparent border-zinc-700 text-gray-400 hover:border-orange-500 hover:text-orange-500'} transition-all`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {tournaments.map((t, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden group hover:border-orange-500 transition-colors">
              <div className="h-32 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10" />
                <img src={t.mapImg} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <h3 className="absolute bottom-2 left-4 z-20 font-black italic text-xl tracking-wider">{t.name}</h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex gap-2 text-xs font-bold">
                  <span className="border border-orange-500 text-orange-500 px-2 py-1 rounded">{t.type}</span>
                  <span className="border border-zinc-700 text-gray-400 px-2 py-1 rounded">{t.perspective}</span>
                </div>
                
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</p>
                  <p className="text-2xl font-black text-orange-500">₹{t.fee}</p>
                </div>
                
                <div className="bg-black/50 p-3 rounded border border-zinc-800">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Prize Pool</p>
                  <div className="flex justify-between text-sm font-bold">
                    <span>1ST PRIZE</span>
                    <span className="text-orange-500">₹{t.firstPrize}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-1">
                    <span>2ND PRIZE</span>
                    <span className="text-orange-500">₹{t.secondPrize}</span>
                  </div>
                </div>
                
                <Link href="/register" className="block w-full text-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase py-3 rounded transition-all">
                  Join Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 bg-black border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-black italic uppercase tracking-widest text-center mb-12 flex items-center justify-center gap-4">
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
            TOURNAMENT <span className="text-orange-500">RULES</span>
            <span className="h-[2px] w-12 bg-orange-500 hidden md:block"></span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { icon: ShieldCheck, title: 'FAIR PLAY', desc: 'Use of hacks, cheats or any third-party tools is strictly prohibited.' },
              { icon: Users, title: 'TEAM COMPOSITION', desc: 'Ensure your squad is complete before the tournament starts.' },
              { icon: Clock, title: 'MATCH SCHEDULE', desc: 'Be on time. Late entries may lead to disqualification.' },
              { icon: WifiOff, title: 'DISCONNECTION', desc: 'No rematches will be granted for disconnections or network issues.' },
              { icon: AlertTriangle, title: 'DECISIONS', desc: 'The tournament admin\'s decision will be final and binding.' }
            ].map((rule, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center hover:border-orange-500/50 transition-colors">
                <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-4 border border-orange-500/20">
                  <rule.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-black tracking-wide mb-2">{rule.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / CTA Section */}
      <section className="relative py-20 px-4 text-center border-b-4 border-orange-500 overflow-hidden">
        {/* Background Image for CTA */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/80 z-10" />
          <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" alt="Background" />
        </div>
        
        <div className="relative z-20 max-w-4xl mx-auto bg-gradient-to-r from-orange-600/90 to-orange-500/90 rounded-2xl p-8 md:p-12 border border-orange-400/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight mb-2">Ready to dominate?</h2>
            <p className="text-orange-100 font-medium">Gather your squad and join the battle now!</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href="/register" className="flex-1 md:flex-none bg-black text-white font-black py-4 px-8 rounded whitespace-nowrap hover:bg-zinc-900 transition-colors uppercase text-center border border-zinc-800">
              Register Squad
            </Link>
          </div>
        </div>
      </section>

      {/* Actual Footer */}
      <footer className="bg-[#050505] py-12 px-4 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Gamepad className="text-orange-500 w-8 h-8" />
            <div className="font-black text-xl tracking-tighter text-gray-500">
              BGMI <span className="text-orange-700">ARENA</span>
            </div>
          </div>
          <p className="text-zinc-600 text-sm font-medium">© 2026 BGMI Arena. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}