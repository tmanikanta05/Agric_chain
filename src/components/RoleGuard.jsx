import { useWallet } from "@solana/wallet-adapter-react";

/* ── Allowed wallets per role ── */
const ROLE_WALLETS = {
  collector:    ["AHZqSqvdyXNzBfbz514UXeQK6JXntqSS5agpNTnWDALB"],
  broker:       ["HogGTnGkpkeDMKHNwwGJ6jSPig8fy2dpCJpQrihHchRp", "5Qbkn6cYg4GxNFRnuhroFhsSVMyG5Sb3E6NTtCLFLqMW"],
  manufacturer: ["AkX9x6BhDDFaoPnir8kyz7gcn4FS3eSL9XbdyaxU32wF", "8busLmxoBGYP4sG2xdRMhnCc8PCLmgP7TwxNSC9cH4BP"],
  lab:          ["2Xqq5TNNi9bhwpEC2xRS78z9YD3C5UUAAhndSLrYmcLY", "DLgx9THCwkwjYSisSWkLUfJG8UdWS1NrsiKhk6yNuemG"],
};

const ROLE_META = {
  collector:    { icon: "🚛", label: "Collector",    step: "Step 2 of 5" },
  broker:       { icon: "🤝", label: "Broker",       step: "Step 3 of 5" },
  manufacturer: { icon: "🏭", label: "Manufacturer", step: "Step 4 of 5" },
  lab:          { icon: "🔬", label: "Lab",          step: "Step 5 of 5" },
};

export default function RoleGuard({ role, children }) {
  const { publicKey, connected } = useWallet();
  const meta = ROLE_META[role];

  /* Not connected — let the page handle its own wallet check */
  if (!connected || !publicKey) return children;

  const allowed = ROLE_WALLETS[role] ?? [];
  const isAllowed = allowed.includes(publicKey.toString());

  if (isAllowed) return children;

  /* ── Access Denied UI ── */
  return (
    <div className="page">
      <div className="step-badge">{meta.step}</div>
      <div className="page-tag">{meta.icon} {meta.label}</div>

      <div className="card" style={{ maxWidth: 520, textAlign: "center", padding: "48px 36px" }}>

        {/* Lock icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: "50%",
          background: "rgba(224,92,92,0.1)",
          border: "2px solid rgba(224,92,92,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
          margin: "0 auto 20px",
          boxShadow: "0 0 24px rgba(224,92,92,0.15)",
        }}>
          🚫
        </div>

        {/* Title */}
        <div style={{
          fontSize: 20, fontWeight: 700,
          color: "#e05c5c",
          marginBottom: 10,
          fontFamily: "var(--font-head)",
        }}>
          Access Denied
        </div>

        {/* Message */}
        <p style={{
          fontSize: 13, fontWeight: 300,
          color: "rgba(240,247,235,0.55)",
          lineHeight: 1.7,
          marginBottom: 20,
        }}>
          This page is restricted to authorized{" "}
          <span style={{ color: "#6dce3f", fontWeight: 600 }}>{meta.label}</span>{" "}
          wallets only. Your connected wallet does not have permission to access this section.
        </p>

        {/* Connected wallet display */}
        <div style={{
          background: "rgba(224,92,92,0.07)",
          border: "1px solid rgba(224,92,92,0.2)",
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, color: "rgba(240,247,235,0.35)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
            Connected Wallet
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#e05c5c" }}>
            {publicKey.toString().slice(0, 16)}…{publicKey.toString().slice(-8)}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(240,247,235,0.25)", marginTop: 20 }}>
          Please switch to the correct wallet in Phantom and refresh.
        </p>

      </div>
    </div>
  );
}