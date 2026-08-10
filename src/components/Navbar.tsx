'use client';

import Link from 'next/link';
import { Gamepad, Wallet, LogIn, Download, BellRing, BellOff, Bell, Home, Crosshair, User, Trophy, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';

// Strictly type the PWA event to satisfy the TypeScript compiler
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Utility function to convert VAPID key for the PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Navbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  
  // PWA Install Prompt State with strict typing
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Notification States
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

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

    // Listen for PWA install capability safely
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // --- NOTIFICATION PERMISSION LOGIC ---
    if (!('Notification' in window)) {
      setNotifPermission('unsupported');
    } else {
      setNotifPermission(Notification.permission);
      
      // If default (never asked) and user hasn't explicitly dismissed our custom prompt before
      if (Notification.permission === 'default' && !localStorage.getItem('notifPromptDismissed')) {
        // Slight delay so it doesn't aggressively pop up the millisecond the site loads
        const timer = setTimeout(() => setShowNotifPrompt(true), 3500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [pathname]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      setShowNotifPrompt(false);

      if (permission === 'granted' && user) {
        await subscribeDeviceToPush();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  };

  const subscribeDeviceToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) return; 

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subJSON = subscription.toJSON();
      
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth,
        created_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const handleDismissNotificationPrompt = () => {
    localStorage.setItem('notifPromptDismissed', 'true');
    setShowNotifPrompt(false);
  };

  // Completely hide all navigation for the Admin Hub
  if (pathname?.startsWith('/admin')) return null;

  // We only hide the TOP bar on the Dashboard, the bottom bar must remain!
  const isDashboard = pathname === '/dashboard';

  return (
    <>
      {/* CUSTOM NOTIFICATION PROMPT OVERLAY */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-black italic text-white uppercase tracking-wider mb-2">Stay Updated</h3>
            <p className="text-sm text-zinc-400 font-bold mb-8">
              Allow notifications to receive important match updates, room details, results, and wallet deposit confirmations.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleEnableNotifications} className="w-full bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-widest py-3 rounded transition-colors">
                Enable Notifications
              </button>
              <button onClick={handleDismissNotificationPrompt} className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase tracking-widest py-3 rounded border border-zinc-800 transition-colors">
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP NAVIGATION BAR --- (Hidden on Dashboard) */}
      {!isDashboard && (
        <nav className="w-full z-50 p-4 md:px-8 lg:px-12 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 sticky top-0">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad className="text-orange-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />
            <div className="font-black text-xl md:text-2xl tracking-tighter text-white whitespace-nowrap">BGMI <span className="text-orange-500">ARENA</span></div>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 text-sm font-bold tracking-wide items-center">
            <Link href="/" className={`transition-colors ${pathname === '/' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>HOME</Link>
            <Link href="/tournaments" className={`transition-colors ${pathname.includes('/tournaments') ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>TOURNAMENTS</Link>
            <Link href="/leaderboard" className={`transition-colors ${pathname === '/leaderboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>LEADERBOARD</Link>
            <Link href="/rules" className={`transition-colors ${pathname === '/rules' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>RULES</Link>
            
            {user && (
              <Link href="/dashboard" className={`transition-colors ${pathname === '/dashboard' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-zinc-300 hover:text-orange-400'}`}>DASHBOARD</Link>
            )}

            {notifPermission === 'granted' && <BellRing className="w-4 h-4 text-emerald-500" title="Notifications Enabled" />}
            {notifPermission === 'denied' && <BellOff className="w-4 h-4 text-red-500 opacity-50" title="Notifications Blocked in Browser Settings" />}

            {deferredPrompt && (
              <button onClick={handleInstallClick} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded flex items-center gap-2 transition-colors border border-blue-500/30">
                <Download className="w-4 h-4 shrink-0" /> Install App
              </button>
            )}
            
            {user ? (
              <Link href="/dashboard" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded flex items-center gap-2 transition-colors border border-zinc-700 text-emerald-500">
                <Wallet className="w-4 h-4 shrink-0" /> ₹{balance}
              </Link>
            ) : (
              <Link href="/dashboard" className="bg-orange-500 hover:bg-orange-400 text-black px-5 py-2.5 rounded flex items-center gap-2 transition-colors font-black uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                <LogIn className="w-4 h-4 shrink-0" /> Player Login
              </Link>
            )}
          </div>

          {/* Mobile Top Bar Controls */}
          <div className="flex md:hidden items-center gap-3">
            {notifPermission === 'granted' && <BellRing className="w-4 h-4 text-emerald-500" />}
            {notifPermission === 'denied' && <BellOff className="w-4 h-4 text-red-500 opacity-50" />}

            {deferredPrompt && (
              <button onClick={handleInstallClick} className="bg-blue-600/20 text-blue-400 p-1.5 rounded border border-blue-500/30" aria-label="Install App">
                <Download className="w-5 h-5 shrink-0" />
              </button>
            )}

            {user ? (
              <div className="bg-zinc-800 px-3 py-1.5 rounded flex items-center gap-1.5 text-xs text-emerald-500 border border-zinc-700 font-bold">
                <Wallet className="w-3 h-3 shrink-0" /> ₹{balance}
              </div>
            ) : (
              <Link href="/dashboard" className="bg-orange-500 text-black px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider">
                Login
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* --- APP-LIKE MOBILE BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-zinc-950 border-t border-zinc-900 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-16 px-2 relative">
          
          <Link href="/" className={`flex flex-col items-center gap-1 w-14 transition-colors ${pathname === '/' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
          </Link>

          <Link href="/tournaments" className={`flex flex-col items-center gap-1 w-14 transition-colors ${pathname.includes('/tournaments') ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Crosshair className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Matches</span>
          </Link>

          {/* ELEVATED CENTER DASHBOARD BUTTON - Changed to User Icon */}
          <div className="relative w-16 flex justify-center">
            <Link href="/dashboard" className="absolute -top-7 flex flex-col items-center group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-[4px] border-[#0a0a0a] shadow-lg transition-transform active:scale-95 ${pathname === '/dashboard' ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-zinc-800 text-zinc-300 border-zinc-900'}`}>
                {user ? <User className="w-6 h-6" /> : <LogIn className="w-6 h-6 ml-0.5" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${pathname === '/dashboard' ? 'text-orange-500' : 'text-zinc-400'}`}>
                {user ? 'Account' : 'Login'}
              </span>
            </Link>
          </div>

          <Link href="/leaderboard" className={`flex flex-col items-center gap-1 w-14 transition-colors ${pathname === '/leaderboard' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Trophy className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Ranks</span>
          </Link>

          <Link href="/rules" className={`flex flex-col items-center gap-1 w-14 transition-colors ${pathname === '/rules' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Rules</span>
          </Link>

        </div>
      </div>
    </>
  );
}
