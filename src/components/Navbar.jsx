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
        <span>AgriChain</span>
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
