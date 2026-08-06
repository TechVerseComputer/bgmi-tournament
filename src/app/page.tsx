import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="font-bold text-xl tracking-wider">
          BGMI <span className="text-emerald-500">HUB</span>
        </div>
        <div className="space-x-4">
          <Link href="/admin" className="text-xs text-slate-400 hover:text-white transition-colors">
            Admin Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-12 md:mt-24">
        <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-1.5 rounded-full text-xs mb-6">
          🔥 REGISTRATIONS OPEN
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          Pro Scrims & <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Daily Tournaments
          </span>
        </h1>
        
        <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm md:text-base">
          Join the most competitive BGMI lobbies. Fair play, strict anti-cheat, and instant prize pool distribution.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/register" 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-center"
          >
            Register Squad (₹100)
          </Link>
          
          <button 
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-8 rounded-xl border border-slate-700 transition-all text-center flex items-center justify-center gap-2"
            onClick={() => alert("To install the PWA: Tap the 'Share' or 'Menu' button in your browser and select 'Add to Home Screen'")}
          >
            📱 Download App
          </button>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="w-full max-w-4xl mx-auto p-6 mt-12 mb-24">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          📅 Upcoming Matches
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Match Card 1 */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Erangel Squads</h3>
                <p className="text-xs text-slate-400">Map: Erangel | TPP</p>
              </div>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-1 rounded">Filling Fast</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-2">
              <div className="text-sm">Today, 9:00 PM</div>
              <div className="text-emerald-400 font-bold">Prize: ₹1,800</div>
            </div>
          </div>

           {/* Match Card 2 */}
           <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl opacity-60">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Miramar Showdown</h3>
                <p className="text-xs text-slate-400">Map: Miramar | TPP</p>
              </div>
              <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded">Tomorrow</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-2">
              <div className="text-sm">Tomorrow, 9:00 PM</div>
              <div className="text-emerald-400 font-bold">Prize: ₹2,000</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}