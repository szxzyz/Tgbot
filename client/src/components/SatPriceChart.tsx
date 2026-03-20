import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";

interface PricePoint {
  t: number;
  p: number;
}

const formatTON = (usd: number) => {
  if (!usd) return "0.00";
  return usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
};

const formatTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const val: number = payload[0].value;
    const ts: number = payload[0].payload?.t;
    return (
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-[10px] shadow-2xl">
        <p className="text-white font-black">${formatTON(val)}</p>
        {ts && <p className="text-[#8E8E93] mt-0.5">{formatTime(ts)}</p>}
      </div>
    );
  }
  return null;
};

export function SatPriceChart() {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load24hData = async () => {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=TONUSDT&interval=1h&limit=24"
      );
      if (!res.ok) throw new Error("Binance klines failed");
      const klines: [number, string, string, string, string][] = await res.json();

      const points: PricePoint[] = klines.map((k) => ({
        t: k[0],
        p: parseFloat(k[4]),
      }));

      if (points.length >= 2) {
        const first = points[0].p;
        const last = points[points.length - 1].p;
        setChange24h(((last - first) / first) * 100);
        setTonPrice(last);
      }

      setHistory(points);
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const refreshPrice = async () => {
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbol=TONUSDT"
      );
      if (!res.ok) return;
      const data = await res.json();
      const price = parseFloat(data.lastPrice);
      const chgPct = parseFloat(data.priceChangePercent);
      if (!price) return;
      setTonPrice(price);
      setChange24h(chgPct);
      setHistory((prev) => {
        if (!prev.length) return prev;
        const updated = [...prev, { t: Date.now(), p: price }];
        return updated.slice(-50);
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load24hData();
    tickerRef.current = setInterval(refreshPrice, 30_000);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, []);

  const isUp = change24h >= 0;
  const accentColor = isUp ? "#22c55e" : "#ef4444";

  const prices = history.map((h) => h.p);
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const pad = (maxP - minP) * 0.2 || 0.01;

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0088CC]/20 border border-[#0088CC]/30 flex items-center justify-center text-[14px]">
            💎
          </div>
          <div>
            <p className="text-white text-xs font-black leading-none">TON · USD</p>
            <p className="text-[#8E8E93] text-[9px] font-semibold mt-0.5 leading-none">
              TON/USDT · 24h · Live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!loading && !error && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                isUp ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <span
                className="text-[11px] font-black tabular-nums"
                style={{ color: accentColor }}
              >
                {isUp ? "+" : ""}
                {change24h.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Price + Live Dot */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          {loading ? (
            <div className="h-7 w-36 rounded-lg bg-white/5 animate-pulse" />
          ) : error ? (
            <span className="text-[#8E8E93] text-sm font-semibold">Unavailable</span>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-white text-[22px] font-black tabular-nums leading-none">
                  ${tonPrice !== null ? formatTON(tonPrice) : "—"}
                </span>
                <span className="text-[#8E8E93] text-[9px] font-semibold pb-0.5">/ TON</span>
              </div>
              <p className="text-[#8E8E93] text-[9px] font-semibold mt-0.5">
                1,000,000 ANX = 1 TON
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 pb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-[9px] font-black uppercase tracking-widest">
            Live
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[80px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-[#8E8E93] animate-spin" />
            <span className="text-[#8E8E93] text-[10px] font-semibold">Loading chart...</span>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#8E8E93] text-[10px]">Could not load chart</span>
          </div>
        ) : history.length > 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[minP - pad, maxP + pad]} hide />
              <XAxis dataKey="t" hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255,255,255,0.12)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                type="monotone"
                dataKey="p"
                stroke={accentColor}
                strokeWidth={2}
                fill="url(#tonGradient)"
                dot={false}
                activeDot={{ r: 4, fill: accentColor, stroke: "#141414", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#8E8E93] text-[10px]">No data</span>
          </div>
        )}
      </div>
    </div>
  );
}
