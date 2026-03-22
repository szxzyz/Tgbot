import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppNotification from "@/components/AppNotification";
import { useEffect, lazy, Suspense, useState, memo, useCallback, useRef } from "react";
import { setupDeviceTracking } from "@/lib/deviceId";
import BanScreen from "@/components/BanScreen";
import CountryBlockedScreen from "@/components/CountryBlockedScreen";
import SeasonEndOverlay from "@/components/SeasonEndOverlay";
import { SeasonEndContext } from "@/lib/SeasonEndContext";
import { useAdmin } from "@/hooks/useAdmin";
import ChannelJoinPopup from "@/components/ChannelJoinPopup";

declare global {
  interface Window {
    show_10401872: (type?: string | { type: string; inAppSettings: any }) => Promise<void>;
  }
}

const Home = lazy(() => import("@/pages/Home"));
const Admin = lazy(() => import("@/pages/Admin"));
const CreateTask = lazy(() => import("@/pages/CreateTask"));
const CountryControls = lazy(() => import("@/pages/CountryControls"));
const Spotlight = lazy(() => import("@/pages/Spotlight"));
const NotFound = lazy(() => import("@/pages/not-found"));

const ACCENT = "#C6F135";

function ANXLoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "#000" }}
    >
      <div
        className="absolute w-72 h-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(198,241,53,0.06) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-8 z-10">
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(198,241,53,0.08)",
              border: "1px solid rgba(198,241,53,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 32px rgba(198,241,53,0.15)",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: ACCENT,
                letterSpacing: "-1px",
                fontFamily: "system-ui, sans-serif",
                lineHeight: 1,
              }}
            >
              A
            </span>
          </div>
          <div className="text-center">
            <h1
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
                lineHeight: 1,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              ANX
            </h1>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              Mine · Earn · Withdraw
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: ACCENT,
                opacity: 0.9,
                animation: "anxBounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes anxBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const PageLoader = memo(function PageLoader() {
  return null;
});

function Router() {
  return (
    <Suspense fallback={<ANXLoadingScreen />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/task/create" component={CreateTask} />
        <Route path="/create-task" component={CreateTask} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/country-controls" component={CountryControls} />
        <Route path="/spotlight" component={Spotlight} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const [showSeasonEnd, setShowSeasonEnd] = useState(false);
  const [seasonLockActive, setSeasonLockActive] = useState(false);
  const { isAdmin } = useAdmin();
  const inAppAdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inAppAdInitialized = useRef(false);
  const [popupAdsEnabled, setPopupAdsEnabled] = useState(true);
  const [popupAdInterval, setPopupAdInterval] = useState(60);

  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

  useEffect(() => {
    if (isDevMode) return;
    fetch("/api/app-settings")
      .then(res => res.json())
      .then(settings => {
        setPopupAdsEnabled(settings.popupAdsEnabled !== false);
        setPopupAdInterval(settings.popupAdInterval || 60);
      })
      .catch(() => {});
  }, [isDevMode]);

  useEffect(() => {
    if (isDevMode) return;
    if (inAppAdInitialized.current) return;
    if (!popupAdsEnabled) return;
    inAppAdInitialized.current = true;

    const showInAppAd = () => {
      if (typeof window.show_10401872 === 'function') {
        window.show_10401872({
          type: 'inApp',
          inAppSettings: {
            frequency: 999,
            capping: 24,
            interval: 15,
            timeout: 0,
            everyPage: false
          }
        }).catch(() => {});
      }
    };

    const intervalMs = popupAdInterval * 1000;
    const initialDelay = setTimeout(() => {
      showInAppAd();
      inAppAdIntervalRef.current = setInterval(() => {
        showInAppAd();
      }, intervalMs);
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (inAppAdIntervalRef.current) {
        clearInterval(inAppAdIntervalRef.current);
      }
    };
  }, [popupAdsEnabled, popupAdInterval]);

  useEffect(() => {
    const checkSeasonStatus = () => {
      fetch("/api/app-settings")
        .then(res => res.json())
        .then(settings => {
          if (settings.seasonBroadcastActive) {
            setSeasonLockActive(true);
            setShowSeasonEnd(true);
          } else {
            setSeasonLockActive(false);
            localStorage.removeItem("season_end_seen");
          }
        })
        .catch(() => {});
    };

    checkSeasonStatus();
    const interval = setInterval(checkSeasonStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCloseSeasonEnd = () => {
    if (!seasonLockActive) {
      localStorage.setItem("season_end_seen", "true");
      setShowSeasonEnd(false);
    }
  };

  const shouldShowSeasonEnd = showSeasonEnd && !isAdmin;

  return (
    <SeasonEndContext.Provider value={{ showSeasonEnd: shouldShowSeasonEnd }}>
      <AppNotification />
      {shouldShowSeasonEnd && <SeasonEndOverlay onClose={handleCloseSeasonEnd} isLocked={seasonLockActive} />}
      <Router />
    </SeasonEndContext.Provider>
  );
}

import { LanguageProvider } from "@/hooks/useLanguage";
import { showNotification } from "@/components/AppNotification";

function App() {
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string>();
  const [isCountryBlocked, setIsCountryBlocked] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [isCheckingCountry, setIsCheckingCountry] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isChannelVerified, setIsChannelVerified] = useState<boolean>(true);
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);

  const isDevMode = import.meta.env.DEV || import.meta.env.MODE === 'development';

  const checkMembership = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        headers['x-telegram-data'] = tg.initData;
      }
      const response = await fetch('/api/check-membership', { headers });
      const data = await response.json();
      if (data.success) {
        if (data.banned) {
          setIsBanned(true);
          return;
        }
        setIsChannelVerified(data.isVerified);
      }
    } catch (err) {
      console.error("Membership check error:", err);
    } finally {
      setIsCheckingMembership(false);
    }
  }, []);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  const checkCountry = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        headers['x-telegram-data'] = tg.initData;
      }
      const cachedUser = localStorage.getItem("tg_user");
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          headers['x-user-id'] = user.id.toString();
        } catch {}
      }
      const response = await fetch('/api/check-country', {
        cache: 'no-store',
        headers
      });
      const data = await response.json();
      if (data.country) {
        setUserCountryCode(data.country.toUpperCase());
      }
      if (data.blocked) {
        setIsCountryBlocked(true);
      } else {
        setIsCountryBlocked(false);
      }
    } catch (err) {
      console.error("Country check error:", err);
    } finally {
      setIsCheckingCountry(false);
    }
  }, []);

  useEffect(() => {
    checkCountry();
  }, [checkCountry]);

  useEffect(() => {
    const handleCountryBlockChange = (event: CustomEvent) => {
      const { action, countryCode } = event.detail;
      if (userCountryCode && countryCode === userCountryCode) {
        if (action === 'blocked') {
          setIsCountryBlocked(true);
        } else if (action === 'unblocked') {
          setIsCountryBlocked(false);
        }
      }
    };
    window.addEventListener('countryBlockChanged', handleCountryBlockChange as EventListener);
    return () => {
      window.removeEventListener('countryBlockChanged', handleCountryBlockChange as EventListener);
    };
  }, [userCountryCode]);

  useEffect(() => {
    if (isCheckingCountry || isCountryBlocked) {
      return;
    }

    if (isDevMode) {
      setTelegramId('dev-user-123');
      setIsAuthenticating(false);
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      if (tg.initDataUnsafe?.user) {
        localStorage.setItem("tg_user", JSON.stringify(tg.initDataUnsafe.user));
        setTelegramId(tg.initDataUnsafe.user.id.toString());
      }
      if (tg.initDataUnsafe?.start_param) {
        localStorage.setItem("tg_start_param", tg.initDataUnsafe.start_param);
      }

      const { deviceId, fingerprint } = setupDeviceTracking();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-device-id": deviceId,
        "x-device-fingerprint": JSON.stringify(fingerprint)
      };
      let body: any = {};
      let userTelegramId: string | null = null;
      const startParam = tg.initDataUnsafe?.start_param || localStorage.getItem("tg_start_param");

      if (tg.initData) {
        body = { initData: tg.initData };
        if (startParam) body.startParam = startParam;
        if (tg.initDataUnsafe?.user?.id) {
          userTelegramId = tg.initDataUnsafe.user.id.toString();
        }
      } else {
        const cachedUser = localStorage.getItem("tg_user");
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            headers["x-user-id"] = user.id.toString();
            userTelegramId = user.id.toString();
            if (startParam) body.startParam = startParam;
          } catch {}
        }
      }

      fetch("/api/auth/telegram", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
        .then(res => res.json())
        .then(data => {
          if (data.referralProcessed) {
            localStorage.removeItem("tg_start_param");
          }
          if (data.banned) {
            setIsBanned(true);
            setBanReason(data.reason);
          } else if (userTelegramId) {
            setTelegramId(userTelegramId);
          }
          setIsAuthenticating(false);
        })
        .catch(() => {
          setIsAuthenticating(false);
        });
    } else {
      setIsAuthenticating(false);
    }
  }, [isDevMode, isCheckingCountry, isCountryBlocked]);

  if (isBanned) {
    return <BanScreen reason={banReason} />;
  }

  if (isCheckingCountry || isAuthenticating || isCheckingMembership) {
    return <ANXLoadingScreen />;
  }

  if (isCountryBlocked) {
    return <CountryBlockedScreen />;
  }

  if (!telegramId && !isDevMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(198,241,53,0.08)", border: "1px solid rgba(198,241,53,0.2)" }}
          >
            <span style={{ fontSize: 28, fontWeight: 900, color: ACCENT }}>A</span>
          </div>
          <h1 className="text-xl font-black text-white mb-3 tracking-tight">Open in Telegram</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Please open this app from Telegram to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          {!isChannelVerified && (
            <Suspense fallback={null}>
              <ChannelJoinPopup
                telegramId={telegramId || ""}
                onVerified={() => {
                  setIsChannelVerified(true);
                  showNotification("Verification successful! Welcome.", "success");
                }}
              />
            </Suspense>
          )}
          <AppContent />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
