import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Shield, CheckCircle } from "lucide-react";
import { showNotification } from "@/components/AppNotification";

declare global {
  interface Window {
    show_9368336: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
  }
}

const ACCENT = "#00E676";

interface AdWatchingSectionProps {
  user: any;
  onReward?: (amount: number) => void;
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

type AdStep = 'idle' | 'playing' | 'crediting' | 'credited';

export default function AdWatchingSection({ user, onReward }: AdWatchingSectionProps) {
  const queryClient = useQueryClient();
  const [adStep, setAdStep] = useState<AdStep>('idle');
  const [lastReward, setLastReward] = useState<number>(0);
  const isProcessingRef = useRef(false);
  const monetagStartTimeRef = useRef<number>(0);

  const { data: appSettings } = useQuery({
    queryKey: ["/api/app-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/app-settings");
      return response.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const watchAdMutation = useMutation({
    mutationFn: async (adType: string) => {
      const response = await apiRequest("POST", "/api/ads/watch", { adType });
      if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, ...error };
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      // Use ONLY server-returned reward value — never derive from client state
      const reward = typeof data.rewardAXN === 'number'
        ? data.rewardAXN
        : parseInt(String(data.rewardAXN ?? '0'), 10);
      setLastReward(reward);
      setAdStep('credited');

      // Update cache strictly from server values — no local arithmetic
      queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
        ...old,
        balance: data.newBalance !== undefined ? String(data.newBalance) : old?.balance,
        adsWatchedToday: data.adsWatchedToday !== undefined
          ? data.adsWatchedToday
          : (old?.adsWatchedToday || 0) + 1,
        adsWatched: (old?.adsWatched || 0) + 1,
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });

      showNotification(`+${reward} ANX added!`, "success");
      onReward?.(reward);

      setTimeout(() => {
        setAdStep('idle');
        isProcessingRef.current = false;
      }, 2000);
    },
    onError: (error: any) => {
      isProcessingRef.current = false;
      setAdStep('idle');
      if (error.status === 429) {
        const limit = error.limit || appSettings?.dailyAdLimit || 50;
        showNotification(`Daily limit reached (${limit}/day)`, "error");
      } else if (error.status === 401 || error.status === 403) {
        showNotification("Auth error. Please refresh.", "error");
      } else if (error.message) {
        showNotification(`Error: ${error.message}`, "error");
      } else {
        showNotification("Network error. Try again.", "error");
      }
    },
  });

  const showMonetagAd = useCallback((): Promise<{ watched: boolean; unavailable: boolean }> => {
    return new Promise((resolve) => {
      if (typeof window.show_9368336 !== 'function') {
        resolve({ watched: false, unavailable: true });
        return;
      }
      monetagStartTimeRef.current = Date.now();
      window.show_9368336()
        .then(() => {
          resolve({ watched: true, unavailable: false });
        })
        .catch(() => {
          const duration = Date.now() - monetagStartTimeRef.current;
          resolve({ watched: duration >= 3000, unavailable: false });
        });
    });
  }, []);

  const handleStartEarning = useCallback(async () => {
    // Guard: only one processing at a time
    if (isProcessingRef.current) return;
    if (adStep !== 'idle') return;
    isProcessingRef.current = true;
    setAdStep('playing');

    try {
      const result = await showMonetagAd();

      if (result.unavailable) {
        showNotification("Open in Telegram app to watch ads.", "error");
        setAdStep('idle');
        isProcessingRef.current = false;
        return;
      }
      if (!result.watched) {
        showNotification("Watch the full ad to earn ANX.", "error");
        setAdStep('idle');
        isProcessingRef.current = false;
        return;
      }

      setAdStep('crediting');
      watchAdMutation.mutate('monetag');
    } catch {
      showNotification("Error playing ad. Try again.", "error");
      setAdStep('idle');
      isProcessingRef.current = false;
    }
  }, [adStep, showMonetagAd, watchAdMutation]);

  const adsWatchedToday = user?.adsWatchedToday || 0;
  const dailyLimit = appSettings?.dailyAdLimit || 50;
  const rewardPerAd = appSettings?.rewardPerAd || 2;
  const limitReached = adsWatchedToday >= dailyLimit;
  const progress = Math.min((adsWatchedToday / dailyLimit) * 100, 100);
  const isActive = adStep !== 'idle';

  const buttonLabel = () => {
    switch (adStep) {
      case 'playing': return 'Playing Ad...';
      case 'crediting': return 'Crediting reward...';
      case 'credited': return `+${lastReward} ANX added`;
      default: return limitReached ? 'Daily Limit Reached' : 'Start watching';
    }
  };

  const buttonIcon = () => {
    switch (adStep) {
      case 'playing': return <Clock size={15} className="animate-spin" />;
      case 'crediting': return <Shield size={15} className="animate-pulse text-green-400" />;
      case 'credited': return <CheckCircle size={15} className="text-green-400" />;
      default: return !limitReached ? <PlayIcon /> : null;
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        background: '#181818',
        border: '1px solid #252525',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      <div className="px-4 pt-4 pb-4">
        <div className="text-center mb-4">
          <h2 className="text-white font-black text-base leading-tight mb-1">Viewing ads</h2>
          <p className="text-[12px]" style={{ color: '#6b6b6b' }}>
            Get ANX for watching commercials
          </p>
        </div>

        {/* Full-width pill — Ember style */}
        <div className="mb-4">
          <button
            onClick={handleStartEarning}
            disabled={isActive || limitReached}
            className="w-full font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            style={{
              height: '52px',
              borderRadius: '999px',
              fontSize: '13px',
              letterSpacing: '0.08em',
              background: adStep === 'credited'
                ? 'rgba(0,230,118,0.12)'
                : isActive || limitReached
                  ? 'rgba(255,255,255,0.05)'
                  : ACCENT,
              color: adStep === 'credited'
                ? ACCENT
                : isActive || limitReached
                  ? '#555'
                  : '#000',
              border: adStep === 'credited' ? `1px solid rgba(0,230,118,0.3)` : 'none',
              boxShadow: !isActive && !limitReached
                ? `0 0 32px rgba(0,230,118,0.4), 0 4px 16px rgba(0,0,0,0.5)`
                : 'none',
            }}
            data-testid="button-watch-ad"
          >
            {buttonIcon()}
            <span>{buttonLabel()}</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold" style={{ color: '#555' }}>
            Limit <span style={{ color: '#888' }}>{adsWatchedToday}/{dailyLimit}</span>
          </span>
          <span className="text-[11px] font-semibold" style={{ color: '#555' }}>
            <span style={{ color: ACCENT }}>{rewardPerAd} ANX</span> per ad
          </span>
        </div>
      </div>

      <div className="h-1 w-full" style={{ background: '#111' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: limitReached ? '#555' : ACCENT,
          }}
        />
      </div>
    </div>
  );
}
