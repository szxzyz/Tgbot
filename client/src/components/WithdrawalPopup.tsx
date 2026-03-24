import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { showNotification } from "@/components/AppNotification";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#00E676";

interface WithdrawalPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tonBalance: number;
}

export default function WithdrawalPopup({ open, onOpenChange }: WithdrawalPopupProps) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const { data: appSettings } = useQuery<any>({ queryKey: ["/api/app-settings"], staleTime: 30000 });
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"], staleTime: 0 });

  const anxBalance = Math.floor(parseFloat(user?.balance || "0"));
  const minWithdraw = appSettings?.minimum_withdrawal_sat ? parseFloat(appSettings.minimum_withdrawal_sat) : 20;
  const networkFee = appSettings?.withdrawal_fee_sat ? parseFloat(appSettings.withdrawal_fee_sat) : 10;

  // ANX → TON rate: 1,000,000 ANX = 1 TON
  const ANX_PER_TON = 1_000_000;
  const anxAmt = parseFloat(amount) || 0;
  const afterFee = Math.max(0, anxAmt - networkFee);
  const tonToReceive = afterFee > 0 ? (afterFee / ANX_PER_TON).toFixed(4) : "0";

  const setPercent = (pct: number) => {
    setAmount(String(Math.floor(anxBalance * pct)));
  };

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdrawals", {
        address,
        amount: anxAmt.toString(),
        method: "TON",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Withdrawal failed");
      return data;
    },
    onSuccess: () => {
      showNotification("Withdrawal request submitted!", "success");
      onOpenChange(false);
      setAddress("");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
    },
    onError: (error: any) => {
      showNotification(error.message || "Withdrawal failed", "error");
    },
  });

  const handleSubmit = () => {
    if (!amount || isNaN(anxAmt) || anxAmt < minWithdraw) {
      showNotification(`Minimum withdrawal is ${minWithdraw.toLocaleString()} ANX`, "error");
      return;
    }
    if (anxAmt > anxBalance) {
      showNotification("Insufficient balance", "error");
      return;
    }
    if (!address.trim()) {
      showNotification("Enter your TON wallet address", "error");
      return;
    }
    withdrawMutation.mutate();
  };

  const close = () => onOpenChange(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={close}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full rounded-t-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderBottom: "none" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full" style={{ background: "#2a2a2a" }} />
            </div>

            <div className="px-4 pt-3 pb-8 space-y-4">

              {/* Header + balance */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-black text-base">Withdraw</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: "#444" }}>
                    Paid in <span style={{ color: ACCENT }}>TON</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg tabular-nums">{anxBalance.toLocaleString()}</p>
                  <p className="text-[10px]" style={{ color: "#444" }}>ANX available</p>
                </div>
              </div>

              {/* Rate pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl self-start w-full justify-center"
                style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.12)" }}
              >
                <span className="text-[11px] font-bold" style={{ color: "#555" }}>1,000,000 ANX</span>
                <span className="text-[11px]" style={{ color: "#2a2a2a" }}>→</span>
                <span className="text-[11px] font-black" style={{ color: ACCENT }}>1 TON</span>
              </div>

              {/* Amount */}
              <div>
                <div className="flex gap-1.5 mb-2">
                  {[25, 50, 75, 100].map(pct => {
                    const val = String(Math.floor(anxBalance * pct / 100));
                    const active = amount === val;
                    return (
                      <button
                        key={pct}
                        onClick={() => setPercent(pct / 100)}
                        className="flex-1 h-8 rounded-lg text-xs font-black transition-all active:scale-95"
                        style={{
                          background: active ? "rgba(0,230,118,0.1)" : "#111",
                          border: `1px solid ${active ? "rgba(0,230,118,0.3)" : "#1a1a1a"}`,
                          color: active ? ACCENT : "#444",
                        }}
                      >
                        {pct === 100 ? "MAX" : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{
                    border: `1px solid ${amount ? "rgba(0,230,118,0.2)" : "#1a1a1a"}`,
                    background: "#111",
                  }}
                >
                  <input
                    type="number"
                    placeholder="Amount in ANX"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 h-11 px-4 bg-transparent text-white font-bold text-sm outline-none"
                  />
                  <span className="pr-4 font-black text-xs" style={{ color: ACCENT }}>ANX</span>
                </div>
              </div>

              {/* TON Address */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#2a2a2a" }}>
                  TON Wallet Address
                </p>
                <div
                  className="flex items-center rounded-xl overflow-hidden"
                  style={{
                    border: `1px solid ${address ? "rgba(0,230,118,0.2)" : "#1a1a1a"}`,
                    background: "#111",
                  }}
                >
                  <input
                    placeholder="UQ... or EQ..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="flex-1 h-11 px-4 bg-transparent text-sm font-medium outline-none text-white"
                  />
                </div>
              </div>

              {/* Summary */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #1a1a1a" }}
              >
                <div className="flex justify-between items-center px-4 py-2.5" style={{ background: "#111" }}>
                  <span className="text-xs" style={{ color: "#3a3a3a" }}>Network fee</span>
                  <span className="text-xs font-bold" style={{ color: "#555" }}>−{networkFee.toLocaleString()} ANX</span>
                </div>
                <div className="h-px" style={{ background: "#1a1a1a" }} />
                <div className="flex justify-between items-center px-4 py-3" style={{ background: "#0d0d0d" }}>
                  <span className="text-xs font-black text-white">You receive</span>
                  <span className="font-black text-base tabular-nums" style={{ color: ACCENT }}>
                    {tonToReceive} TON
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={withdrawMutation.isPending}
                className="w-full h-12 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{ background: ACCENT, boxShadow: "0 0 20px rgba(0,230,118,0.25)" }}
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Withdraw TON"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
