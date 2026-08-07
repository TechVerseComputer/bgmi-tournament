'use client';

import Link from 'next/link';
import { Gamepad, Wallet, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);

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
  }, [pathname]); // Re-run when route changes

  // Hide this public navbar on Admin and Dashboard pages because they have their own specific UI
  if (pathname === '/admin' || pathname === '/dashboard') return null;

  return (
    <nav className="w-full z-50 p-4 lg:px-12 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 sticky top-0">
      <Link href="/" className="flex items-center gap-2">
        <Gamepad className="text-orange-500 w-8 h-8" />
        <div className="font-black text-2xl tracking-tighter">BGMI <span className="text-orange-500">ARENA</span></div>
      </Link>
      
      <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide items-center">
        <Link href="/" className={`hover:text-orange-400 transition-colors ${pathname === '/' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : ''}`}>HOME</Link>
        <Link href="/tournaments" className={`hover:text-orange-400 transition-colors ${pathname.includes('/tournaments') ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : ''}`}>TOURNAMENTS</Link>
        <Link href="/leaderboard" className={`hover:text-orange-400 transition-colors ${pathname === '/leaderboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : ''}`}>LEADERBOARD</Link>
        <Link href="/rules" className={`hover:text-orange-400 transition-colors ${pathname === '/rules' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : ''}`}>RULES</Link>
        
        {/* Dynamic Auth Button */}
        {user ? (
          <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded flex items-center gap-2 transition-colors border border-zinc-700 text-emerald-500">
            <Wallet className="w-4 h-4" /> ₹{balance}
          </Link>
        ) : (
          <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded flex items-center gap-2 transition-colors font-black uppercase tracking-wider">
            <LogIn className="w-4 h-4" /> Player Login
          </Link>
        )}
      </div>
    </nav>
  );
}