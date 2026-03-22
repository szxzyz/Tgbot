import { useQuery } from "@tanstack/react-query";
import { Loader2, Copy, Share2, Users, Zap, X } from "lucide-react";
import { showNotification } from "@/components/AppNotification";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const ACCENT = "#C6F135";

interface ReferralItem {
  name: string;
  totalSatsEarned: number;
  isActive: boolean;
}

interface InvitePopupProps {
  onClose: () => void;
}

export default function InvitePopup({ onClose }: InvitePopupProps) {
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"], staleTime: 60000 });
  const { data: referralData, isLoading } = useQuery<{ referrals: ReferralItem[] }>({
    queryKey: ["/api/referrals/list"],
    staleTime: 30000,
  });
  const { data: botInfo } = useQuery<{ username: string }>({
    queryKey: ["/api/bot-info"],
    staleTime: 3600000,
  });

  const botUsername = botInfo?.username || "bot";
  const referralLink = user?.referralCode
    ? `https://t.me/${botUsername}?start=${user.referralCode}`
    : "";

  const referrals = referralData?.referrals || [];
  const totalFriends = referrals.length;
  const totalIncome = referrals.reduce((sum, r) => sum + (r.totalSatsEarned || 0), 0);

  const handleShare = () => {
    if (!referralLink) return;
    const tg = (window as any).Telegram?.WebApp;
    const text = "Join ANX — earn crypto by watching ads! 🚀";
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, "_blank");
  };

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showNotification("Link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {/* Full-screen sheet slides up from bottom */}
      <motion.div
        className="fixed inset-0 z-[201] overflow-hidden flex flex-col"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{
          background: "#0d0d0d",
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle + close */}
        <div className="flex justify-center pt-3 pb-1 relative flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "#2a2a2a" }} />
          <button
            onClick={onClose}
            className="absolute right-4 top-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors active:bg-white/10"
            style={{ background: '#1a1a1a' }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-8">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-white font-black text-base">Invite & Earn</h2>
              <p className="text-xs mt-0.5" style={{ color: "#444" }}>
                Get <span style={{ color: ACCENT }}>10%</span> of every ANX your friends earn
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-2 mb-4">
              <div
                className="flex-1 rounded-xl px-3 py-3 flex items-center gap-2"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}
              >
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                <div>
                  <p className="text-white font-black text-lg leading-none">{totalFriends}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#333" }}>Friends</p>
                </div>
              </div>
              <div
                className="flex-1 rounded-xl px-3 py-3 flex items-center gap-2"
                style={{ background: "#111", border: "1px solid #1a1a1a" }}
              >
                <Zap className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                <div>
                  <p className="font-black text-lg leading-none tabular-nums" style={{ color: ACCENT }}>
                    {totalIncome > 999 ? `${(totalIncome / 1000).toFixed(1)}K` : totalIncome}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#333" }}>ANX earned</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleShare}
                disabled={!referralLink}
                className="flex-1 h-11 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
                style={{ background: ACCENT, boxShadow: `0 0 16px rgba(198,241,53,0.2)` }}
              >
                <Share2 className="w-4 h-4" />
                Invite Friends
              </button>
              <button
                onClick={handleCopy}
                disabled={!referralLink}
                className="h-11 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
                style={{
                  background: "#111",
                  border: `1px solid ${copied ? ACCENT + "50" : "#1a1a1a"}`,
                  color: copied ? ACCENT : "#555",
                }}
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Referral link display */}
            {referralLink && (
              <div
                className="rounded-xl px-3 py-2.5 mb-4 flex items-center gap-2"
                style={{ background: "#080808", border: "1px solid #111" }}
              >
                <p className="text-[10px] text-gray-600 font-mono flex-1 truncate">{referralLink}</p>
              </div>
            )}

            {/* Friends list */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: ACCENT }} />
              </div>
            ) : referrals.length === 0 ? (
              <div
                className="rounded-xl py-8 flex flex-col items-center gap-1.5 text-center"
                style={{ background: "#080808", border: "1px dashed #1a1a1a" }}
              >
                <Users className="w-6 h-6" style={{ color: '#1a1a1a' }} />
                <p className="text-white/20 text-xs font-semibold">No friends yet</p>
                <p className="text-[10px]" style={{ color: "#1e1e1e" }}>Tap Invite to share</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#2a2a2a" }}>
                  Your Friends
                </p>
                <div className="space-y-1.5">
                  {referrals.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                      style={{
                        background: r.isActive ? "rgba(198,241,53,0.04)" : "#080808",
                        border: `1px solid ${r.isActive ? "rgba(198,241,53,0.1)" : "#111"}`,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                          style={{
                            background: r.isActive ? "rgba(198,241,53,0.1)" : "#111",
                            color: r.isActive ? ACCENT : "#333",
                          }}
                        >
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{r.name}</p>
                          <p className="text-[9px]" style={{ color: r.isActive ? ACCENT : "#2a2a2a" }}>
                            {r.isActive ? "● Active" : "○ Inactive"}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-black tabular-nums" style={{ color: r.isActive ? ACCENT : "#333" }}>
                        +{r.totalSatsEarned.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
