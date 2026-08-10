import { Headphones, Mail } from 'lucide-react';

export default function HelpCenterPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <Headphones className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Help <span className="text-orange-500">Center</span></h1>
      </section>
      
      <section className="py-12 px-4 max-w-4xl mx-auto space-y-8">
        
        <div className="bg-orange-500/10 border border-orange-500/30 p-8 rounded-2xl text-center flex flex-col items-center">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500 mb-4">Need Immediate Support?</h2>
          <a href="mailto:support@bgmiarena.in" className="bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2">
            <Mail className="w-5 h-5"/> Email Support
          </a>
          <p className="text-xs text-zinc-400 font-bold mt-4">We actively monitor support requests during operational hours.</p>
        </div>

        <div className="space-y-4 pt-8 border-t border-zinc-900">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Frequently Asked Questions</h3>
          
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">How long do deposits take?</h4>
            <p className="text-zinc-400 text-sm">Most deposits are verified and approved by admins within 5-15 minutes.</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">What if my game disconnects?</h4>
            <p className="text-zinc-400 text-sm">Individual player disconnections are not eligible for refunds. Please ensure you have a stable network connection before the match starts.</p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-white font-bold mb-2">How do I claim my prize?</h4>
            <p className="text-zinc-400 text-sm">Submit your match screenshot on the match page. Once the 30-minute review window concludes, admins will verify and disburse the prize to your platform wallet.</p>
          </div>
        </div>

      </section>
    </main>
  );
}
