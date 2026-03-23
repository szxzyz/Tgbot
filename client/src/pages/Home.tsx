import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Header from "@/components/Header";
import AdWatchingSection from "@/components/AdWatchingSection";
import BottomNav from "@/components/BottomNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdFlow } from "@/hooks/useAdFlow";
import { useLocation } from "wouter";
import { SettingsPopup } from "@/components/SettingsPopup";
import AboutPopup from "@/components/AboutPopup";
import { useLanguage } from "@/hooks/useLanguage";
import { Check, Loader2, CalendarCheck, Users, Send, ExternalLink, Rocket, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showNotification } from "@/components/AppNotification";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import WithdrawalPopup from "@/components/WithdrawalPopup";
import MenuPopup from "@/components/MenuPopup";

const ACCENT = "#C6F135";
const ACCENT_DIM = "rgba(198,241,53,0.10)";
const ACCENT_GLOW = "0 0 16px rgba(198,241,53,0.35)";

interface UnifiedTask {
  id: string;
  type: 'advertiser';
  taskType: string;
  title: string;
  link: string | null;
  rewardAXN: number;
  rewardBUG?: number;
  rewardType: string;
  isAdminTask: boolean;
  isAdvertiserTask?: boolean;
  priority: number;
}

declare global {
  interface Window {
    show_9368336: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
    show_10401872: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
    Adsgram: {
      init: (config: { blockId: string }) => { show: () => Promise<void> };
    };
    showGiga: (placement: string) => Promise<void>;
  }
}

interface User {
  id?: string;
  telegramId?: string;
  balance?: string;
  tonBalance?: string;
  bugBalance?: string;
  lastStreakDate?: string;
  username?: string;
  firstName?: string;
  telegramUsername?: string;
  referralCode?: string;
  adsWatched?: number;
  adsWatchedToday?: number;
  dailyEarnings?: string;
  currentStreak?: number;
  createdAt?: string;
  [key: string]: any;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_DAY_JS = [1, 2, 3, 4, 5, 6, 0];

function getDayStatus(displayIdx: number, todayDisplayIdx: number, currentStreak: number, hasClaimed: boolean) {
  if (displayIdx === todayDisplayIdx) return hasClaimed ? 'claimed' : 'today';
  if (displayIdx < todayDisplayIdx) {
    const daysPast = todayDisplayIdx - displayIdx;
    return daysPast <= (currentStreak - (hasClaimed ? 1 : 0)) ? 'claimed' : 'unclaimed';
  }
  return 'future';
}

function AdsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke={ACCENT} strokeWidth="1.6" />
      <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill={ACCENT} />
      <path d="M2 9h2M20 9h2" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function EarningsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M12 7v1.5M12 15.5V17M9.5 14.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-1.5-1.5-2-2.5-2.5S9.5 11 9.5 9.5C9.5 8.12 10.62 7 12 7s2.5 1.12 2.5 2.5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DaysIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M3 9h18" stroke={ACCENT} strokeWidth="1.8" />
      <path d="M8 2v4M16 2v4" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="14" r="1.5" fill={ACCENT} />
    </svg>
  );
}

function DefaultAvatar() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="18" r="8" fill={ACCENT} opacity="0.8" />
      <path d="M6 42c0-8.84 7.16-16 16-16s16 7.16 16 16" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [withdrawPopupOpen, setWithdrawPopupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [boosterPopupOpen, setBoosterPopupOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [clickedTasks, setClickedTasks] = useState<Set<string>>(new Set());
  const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string>("");
  const [shareWithFriendsStep, setShareWithFriendsStep] = useState<'idle' | 'sharing' | 'countdown' | 'ready' | 'claiming'>('idle');
  const [dailyCheckinStep, setDailyCheckinStep] = useState<'idle' | 'ads' | 'countdown' | 'ready' | 'claiming'>('idle');
  const [checkForUpdatesStep, setCheckForUpdatesStep] = useState<'idle' | 'opened' | 'countdown' | 'ready' | 'claiming'>('idle');
  const [checkForUpdatesCountdown, setCheckForUpdatesCountdown] = useState(3);

  const { data: appSettings } = useQuery<any>({ queryKey: ['/api/app-settings'], retry: false });
  const { data: missionStatus } = useQuery<any>({ queryKey: ['/api/missions/status'], retry: false });
  const { data: unifiedTasksData } = useQuery<{ success: boolean; tasks: UnifiedTask[]; completedTaskIds: string[]; referralCode?: string }>({
    queryKey: ['/api/tasks/home/unified'],
    queryFn: async () => {
      const res = await fetch('/api/tasks/home/unified', { credentials: 'include' });
      if (!res.ok) return { success: true, tasks: [], completedTaskIds: [] };
      return res.json();
    },
    retry: false,
  });
  const { data: userStats } = useQuery<{ todayEarnings: string; totalEarnings: string }>({
    queryKey: ['/api/user/stats'],
    retry: false,
    refetchInterval: 30000,
  });

  useQuery({
    queryKey: ['/api/referrals/list'],
    staleTime: 60000,
    retry: false,
  });

  const { runAdFlow } = useAdFlow();

  useEffect(() => {
    if (unifiedTasksData?.completedTaskIds) {
      setCompletedTasks(new Set(unifiedTasksData.completedTaskIds));
    }
  }, [unifiedTasksData]);

  useEffect(() => {
    const checkClaimed = () => {
      const typedUser = user as User;
      if (typedUser?.lastStreakDate) {
        const lastClaim = new Date(typedUser.lastStreakDate);
        const todayUTC = new Date().toISOString().split('T')[0];
        const lastClaimUTC = lastClaim.toISOString().split('T')[0];
        if (lastClaimUTC === todayUTC) {
          setHasClaimed(true);
          setTimeUntilNextClaim("Come back tomorrow");
          return;
        }
      }
      setHasClaimed(false);
      setTimeUntilNextClaim("Available");
    };
    checkClaimed();
  }, [(user as User)?.lastStreakDate, (user as User)?.id]);

  useEffect(() => {
    if (checkForUpdatesStep === 'countdown' && checkForUpdatesCountdown > 0) {
      const timer = setTimeout(() => setCheckForUpdatesCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (checkForUpdatesStep === 'countdown' && checkForUpdatesCountdown === 0) {
      setCheckForUpdatesStep('ready');
    }
  }, [checkForUpdatesStep, checkForUpdatesCountdown]);

  const showMonetagRewardedAd = (): Promise<{ success: boolean; unavailable: boolean }> => {
    return new Promise((resolve) => {
      if (typeof window.show_10401872 === 'function') {
        window.show_10401872()
          .then(() => resolve({ success: true, unavailable: false }))
          .catch(() => resolve({ success: false, unavailable: false }));
      } else {
        resolve({ success: false, unavailable: true });
      }
    });
  };

  const claimStreakMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/streak/claim");
      if (!response.ok) {
        const error = await response.json();
        const errorObj = new Error(error.message || 'Failed to claim streak');
        (errorObj as any).alreadyClaimedToday = error.alreadyClaimedToday === true;
        throw errorObj;
      }
      return response.json();
    },
    onSuccess: (data) => {
      setHasClaimed(true);
      const rewardAmount = parseFloat(data.rewardEarned || '0');
      const earned = rewardAmount > 0 ? Math.round(rewardAmount) : 10;
      queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
        ...old,
        balance: String(parseFloat(old?.balance || '0') + earned),
        currentStreak: data.newStreak ?? old?.currentStreak,
        lastStreakDate: new Date().toISOString(),
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      showNotification(`+${earned} ANX daily reward claimed!`, "success");
    },
    onError: (error: any) => {
      if (error.alreadyClaimedToday) {
        setHasClaimed(true);
        showNotification("Already claimed today! Come back tomorrow.", "info");
      } else {
        showNotification(error.message || "Failed to claim streak", "error");
      }
    },
    onSettled: () => setIsClaimingStreak(false),
  });

  const handleClaimStreak = async () => {
    if (isClaimingStreak || hasClaimed) return;
    setIsClaimingStreak(true);
    try {
      const monetagResult = await showMonetagRewardedAd();
      if (monetagResult.unavailable) { claimStreakMutation.mutate(); return; }
      if (!monetagResult.success) {
        showNotification("Please watch the ad completely to claim your bonus.", "error");
        setIsClaimingStreak(false);
        return;
      }
      claimStreakMutation.mutate();
    } catch {
      showNotification("Failed to claim streak. Please try again.", "error");
      setIsClaimingStreak(false);
    }
  };

  const advertiserTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/advertiser-tasks/${taskId}/click`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to start task');
      return data;
    },
    onSuccess: (_data, taskId) => {
      setClickedTasks(prev => new Set(prev).add(taskId));
      showNotification("Task started! Click claim to earn your reward.", "info");
    },
    onError: (error: any) => showNotification(error.message || 'Failed to start task', 'error'),
  });

  const claimAdvertiserTaskMutation = useMutation({
    mutationFn: async ({ taskId, taskType, link }: { taskId: string; taskType: string; link: string | null }) => {
      if (taskType === 'channel' && link) {
        const username = link.replace('https://t.me/', '').split('?')[0];
        const currentTelegramData = (window as any).Telegram?.WebApp?.initData || '';
        const resVerify = await fetch('/api/tasks/verify/channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-telegram-data': currentTelegramData || '' },
          body: JSON.stringify({ channelId: `@${username}` }),
          credentials: 'include',
        });
        const verifyData = await resVerify.json();
        if (!resVerify.ok || !verifyData.isJoined) throw new Error('Please join the channel to complete this task.');
      }
      const res = await fetch(`/api/advertiser-tasks/${taskId}/claim`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to claim reward');
      setCompletedTasks(prev => { const next = new Set(prev); next.add(taskId); return next; });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/home/unified'] });
      const satReward = Number(data.reward ?? 0);
      showNotification(`+${satReward.toLocaleString()} ANX earned!`, 'success');
    },
    onError: (error: any) => showNotification(error.message || 'Failed to claim reward', 'error'),
  });

  const redeemPromoMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/promo-codes/redeem", { code });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid promo code");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setPromoCode("");
      setIsApplyingPromo(false);
      showNotification(data.message || "Promo applied successfully!", "success");
    },
    onError: (error: any) => {
      showNotification(error.message || "Invalid promo code", "error");
      setIsApplyingPromo(false);
    },
  });

  const shareWithFriendsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/missions/claim", { missionId: 'shareStory' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      showNotification("Rewards claimed!", "success");
      setShareWithFriendsStep('idle');
    }
  });

  const dailyCheckinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/missions/claim", { missionId: 'dailyCheckin' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      showNotification("Daily check-in successful!", "success");
      setDailyCheckinStep('idle');
    }
  });

  const checkForUpdatesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/missions/claim", { missionId: 'checkForUpdates' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/missions/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      showNotification("Rewards claimed!", "success");
      setCheckForUpdatesStep('idle');
    }
  });

  const botUsername = import.meta.env.VITE_BOT_USERNAME || 'MoneyAXNbot';
  const referralLink = user?.referralCode ? `https://t.me/${botUsername}?start=${user.referralCode}` : '';

  const handleShareWithFriends = useCallback(() => {
    if (!referralLink) return;
    const tgWebApp = (window as any).Telegram?.WebApp;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on this Watch-to-Earn app and start earning ANX together!")}`;
    if (tgWebApp?.openTelegramLink) tgWebApp.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
    setShareWithFriendsStep('ready');
  }, [referralLink]);

  const handleClaimShareWithFriends = useCallback(() => { shareWithFriendsMutation.mutate(); }, [shareWithFriendsMutation]);

  const handleDailyCheckin = useCallback(async () => {
    if (missionStatus?.dailyCheckin?.claimed || dailyCheckinStep !== 'idle') return;
    setDailyCheckinStep('ads');
    const adResult = await runAdFlow();
    if (!adResult.monetagWatched) {
      showNotification("Please watch the ads completely to claim!", "error");
      setDailyCheckinStep('idle');
      return;
    }
    setDailyCheckinStep('ready');
  }, [missionStatus?.dailyCheckin?.claimed, dailyCheckinStep, runAdFlow]);

  const handleClaimDailyCheckin = useCallback(() => {
    if (dailyCheckinMutation.isPending) return;
    setDailyCheckinStep('claiming');
    dailyCheckinMutation.mutate();
  }, [dailyCheckinMutation]);

  const handleCheckForUpdates = useCallback(() => {
    if (missionStatus?.checkForUpdates?.claimed || checkForUpdatesStep !== 'idle') return;
    const tgWebApp = (window as any).Telegram?.WebApp;
    const channelUrl = 'https://t.me/LightningSatoshi';
    if (tgWebApp?.openTelegramLink) tgWebApp.openTelegramLink(channelUrl);
    else if (tgWebApp?.openLink) tgWebApp.openLink(channelUrl);
    else window.open(channelUrl, '_blank');
    setCheckForUpdatesStep('opened');
    setCheckForUpdatesCountdown(3);
    const countdownInterval = setInterval(() => {
      setCheckForUpdatesCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownInterval); setCheckForUpdatesStep('ready'); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [missionStatus?.checkForUpdates?.claimed, checkForUpdatesStep]);

  const handleClaimCheckForUpdates = useCallback(() => {
    if (checkForUpdatesMutation.isPending) return;
    setCheckForUpdatesStep('claiming');
    checkForUpdatesMutation.mutate();
  }, [checkForUpdatesMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="text-center">
          <div className="flex gap-1.5 justify-center mb-4">
            {[0, 150, 300].map(delay => (
              <div key={delay} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: ACCENT, animationDelay: `${delay}ms` }} />
            ))}
          </div>
          <div className="text-white/40 text-sm font-medium tracking-widest uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  const typedUser = user as User;
  const totalAds = typedUser?.adsWatched || 0;
  const todayEarnings = Math.floor(parseFloat(userStats?.todayEarnings || "0"));
  const createdAt = typedUser?.createdAt ? new Date(typedUser.createdAt) : null;
  const daysActive = createdAt ? Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 1;

  const displayName = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || typedUser?.firstName || typedUser?.username || "User";
  const tgUsername = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username || typedUser?.telegramUsername || typedUser?.username || '';
  const photoUrl = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || typedUser?.profileImageUrl || null;

  const currentStreak = typedUser?.currentStreak || 0;
  const todayJSDay = new Date().getDay();
  const todayDisplayIdx = WEEK_DAY_JS.indexOf(todayJSDay);

  return (
    <Layout>
      <Header onMenuClick={() => setMenuOpen(true)} />

      <main
        className="w-full mx-auto px-4 pb-24"
        style={{
          background: '#000',
          minHeight: '100dvh',
          maxWidth: '480px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)',
        }}
      >

        {/* ── Profile Section ─────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-3 mt-0">
          {/* Avatar */}
          <div className="relative mb-2">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(${ACCENT}, transparent, ${ACCENT}80, transparent, ${ACCENT})`,
                padding: '2px',
                borderRadius: '50%',
                boxShadow: `0 0 20px rgba(198,241,53,0.4), 0 0 40px rgba(198,241,53,0.15)`,
              }}
            />
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
              style={{
                border: `2px solid ${ACCENT}`,
                background: '#111',
                boxShadow: `0 0 0 3px rgba(198,241,53,0.15), ${ACCENT_GLOW}`,
              }}
              onClick={() => { if (isAdmin) setLocation('/admin'); }}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <DefaultAvatar />
              )}
            </div>
          </div>

          {/* Name */}
          <h2 className="text-white text-base font-black tracking-tight leading-tight">{displayName}</h2>
          {tgUsername && (
            <p className="text-[11px] font-semibold leading-tight mt-0.5" style={{ color: '#555' }}>@{tgUsername}</p>
          )}
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────── */}
        <div className="flex items-center mb-4">
          {[
            { icon: <AdsIcon />, label: 'Total Ads', value: totalAds.toLocaleString() },
            { icon: <EarningsIcon />, label: 'Today', value: todayEarnings > 0 ? `${todayEarnings.toLocaleString()}` : '0' },
            { icon: <DaysIcon />, label: 'Days', value: daysActive.toString() },
          ].map(({ icon, label, value }, i) => (
            <div key={label} className="flex-1 flex items-center">
              {i > 0 && (
                <div className="w-px h-8 flex-shrink-0" style={{ background: '#1e1e1e' }} />
              )}
              <div className="flex-1 flex flex-col items-center gap-0.5 py-1">
                <div className="flex items-center gap-1.5">
                  {icon}
                  <span className="text-white text-xl font-black tabular-nums leading-none" style={{ letterSpacing: '-0.5px' }}>{value}</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#3e3e3e' }}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Daily Login Reward ────────────────────────────────────── */}
        <div className="rounded-2xl p-3.5 mb-3" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-white font-black text-sm">Daily Reward</span>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-lg tracking-wider"
              style={{ background: ACCENT_DIM, color: ACCENT, border: `1px solid rgba(198,241,53,0.2)` }}
            >
              10 ANX / day
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((day, i) => {
              const status = getDayStatus(i, todayDisplayIdx, currentStreak, hasClaimed);
              const isToday = status === 'today';
              const isClaimed = status === 'claimed';
              const isFuture = status === 'future';
              return (
                <button
                  key={day}
                  onClick={isToday && !hasClaimed ? handleClaimStreak : undefined}
                  disabled={isClaimingStreak || isFuture || isClaimed || (isToday && hasClaimed)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                  style={{
                    background: isToday
                      ? ACCENT_DIM
                      : isClaimed
                      ? 'rgba(198,241,53,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: isToday
                      ? `1.5px solid ${ACCENT}60`
                      : isClaimed
                      ? `1.5px solid rgba(198,241,53,0.15)`
                      : '1.5px solid rgba(255,255,255,0.04)',
                    boxShadow: isToday ? `0 0 10px rgba(198,241,53,0.2)` : 'none',
                  }}
                >
                  <span
                    className="text-[9px] font-black uppercase tracking-wider"
                    style={{ color: isToday ? ACCENT : isClaimed ? '#4a5a3a' : '#2e2e2e' }}
                  >
                    {day}
                  </span>
                  {isClaimed ? (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: ACCENT }}
                    >
                      <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                    </div>
                  ) : isToday ? (
                    isClaimingStreak ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: ACCENT }} />
                    ) : hasClaimed ? (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: ACCENT }}>
                        <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 6px ${ACCENT}` }} />
                    )
                  ) : (
                    <div className="w-3 h-3 rounded-full" style={{ background: '#1e1e1e' }} />
                  )}
                </button>
              );
            })}
          </div>
          {hasClaimed && (
            <p className="text-center text-[10px] mt-2" style={{ color: '#444' }}>
              Next claim: <span style={{ color: ACCENT }}>tomorrow</span>
            </p>
          )}
        </div>

        {/* ── Ad Watching Section ───────────────────────────────────── */}
        <AdWatchingSection user={user as User} onReward={() => {}} />

      </main>

      {/* ── Daily Tasks Popup ─────────────────────────────────────── */}
      {boosterPopupOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
          <div className="rounded-2xl p-6 w-full max-w-sm relative" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <CalendarCheck className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold text-white">Daily Tasks</h2>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Share with Friends */}
              <div className="flex items-center justify-between rounded-xl p-3" style={{ background: '#111' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4" style={{ color: ACCENT }} />
                    <p className="text-white text-sm font-medium">Share with Friends</p>
                  </div>
                  <p className="text-xs ml-6" style={{ color: '#555' }}>Reward: <span className="text-white font-medium">{appSettings?.referralRewardAXN || '5'} ANX</span></p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {missionStatus?.shareStory?.claimed ? (
                    <div className="h-8 w-20 rounded-lg flex items-center justify-center" style={{ background: 'rgba(198,241,53,0.1)' }}>
                      <Check className="w-4 h-4" style={{ color: ACCENT }} />
                    </div>
                  ) : shareWithFriendsStep === 'ready' || shareWithFriendsStep === 'claiming' ? (
                    <Button onClick={handleClaimShareWithFriends} disabled={shareWithFriendsMutation.isPending}
                      className="h-8 w-20 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white">
                      {shareWithFriendsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                    </Button>
                  ) : (
                    <Button onClick={handleShareWithFriends} disabled={!referralLink}
                      className="h-8 w-16 text-xs font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white">Share</Button>
                  )}
                </div>
              </div>
              {/* Daily Check-in */}
              <div className="flex items-center justify-between rounded-xl p-3" style={{ background: '#111' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarCheck className="w-4 h-4" style={{ color: ACCENT }} />
                    <p className="text-white text-sm font-medium">Daily Check-in</p>
                  </div>
                  <p className="text-xs ml-6" style={{ color: '#555' }}>Reward: <span className="text-white font-medium">{appSettings?.dailyCheckinReward || '5'} ANX</span></p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {missionStatus?.dailyCheckin?.claimed ? (
                    <div className="h-8 w-20 rounded-lg flex items-center justify-center" style={{ background: 'rgba(198,241,53,0.1)' }}><Check className="w-4 h-4" style={{ color: ACCENT }} /></div>
                  ) : dailyCheckinStep === 'ads' ? (
                    <Button disabled className="h-8 w-20 text-xs font-bold rounded-lg bg-purple-600 text-white">Watching...</Button>
                  ) : dailyCheckinStep === 'ready' || dailyCheckinStep === 'claiming' ? (
                    <Button onClick={handleClaimDailyCheckin} disabled={dailyCheckinMutation.isPending}
                      className="h-8 w-20 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white">
                      {dailyCheckinMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                    </Button>
                  ) : (
                    <Button onClick={handleDailyCheckin} className="h-8 w-20 text-xs font-bold rounded-lg text-black" style={{ background: ACCENT }}>Check-in</Button>
                  )}
                </div>
              </div>
              {/* Check for Updates */}
              <div className="flex items-center justify-between rounded-xl p-3" style={{ background: '#111' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-4 h-4" style={{ color: ACCENT }} />
                    <p className="text-white text-sm font-medium">Check for Updates</p>
                  </div>
                  <p className="text-xs ml-6" style={{ color: '#555' }}>Reward: <span className="text-white font-medium">{appSettings?.checkForUpdatesReward || '5'} ANX</span></p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {missionStatus?.checkForUpdates?.claimed ? (
                    <div className="h-8 w-20 rounded-lg flex items-center justify-center" style={{ background: 'rgba(198,241,53,0.1)' }}><Check className="w-4 h-4" style={{ color: ACCENT }} /></div>
                  ) : checkForUpdatesStep === 'opened' ? (
                    <div className="h-8 w-20 flex items-center justify-center gap-1 rounded-lg" style={{ background: '#1a1a1a', border: '1px solid rgba(198,241,53,0.2)' }}>
                      <Clock size={12} style={{ color: ACCENT }} />
                      <span className="text-white text-xs font-bold">{checkForUpdatesCountdown}s</span>
                    </div>
                  ) : checkForUpdatesStep === 'ready' || checkForUpdatesStep === 'claiming' ? (
                    <Button onClick={handleClaimCheckForUpdates} disabled={checkForUpdatesMutation.isPending}
                      className="h-8 w-20 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-white">
                      {checkForUpdatesMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                    </Button>
                  ) : (
                    <Button onClick={handleCheckForUpdates} className="h-8 w-20 text-xs font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white">Open</Button>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setBoosterPopupOpen(false)}
              className="w-full mt-6 font-bold rounded-xl border text-white"
              style={{ background: '#111', border: '1px solid #222' }}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {settingsOpen && <SettingsPopup onClose={() => setSettingsOpen(false)} />}
      {aboutOpen && <AboutPopup onClose={() => setAboutOpen(false)} />}
      {menuOpen && (
        <MenuPopup
          onClose={() => setMenuOpen(false)}
          onInviteClick={() => { setMenuOpen(false); }}
        />
      )}

      <WithdrawalPopup
        open={withdrawPopupOpen}
        onOpenChange={setWithdrawPopupOpen}
        tonBalance={Math.floor(parseFloat(typedUser?.balance || "0"))}
      />

      <BottomNav
        onWithdrawClick={() => setWithdrawPopupOpen(true)}
        onFriendsClick={() => setAboutOpen(true)}
      />
    </Layout>
  );
}
