import { NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
export default function Navbar() {
  return (
    <header className="header">
      {/* ── Brand ── */}
      <NavLink to="/" className="logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img
          src="/logo.png"
          alt="AgriChain Logo"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            /* subtle glow to match theme */
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

      {/* ── Nav links ── */}
      <nav className="nav">
        <NavLink to="/farmer"       className={({ isActive }) => isActive ? "active" : ""}>🌾 Farmer</NavLink>
        <NavLink to="/collector"    className={({ isActive }) => isActive ? "active" : ""}>🚛 Collector</NavLink>
        <NavLink to="/broker"       className={({ isActive }) => isActive ? "active" : ""}>🤝 Broker</NavLink>
        <NavLink to="/manufacturer" className={({ isActive }) => isActive ? "active" : ""}>🏭 Manufacturer</NavLink>
        <NavLink to="/lab"          className={({ isActive }) => isActive ? "active" : ""}>🔬 Lab</NavLink>
      </nav>

      {/* ── Wallet ── */}
      <div className="nav-wallet">
        <WalletMultiButton />
      </div>
    </header>
  );
}
