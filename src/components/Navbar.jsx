import { useState } from "react";
import { NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const navLinks = [
  { to: "/farmer",       label: "🌾 Farmer"       },
  { to: "/collector",    label: "🚛 Collector"    },
  { to: "/broker",       label: "🤝 Broker"       },
  { to: "/manufacturer", label: "🏭 Manufacturer" },
  { to: "/lab",          label: "🔬 Lab"          },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        {/* ── Brand ── */}
        <NavLink to="/" className="logo" style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={close}>
          <img
            src="/logo.png"
            alt="AgriChain Logo"
            style={{
              width: 40, height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
              filter: "drop-shadow(0 0 6px rgba(109,206,63,0.45))",
            }}
          />
          <span style={{
            fontFamily: "'Merriweather', serif",
            fontWeight: 900,
            fontStyle: "normal",
            textTransform: "uppercase",
            letterSpacing: "3px",
            fontSize: "15px",
            background: "linear-gradient(135deg, #2d8a10 0%, #6dce3f 60%, #9ef56a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 8px rgba(109,206,63,0.3))",
          }}>AGRICHAIN</span>
        </NavLink>

        {/* ── Desktop nav ── */}
        <nav className="nav">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Wallet ── */}
        <div className="nav-wallet">
          <WalletMultiButton />
        </div>

        {/* ── Hamburger (mobile only) ── */}
        <button
          className="nav-hamburger"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: open ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
        </button>
      </header>

      {/* ── Mobile overlay ── */}
      <div
        className={`nav-mobile-overlay ${open ? "open" : ""}`}
        onClick={close}
      />

      {/* ── Mobile drawer ── */}
      <div className={`nav-mobile-drawer ${open ? "open" : ""}`}>
        <button className="drawer-close" onClick={close}>✕</button>
        <div className="drawer-title">Navigation</div>
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => isActive ? "active" : ""}
            onClick={close}
          >
            {label}
          </NavLink>
        ))}

        {/* Wallet button inside drawer on mobile */}
        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(109,206,63,0.1)" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "2.5px",
            textTransform: "uppercase", color: "var(--green)",
            marginBottom: 12, opacity: 0.7,
          }}>Wallet</div>
          <WalletMultiButton />
        </div>
      </div>
    </>
  );
}
