import { useQuery } from "@tanstack/react-query";

export default function Header() {
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
      <div className="max-w-md mx-auto px-4 pb-2 flex items-center justify-end">

        {/* ChatGPT-style pill capsule */}
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
          {/* ANX coin icon */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(198,241,53,0.1)',
              border: '1px solid rgba(198,241,53,0.2)',
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
                color: '#C6F135',
                letterSpacing: '-0.5px',
                lineHeight: 1,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              A
            </span>
          </div>

          {/* Text block */}
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
