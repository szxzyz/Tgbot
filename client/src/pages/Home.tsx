import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { showNotification } from "@/components/AppNotification";
import { Zap, Play, Lock, Bookmark, BookmarkCheck, User, TrendingUp, Shield, Search, Loader2, Film, SatelliteDish } from "lucide-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    show_10401872: (type?: any) => Promise<void>;
    show_10013974: (type?: any) => Promise<void>;
    Adsgram: {
      init: (config: { blockId: string }) => { show: () => Promise<void> };
    };
  }
}

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  priceInSats: number;
  views: number;
  likesCount: number;
  commentsCount: number;
  isUnlocked: boolean;
  isSaved: boolean;
  createdAt: string;
}

interface UserData {
  id?: string;
  balance?: string;
  username?: string;
  firstName?: string;
  adsWatchedToday?: number;
  [key: string]: any;
}

function VideoCard({ video, onClick }: { video: VideoItem; onClick: () => void }) {
  const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative w-full bg-[#111] rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a]">
            <Film className="w-10 h-10 text-white/20" />
          </div>
        )}

        {/* Price badge / Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {video.isUnlocked ? (
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center border border-[#F5C542]/40">
                <Lock className="w-5 h-5 text-[#F5C542]" />
              </div>
              {video.priceInSats > 0 && (
                <span className="bg-[#F5C542] text-black text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {video.priceInSats.toLocaleString()} SAT
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">{video.title}</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/40 text-xs">{formatViews(video.views)} views</span>
          {video.likesCount > 0 && <span className="text-white/40 text-xs">· {video.likesCount} likes</span>}
          {video.commentsCount > 0 && <span className="text-white/40 text-xs">· {video.commentsCount} comments</span>}
        </div>
      </div>
    </motion.div>
  );
}

function EarnSatsPanel({ user, onEarned }: { user: UserData; onEarned: () => void }) {
  const [loadingAd, setLoadingAd] = useState(false);
  const queryClient = useQueryClient();
  const { data: appSettings } = useQuery<any>({ queryKey: ['/api/app-settings'], retry: false });

  const watchAdMutation = useMutation({
    mutationFn: async (adType: string) => {
      const res = await fetch('/api/ads/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adType }),
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, ...data };
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/user'], (old: any) => ({
        ...old,
        balance: data.newBalance,
        adsWatchedToday: data.adsWatchedToday,
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      const reward = Math.round(data.rewardAXN || 1000);
      showNotification(`+${reward.toLocaleString()} SAT earned!`, 'success');
      onEarned();
    },
    onError: (error: any) => {
      if (error.status === 429) {
        showNotification(`Daily ad limit reached (${error.limit || 50} ads/day)`, 'error');
      } else {
        showNotification(error.message || 'Failed to claim reward', 'error');
      }
    },
    onSettled: () => {
      setLoadingAd(false);
    },
  });

  const handleWatchAd = useCallback(async (providerId: string) => {
    if (loadingAd) return;
    setLoadingAd(true);
    const startTime = Date.now();

    const onComplete = () => {
      if (Date.now() - startTime < 3000) {
        showNotification('Ad watched too fast!', 'error');
        setLoadingAd(false);
        return;
      }
      watchAdMutation.mutate(providerId);
    };

    const onError = () => {
      showNotification('Ad failed to load. Try again.', 'error');
      setLoadingAd(false);
    };

    try {
      if (providerId === 'monetag') {
        if (typeof window.show_10013974 === 'function') {
          window.show_10013974().then(onComplete).catch(onError);
        } else if (typeof window.show_10401872 === 'function') {
          window.show_10401872().then(onComplete).catch(onError);
        } else {
          onError();
        }
      } else if (providerId === 'adsgram') {
        if (window.Adsgram) {
          window.Adsgram.init({ blockId: 'int-20373' }).show().then(onComplete).catch(onError);
        } else {
          onError();
        }
      } else {
        onError();
      }
    } catch {
      onError();
    }
  }, [loadingAd, watchAdMutation]);

  const balance = Math.floor(parseFloat(user.balance || '0'));
  const adsToday = user.adsWatchedToday || 0;
  const dailyLimit = appSettings?.dailyAdLimit || 50;

  return (
    <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F5C542]/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#F5C542]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Earn SAT</p>
            <p className="text-white/40 text-xs">Watch ads to earn Sats</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#F5C542] font-bold">{balance.toLocaleString()}</p>
          <p className="text-white/40 text-xs">SAT balance</p>
        </div>
      </div>

      {/* Ad buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleWatchAd('monetag')}
          disabled={loadingAd || adsToday >= dailyLimit}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5C542]/10 border border-[#F5C542]/20 text-[#F5C542] text-sm font-medium disabled:opacity-40 hover:bg-[#F5C542]/20 transition-all active:scale-95"
        >
          {loadingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Watch Ad</span>
        </button>
        <button
          onClick={() => handleWatchAd('adsgram')}
          disabled={loadingAd || adsToday >= dailyLimit}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium disabled:opacity-40 hover:bg-white/8 transition-all active:scale-95"
        >
          {loadingAd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>Bonus Ad</span>
        </button>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>Daily ads: {adsToday}/{dailyLimit}</span>
          <span>{Math.round((adsToday / dailyLimit) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F5C542] rounded-full transition-all"
            style={{ width: `${Math.min(100, (adsToday / dailyLimit) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'feed' | 'earn' | 'saved'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: videosData, isLoading: videosLoading, refetch: refetchVideos } = useQuery<{
    success: boolean;
    videos: VideoItem[];
  }>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const res = await fetch('/api/videos', { credentials: 'include' });
      return res.json();
    },
    retry: false,
  });

  const { data: savedData, isLoading: savedLoading } = useQuery<{
    success: boolean;
    videos: VideoItem[];
  }>({
    queryKey: ['/api/user/saved-videos'],
    queryFn: async () => {
      const res = await fetch('/api/user/saved-videos', { credentials: 'include' });
      return res.json();
    },
    enabled: activeTab === 'saved',
    retry: false,
  });

  const typedUser = user as UserData;
  const balance = Math.floor(parseFloat(typedUser?.balance || '0'));
  const displayName = typedUser?.firstName || typedUser?.username || 'User';

  const allVideos = videosData?.videos || [];
  const filteredVideos = searchQuery
    ? allVideos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allVideos;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F5C542] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center">
                <SatelliteDish className="w-4 h-4 text-[#F5C542]" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">SatsTV</h1>
                <p className="text-white/40 text-[10px]">Watch & Earn</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#F5C542]/10 border border-[#F5C542]/20 rounded-full px-3 py-1.5">
              <Zap className="w-3 h-3 text-[#F5C542]" />
              <span className="text-[#F5C542] text-xs font-bold">{balance.toLocaleString()} SAT</span>
            </div>
          </div>

          {/* Search bar - only on feed tab */}
          {activeTab === 'feed' && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-white/20"
              />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1">
            {(['feed', 'earn', 'saved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-[#F5C542] text-black'
                    : 'bg-white/5 text-white/50 hover:bg-white/8'
                }`}
              >
                {tab === 'feed' ? '🎬 Feed' : tab === 'earn' ? '⚡ Earn' : '🔖 Saved'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <>
            {videosLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-[#F5C542] animate-spin" />
                <p className="text-white/40 text-sm">Loading videos...</p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <Film className="w-10 h-10 text-white/20" />
                </div>
                <div className="text-center">
                  <p className="text-white/60 font-medium">
                    {searchQuery ? 'No videos found' : 'No videos yet'}
                  </p>
                  <p className="text-white/30 text-sm mt-1">
                    {searchQuery ? 'Try a different search term' : 'Check back later for new content'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => setLocation(`/video/${video.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* EARN TAB */}
        {activeTab === 'earn' && (
          <div>
            <EarnSatsPanel
              user={typedUser}
              onEarned={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
              }}
            />

            {/* How it works */}
            <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F5C542]" />
                How it works
              </h3>
              <div className="space-y-4">
                {[
                  { step: '1', icon: '⚡', title: 'Watch Ads', desc: 'Earn SAT by watching short ads' },
                  { step: '2', icon: '🎬', title: 'Browse Videos', desc: 'Find premium videos you want to watch' },
                  { step: '3', icon: '🔓', title: 'Unlock & Watch', desc: 'Use your SAT to unlock premium content' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/20 flex items-center justify-center flex-shrink-0 text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Balance</p>
                <p className="text-[#F5C542] font-bold text-xl">{balance.toLocaleString()}</p>
                <p className="text-white/40 text-xs">SAT</p>
              </div>
              <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Ads Today</p>
                <p className="text-white font-bold text-xl">{typedUser?.adsWatchedToday || 0}</p>
                <p className="text-white/40 text-xs">watched</p>
              </div>
            </div>
          </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#F5C542] animate-spin" />
              </div>
            ) : (savedData?.videos || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <Bookmark className="w-10 h-10 text-white/20" />
                </div>
                <div className="text-center">
                  <p className="text-white/60 font-medium">No saved videos</p>
                  <p className="text-white/30 text-sm mt-1">Bookmark videos to watch them later</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {(savedData?.videos || []).map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => setLocation(`/video/${video.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-white/5 px-6 py-3 flex items-center justify-around">
        <button
          onClick={() => setLocation('/profile')}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-[#F5C542]' : 'text-white/40 hover:text-white/70'}`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px]">Videos</span>
        </button>
        <button
          onClick={() => setActiveTab('earn')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'earn' ? 'text-[#F5C542]' : 'text-white/40 hover:text-white/70'}`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px]">Earn</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'saved' ? 'text-[#F5C542]' : 'text-white/40 hover:text-white/70'}`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">Saved</span>
        </button>
        <button
          onClick={() => setLocation('/admin')}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px]">Admin</span>
        </button>
      </div>
    </div>
  );
}
