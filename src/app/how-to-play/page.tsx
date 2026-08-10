import { Gamepad2, Trophy, Users, Zap, ListChecks, UserCheck, Clock, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function HowToPlayPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <Gamepad2 className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">How To <span className="text-orange-500">Play</span></h1>
        <p className="text-zinc-400 font-bold">Your 4-step guide to winning on BGMI Arena.</p>
      </section>
      
      {/* --- EXISTING 4-STEP GUIDE --- */}
      <section className="py-12 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">1</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Deposit Funds</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Head to the Player Portal and top up your wallet via UPI. Admins approve deposits instantly.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">2</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Book Your Drop</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Select a match, choose an open Drop Slot, enter your squad's In-Game IDs, and confirm.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">3</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Get Room Details</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Return to the Match Details page 15 minutes before the start time to view the Room ID & Password.</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-8 rounded-2xl space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center font-black text-xl mb-4 border border-orange-500/20">4</div>
          <h3 className="font-black uppercase tracking-wider text-white text-lg">Submit & Win</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Upload a screenshot of your match result. Once verified, your prize money is instantly credited.</p>
        </div>
      </section>

      {/* --- NEW: DETAILED MATCH TIMELINE --- */}
      <section className="py-12 px-4 max-w-5xl mx-auto space-y-8 border-t border-zinc-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-wider mb-2">Detailed Match <span className="text-orange-500">Checklist</span></h2>
          <p className="text-sm text-zinc-400 font-bold">Follow these guidelines to ensure a smooth tournament experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Before Joining */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-orange-500 font-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <ListChecks className="w-5 h-5"/> Before Joining
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check the match entry fee</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check the match date and time</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check available drop slots</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check the number of winners and prize pool</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Read the tournament rules thoroughly</li>
            </ul>
          </div>

          {/* After Joining */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-orange-500 font-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5"/> After Joining
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Verify your registration on the Match Details page</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check your selected slot and team details</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Ensure your submitted BGMI/In-Game ID is correct to avoid disqualification</li>
            </ul>
          </div>

          {/* Before Match */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-orange-500 font-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5"/> Before Match
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check Room ID & Password (available 15 mins prior)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Join the room on time to secure your slot</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Strictly follow all tournament rules</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/> Do NOT share room credentials with anyone</li>
            </ul>
          </div>

          {/* After Match */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl">
            <h4 className="text-orange-500 font-black uppercase tracking-wider flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5"/> After Match
            </h4>
            <ul className="space-y-3 text-sm text-zinc-400 font-medium">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Capture a clear result screenshot showing placement and kills</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Submit the screenshot through the Match Details page</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Monitor the "Under Review" status for updates</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"/> Check your wallet balance after the payout is approved</li>
            </ul>
          </div>
        </div>

        {/* Verification Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-xl flex items-start gap-3 mt-6">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black uppercase text-amber-500 tracking-wider mb-1">Important: Verification Process</h4>
            <p className="text-xs text-amber-500/80 font-medium leading-relaxed">
              Payouts are not automatic. Every submitted screenshot is subject to strict verification by administrators during a mandatory review period to ensure fair play. Fraudulent submissions will result in an immediate ban.
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
