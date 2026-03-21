import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Play, Clock, Shield } from "lucide-react";
import { showNotification } from "@/components/AppNotification";

declare global {
  interface Window {
    show_9368336: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
  }
}

const ACCENT = "#C6F135";

interface AdWatchingSectionProps {
  user: any;
  onReward?: (amount: number) => void;
}

export default function AdWatchingSection({ user, onReward }: AdWatchingSectionProps) {
  const queryClient = useQueryClient();
  const [isShowingAds, setIsShowingAds] = useState(false);
  const [currentAdStep, setCurrentAdStep] = useState<'idle' | 'monetag' | 'adsgram' | 'verifying'>('idle');
  const sessionRewardedRef = useRef(false);
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
    onSuccess: async (data: any) => {
      // Directly update balance from backend response — reliable and instant
      if (data?.newBalance !== undefined) {
        queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
          ...old,
          balance: String(data.newBalance),
          adsWatchedToday: data.adsWatchedToday ?? ((old?.adsWatchedToday || 0) + 1),
          adsWatched: (old?.adsWatched || 0) + 1,
        }));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
    },
    onError: (error: any) => {
      sessionRewardedRef.current = false;
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (error.status === 429) {
        const limit = error.limit || appSettings?.dailyAdLimit || 50;
        showNotification(`Daily ad limit reached (${limit} ads/day)`, "error");
      } else if (error.status === 401 || error.status === 403) {
        showNotification("Authentication error. Please refresh the page.", "error");
      } else if (error.message) {
        showNotification(`Error: ${error.message}`, "error");
      } else {
        showNotification("Network error. Check your connection and try again.", "error");
      }
    },
  });

  const showMonetagAd = (): Promise<{ success: boolean; watchedFully: boolean; unavailable: boolean }> => {
    return new Promise((resolve) => {
      if (typeof window.show_9368336 === 'function') {
        monetagStartTimeRef.current = Date.now();
        window.show_9368336()
          .then(() => {
            const watchDuration = Date.now() - monetagStartTimeRef.current;
            resolve({ success: true, watchedFully: watchDuration >= 3000, unavailable: false });
          })
          .catch((error) => {
            console.error('Monetag ad error:', error);
            const watchDuration = Date.now() - monetagStartTimeRef.current;
            resolve({ success: false, watchedFully: watchDuration >= 3000, unavailable: false });
          });
      } else {
        resolve({ success: false, watchedFully: false, unavailable: true });
      }
    });
  };

  const handleStartEarning = async () => {
    if (isShowingAds) return;
    setIsShowingAds(true);
    sessionRewardedRef.current = false;

    try {
      setCurrentAdStep('monetag');
      const monetagResult = await showMonetagAd();

      if (monetagResult.unavailable) {
        showNotification("Ad not available. Please open in Telegram app.", "error");
        return;
      }
      if (!monetagResult.watchedFully) {
        showNotification("Watch the full ad to earn ANX.", "error");
        return;
      }
      if (!monetagResult.success) {
        showNotification("Ad failed. Please try again.", "error");
        return;
      }

      setCurrentAdStep('verifying');
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!sessionRewardedRef.current) {
        sessionRewardedRef.current = true;
        const rewardAmount = appSettings?.rewardPerAd || 2;

        queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
          ...old,
          balance: String(parseFloat(old?.balance || '0') + rewardAmount),
          adsWatchedToday: (old?.adsWatchedToday || 0) + 1,
          adsWatched: (old?.adsWatched || 0) + 1,
        }));

        onReward?.(rewardAmount);
        showNotification(`+${rewardAmount} ANX added!`, "success");
        watchAdMutation.mutate('monetag');
      }
    } catch (error) {
      console.error('Ad watching error:', error);
      showNotification("Error playing ad. Try again.", "error");
    } finally {
      setCurrentAdStep('idle');
      setIsShowingAds(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  };

  const adsWatchedToday = user?.adsWatchedToday || 0;
  const dailyLimit = appSettings?.dailyAdLimit || 50;
  const rewardPerAd = appSettings?.rewardPerAd || 2;
  const limitReached = adsWatchedToday >= dailyLimit;

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
      <div className="px-4 pt-4 pb-4">
        <div className="mb-4">
          <h2 className="text-white font-black text-base leading-tight mb-0.5">Viewing ads</h2>
          <p className="text-[12px]" style={{ color: '#8E8E93' }}>
            Get ANX for watching commercials
          </p>
        </div>

        <button
          onClick={handleStartEarning}
          disabled={isShowingAds || limitReached}
          className="w-full h-13 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 mb-3"
          style={{
            height: '52px',
            background: isShowingAds || limitReached ? 'rgba(255,255,255,0.05)' : ACCENT,
            color: isShowingAds || limitReached ? '#888' : '#000',
            border: 'none',
            boxShadow: !isShowingAds && !limitReached ? `0 0 16px rgba(198,241,53,0.25)` : 'none',
          }}
          data-testid="button-watch-ad"
        >
          {isShowingAds ? (
            <>
              {currentAdStep === 'verifying' ? (
                <Shield size={16} className="animate-pulse text-green-400" />
              ) : (
                <Clock size={16} className="animate-spin" />
              )}
              <span>
                {currentAdStep === 'monetag' ? 'Playing Ad...' :
                  currentAdStep === 'verifying' ? 'Verifying...' : 'Loading...'}
              </span>
            </>
          ) : limitReached ? (
            <span>Daily Limit Reached</span>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Start watching</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold" style={{ color: '#555' }}>
            Limit <span style={{ color: '#888' }}>{adsWatchedToday}/{dailyLimit}</span>
          </span>
          <span className="text-[11px] font-semibold" style={{ color: '#555' }}>
            <span style={{ color: ACCENT }}>{rewardPerAd} ANX</span> per ad
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: '#111' }}>
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.min((adsWatchedToday / dailyLimit) * 100, 100)}%`,
            background: limitReached ? '#555' : ACCENT,
          }}
        />
      </div>
    </div>
  );
}
