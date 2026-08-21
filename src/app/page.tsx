'use client';

import Link from 'next/link';
import {
  Users,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Zap,
  Trophy,
  Headphones,
  Timer,
  Gamepad2,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  BellRing,
  ArrowRight,
  Swords,
  Crosshair,
  Smartphone,
  Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// Local BGMI hero artwork.
// Keep these files in public/images/hero/.
const heroImages = [
  '/images/hero/bgmi-1.jpg',
  '/images/hero/bgmi-2.jpg',
  '/images/hero/bgmi-3.jpg',
  '/images/hero/bgmi-4.jpg',
];

export default function Home() {
  const [latestTournaments, setLatestTournaments] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const initPage = async () => {
      // Keep the existing live tournament query and data structure intact.
      const { data: tourneyData } = await supabase
        .from('tournaments')
        .select('*, registrations(id)')
        .neq('status', 'CANCELLED')
        .neq('status', 'COMPLETED')
        .order('match_time', { ascending: true, nullsFirst: false })
        .limit(4);

      if (tourneyData) {
        const sortedTourneys = tourneyData.sort((a, b) => {
          if (!a.match_time) return 1;
          if (!b.match_time) return -1;
          return (
            new Date(a.match_time).getTime() -
            new Date(b.match_time).getTime()
          );
        });

        setLatestTournaments(sortedTourneys);
      }

      // Keep the existing authenticated-user upcoming match flow.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        const { data: regs } = await supabase
          .from('registrations')
          .select('slot_number, tournaments(*)')
          .eq('user_id', session.user.id);

        if (regs) {
          const activeMatches = regs.filter((r: any) => {
            const t = Array.isArray(r.tournaments)
              ? r.tournaments[0]
              : r.tournaments;

            return (
              t &&
              t.status !== 'COMPLETED' &&
              t.status !== 'CANCELLED'
            );
          });

          activeMatches.sort((a, b) => {
            const tA = Array.isArray(a.tournaments)
              ? a.tournaments[0]
              : a.tournaments;
            const tB = Array.isArray(b.tournaments)
              ? b.tournaments[0]
              : b.tournaments;

            if (!tA.match_time) return 1;
            if (!tB.match_time) return -1;

            return (
              new Date(tA.match_time).getTime() -
              new Date(tB.match_time).getTime()
            );
          });

          setMyMatches(activeMatches);
        }
      }
    };

    initPage();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4500);

    const timeInterval = setInterval(
      () => setCurrentTime(Date.now()),
      1000
    );

    return () => {
      clearInterval(slideInterval);
      clearInterval(timeInterval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } finally {
      setDeferredInstallPrompt(null);
    }
  };

  const formatCountdown = (closingTime: string) => {
    if (!closingTime || !currentTime) return null;

    const target = new Date(closingTime).getTime();
    const diff = target - currentTime;

    if (diff <= 0) return 'CLOSED';

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if (d > 0) return `${d}D ${h}H`;

    return `${h.toString().padStart(2, '0')}H ${m
      .toString()
      .padStart(2, '0')}M ${s.toString().padStart(2, '0')}S`;
  };

  const getTournamentStats = (t: any) => {
    const isFree = t.entry_type === 'FREE' || Number(t.fee) === 0;
    const bookedCount = t.registrations?.length || 0;
    const maxSlots = Number(t.total_slots || 25);
    const minSlots = Number(t.minimum_slots_required || maxSlots);
    const isMinReached = bookedCount >= minSlots;
    const fillPercentage = Math.min(
      100,
      Math.max(0, (bookedCount / maxSlots) * 100)
    );
    const spotsLeft = Math.max(0, maxSlots - bookedCount);

    const winnerCount =
      t.total_winners ||
      (t.prize_breakdown?.length > 0
        ? t.prize_breakdown.length
        : 2);

    const activePrizes =
      t.prize_breakdown?.length > 0
        ? t.prize_breakdown.slice(0, winnerCount)
        : [t.first_prize || 0, t.second_prize || 0].slice(
            0,
            winnerCount
          );

    const totalPrizePool = activePrizes.reduce(
      (a: number, b: number) => a + Number(b),
      0
    );

    const isTimePassed =
      t.registration_closing_time &&
      currentTime > new Date(t.registration_closing_time).getTime();

    const isUnderReview = t.status === 'UNDER REVIEW';
    const isMinFailed = isTimePassed && !isMinReached;

    const isClosed =
      isTimePassed ||
      t.status === 'FULL' ||
      t.status === 'COMPLETED' ||
      t.status === 'CANCELLED' ||
      isUnderReview ||
      isMinFailed;

    let displayStatus = t.status || 'OPEN';

    if (isTimePassed && t.status === 'OPEN') {
      displayStatus = isMinFailed
        ? 'MIN NOT REACHED'
        : 'REGISTRATION CLOSED';
    } else if (t.status === 'OPEN') {
      displayStatus = isMinReached
        ? 'MATCH CONFIRMED'
        : 'OPEN FOR PLAYERS';
    }

    return {
      isFree,
      bookedCount,
      maxSlots,
      minSlots,
      isMinReached,
      fillPercentage,
      spotsLeft,
      activePrizes,
      totalPrizePool,
      isClosed,
      displayStatus,
      countdown: formatCountdown(t.registration_closing_time),
    };
  };

  const openTournamentCount = latestTournaments.filter((t) => {
    const { isClosed } = getTournamentStats(t);
    return !isClosed;
  }).length;

  const totalFeaturedPlayers = latestTournaments.reduce(
    (sum, t) => sum + (t.registrations?.length || 0),
    0
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050608] font-sans text-white selection:bg-orange-500 selection:text-white">
      {/* HERO */}
      <section className="relative isolate min-h-[78vh] overflow-hidden border-b border-white/[0.06] md:min-h-[82vh]">
        {heroImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-[1200ms] ease-out ${
              index === currentSlide
                ? 'scale-105 opacity-45'
                : 'scale-100 opacity-0'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
            aria-hidden="true"
          />
        ))}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.25)_0%,rgba(5,6,8,0.55)_45%,#050608_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(5,6,8,0.72)_80%)]" />

        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-6xl flex-col items-center justify-center px-5 pb-14 pt-28 text-center md:min-h-[82vh] md:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-400 backdrop-blur-md sm:text-xs">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
            Daily BGMI Tournaments
          </div>

          <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-8xl">
            Play.
            <span className="text-zinc-400"> Compete.</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
              Win.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-sm font-medium leading-7 text-zinc-300 sm:text-base md:text-lg">
            Find your next BGMI match, secure your slot, compete with
            other players and track your tournament journey from one
            place.
          </p>

          <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/tournaments"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-black shadow-[0_12px_35px_rgba(249,115,22,0.22)] transition-all hover:-translate-y-0.5 hover:bg-orange-400 sm:text-sm"
            >
              <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
              Find a Tournament
            </Link>

            <Link
              href="/how-to-play"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.1] sm:text-sm"
            >
              How It Works
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleInstallApp}
              disabled={!deferredInstallPrompt || isAppInstalled}
              aria-label={isAppInstalled ? 'BGMI Arena is installed' : 'Install BGMI Arena app'}
              title={
                isAppInstalled
                  ? 'BGMI Arena is already installed'
                  : deferredInstallPrompt
                    ? 'Install BGMI Arena'
                    : 'Install option appears when your browser supports PWA installation'
              }
              className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl border px-4 transition-all sm:px-3 ${
                isAppInstalled
                  ? 'cursor-default border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : deferredInstallPrompt
                    ? 'border-orange-500/25 bg-orange-500/10 text-orange-300 hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/15'
                    : 'cursor-not-allowed border-white/10 bg-white/[0.04] text-zinc-600'
              }`}
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">
                {isAppInstalled ? 'Installed' : 'Install App'}
              </span>
            </button>
          </div>

          {/* Live data snapshot — only based on tournaments already loaded */}
          <div className="mt-10 grid w-full max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl">
            <div className="px-3 py-4 sm:px-6">
              <p className="text-lg font-black text-white sm:text-2xl">
                {latestTournaments.length}
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-zinc-500 sm:text-[10px]">
                Featured Matches
              </p>
            </div>
            <div className="border-x border-white/[0.08] px-3 py-4 sm:px-6">
              <p className="text-lg font-black text-orange-400 sm:text-2xl">
                {openTournamentCount}
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-zinc-500 sm:text-[10px]">
                Open Now
              </p>
            </div>
            <div className="px-3 py-4 sm:px-6">
              <p className="text-base font-black text-emerald-400 sm:text-2xl">
                {totalFeaturedPlayers}
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-zinc-500 sm:text-[10px]">
                Slots Filled
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Show hero slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide
                    ? 'w-8 bg-orange-500'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* LOGGED-IN PLAYER AREA */}
      {user && (
        <section className="border-b border-white/[0.06] bg-[#080a0d]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Player Dashboard
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  My Upcoming Matches
                </h2>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-orange-400"
              >
                Open Dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {myMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 text-center sm:flex-row sm:text-left">
                <div>
                  <p className="font-bold text-zinc-200">
                    You have no active upcoming matches.
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Browse the latest tournaments and secure your next slot.
                  </p>
                </div>
                <Link
                  href="/tournaments"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-orange-400"
                >
                  Browse Matches
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myMatches.map((m: any, idx: number) => {
                  const tourney = Array.isArray(m.tournaments)
                    ? m.tournaments[0]
                    : m.tournaments;

                  if (!tourney) return null;

                  return (
                    <div
                      key={idx}
                      className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.035] p-5 transition-colors hover:border-emerald-500/35"
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Slot {m.slot_number} Locked
                        </span>
                        <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                          Registered
                        </span>
                      </div>

                      <h3 className="text-lg font-black uppercase tracking-tight text-white">
                        {tourney.name}
                      </h3>

                      <div className="mt-3 flex items-start gap-2 text-xs font-medium leading-5 text-zinc-400">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>
                          {tourney.match_time
                            ? new Date(
                                tourney.match_time
                              ).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : 'Match time TBA'}
                        </span>
                      </div>

                      <Link
                        href={`/tournaments/${tourney.id}`}
                        className="mt-5 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/[0.08]"
                      >
                        View Match Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TOURNAMENTS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Live Tournament Feed
            </div>
            <h2 className="text-3xl font-black uppercase tracking-[-0.03em] sm:text-4xl md:text-5xl">
              Open & Upcoming
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-6 text-zinc-500 sm:text-sm">
              Compare entry fees, prize pools, available slots and
              registration deadlines before you join.
            </p>
          </div>

          <Link
            href="/tournaments"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:border-orange-500/30 hover:text-orange-400 sm:self-auto"
          >
            View All Tournaments
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {latestTournaments.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-zinc-700" />
            <h3 className="mt-4 text-lg font-black uppercase">
              No tournaments available
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              Check back soon for the next tournament.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {latestTournaments.map((t) => {
              const stats = getTournamentStats(t);

              const matchDate = t.match_time
                ? new Date(t.match_time).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'DATE TBA';

              const matchTime = t.match_time
                ? new Date(t.match_time).toLocaleTimeString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : 'TIME TBA';

              return (
                <article
                  key={t.id}
                  className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-[#0a0c0f] transition-all duration-300 sm:rounded-2xl ${
                    stats.isClosed
                      ? 'border-white/[0.07]'
                      : 'border-white/[0.09] hover:-translate-y-1 hover:border-orange-500/35 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]'
                  }`}
                >
                  {/* Artwork */}
                  <div className="relative h-[104px] overflow-hidden sm:h-40 lg:h-44">
                    <img
                      src={t.map_img}
                      alt={t.name}
                      className={`h-full w-full object-cover transition-transform duration-700 ${
                        stats.isClosed
                          ? 'grayscale opacity-55'
                          : 'group-hover:scale-[1.04]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] via-black/15 to-black/20" />

                    <div className="absolute left-2 top-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 sm:left-3 sm:top-3">
                      {stats.isFree && (
                        <span className="rounded-md bg-emerald-500 px-1.5 py-1 text-[6px] font-black uppercase tracking-wider text-black sm:px-2 sm:text-[8px]">
                          Free
                        </span>
                      )}
                      <span
                        className={`truncate rounded-md border px-1.5 py-1 text-[6px] font-black uppercase tracking-wider backdrop-blur-md sm:px-2 sm:text-[8px] ${
                          stats.displayStatus === 'MATCH CONFIRMED'
                            ? 'border-emerald-400/25 bg-emerald-500/90 text-black'
                            : stats.displayStatus === 'OPEN FOR PLAYERS'
                              ? 'border-orange-400/20 bg-black/65 text-orange-300'
                              : 'border-white/10 bg-black/65 text-zinc-300'
                        }`}
                      >
                        {stats.displayStatus}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 sm:bottom-3 sm:left-4 sm:right-4">
                      <h3 className="truncate text-sm font-black uppercase tracking-tight text-white sm:text-xl">
                        {t.name}
                      </h3>
                    </div>
                  </div>

                  {/* Information */}
                  <div className="flex flex-1 flex-col">
                    {/* Schedule: the player's first question */}
                    <div className="border-b border-white/[0.07] px-2.5 py-2.5 sm:px-4 sm:py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-orange-400 sm:text-[9px]">
                            Match Schedule
                          </p>
                          <p className="mt-1 truncate text-[11px] font-bold text-zinc-300 sm:text-sm">
                            {matchDate} · IST
                          </p>
                          <p className="mt-0.5 truncate text-base font-black leading-none text-white sm:text-2xl">
                            {matchTime}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[7px]">
                            Match
                          </p>
                          <p className="mt-0.5 text-[9px] font-black uppercase text-orange-300 sm:text-sm">
                            {t.type || 'MATCH'}
                          </p>
                          {t.perspective && (
                            <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[8px]">
                              {t.perspective}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Core facts: four values, each shown once */}
                    <div className="grid grid-cols-2 border-b border-white/[0.07]">
                      <div className="border-b border-white/[0.06] px-2.5 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[8px]">
                          Prize Pool
                        </p>
                        <p className="mt-1 text-sm font-black text-emerald-400 sm:text-lg">
                          ₹{stats.totalPrizePool}
                        </p>
                      </div>

                      <div className="border-b border-l border-white/[0.06] px-2.5 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[8px]">
                          1st Prize
                        </p>
                        <p className="mt-1 text-sm font-black text-amber-300 sm:text-lg">
                          ₹{stats.activePrizes[0] || 0}
                        </p>
                      </div>

                      <div className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[8px]">
                          Entry
                        </p>
                        <p
                          className={`mt-1 text-sm font-black sm:text-lg ${
                            stats.isFree ? 'text-emerald-400' : 'text-orange-400'
                          }`}
                        >
                          {stats.isFree ? 'FREE' : `₹${t.fee}`}
                        </p>
                      </div>

                      <div className="border-l border-white/[0.06] px-2.5 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-[6px] font-black uppercase tracking-widest text-zinc-600 sm:text-[8px]">
                          Slots
                        </p>
                        <p className="mt-1 text-sm font-black text-white sm:text-lg">
                          {stats.bookedCount}/{stats.maxSlots}
                        </p>
                      </div>
                    </div>

                    {/* Availability: compact, useful, not another large panel */}
                    <div className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[7px] font-black uppercase tracking-wider text-zinc-500 sm:text-[8px]">
                          {stats.isClosed ? 'Registration' : 'Closes in'}
                        </p>
                        <p
                          className={`text-[8px] font-black uppercase tracking-wider sm:text-[9px] ${
                            stats.isClosed ? 'text-red-400' : 'text-orange-400'
                          }`}
                        >
                          {stats.isClosed ? 'Closed' : stats.countdown || 'Open'}
                        </p>
                      </div>

                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08] sm:h-1.5">
                        <div
                          className={`h-full rounded-full ${
                            stats.spotsLeft === 0 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${stats.fillPercentage}%` }}
                        />
                      </div>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-[7px] font-black uppercase tracking-wider sm:text-[8px] ${
                            stats.isMinReached ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {stats.isMinReached
                            ? 'Match Confirmed'
                            : `Min ${stats.minSlots} Players`}
                        </p>
                        <p className="shrink-0 text-[7px] font-black uppercase tracking-wider text-zinc-500 sm:text-[8px]">
                          {stats.spotsLeft === 0
                            ? 'Sold Out'
                            : `${stats.spotsLeft} Spots Left`}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto grid grid-cols-2 gap-1.5 border-t border-white/[0.07] p-2.5 sm:gap-2 sm:p-3">
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] px-2 text-[7px] font-black uppercase tracking-widest text-zinc-200 transition-colors hover:bg-white/[0.08] sm:min-h-10 sm:rounded-xl sm:text-[9px]"
                      >
                        Details
                      </Link>

                      {stats.isClosed ? (
                        <button
                          disabled
                          className="min-h-9 cursor-not-allowed rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 text-[7px] font-black uppercase tracking-widest text-zinc-600 sm:min-h-10 sm:rounded-xl sm:text-[9px]"
                        >
                          Closed
                        </button>
                      ) : (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-2 text-[7px] font-black uppercase tracking-widest transition-colors sm:min-h-10 sm:rounded-xl sm:text-[9px] ${
                            stats.isFree
                              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                              : 'bg-orange-500 text-black hover:bg-orange-400'
                          }`}
                        >
                          {stats.isFree ? 'Join Free' : 'Join'}
                          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* TRUST / PRODUCT VALUE */}
      <section className="border-y border-white/[0.06] bg-[#080a0d]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Built for Competitive Play
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] sm:text-4xl">
              Clear rules. Clear matches. Clear records.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Everything important to your tournament is visible before
              you join — including entry fee, prize information, available
              slots, match timing and tournament rules.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Match Verification',
                desc: 'Tournament results can be reviewed before winnings are credited.',
                icon: ShieldCheck,
              },
              {
                title: 'Wallet Tracking',
                desc: 'Keep tournament-related balance and transactions in your player account.',
                icon: Wallet,
              },
              {
                title: 'Live Match Details',
                desc: 'See slots, timings, entry fees and registration status before joining.',
                icon: Crosshair,
              },
              {
                title: 'Match Updates',
                desc: 'Browser notifications can keep you informed about important match activity.',
                icon: BellRing,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-orange-500/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/15 bg-orange-500/[0.07] text-orange-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-sm font-black uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
            Simple Process
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            Four straightforward steps from account creation to your
            tournament result.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: 'Create Account',
              desc: 'Sign in and set up your player profile.',
            },
            {
              step: '02',
              title: 'Join Match',
              desc: 'Choose a tournament and secure your slot.',
            },
            {
              step: '03',
              title: 'Play',
              desc: 'Follow the room details and compete.',
            },
            {
              step: '04',
              title: 'Get Winnings',
              desc: 'Approved winnings are credited to your wallet.',
            },
          ].map((item, index) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
            >
              {index < 3 && (
                <div className="absolute right-[-8px] top-10 z-10 hidden text-zinc-700 lg:block">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}

              <span className="text-2xl font-black text-orange-500/80">
                {item.step}
              </span>
              <h3 className="mt-5 text-sm font-black uppercase tracking-wide">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* RULES */}
      <section className="border-t border-white/[0.06] bg-[#080a0d]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                Fair Competition
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] sm:text-4xl">
                Tournament Rules
              </h2>
            </div>

            <Link
              href="/rules"
              className="inline-flex items-center gap-2 self-start text-xs font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-orange-400 sm:self-auto"
            >
              Read Full Rules
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: 'Fair Play',
                desc: 'Hacks, cheats and prohibited third-party tools are not allowed.',
                icon: ShieldCheck,
              },
              {
                title: 'Team Ready',
                desc: 'Make sure your complete squad is ready before the match.',
                icon: Users,
              },
              {
                title: 'Be On Time',
                desc: 'Follow the published schedule and check-in requirements.',
                icon: Clock,
              },
              {
                title: 'Disconnections',
                desc: 'Individual connection issues do not automatically qualify for rematches.',
                icon: AlertTriangle,
              },
              {
                title: 'Admin Decision',
                desc: 'Tournament decisions are handled according to the published rules.',
                icon: Zap,
              },
            ].map((rule) => (
              <div
                key={rule.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <rule.icon className="h-5 w-5 text-orange-400" />
                <h3 className="mt-5 text-xs font-black uppercase tracking-wide">
                  {rule.title}
                </h3>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Need Help?
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] sm:text-4xl">
              Support & Information
            </h2>
          </div>
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-orange-400"
          >
            Help Center
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: '/help',
              title: 'Help Center',
              desc: 'Tournament, wallet, registration, result and withdrawal guidance.',
              icon: Headphones,
            },
            {
              href: '/how-to-play',
              title: 'How To Play',
              desc: 'Understand the complete process before joining your first match.',
              icon: Gamepad2,
            },
            {
              href: '/terms',
              title: 'Terms & Conditions',
              desc: 'Review tournament conditions, cancellations and player responsibilities.',
              icon: FileText,
            },
            {
              href: '/privacy',
              title: 'Privacy Policy',
              desc: 'Understand how account and transaction information is handled.',
              icon: Lock,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all hover:border-orange-500/20 hover:bg-white/[0.04]"
            >
              <item.icon className="h-5 w-5 text-orange-400" />
              <h3 className="mt-5 text-sm font-black uppercase tracking-wide group-hover:text-orange-400">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                {item.desc}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-orange-400">
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* INSTALL / PWA CTA */}
      <section className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-orange-500/[0.08] via-white/[0.02] to-transparent p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">
                Play Anywhere
              </p>
              <h2 className="mt-1 text-xl font-black uppercase sm:text-2xl">
                Install BGMI Arena
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
                Use the PWA for quick access to tournaments and important
                match updates.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-44">
            <button
              type="button"
              onClick={handleInstallApp}
              disabled={!deferredInstallPrompt || isAppInstalled}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                isAppInstalled
                  ? 'cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : deferredInstallPrompt
                    ? 'bg-orange-500 text-black hover:bg-orange-400'
                    : 'border border-white/10 bg-white/[0.05] text-zinc-500'
              }`}
            >
              <Download className="h-4 w-4" />
              {isAppInstalled
                ? 'App Installed'
                : deferredInstallPrompt
                  ? 'Install App'
                  : 'Install Available in Browser'}
            </button>

            <Link
              href="/how-to-play"
              className="inline-flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:text-orange-400"
            >
              Installation Help
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 pb-14 pt-6 sm:px-6 md:pb-20 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-orange-500/20">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('/images/hero/bgmi-cta.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d10] via-[#0b0d10]/90 to-[#0b0d10]/65" />

          <div className="relative z-10 flex flex-col items-center px-6 py-14 text-center md:px-12 md:py-16">
            <div className="mb-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">
              <Trophy className="h-4 w-4" />
              Your Next Match
            </div>

            <h2 className="max-w-3xl text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Find a tournament.
              <br />
              <span className="text-orange-400">Secure your slot.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              Browse the current tournament schedule and choose the match
              that fits your squad.
            </p>

            <Link
              href="/tournaments"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-xs font-black uppercase tracking-widest text-black shadow-[0_12px_35px_rgba(249,115,22,0.2)] transition-all hover:bg-orange-400 hover:-translate-y-0.5"
            >
              Browse Tournaments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
