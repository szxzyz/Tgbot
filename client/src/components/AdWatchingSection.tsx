import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Play, Clock, Shield, Tv } from "lucide-react";
import { showNotification } from "@/components/AppNotification";

declare global {
  interface Window {
    show_9368336: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
  }
}

interface AdWatchingSectionProps {
  user: any;
}

export default function AdWatchingSection({ user }: AdWatchingSectionProps) {
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-eligibility"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/valid-count"] });
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
            const watchedAtLeast3Seconds = watchDuration >= 3000;
            resolve({ success: true, watchedFully: watchedAtLeast3Seconds, unavailable: false });
          })
          .catch((error) => {
            console.error('Monetag ad error:', error);
            const watchDuration = Date.now() - monetagStartTimeRef.current;
            const watchedAtLeast3Seconds = watchDuration >= 3000;
            resolve({ success: false, watchedFully: watchedAtLeast3Seconds, unavailable: false });
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
        showNotification("Claimed too fast! Watch the full ad.", "error");
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
          adsWatchedToday: (old?.adsWatchedToday || 0) + 1
        }));
        
        showNotification(`+${rewardAmount} ANX earned!`, "success");
        
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

  return (
    <div className="rounded-2xl bg-[#141414] border border-white/10 mb-3 overflow-hidden">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center flex-shrink-0">
            <Tv className="w-5 h-5 text-[#F5C542]" />
          </div>
          <div>
            <h2 className="text-white font-black text-sm leading-tight">Watch & Earn</h2>
            <p className="text-[#8E8E93] text-[11px] mt-0.5">Each ad = <span className="text-[#F5C542] font-bold">{rewardPerAd} ANX</span> instantly</p>
          </div>
        </div>

        <button
          onClick={handleStartEarning}
          disabled={isShowingAds || adsWatchedToday >= dailyLimit}
          className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: isShowingAds || adsWatchedToday >= dailyLimit
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #F5C542 0%, #f0a500 100%)',
            color: isShowingAds || adsWatchedToday >= dailyLimit ? '#888' : '#000',
            border: 'none',
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
                 currentAdStep === 'adsgram' ? 'Loading Ad...' :
                 currentAdStep === 'verifying' ? 'Verifying...' : 'Loading...'}
              </span>
            </>
          ) : adsWatchedToday >= dailyLimit ? (
            <>
              <span>Daily Limit Reached</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Watch Ad — Earn {rewardPerAd} ANX</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[#8E8E93] text-[10px] font-semibold">Ads Today</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F5C542] transition-all"
                style={{ width: `${Math.min((adsWatchedToday / dailyLimit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-white text-[10px] font-black tabular-nums">{adsWatchedToday}/{dailyLimit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
