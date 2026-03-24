import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const balance = Math.floor(parseFloat(user?.balance || "0"));
  const formatBalance = (n: number) => n.toLocaleString();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}
    >
      <div className="max-w-md mx-auto px-4 pb-2 flex items-center justify-between">

        {/* Menu button — top left */}
        {onMenuClick ? (
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(22,22,24,0.88)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            aria-label="Open menu"
          >
            <span style={{ display: 'block', width: 16, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.75)' }} />
            <span style={{ display: 'block', width: 11, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.45)' }} />
            <span style={{ display: 'block', width: 14, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.6)' }} />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}

        {/* ANX Balance pill — top right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '7px 14px 7px 10px',
            borderRadius: '999px',
            background: 'rgba(22, 22, 24, 0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#00E676',
                letterSpacing: '-0.5px',
                lineHeight: 1,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              A
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.38)',
                lineHeight: 1,
              }}
            >
              ANX Balance
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {formatBalance(balance)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
