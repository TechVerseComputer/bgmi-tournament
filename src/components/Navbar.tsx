'use client';

import Link from 'next/link';
import { Gamepad, Wallet, LogIn, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('wallets').select('balance').eq('user_id', session.user.id).single();
        if (data) setBalance(data.balance);
      }
    };
    fetchUser();
  }, [pathname]);

  if (pathname === '/admin' || pathname === '/dashboard') return null;

  return (
    <nav className="w-full z-50 p-4 lg:px-12 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 sticky top-0">
      <Link href="/" className="flex items-center gap-2">
        <Gamepad className="text-orange-500 w-8 h-8" />
        <div className="font-black text-2xl tracking-tighter text-white">BGMI <span className="text-orange-500">ARENA</span></div>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide items-center">
        <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>HOME</Link>
        <Link href="/tournaments" className={`transition-colors ${pathname.includes('/tournaments') ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>TOURNAMENTS</Link>
        <Link href="/leaderboard" className={`transition-colors ${pathname === '/leaderboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>LEADERBOARD</Link>
        <Link href="/rules" className={`transition-colors ${pathname === '/rules' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>RULES</Link>
        
        {user ? (
          <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded flex items-center gap-2 transition-colors border border-zinc-700 text-emerald-500">
            <Wallet className="w-4 h-4" /> ₹{balance}
          </Link>
        ) : (
          <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-400 text-black px-5 py-2.5 rounded flex items-center gap-2 transition-colors font-black uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            <LogIn className="w-4 h-4" /> Player Login
          </Link>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      <div className="flex md:hidden items-center gap-3">
        {user && (
          <Link href="/dashboard" className="bg-zinc-800 px-3 py-1.5 rounded flex items-center gap-1.5 text-xs text-emerald-500 border border-zinc-700 font-bold">
            <Wallet className="w-3.5 h-3.5" /> ₹{balance}
          </Link>
        )}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-300 hover:text-orange-500 p-2">
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-950 border-b border-zinc-900 p-6 flex flex-col gap-4 md:hidden shadow-2xl">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-2 ${pathname === '/' ? 'text-orange-500' : 'text-zinc-300'}`}>HOME</Link>
          <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-2 ${pathname.includes('/tournaments') ? 'text-orange-500' : 'text-zinc-300'}`}>TOURNAMENTS</Link>
          <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-2 ${pathname === '/leaderboard' ? 'text-orange-500' : 'text-zinc-300'}`}>LEADERBOARD</Link>
          <Link href="/rules" onClick={() => setMobileMenuOpen(false)} className={`text-base font-bold py-2 ${pathname === '/rules' ? 'text-orange-500' : 'text-zinc-300'}`}>RULES</Link>
          
          {!user && (
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-orange-500 text-black py-3 rounded text-center font-black uppercase tracking-wider mt-2 flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> Player Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
