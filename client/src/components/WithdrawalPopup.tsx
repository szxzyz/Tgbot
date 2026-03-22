import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { showNotification } from "@/components/AppNotification";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#C6F135";
const ACCENT_DIM = "rgba(198,241,53,0.10)";
const ACCENT_GLOW = "0 0 24px rgba(198,241,53,0.30)";

interface WithdrawalPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tonBalance: number;
}

export default function WithdrawalPopup({ open, onOpenChange, tonBalance }: WithdrawalPopupProps) {
  const queryClient = useQueryClient();
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: appSettings } = useQuery<any>({
    queryKey: ["/api/app-settings"],
    staleTime: 30000,
  });

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    staleTime: 0,
  });

  const anxBalance = Math.floor(parseFloat(user?.balance || "0"));
  const minWithdraw = appSettings?.minimum_withdrawal_sat ? parseFloat(appSettings.minimum_withdrawal_sat) : 20;
  const networkFee = appSettings?.withdrawal_fee_sat ? parseFloat(appSettings.withdrawal_fee_sat) : 10;

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdrawals", {
        address: withdrawAddress,
        amount: parseFloat(withdrawAmount).toString(),
        method: "ANX",
      });
      return res.json();
    },
    onSuccess: () => {
      showNotification("Withdrawal request submitted successfully", "success");
      onOpenChange(false);
      setWithdrawAddress("");
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
    },
    onError: (error: any) => {
      let message = "Withdrawal failed";
      try {
        if (typeof error.message === "string") {
          const trimmed = error.message.trim();
          if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            const parsed = JSON.parse(trimmed);
            if (parsed.message) message = parsed.message;
          } else {
            message = error.message;
          }
        }
      } catch (e) {
        message = error.message;
      }
      showNotification(message, "error");
    },
  });

  const handleWithdrawClick = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < minWithdraw) {
      showNotification(`Minimum withdrawal amount is ${minWithdraw} ANX`, "error");
      return;
    }
    if (amount > anxBalance) {
      showNotification(`Insufficient balance. Available: ${anxBalance} ANX`, "error");
      return;
    }
    if (!withdrawAddress.trim()) {
      showNotification("Please enter your destination address", "error");
      return;
    }
    if (!withdrawAddress.trim().endsWith("@speed.app")) {
      showNotification("Address must end with @speed.app", "error");
      return;
    }
    withdrawMutation.mutate();
  };

  const amount = parseFloat(withdrawAmount) || 0;
  const toReceive = Math.max(0, amount - networkFee);

  const setPercent = (pct: number) => {
    const val = Math.floor(anxBalance * pct);
    setWithdrawAmount(val.toString());
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#080808",
              borderTop: "1px solid #1e1e1e",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full" style={{ background: "#252525" }} />
            </div>

            {/* Balance Hero */}
            <div className="px-4 pt-5 pb-0">
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
              >
                {/* glow */}
                <div
                  className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full"
                  style={{ background: "rgba(198,241,53,0.07)", filter: "blur(24px)" }}
                />
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#3a3a3a" }}>
                  Your Balance
                </p>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-white font-black tabular-nums" style={{ fontSize: "38px", lineHeight: 1 }}>
                    {anxBalance.toLocaleString()}
                  </span>
                  <span className="font-black text-base mb-1" style={{ color: ACCENT }}>ANX</span>
                </div>
                {/* Rate pill */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background: ACCENT_DIM, border: "1px solid rgba(198,241,53,0.15)" }}
                >
                  <span className="text-[10px] font-bold" style={{ color: "#666" }}>1,000,000 ANX</span>
                  <span className="text-[10px]" style={{ color: "#333" }}>→</span>
                  <span className="text-[10px] font-black" style={{ color: ACCENT }}>1 TON</span>
                </div>
              </div>
            </div>

            <div className="px-4 pt-5 pb-8 space-y-4">

              {/* Quick amount selector */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: "#3a3a3a" }}>
                  Amount
                </p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPercent(pct / 100)}
                      className="h-9 rounded-xl text-xs font-black transition-all active:scale-95"
                      style={{
                        background: withdrawAmount === String(Math.floor(anxBalance * pct / 100))
                          ? ACCENT_DIM
                          : "#0f0f0f",
                        border: withdrawAmount === String(Math.floor(anxBalance * pct / 100))
                          ? "1px solid rgba(198,241,53,0.3)"
                          : "1px solid #1a1a1a",
                        color: withdrawAmount === String(Math.floor(anxBalance * pct / 100))
                          ? ACCENT
                          : "#555",
                      }}
                    >
                      {pct === 100 ? "MAX" : `${pct}%`}
                    </button>
                  ))}
                </div>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${withdrawAmount ? "rgba(198,241,53,0.25)" : "#1a1a1a"}`, background: "#0f0f0f" }}
                >
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 h-12 px-4 bg-transparent text-white font-bold text-sm outline-none tabular-nums"
                    style={{ color: "#fff" }}
                  />
                  <span className="pr-4 font-black text-sm" style={{ color: ACCENT }}>ANX</span>
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#3a3a3a" }}>
                    Withdraw To
                  </p>
                  <a
                    href="https://links.speed.app/referral?referral_code=CH265L"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold transition-opacity hover:opacity-70"
                    style={{ color: ACCENT }}
                    onClick={(e) => {
                      if ((window as any).Telegram?.WebApp) {
                        e.preventDefault();
                        (window as any).Telegram.WebApp.openLink("https://links.speed.app/referral?referral_code=CH265L");
                      }
                    }}
                  >
                    Get speed.app address →
                  </a>
                </div>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${withdrawAddress ? "rgba(198,241,53,0.25)" : "#1a1a1a"}`, background: "#0f0f0f" }}
                >
                  <div className="pl-4 pr-2 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={withdrawAddress ? ACCENT : "#333"} />
                    </svg>
                  </div>
                  <input
                    placeholder="yourname@speed.app"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="flex-1 h-12 pr-4 bg-transparent text-sm font-medium outline-none"
                    style={{ color: "#fff" }}
                  />
                </div>
              </div>

              {/* Receipt summary */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #1a1a1a" }}
              >
                <div className="px-4 py-3 flex justify-between items-center" style={{ background: "#0d0d0d" }}>
                  <span className="text-xs" style={{ color: "#444" }}>You send</span>
                  <span className="text-xs font-bold text-white tabular-nums">{amount > 0 ? amount.toLocaleString() : "—"} ANX</span>
                </div>
                <div className="h-px" style={{ background: "#111" }} />
                <div className="px-4 py-3 flex justify-between items-center" style={{ background: "#0d0d0d" }}>
                  <span className="text-xs" style={{ color: "#444" }}>Network fee</span>
                  <span className="text-xs font-bold text-white">− {networkFee} ANX</span>
                </div>
                <div className="h-px" style={{ background: "#111" }} />
                <div className="px-4 py-3 flex justify-between items-center" style={{ background: "#0d0d0d" }}>
                  <span className="text-xs" style={{ color: "#444" }}>Min. withdrawal</span>
                  <span className="text-xs font-bold text-white">{minWithdraw} ANX</span>
                </div>
                <div
                  className="px-4 py-4 flex justify-between items-center"
                  style={{ background: ACCENT_DIM, borderTop: "1px solid rgba(198,241,53,0.12)" }}
                >
                  <span className="text-sm font-black" style={{ color: "rgba(198,241,53,0.6)" }}>You receive</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: ACCENT }}>
                    {toReceive > 0 ? toReceive.toLocaleString() : "0"} <span className="text-sm">ANX</span>
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleWithdrawClick}
                disabled={withdrawMutation.isPending}
                className="w-full rounded-2xl font-black text-sm uppercase tracking-widest text-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  height: "54px",
                  background: ACCENT,
                  boxShadow: withdrawMutation.isPending ? "none" : ACCENT_GLOW,
                }}
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v14M5 9l7 7 7-7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 20h18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Withdraw ANX
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full text-center text-[11px] font-bold uppercase tracking-widest py-1 transition-opacity hover:opacity-60"
                style={{ color: "#2a2a2a" }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
