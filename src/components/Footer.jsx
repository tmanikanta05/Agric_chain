function AgriChainLogoSmall() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      <path d="M6 26 C6 26 8 14 16 10 C22 7 27 9 27 9 C27 9 25 15 20 19 C15 23 6 26 6 26Z"
        fill="url(#leafGradF)" opacity="0.9"/>
      <path d="M6 26 C10 20 14 15 20 11"
        stroke="#050a03" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <rect x="3" y="20" width="7" height="4" rx="2"
        stroke="#6dce3f" strokeWidth="1.5" fill="none" opacity="0.8"/>
      <rect x="8" y="20" width="7" height="4" rx="2"
        stroke="#6dce3f" strokeWidth="1.5" fill="none" opacity="0.8"/>
      <circle cx="22" cy="10" r="2" fill="#6dce3f" opacity="0.9"/>
      <defs>
        <linearGradient id="leafGradF" x1="6" y1="26" x2="27" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2d8a10"/>
          <stop offset="100%" stopColor="#6dce3f"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Footer() {
  const year = 2026;

  return (
    <footer style={{
      width: "100%",
      background: "#ffffff",
      borderTop: "2px solid rgba(109,206,63,0.4)",
      boxShadow: "0 -2px 16px rgba(0,0,0,0.06)",
      paddingTop: 48,
      paddingBottom: 28,
      marginTop: "auto",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>

        {/* ── Team credits ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "#2d8a10",
          }}>
            Developed By
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
          }}>
            {[
              "Challa Naga Nishith",
              "Veenavanka Adi Vishnu",
              "Tummala Manikanta",
            ].map((name) => (
              <div key={name} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(109,206,63,0.08)",
                border: "1px solid rgba(109,206,63,0.35)",
                borderRadius: 999,
                padding: "6px 18px",
                fontSize: 12,
                fontWeight: 500,
                color: "#1a4a0a",
                letterSpacing: "0.3px",
              }}>
                <span style={{
                  width: 5, height: 5,
                  borderRadius: "50%",
                  background: "#6dce3f",
                  display: "inline-block",
                  flexShrink: 0,
                }}/>
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* ── Guide ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "#2d8a10",
          }}>
            Guided By
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(109,206,63,0.08)",
            border: "1px solid rgba(109,206,63,0.35)",
            borderRadius: 999,
            padding: "7px 20px",
            fontSize: 12,
            fontWeight: 500,
            color: "#1a4a0a",
            letterSpacing: "0.3px",
          }}>
            <span style={{
              width: 5, height: 5,
              borderRadius: "50%",
              background: "#6dce3f",
              display: "inline-block",
              flexShrink: 0,
            }}/>
            Mr. Phani Prasad
            <span style={{
              fontSize: 10,
              fontWeight: 400,
              color: "#5a7a50",
              borderLeft: "1px solid rgba(109,206,63,0.3)",
              paddingLeft: 8,
              marginLeft: 2,
            }}>
              Assistant Professor
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(109,206,63,0.35), transparent)",
          marginBottom: 20,
        }}/>

        {/* ── Bottom bar ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#5a7a50",
            margin: 0,
          }}>
            © {year} AgriChain. Built on Solana Devnet. All rights reserved.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 400, color: "#5a7a50" }}>
              Powered by
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#3da81c", letterSpacing: "0.5px" }}>
              ⚡ Solana
            </span>
            <span style={{ fontSize: 11, color: "#aaa" }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#2d6e1a" }}>
              ⚓ Anchor
            </span>
            <span style={{ fontSize: 11, color: "#aaa" }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#2d6e1a" }}>
              ⚛ React
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}