'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Gamepad2, User, LogOut, ShieldAlert, Wallet } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const checkUserAndWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch wallet balance
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();
        if (walletData) setWalletBalance(walletData.balance);

        // Check if admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', session.user.email)
          .single();
        if (adminData) setIsAdmin(true);
      }
    };
    checkUserAndWallet();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (walletData) setWalletBalance(walletData.balance);
      } else {
        setUser(null);
        setIsAdmin(false);
        setWalletBalance(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Force Google account picker so you can test multiple Gmail accounts
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { prompt: 'select_account' }
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setWalletBalance(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/90 border-b border-zinc-900 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-black italic uppercase tracking-wider text-white">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]">
            <Gamepad2 className="w-6 h-6" />
          </div>
          BGMI <span className="text-orange-500">ARENA</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-zinc-300">
          <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
          <Link href="/tournaments" className="hover:text-orange-500 transition-colors">Tournaments</Link>
          <Link href="/leaderboard" className="hover:text-orange-500 transition-colors">Leaderboard</Link>
          <Link href="/tournaments" className="hover:text-orange-500 transition-colors">Rules</Link>
          {isAdmin && (
            <Link href="/admin" className="text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4"/> Admin Hub
            </Link>
          )}
        </nav>

        {/* Auth Actions & Live Wallet Balance */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Wallet Balance Badge */}
              <Link href="/dashboard" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                <Wallet className="w-4 h-4 text-emerald-400"/>
                <span className="text-xs font-black text-emerald-400">₹{walletBalance ?? 0}</span>
              </Link>
              <Link href="/dashboard" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all">
                <User className="w-4 h-4 text-orange-500"/> Portal
              </Link>
              <button onClick={handleLogout} aria-label="Logout" className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 p-2.5 rounded-xl transition-all">
                <LogOut className="w-4 h-4"/>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin} 
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all hover:scale-105"
            >
              Player Login
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
