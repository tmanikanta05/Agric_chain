import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PublicKey, Connection } from "@solana/web3.js";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");
const DEVNET_RPC = "https://api.devnet.solana.com";
const publicConnection = new Connection(DEVNET_RPC, "confirmed");

const DISTRICT_MAP = { 1:"Adilabad", 2:"Bhupalpally", 3:"Suryapet", 4:"Rangareddy", 5:"Warangal" };
const CROP_MAP     = { 1:"Paddy", 2:"Wheat", 3:"Cotton", 4:"Vegetables", 5:"Fruits" };
const PROC_MAP     = { 1:"Raw", 2:"Cleaned", 3:"Dried", 4:"Milled", 5:"Processed" };
const GRADE_MAP    = { 1:"Grade A", 2:"Grade B", 3:"Grade C", 4:"Rejected" };
const PKG_MAP      = { 1:"Jute Bag", 2:"Plastic Bag", 3:"Carton Box", 4:"Bulk" };

const TIMELINE_STEPS = [
  { status: 0, icon: "🧑‍🌾", label: "Registered",        desc: "Farmer registered crop on-chain" },
  { status: 1, icon: "🚛",  label: "Collector Assigned", desc: "Collector assigned broker" },
  { status: 2, icon: "🤝",  label: "Broker Accepted",    desc: "Broker confirmed weight & manufacturer" },
  { status: 3, icon: "🏭",  label: "In Lab",             desc: "Manufacturer processed & sent to lab" },
  { status: 4, icon: "✅",  label: "Approved",           desc: "Lab approved — ready for dispatch" },
  { status: 5, icon: "❌",  label: "Rejected",           desc: "Lab rejected — returned to collector" },
];

const roles = [
  { to: "/farmer",       icon: "🧑‍🌾", title: "Farmer",       sub: "Register crop" },
  { to: "/collector",    icon: "🚛",  title: "Collector",    sub: "Assign broker" },
  { to: "/broker",       icon: "🤝",  title: "Broker",       sub: "Accept crop" },
  { to: "/manufacturer", icon: "🏭",  title: "Manufacturer", sub: "Process & pack" },
  { to: "/lab",          icon: "🔬",  title: "Lab",          sub: "Test & certify" },
];

/* ── Print slip ── */
function printSlip({ crop, farmer }) {
  const district = DISTRICT_MAP[farmer?.district] || "—";
  const cropType = CROP_MAP[crop?.cropType] || "—";
  const mobile   = farmer?.mobile ? "XXXXXX" + farmer.mobile.slice(-4) : "—";
  const status   = TIMELINE_STEPS.find((s) => s.status === (crop?.status ?? -1))?.label || "—";

  const html = `<!DOCTYPE html><html><head><title>AgriChain Crop Slip</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Merriweather',serif;background:#fff;color:#111;padding:32px;max-width:480px;margin:auto;}
    .header{text-align:center;border-bottom:3px solid #6dce3f;padding-bottom:16px;margin-bottom:20px;}
    .logo{font-size:26px;font-weight:700;color:#2d8a10;letter-spacing:3px;}
    .sub{font-size:11px;color:#666;margin-top:4px;letter-spacing:1px;}
    .crop-id{background:#f0fff4;border:2px solid #6dce3f;border-radius:8px;text-align:center;padding:14px;margin-bottom:20px;}
    .crop-id-label{font-size:10px;color:#2d8a10;font-weight:700;letter-spacing:2px;text-transform:uppercase;}
    .crop-id-val{font-size:22px;font-weight:700;color:#1a4a0a;margin-top:4px;font-family:monospace;letter-spacing:2px;}
    .section{margin-bottom:16px;}
    .section-title{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#2d8a10;border-bottom:1px solid #e0f0d8;padding-bottom:5px;margin-bottom:10px;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
    .field-label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:1px;}
    .field-val{font-size:13px;font-weight:700;color:#111;margin-top:2px;}
    .status-badge{display:inline-block;background:#f0fff4;border:1px solid #6dce3f;color:#2d8a10;border-radius:999px;padding:4px 14px;font-size:11px;font-weight:700;}
    .footer{text-align:center;margin-top:24px;padding-top:14px;border-top:1px solid #e0f0d8;font-size:9px;color:#aaa;letter-spacing:1px;}
    .privacy{background:#fffbe6;border:1px solid #f0c040;border-radius:6px;padding:8px 12px;font-size:9px;color:#7a6000;margin-top:14px;}
  </style></head><body>
  <div class="header">
    <div class="logo">🌾 AGRICHAIN</div>
    <div class="sub">BLOCKCHAIN AGRICULTURAL SUPPLY CHAIN — SOLANA DEVNET</div>
  </div>
  <div class="crop-id">
    <div class="crop-id-label">Crop ID</div>
    <div class="crop-id-val">${crop?.cropId || "—"}</div>
  </div>
  <div class="section">
    <div class="section-title">Farmer Details</div>
    <div class="grid">
      <div><div class="field-label">Name</div><div class="field-val">${farmer?.name || "—"}</div></div>
      <div><div class="field-label">Mobile</div><div class="field-val">${mobile}</div></div>
      <div><div class="field-label">Aadhaar (last 4)</div><div class="field-val">XXXX-XXXX-${crop?.aadhaarHash?.slice(-4) || "****"}</div></div>
      <div><div class="field-label">District</div><div class="field-val">${district}</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Crop Details</div>
    <div class="grid">
      <div><div class="field-label">Crop Type</div><div class="field-val">${cropType}</div></div>
      <div><div class="field-label">Approx Weight</div><div class="field-val">${crop?.approxWeight?.toString() || "—"} kg</div></div>
      <div><div class="field-label">Status</div><div class="field-val"><span class="status-badge">${status}</span></div></div>
      <div><div class="field-label">Printed On</div><div class="field-val">${new Date().toLocaleDateString("en-IN")}</div></div>
    </div>
  </div>
  <div class="privacy">🔒 Aadhaar is protected — only last 4 digits shown. Original number is never stored on-chain.</div>
  <div class="footer">AgriChain · Solana Devnet · © 2026 · Auto-generated from blockchain data</div>
  </body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}

/* ── Yellow print button ── */
const PrintBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    background: "linear-gradient(135deg,#f0c040,#f5d060)",
    border: "none", borderRadius: 8, color: "#3a2800",
    fontWeight: 700, fontSize: 12, padding: "8px 18px",
    cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 4px 14px rgba(240,192,64,0.35)",
    display: "flex", alignItems: "center", gap: 6,
    transition: "opacity 0.2s",
  }}
    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
  >
    🖨️ Print Slip
  </button>
);

export default function Home() {
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [cropIdInput, setCropIdInput] = useState("");
  const [searching,   setSearching]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [searchErr,   setSearchErr]   = useState("");
  const resultRef = useRef(null);

  /* ── Live Stats ── */
  const [stats,     setStats]     = useState(null);
  const [statsLoad, setStatsLoad] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!program || !connection) return;
    setStatsLoad(true);
    try {
      const raw = await connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed" });
      let total = 0, approved = 0, rejected = 0, inProgress = 0;
      for (const { account } of raw) {
        try {
          const decoded = program.coder.accounts.decode("crop", account.data);
          total++;
          if (decoded.status === 4) approved++;
          else if (decoded.status === 5) rejected++;
          else inProgress++;
        } catch (_) {}
      }
      setStats({ total, approved, rejected, inProgress });
    } catch (err) { console.error("Stats fetch failed:", err); }
    finally { setStatsLoad(false); }
  }, [program, connection]);

  useEffect(() => { if (program) fetchStats(); }, [program]);

  /* ── Search ── */
  const searchCrop = async () => {
    const query = cropIdInput.trim();
    if (!query) { setSearchErr("Enter a Crop ID or wallet address"); return; }
    if (!program || !connection) { setSearchErr("Connect wallet first to search"); return; }
    setSearching(true); setResult(null); setSearchErr("");
    try {
      const raw = await connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed" });
      const crops = [];
      let farmer  = null;

      for (const { pubkey, account } of raw) {
        try { crops.push({ publicKey: pubkey, account: program.coder.accounts.decode("crop", account.data) }); continue; } catch (_) {}
      }

      let found = crops.find(({ account }) => account.cropId === query);
      if (!found) {
        try {
          const pk = new PublicKey(query);
          found = crops.find(({ account }) => account.farmer?.toString() === pk.toString());
        } catch (_) {}
      }
      if (!found) { setSearchErr(`No crop found for "${query}"`); setSearching(false); return; }

      for (const { account } of raw) {
        try {
          const f = program.coder.accounts.decode("farmer", account.data);
          if (f.authority?.toString() === found.account.farmer?.toString()) { farmer = f; break; }
        } catch (_) {}
      }
      setResult({ cropPda: found.publicKey.toString(), crop: found.account, farmer });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) { console.error(err); setSearchErr("Search failed: " + err.message); }
    finally { setSearching(false); }
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
      <div style={{ textAlign: "center", maxWidth: 640, padding: "60px 24px 32px" }}>
        <div className="page-tag">⛓ Solana Devnet</div>
        <h1 className="page-title" style={{ marginBottom: 16 }}>Welcome to <em>AgriChain</em></h1>
        <p style={{ fontSize:14, fontWeight:300, color:"var(--muted)", lineHeight:1.85, marginBottom:40, maxWidth:520, margin:"0 auto 40px" }}>
          AgriChain is a blockchain-powered agricultural supply chain management system
          ensuring <span style={{ color:"var(--text)", fontWeight:400 }}>transparency</span>,{" "}
          <span style={{ color:"var(--text)", fontWeight:400 }}>traceability</span> and{" "}
          <span style={{ color:"var(--text)", fontWeight:400 }}>trust</span> — from farmer to consumer.
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:40 }}>
          {roles.map(({ to, icon, title, sub }) => (
            <Link key={to} to={to} style={{
              background:"var(--glass-card)", border:"1px solid rgba(255,255,255,0.1)",
              borderRadius:12, padding:"14px 16px", textDecoration:"none",
              color:"var(--text)", transition:"border-color 0.2s,transform 0.2s,box-shadow 0.2s",
              minWidth:100, textAlign:"center", flex:"1 1 90px", maxWidth:130, backdropFilter:"blur(16px)",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor="rgba(109,206,63,0.4)"; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
            >
              <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{title}</div>
              <div style={{ fontSize:10, fontWeight:300, color:"var(--muted)", marginTop:3 }}>{sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ LIVE STATS ══ */}
      <div style={{ width:"100%", maxWidth:680, padding:"0 24px 28px" }}>
        <div style={{ background:"var(--glass-card)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, padding:"22px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", color:"var(--green)", textTransform:"uppercase" }}>
              📊 Live Chain Stats
            </div>
            <button onClick={fetchStats} disabled={statsLoad} style={{
              background:"none", border:"1px solid rgba(109,206,63,0.25)",
              borderRadius:6, color:"var(--green)", fontSize:10, padding:"4px 10px",
              cursor:"pointer", fontFamily:"inherit", fontWeight:600,
            }}>
              {statsLoad ? "…" : "↻ Refresh"}
            </button>
          </div>

          {!program ? (
            <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"12px 0" }}>Connect wallet to load live stats</div>
          ) : statsLoad ? (
            <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--muted)", fontSize:13, padding:"8px 0" }}>
              <span className="spinner"/> Fetching from chain…
            </div>
          ) : stats ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {[
                { label:"Total Crops", value:stats.total,      color:"#6dce3f", icon:"🌾" },
                { label:"Approved",    value:stats.approved,    color:"#6dce3f", icon:"✅" },
                { label:"Rejected",    value:stats.rejected,    color:"#e05c5c", icon:"❌" },
                { label:"In Progress", value:stats.inProgress,  color:"#f0a500", icon:"⏳" },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:26, fontWeight:800, color, fontFamily:"var(--font-head)", lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", marginTop:5 }}>{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"12px 0" }}>Click Refresh to load stats</div>
          )}
        </div>
      </div>

      {/* ══ CROP TRACKER ══ */}
      <div style={{ width:"100%", maxWidth:680, padding:"0 24px 80px" }}>
        <div style={{ background:"var(--glass-card)", backdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, padding:"28px 24px", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"2.5px", color:"var(--green)", textTransform:"uppercase", marginBottom:6 }}>
            🔍 Crop Status Tracker
          </div>
          <div style={{ fontSize:13, fontWeight:300, color:"var(--muted)", marginBottom:18, lineHeight:1.6 }}>
            Enter your Crop ID or Farmer wallet address to track the journey
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <input type="text" placeholder="e.g. 25XXXX01  or  FarmerWalletAddress..."
              value={cropIdInput} onChange={(e) => setCropIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchCrop()}
              style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"var(--text)", fontSize:13, fontWeight:300, outline:"none", fontFamily:"inherit", transition:"border-color 0.2s" }}
              onFocus={(e) => { e.target.style.borderColor="rgba(109,206,63,0.45)"; }}
              onBlur={(e)  => { e.target.style.borderColor="rgba(255,255,255,0.1)"; }}
            />
            <button onClick={searchCrop} disabled={searching} style={{
              background:"linear-gradient(135deg,#3da81c,#6dce3f)", border:"none", borderRadius:10,
              color:"#050a03", fontWeight:700, fontSize:13, padding:"12px 22px",
              cursor:searching?"not-allowed":"pointer", opacity:searching?0.6:1,
              fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(109,206,63,0.3)", letterSpacing:"0.3px",
            }}>
              {searching ? "…" : "Track →"}
            </button>
          </div>

          {searchErr && <div style={{ marginTop:12, fontSize:12, color:"#e05c5c" }}>{searchErr}</div>}

          {/* Result */}
          {result && (
            <div ref={resultRef} style={{ marginTop:24 }}>
              <div style={{ background:"rgba(109,206,63,0.05)", border:"1px solid rgba(109,206,63,0.2)", borderRadius:12, padding:"16px 18px", marginBottom:20 }}>

                {/* Header + Print */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ fontSize:16, fontWeight:800, color:"var(--green)", fontFamily:"monospace", letterSpacing:1 }}>
                      🌾 {crop.cropId}
                    </div>
                    <div style={{
                      fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:999, border:"1px solid",
                      color:       status===4?"#6dce3f":status===5?"#e05c5c":"#f0a500",
                      borderColor: status===4?"#6dce3f":status===5?"#e05c5c":"#f0a500",
                    }}>
                      {TIMELINE_STEPS.find((s) => s.status===status)?.label||"Unknown"}
                    </div>
                  </div>
                  <PrintBtn onClick={() => printSlip({ crop, farmer })} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[
                    ["Farmer",    farmer?.name||"—"],
                    ["District",  DISTRICT_MAP[farmer?.district]||"—"],
                    ["Mobile",    farmer?.mobile||"—"],
                    ["Crop",      CROP_MAP[crop.cropType]||"—"],
                    ["Approx Wt",(crop.approxWeight?.toString()||"—")+" kg"],
                    ["Final Wt",  crop.finalWeight?.toString()>"0"?crop.finalWeight.toString()+" kg":"—"],
                    ...(crop.processingType>0?[["Processing",PROC_MAP[crop.processingType]||"—"],["Grade",GRADE_MAP[crop.qualityGrade]||"—"],["Moisture",crop.moisture+"%"]]:[]),
                    ...(crop.totalPackages>0?[["Packages",crop.totalPackages?.toString()],["Pkg Type",PKG_MAP[crop.packageType]||"—"],["Material",crop.packagingMaterial||"—"]]:[]),
                    ...(crop.testResults?.length>0?[["Test Results",crop.testResults.join(" | ")]]:[]),
                  ].map(([label,val]) => (
                    <div key={label}>
                      <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
                      <div style={{ fontSize:12, fontWeight:300, color:"var(--text)", marginTop:2 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:12 }}>
                  <a href={`https://explorer.solana.com/address/${result.cropPda}?cluster=devnet`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize:11, color:"var(--green)", textDecoration:"none", borderBottom:"1px dashed rgba(109,206,63,0.4)" }}>
                    View on Solana Explorer ↗
                  </a>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"2px", color:"var(--green)", textTransform:"uppercase", marginBottom:14 }}>
                Journey Timeline
              </div>
              <div style={{ position:"relative", paddingLeft:28 }}>
                <div style={{ position:"absolute", left:10, top:8, bottom:8, width:2, background:"rgba(109,206,63,0.15)", borderRadius:2 }}/>
                {timelineSteps.map((step, idx) => {
                  const done     = status >= step.status && !(status===5 && step.status===4);
                  const current  = status === step.status;
                  const isReject = step.status === 5;
                  return (
                    <div key={step.status} style={{ position:"relative", display:"flex", alignItems:"flex-start", gap:14, marginBottom:idx<timelineSteps.length-1?16:0, opacity:done?1:0.35 }}>
                      <div style={{
                        position:"absolute", left:-28, width:20, height:20, borderRadius:"50%",
                        background:done?(isReject?"rgba(224,92,92,0.2)":"rgba(109,206,63,0.2)"):"rgba(255,255,255,0.05)",
                        border:`2px solid ${done?(isReject?"#e05c5c":"#6dce3f"):"rgba(255,255,255,0.1)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:9, zIndex:1,
                        boxShadow:current?`0 0 10px ${isReject?"#e05c5c":"#6dce3f"}`:"none",
                      }}>
                        {done?(isReject?"✕":"✓"):""}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:current?700:400, color:done?(isReject?"#e05c5c":"var(--text)"):"var(--muted)" }}>
                          {step.icon} {step.label}
                          {current && (
                            <span style={{
                              marginLeft:8, fontSize:9, padding:"2px 8px", borderRadius:999,
                              background:isReject?"rgba(224,92,92,0.15)":"rgba(109,206,63,0.15)",
                              color:isReject?"#e05c5c":"#6dce3f",
                              border:`1px solid ${isReject?"rgba(224,92,92,0.3)":"rgba(109,206,63,0.3)"}`,
                              fontWeight:700, letterSpacing:"1px", textTransform:"uppercase",
                            }}>Current</span>
                          )}
                        </div>
                        <div style={{ fontSize:11, fontWeight:300, color:"var(--muted)", marginTop:2 }}>{step.desc}</div>
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