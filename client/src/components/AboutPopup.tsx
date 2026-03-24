import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const ACCENT = "#00E676";
const ACCENT_DIM = "rgba(0,230,118,0.10)";

interface AboutPopupProps {
  onClose: () => void;
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={ACCENT} strokeWidth="1.7" />
        <path d="M10 9.5l5 2.5-5 2.5V9.5z" fill={ACCENT} />
      </svg>
    ),
    title: "Watch & Earn",
    desc: "Earn ANX tokens by watching short ads. Every view is instantly credited to your balance.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.5" stroke={ACCENT} strokeWidth="1.7" />
        <path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M19 10v6M22 13h-6" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Invite & Grow",
    desc: "Earn 10% of every ANX your referrals earn — forever. Build your network and multiply rewards.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke={ACCENT} strokeWidth="1.7" />
        <path d="M2 10h20" stroke={ACCENT} strokeWidth="1.7" />
        <circle cx="7" cy="15" r="1.5" fill={ACCENT} />
        <path d="M15 15h4" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    title: "Instant Withdrawals",
    desc: "Withdraw your earned ANX anytime. Fast, secure, and transparent payouts.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={ACCENT} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Secure & Verified",
    desc: "Built on Telegram's trusted platform. Your identity and earnings are fully protected.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="3" stroke={ACCENT} strokeWidth="1.7" />
        <path d="M3 9h18" stroke={ACCENT} strokeWidth="1.7" />
        <path d="M8 2v4M16 2v4" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="14" r="1.5" fill={ACCENT} />
      </svg>
    ),
    title: "Daily Rewards",
    desc: "Claim your daily login bonus every 24 hours. Maintain streaks to stay ahead.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={ACCENT} strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
    title: "Creator Contest",
    desc: "Make content about ANX and earn up to 10,000,000 ANX per viral video.",
  },
];

const stats = [
  { value: "250+", label: "Ads / Day" },
  { value: "10%", label: "Referral Cut" },
  { value: "24/7", label: "Uptime" },
];

export default function AboutPopup({ onClose }: AboutPopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 flex flex-col"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          style={{ background: "#000" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 pt-14 pb-4 flex-shrink-0"
            style={{ borderBottom: "1px solid #111" }}
          >
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-white font-black text-base">About ANX</h1>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-5 space-y-4">

              {/* Hero card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="relative rounded-2xl overflow-hidden p-5"
                style={{ background: ACCENT_DIM, border: "1px solid rgba(0,230,118,0.18)" }}
              >
                <motion.div
                  className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
                  style={{ background: "rgba(0,230,118,0.07)", filter: "blur(24px)" }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
                  style={{ background: "rgba(0,230,118,0.05)", filter: "blur(20px)" }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
                <div className="relative z-10 flex items-center gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      border: `2px solid ${ACCENT}40`,
                      background: "rgba(0,230,118,0.08)",
                      boxShadow: `0 0 24px rgba(0,230,118,0.2)`,
                    }}
                    animate={{ boxShadow: ["0 0 16px rgba(0,230,118,0.15)", "0 0 32px rgba(0,230,118,0.35)", "0 0 16px rgba(0,230,118,0.15)"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img src="/btc-icon.jpg" alt="ANX" className="w-full h-full object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                    <span className="text-xl font-black absolute" style={{ color: ACCENT }}>A</span>
                  </motion.div>
                  <div>
                    <h2 className="text-white font-black text-xl tracking-widest">ANX</h2>
                    <p className="text-xs mt-0.5 font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>
                      Watch · Earn · Withdraw
                    </p>
                    <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "#444" }}>
                      The next-generation Watch-to-Earn platform built on Telegram.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="grid grid-cols-3 gap-2"
              >
                {stats.map(({ value, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18 + i * 0.06 }}
                    className="rounded-xl py-3 flex flex-col items-center justify-center"
                    style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
                  >
                    <span className="text-lg font-black tabular-nums" style={{ color: ACCENT }}>{value}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#333" }}>{label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Mission */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-2xl p-4"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#333" }}>Our Mission</p>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  ANX is built to democratize digital earnings. Watch short ads, earn ANX tokens instantly, and grow your income by inviting friends — all inside Telegram, with no complexity.
                </p>
              </motion.div>

              {/* Features */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2.5 px-0.5" style={{ color: "#333" }}>Features</p>
                <div className="space-y-2">
                  {features.map(({ icon, title, desc }, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.26 + i * 0.06 }}
                      className="rounded-xl p-3.5 flex items-start gap-3"
                      style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: ACCENT_DIM, border: "1px solid rgba(0,230,118,0.12)" }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{title}</p>
                        <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "#555" }}>{desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Community */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,136,204,0.1)", border: "1px solid rgba(0,136,204,0.2)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Telegram Channel</p>
                    <p className="text-[10px]" style={{ color: "#444" }}>Updates, news & announcements</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const tg = (window as any).Telegram?.WebApp;
                    const url = "https://t.me/LightningSatoshi";
                    if (tg?.openTelegramLink) tg.openTelegramLink(url);
                    else window.open(url, "_blank");
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-black"
                  style={{ background: "rgba(0,136,204,0.12)", color: "#0088cc", border: "1px solid rgba(0,136,204,0.2)" }}
                >
                  Join
                </button>
              </motion.div>

              {/* Version */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="text-center pb-4"
              >
                <p className="text-[10px] font-semibold" style={{ color: "#222" }}>ANX App · Version 1.0</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#1a1a1a" }}>© 2025 ANX. All rights reserved.</p>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
