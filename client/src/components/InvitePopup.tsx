import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { showNotification } from "@/components/AppNotification";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#C6F135";
const ACCENT_DIM = "rgba(198,241,53,0.10)";
const ACCENT_GLOW = "0 0 24px rgba(198,241,53,0.35)";

interface ReferralItem {
  refereeId: string;
  name: string;
  username?: string;
  totalSatsEarned: number;
  referralStatus: string;
  isActive: boolean;
}

interface InvitePopupProps {
  onClose: () => void;
}

export default function InvitePopup({ onClose }: InvitePopupProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 60000,
  });

  const { data: referralData, isLoading: referralsLoading } = useQuery<{ referrals: ReferralItem[] }>({
    queryKey: ["/api/referrals/list"],
    retry: false,
    staleTime: 30000,
  });

  const { data: botInfo } = useQuery<{ username: string }>({
    queryKey: ["/api/bot-info"],
    staleTime: 60 * 60 * 1000,
  });

  const botUsername = botInfo?.username || "bot";
  const referralLink = user?.referralCode
    ? `https://t.me/${botUsername}?start=${user.referralCode}`
    : "";

  const referrals = referralData?.referrals || [];
  const totalFriends = referrals.length;
  const totalIncome = referrals.reduce((sum, r) => sum + (r.totalSatsEarned || 0), 0);

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showNotification("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!referralLink || isSharing) return;
    setIsSharing(true);
    try {
      const tgWebApp = (window as any).Telegram?.WebApp;
      const shareTitle = "💰 Earn ANX by watching ads! Join me and earn real crypto.";
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareTitle)}`;
      if (tgWebApp?.openTelegramLink) tgWebApp.openTelegramLink(shareUrl);
      else window.open(shareUrl, "_blank");
    } catch {}
    setIsSharing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{
            maxHeight: "90vh",
            overflowY: "auto",
            background: "#080808",
            borderTop: "1px solid #1e1e1e",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "#252525" }} />
          </div>

          {/* Hero Header */}
          <div
            className="mx-4 mt-5 mb-5 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden"
            style={{ background: ACCENT_DIM, border: "1px solid rgba(198,241,53,0.15)" }}
          >
            {/* glow blob */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
              style={{ background: "rgba(198,241,53,0.08)", filter: "blur(32px)" }}
            />
            {/* Big % badge */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 relative"
              style={{ background: "rgba(198,241,53,0.12)", border: "1px solid rgba(198,241,53,0.25)", boxShadow: ACCENT_GLOW }}
            >
              <span className="font-black text-2xl" style={{ color: ACCENT }}>10%</span>
            </div>
            <h2 className="text-white font-black text-xl leading-tight mb-1">
              Invite Friends & Earn
            </h2>
            <p className="text-sm leading-snug" style={{ color: "#666" }}>
              Get <span style={{ color: ACCENT }} className="font-bold">10%</span> of every referral's ad earnings — forever
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 px-4 mb-5">
            <div
              className="flex-1 rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
                Friends
              </span>
              <span className="text-white font-black text-3xl tabular-nums leading-none">{totalFriends}</span>
              <span className="text-[10px]" style={{ color: "#444" }}>invited</span>
            </div>
            <div
              className="flex-1 rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
                Income
              </span>
              <span className="font-black text-3xl tabular-nums leading-none" style={{ color: ACCENT }}>
                {totalIncome.toLocaleString()}
              </span>
              <span className="text-[10px]" style={{ color: "#444" }}>ANX earned</span>
            </div>
          </div>

          {/* Invite link block */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4"
              style={{ background: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#3a3a3a" }}>
                Your Referral Link
              </p>
              <div
                className="rounded-xl px-3 py-2.5 text-xs font-mono break-all mb-3"
                style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", color: "#555" }}
              >
                {referralLink || "Generating link..."}
              </div>

              {/* Share button — full width, primary */}
              <button
                onClick={shareLink}
                disabled={!referralLink || isSharing}
                className="w-full h-12 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 mb-2.5 transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: ACCENT, boxShadow: ACCENT_GLOW }}
              >
                {isSharing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                    <polyline points="16 6 12 2 8 6" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="2" x2="12" y2="15" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                )}
                {isSharing ? "Sharing..." : "Share Invite Link"}
              </button>

              {/* Copy button — secondary */}
              <button
                onClick={copyLink}
                disabled={!referralLink}
                className="w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: "#161616", border: "1px solid #222", color: copied ? ACCENT : "#666" }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="#666" strokeWidth="1.8" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#666" strokeWidth="1.8" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Friends list */}
          <div className="px-4 pb-8">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#3a3a3a" }}>
              Friends
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: ACCENT_DIM, color: ACCENT }}
              >
                {totalFriends}
              </span>
            </p>

            {referralsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin" style={{ color: ACCENT }} />
              </div>
            ) : referrals.length === 0 ? (
              <div
                className="rounded-2xl py-10 flex flex-col items-center gap-2 text-center"
                style={{ background: "#0d0d0d", border: "1px dashed #1e1e1e" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                  style={{ background: ACCENT_DIM }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="7" r="4" stroke={ACCENT} strokeWidth="1.8" />
                    <path d="M2 21c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M19 11v6M22 14h-6" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm font-semibold">No friends yet</p>
                <p className="text-[11px]" style={{ color: "#333" }}>Share your link above to start earning</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{
                      background: r.isActive ? "rgba(198,241,53,0.06)" : "#0d0d0d",
                      border: `1px solid ${r.isActive ? "rgba(198,241,53,0.18)" : "#1a1a1a"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{
                          background: r.isActive ? "rgba(198,241,53,0.15)" : "#181818",
                          color: r.isActive ? ACCENT : "#444",
                        }}
                      >
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{r.name}</p>
                        <div
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5"
                          style={{
                            background: r.isActive ? "rgba(198,241,53,0.12)" : "#161616",
                            color: r.isActive ? ACCENT : "#444",
                          }}
                        >
                          {r.isActive ? "● Active" : "○ Inactive"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-sm tabular-nums">
                        {r.totalSatsEarned.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold" style={{ color: ACCENT }}>ANX</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
