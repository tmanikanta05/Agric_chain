import { NavLink } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  return (
    <header className="header">
      <NavLink to="/" className="logo">
        AgriChain
      </NavLink>

      <nav className="nav">
        <NavLink to="/farmer"       className={({ isActive }) => isActive ? "active" : ""}>🌾 Farmer</NavLink>
        <NavLink to="/collector"    className={({ isActive }) => isActive ? "active" : ""}>🚛 Collector</NavLink>
        <NavLink to="/broker"       className={({ isActive }) => isActive ? "active" : ""}>🤝 Broker</NavLink>
        <NavLink to="/manufacturer" className={({ isActive }) => isActive ? "active" : ""}>🏭 Manufacturer</NavLink>
        <NavLink to="/lab"          className={({ isActive }) => isActive ? "active" : ""}>🔬 Lab</NavLink>
      </nav>

      <div className="nav-wallet">
        <WalletMultiButton />
      </div>
    </header>
  );
}