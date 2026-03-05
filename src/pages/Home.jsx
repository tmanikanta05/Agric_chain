import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");

const DISTRICT_MAP   = { 1:"Adilabad", 2:"Bhupalpally", 3:"Suryapet", 4:"Rangareddy", 5:"Warangal" };
const CROP_MAP       = { 1:"Paddy", 2:"Wheat", 3:"Cotton", 4:"Vegetables", 5:"Fruits" };
const PROC_MAP       = { 1:"Raw", 2:"Cleaned", 3:"Dried", 4:"Milled", 5:"Processed" };
const GRADE_MAP      = { 1:"Grade A", 2:"Grade B", 3:"Grade C", 4:"Rejected" };
const PKG_MAP        = { 1:"Jute Bag", 2:"Plastic Bag", 3:"Carton Box", 4:"Bulk" };

const TIMELINE_STEPS = [
  { status: 0, icon: "🧑‍🌾", label: "Registered",        desc: "Farmer registered crop on-chain" },
  { status: 1, icon: "🚛", label: "Collector Assigned", desc: "Collector assigned broker" },
  { status: 2, icon: "🤝", label: "Broker Accepted",    desc: "Broker confirmed weight & manufacturer" },
  { status: 3, icon: "🏭", label: "In Lab",             desc: "Manufacturer processed & sent to lab" },
  { status: 4, icon: "✅", label: "Approved",           desc: "Lab approved — ready for dispatch" },
  { status: 5, icon: "❌", label: "Rejected",           desc: "Lab rejected — returned to collector" },
];

const roles = [
  { to: "/farmer",       icon: "🧑‍🌾", title: "Farmer",       sub: "Register crop" },
  { to: "/collector",    icon: "🚛",  title: "Collector",    sub: "Assign broker" },
  { to: "/broker",       icon: "🤝",  title: "Broker",       sub: "Accept crop" },
  { to: "/manufacturer", icon: "🏭",  title: "Manufacturer", sub: "Process & pack" },
  { to: "/lab",          icon: "🔬",  title: "Lab",          sub: "Test & certify" },
];

export default function Home() {
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [cropIdInput, setCropIdInput] = useState("");
  const [searching,   setSearching]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [searchErr,   setSearchErr]   = useState("");
  const resultRef = useRef(null);

  const searchCrop = async () => {
    const query = cropIdInput.trim();
    if (!query) { setSearchErr("Enter a Crop ID or wallet address"); return; }
    if (!program || !connection) { setSearchErr("Connect wallet first to search"); return; }

    setSearching(true);
    setResult(null);
    setSearchErr("");

    try {
      const raw = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed",
        filters: [{ memcmp: { offset: 0, bytes: "bLrwCTwwMB2" } }],
      });

      const crops = raw.map(({ pubkey, account }) => ({
        publicKey: pubkey,
        account: program.coder.accounts.decode("crop", account.data),
      }));

      let found = crops.find(({ account }) => account.cropId === query);
      if (!found) {
        try {
          const pk = new PublicKey(query);
          found = crops.find(({ account }) => account.farmer?.toString() === pk.toString());
        } catch (_) {}
      }

      if (!found) {
        setSearchErr(`No crop found for "${query}"`);
        setSearching(false);
        return;
      }

      const farmerRaw = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed",
        filters: [{ memcmp: { offset: 0, bytes: "jXX2LSteZVk" } }],
      });
      const farmers = farmerRaw.map(({ pubkey, account }) => ({
        publicKey: pubkey,
        account: program.coder.accounts.decode("farmer", account.data),
      }));
      const farmer = farmers.find(
        ({ account }) => account.authority?.toString() === found.account.farmer?.toString()
      )?.account || null;

      setResult({ cropPda: found.publicKey.toString(), crop: found.account, farmer });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error(err);
      setSearchErr("Search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const crop   = result?.crop;
  const farmer = result?.farmer;
  const status = crop?.status ?? -1;

  const timelineSteps = status === 5
    ? TIMELINE_STEPS.filter((s) => s.status !== 4)
    : TIMELINE_STEPS.filter((s) => s.status !== 5);

  return (
    <div className="page" style={{ gap: 0 }}>

      {/* ── Hero ── */}
      <div style={{ textAlign: "center", maxWidth: 640, padding: "60px 24px 40px" }}>
        <div className="page-tag">⛓ Solana Devnet</div>

        <h1 className="page-title" style={{ marginBottom: 16 }}>
          Welcome to <em>AgriChain</em>
        </h1>

        <p style={{
          fontSize: 14,
          fontWeight: 300,
          color: "var(--muted)",
          lineHeight: 1.85,
          marginBottom: 40,
          maxWidth: 520,
          margin: "0 auto 40px",
        }}>
          AgriChain is a blockchain-powered agricultural supply chain management system
          ensuring <span style={{ color: "var(--text)", fontWeight: 400 }}>transparency</span>,{" "}
          <span style={{ color: "var(--text)", fontWeight: 400 }}>traceability</span> and{" "}
          <span style={{ color: "var(--text)", fontWeight: 400 }}>trust</span> — from farmer to consumer.
        </p>

        {/* ── Role cards ── */}
        <div style={{
          display: "flex", gap: 10, justifyContent: "center",
          flexWrap: "wrap", marginBottom: 48,
        }}>
          {roles.map(({ to, icon, title, sub }) => (
            <Link key={to} to={to} style={{
              background: "var(--glass-card)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "14px 16px", textDecoration: "none",
              color: "var(--text)", transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
              minWidth: 100, textAlign: "center", flex: "1 1 90px", maxWidth: 130,
              backdropFilter: "blur(16px)",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(109,206,63,0.4)";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{title}</div>
              <div style={{ fontSize: 10, fontWeight: 300, color: "var(--muted)", marginTop: 3 }}>{sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Crop Tracker ── */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 24px 80px" }}>
        <div style={{
          background: "var(--glass-card)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18, padding: "28px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2.5px", color: "var(--green)", textTransform: "uppercase", marginBottom: 6 }}>
            🔍 Crop Status Tracker
          </div>
          <div style={{ fontSize: 13, fontWeight: 300, color: "var(--muted)", marginBottom: 18, lineHeight: 1.6 }}>
            Enter your Crop ID or Farmer wallet address to track the journey
          </div>

          {/* Search box */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="e.g. 25XXXX01  or  FarmerWalletAddress..."
              value={cropIdInput}
              onChange={(e) => setCropIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCrop()}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                padding: "12px 14px", color: "var(--text)", fontSize: 13,
                fontWeight: 300,
                outline: "none", fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(109,206,63,0.45)"; }}
              onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
            <button
              onClick={searchCrop}
              disabled={searching}
              style={{
                background: "linear-gradient(135deg,#3da81c,#6dce3f)",
                border: "none", borderRadius: 10, color: "#050a03",
                fontWeight: 700, fontSize: 13, padding: "12px 22px",
                cursor: searching ? "not-allowed" : "pointer",
                opacity: searching ? 0.6 : 1,
                fontFamily: "inherit", whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(109,206,63,0.3)",
                letterSpacing: "0.3px",
              }}
            >
              {searching ? "…" : "Track →"}
            </button>
          </div>

          {searchErr && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#e05c5c", fontWeight: 400 }}>{searchErr}</div>
          )}

          {/* ── Result ── */}
          {result && (
            <div ref={resultRef} style={{ marginTop: 24 }}>
              {/* Crop summary */}
              <div style={{
                background: "rgba(109,206,63,0.05)", border: "1px solid rgba(109,206,63,0.2)",
                borderRadius: 12, padding: "16px 18px", marginBottom: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--green)", fontFamily: "monospace", letterSpacing: 1 }}>
                    🌾 {crop.cropId}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                    border: "1px solid",
                    color:       status === 4 ? "#6dce3f" : status === 5 ? "#e05c5c" : "#f0a500",
                    borderColor: status === 4 ? "#6dce3f" : status === 5 ? "#e05c5c" : "#f0a500",
                  }}>
                    {TIMELINE_STEPS.find((s) => s.status === status)?.label || "Unknown"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    ["Farmer",    farmer?.name || "—"],
                    ["District",  DISTRICT_MAP[farmer?.district] || "—"],
                    ["Mobile",    farmer?.mobile || "—"],
                    ["Crop",      CROP_MAP[crop.cropType] || "—"],
                    ["Approx Wt", (crop.approxWeight?.toString() || "—") + " kg"],
                    ["Final Wt",  crop.finalWeight?.toString() > "0" ? crop.finalWeight.toString() + " kg" : "—"],
                    ...(crop.processingType > 0 ? [
                      ["Processing", PROC_MAP[crop.processingType] || "—"],
                      ["Grade",      GRADE_MAP[crop.qualityGrade] || "—"],
                      ["Moisture",   crop.moisture + "%"],
                    ] : []),
                    ...(crop.totalPackages > 0 ? [
                      ["Packages", crop.totalPackages?.toString()],
                      ["Pkg Type", PKG_MAP[crop.packageType] || "—"],
                      ["Material", crop.packagingMaterial || "—"],
                    ] : []),
                    ...(crop.testResults?.length > 0 ? [
                      ["Test Results", crop.testResults.join(" | ")],
                    ] : []),
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 300, color: "var(--text)", marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <a
                    href={`https://explorer.solana.com/address/${result.cropPda}?cluster=devnet`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "var(--green)", textDecoration: "none", borderBottom: "1px dashed rgba(109,206,63,0.4)" }}
                  >
                    View on Solana Explorer ↗
                  </a>
                </div>
              </div>

              {/* ── Timeline ── */}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "var(--green)", textTransform: "uppercase", marginBottom: 14 }}>
                Journey Timeline
              </div>
              <div style={{ position: "relative", paddingLeft: 28 }}>
                <div style={{
                  position: "absolute", left: 10, top: 8, bottom: 8,
                  width: 2, background: "rgba(109,206,63,0.15)", borderRadius: 2,
                }} />

                {timelineSteps.map((step, idx) => {
                  const done     = status >= step.status && !(status === 5 && step.status === 4);
                  const current  = status === step.status;
                  const isReject = step.status === 5;

                  return (
                    <div key={step.status} style={{
                      position: "relative", display: "flex",
                      alignItems: "flex-start", gap: 14,
                      marginBottom: idx < timelineSteps.length - 1 ? 16 : 0,
                      opacity: done ? 1 : 0.35,
                    }}>
                      <div style={{
                        position: "absolute", left: -28,
                        width: 20, height: 20, borderRadius: "50%",
                        background: done
                          ? (isReject ? "rgba(224,92,92,0.2)" : "rgba(109,206,63,0.2)")
                          : "rgba(255,255,255,0.05)",
                        border: `2px solid ${done ? (isReject ? "#e05c5c" : "#6dce3f") : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, zIndex: 1,
                        boxShadow: current ? `0 0 10px ${isReject ? "#e05c5c" : "#6dce3f"}` : "none",
                      }}>
                        {done ? (isReject ? "✕" : "✓") : ""}
                      </div>

                      <div>
                        <div style={{
                          fontSize: 13, fontWeight: current ? 700 : 400,
                          color: done ? (isReject ? "#e05c5c" : "var(--text)") : "var(--muted)",
                        }}>
                          {step.icon} {step.label}
                          {current && (
                            <span style={{
                              marginLeft: 8, fontSize: 9, padding: "2px 8px",
                              borderRadius: 999,
                              background: isReject ? "rgba(224,92,92,0.15)" : "rgba(109,206,63,0.15)",
                              color: isReject ? "#e05c5c" : "#6dce3f",
                              border: `1px solid ${isReject ? "rgba(224,92,92,0.3)" : "rgba(109,206,63,0.3)"}`,
                              fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                            }}>Current</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 300, color: "var(--muted)", marginTop: 2 }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}