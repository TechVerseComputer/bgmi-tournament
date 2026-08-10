import { Headphones, Mail, User, Wallet, Gamepad2, Key, Image as ImageIcon, Trophy, Wrench } from 'lucide-react';

export default function HelpCenterPage() {
  return (
    <main className="bg-[#0a0a0a] text-white font-sans min-h-screen pb-24">
      <section className="py-16 px-4 text-center border-b border-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <Headphones className="w-16 h-16 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Help <span className="text-orange-500">Center</span></h1>
      </section>
      
      <section className="py-12 px-4 max-w-5xl mx-auto space-y-12">
        
        {/* --- EXISTING SUPPORT WIDGET --- */}
        <div className="bg-orange-500/10 border border-orange-500/30 p-8 rounded-2xl text-center flex flex-col items-center">
          <h2 className="text-xl font-black uppercase tracking-wider text-orange-500 mb-4">Need Immediate Support?</h2>
          <a href="mailto:support@bgmiarena.in" className="bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center gap-2">
            <Mail className="w-5 h-5"/> Email Support
          </a>
          <p className="text-xs text-zinc-400 font-bold mt-4">We actively monitor support requests during operational hours.</p>
        </div>

        {/* --- EXISTING TOP FAQs --- */}
        <div className="space-y-4 pt-8 border-t border-zinc-900">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">Frequently Asked Questions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* --- COMPREHENSIVE KNOWLEDGE BASE --- */}
        <div className="space-y-8 pt-8 border-t border-zinc-900">
          <h3 className="text-2xl font-black italic uppercase tracking-widest text-white mb-8">Detailed <span className="text-orange-500">Information</span></h3>

          {/* Account & Login */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <User className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">A. Account & Login</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">How authentication works</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">We use secure Google Login. If you log out, simply sign back in with the same Google account to access your wallet and match history.</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Account Access & Security</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">Keep your Google account secure. If you lose access to your email, we cannot transfer your wallet balance to a new account.</p>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Wallet className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">B. Wallet & Transactions</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Deposit Limits</h5>
                <ul className="text-xs text-zinc-400 leading-relaxed list-disc list-inside">
                  <li>Minimum Deposit: ₹50</li>
                  <li>Maximum Deposit: ₹2,000 per transaction</li>
                  <li>Do not submit duplicate requests if your deposit is pending.</li>
                </ul>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Withdrawal Limits</h5>
                <ul className="text-xs text-zinc-400 leading-relaxed list-disc list-inside">
                  <li>Minimum Withdrawal: ₹100</li>
                  <li>Maximum Withdrawal: ₹2,000 per transaction</li>
                  <li>Transactions are processed during operational hours.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tournament Registration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Gamepad2 className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">C. Tournament Registration</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Joining a Match</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">Registrations are subject to slot availability. Once the "Closes At" timer reaches zero, no further entries are accepted.</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Cancellations</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">If a tournament is officially cancelled by our administrators, your entry fee will be fully refunded to your platform wallet.</p>
              </div>
            </div>
          </div>

          {/* Match & Room Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Key className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">D. Match & Room Details</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">When do I get the Room ID?</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">Room ID and Password are posted on the Match Details page approximately 15 minutes before the match starts.</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Credential Sharing</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">Do NOT share room credentials with unregistered players. Doing so will result in immediate disqualification and an account ban.</p>
              </div>
            </div>
          </div>

          {/* Result Submission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <ImageIcon className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">E. Result Submission</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Acceptable Evidence</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">The registered captain must upload an unedited screenshot clearly showing your squad's final placement and total kills.</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Rejected Evidence</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">If your screenshot is blurry or incomplete, an admin will reject it with a note. You will be allowed to re-upload proper evidence.</p>
              </div>
            </div>
          </div>

          {/* Verification & Payouts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Trophy className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">F. Payouts & Verification</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">The Review Period</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">After a match concludes, there is a mandatory 30-minute "Under Review" period where payouts are locked so admins can verify all screenshots.</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
                <h5 className="text-sm font-bold text-white mb-1.5">Disputes & Crediting</h5>
                <p className="text-xs text-zinc-400 leading-relaxed">Once verified, winnings are credited to your platform wallet. If you suspect foul play by another team, contact support immediately during the review period.</p>
              </div>
            </div>
          </div>

          {/* Technical Issues */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-4">
              <Wrench className="w-5 h-5" />
              <h4 className="font-black uppercase tracking-wider text-lg">G. Technical Issues</h4>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-xl">
              <p className="text-xs text-zinc-400 leading-relaxed">
                If you experience platform or browser issues, try clearing your cache or restarting the application. When contacting support regarding a technical glitch, please provide your registered email, device type, and the Match ID to help us resolve it quickly.
              </p>
            </div>
          </div>

        </div>

      </section>
    </main>
  );
}
