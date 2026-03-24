import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#00E676";

interface BottomNavProps {
  onWithdrawClick?: () => void;
  onInviteClick?: () => void;
}

function InviteNavIcon({ active }: { active?: boolean }) {
  const color = active ? ACCENT : "#666";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="1.7" />
      <path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
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

function AdminNavIcon({ active }: { active?: boolean }) {
  const color = active ? ACCENT : "#666";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeNavIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3l9 9" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BottomNav({ onWithdrawClick, onInviteClick }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const isHome = location === "/";
  const isAdmin = location === "/admin" || location.startsWith("/admin");

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(6,6,6,0.97)',
        borderTop: '1px solid #1e1e1e',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-md mx-auto flex">
        {/* Invite */}
        <button
          onClick={onInviteClick}
          className="flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5"
        >
          <InviteNavIcon />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#666' }}>
            Invite
          </span>
        </button>

        {/* Center – dynamic: Withdraw on Home, Home on other pages */}
        <button
          onClick={isHome ? onWithdrawClick : () => setLocation('/')}
          className="flex-1 py-3 flex flex-col items-center justify-center gap-1 relative transition-colors active:bg-white/5"
        >
          <div
            className="absolute -top-3 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: '#0a0a0a',
              border: `2px solid ${ACCENT}`,
              boxShadow: `0 0 16px rgba(0,230,118,0.35), 0 -4px 20px rgba(0,230,118,0.1)`,
            }}
          >
            <AnimatePresence mode="wait">
              {isHome ? (
                <motion.div
                  key="withdraw"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  <WithdrawNavIcon active />
                </motion.div>
              ) : (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  <HomeNavIcon />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-6" />
          <AnimatePresence mode="wait">
            <motion.span
              key={isHome ? 'withdraw-label' : 'home-label'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: ACCENT }}
            >
              {isHome ? 'Withdraw' : 'Home'}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Admin */}
        <button
          onClick={() => setLocation('/admin')}
          className="flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors active:bg-white/5"
        >
          <AdminNavIcon active={isAdmin} />
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: isAdmin ? ACCENT : '#666' }}
          >
            Admin
          </span>
        </button>
      </div>
    </div>
  );
}
