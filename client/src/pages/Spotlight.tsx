import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Home } from "lucide-react";
import WithdrawalPopup from "@/components/WithdrawalPopup";
import InvitePopup from "@/components/InvitePopup";
import { useAuth } from "@/hooks/useAuth";

const ACCENT = "#C6F135";

function TrophyIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs"
      style={{ background: '#111', color: '#555' }}
    >
      {rank}
    </div>
  );
}

function SpotlightNavIcon({ active }: { active?: boolean }) {
  const color = active ? ACCENT : "#666";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill={active ? color : 'none'} />
    </svg>
  );
}

function FriendsNavIcon({ active }: { active?: boolean }) {
  const color = active ? ACCENT : "#666";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.7" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19 10v6M22 13h-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WithdrawNavIcon({ active }: { active?: boolean }) {
  const color = active ? ACCENT : "#666";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke={color} strokeWidth="1.7" />
      <path d="M2 10h20" stroke={color} strokeWidth="1.7" />
      <circle cx="7" cy="15" r="1.5" fill={color} />
      <path d="M15 15h4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function Spotlight() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data, isLoading } = useQuery<{ success: boolean; users: any[] }>({
    queryKey: ["/api/spotlight"],
    queryFn: async () => {
      const res = await fetch("/api/spotlight");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const users = data?.users || [];

  const balance = Math.floor(parseFloat((user as any)?.balance || "0"));

  return (
    <Layout>
      {/* Header */}
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}
      >
        <div className="max-w-md mx-auto px-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors active:bg-white/10"
            style={{ background: 'rgba(22,22,24,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Home className="w-4 h-4" style={{ color: '#aaa' }} />
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '7px 14px 7px 10px',
              borderRadius: '999px',
              background: 'rgba(22,22,24,0.88)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(198,241,53,0.1)', border: '1px solid rgba(198,241,53,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 900, color: '#C6F135', letterSpacing: '-0.5px', lineHeight: 1 }}>A</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', lineHeight: 1 }}>ANX Balance</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>{balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-16 pb-24" style={{ background: '#000', minHeight: '100vh' }}>
        {/* Title */}
        <div className="flex flex-col items-center mb-6 mt-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(198,241,53,0.08)', border: '1px solid rgba(198,241,53,0.15)' }}
          >
            <span style={{ fontSize: 24 }}>⭐</span>
          </div>
          <h1 className="text-white font-black text-2xl tracking-tight">Spotlight</h1>
          <p className="text-sm mt-1" style={{ color: '#444' }}>Top ANX earners this season</p>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
          </div>
        ) : users.length === 0 ? (
          <div
            className="rounded-2xl py-12 flex flex-col items-center gap-2 text-center"
            style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}
          >
            <p className="text-white/20 text-sm font-semibold">No data yet</p>
            <p className="text-xs" style={{ color: '#1a1a1a' }}>Be the first to earn ANX!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => {
              const rank = i + 1;
              const isTop3 = rank <= 3;
              const displayName = u.firstName || u.username || `User ${rank}`;
              const username = u.username ? `@${u.username}` : '';
              const adsWatched = u.adsWatched || 0;
              const earnedANX = Math.floor(parseFloat(u.balance || '0'));

              return (
                <div
                  key={u.id || i}
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                  style={{
                    background: isTop3 ? 'rgba(198,241,53,0.04)' : '#0d0d0d',
                    border: `1px solid ${isTop3 ? 'rgba(198,241,53,0.12)' : '#1a1a1a'}`,
                  }}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-9 flex items-center justify-center">
                    <TrophyIcon rank={rank} />
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{
                      background: isTop3 ? 'rgba(198,241,53,0.1)' : '#111',
                      color: isTop3 ? ACCENT : '#444',
                      border: `1px solid ${isTop3 ? 'rgba(198,241,53,0.2)' : '#1a1a1a'}`,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{displayName}</p>
                    {username && (
                      <p className="text-[10px] truncate" style={{ color: '#333' }}>{username}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black tabular-nums" style={{ color: isTop3 ? ACCENT : '#888' }}>
                      {adsWatched.toLocaleString()} <span className="text-[10px] font-medium" style={{ color: '#444' }}>ads</span>
                    </p>
                    <p className="text-[10px] tabular-nums" style={{ color: '#333' }}>
                      {earnedANX.toLocaleString()} ANX
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Motivational note */}
        <div
          className="mt-5 rounded-2xl px-4 py-4 text-center"
          style={{ background: '#080808', border: '1px dashed #1a1a1a' }}
        >
          <p className="text-xs font-semibold" style={{ color: '#333' }}>
            Watch ads every day to climb the leaderboard 🚀
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(6,6,6,0.97)',
          borderTop: '1px solid #1a1a1a',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-md mx-auto flex">
          {/* Friends */}
          <button
            onClick={() => setInviteOpen(true)}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5"
          >
            <FriendsNavIcon />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#666' }}>Friends</span>
          </button>

          {/* Withdraw */}
          <button
            onClick={() => setWithdrawOpen(true)}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-1 relative transition-colors active:bg-white/5"
          >
            <div
              className="absolute -top-3 w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: '#0a0a0a',
                border: `2px solid ${ACCENT}`,
                boxShadow: `0 0 16px rgba(198,241,53,0.35), 0 -4px 20px rgba(198,241,53,0.1)`,
              }}
            >
              <WithdrawNavIcon active />
            </div>
            <div className="h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>Withdraw</span>
          </button>

          {/* Spotlight (active) */}
          <button
            onClick={() => {}}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5"
          >
            <SpotlightNavIcon active />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>Spotlight</span>
          </button>
        </div>
      </div>

      {inviteOpen && <InvitePopup onClose={() => setInviteOpen(false)} />}
      <WithdrawalPopup
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        tonBalance={balance}
      />
    </Layout>
  );
}
