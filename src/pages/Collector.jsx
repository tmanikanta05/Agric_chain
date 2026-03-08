import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");
const BROKERS = [
  { label: "Broker 1 - Raju Traders",    pubkey: "HogGTnGkpkeDMKHNwwGJ6jSPig8fy2dpCJpQrihHchRp" },
  { label: "Broker 2 - Krishna Exports", pubkey: "5Qbkn6cYg4GxNFRnuhroFhsSVMyG5Sb3E6NTtCLFLqMW" },
];
const MANUFACTURERS = [
  { label: "Manufacturer 1 - AgroPro Mills",       pubkey: "AkX9x6BhDDFaoPnir8kyz7gcn4FS3eSL9XbdyaxU32wF" },
  { label: "Manufacturer 2 - GreenPack Industries", pubkey: "8busLmxoBGYP4sG2xdRMhnCc8PCLmgP7TwxNSC9cH4BP" },
];
const DISTRICT_MAP = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
const CROP_MAP     = {1:"🌾 Paddy",2:"🌿 Wheat",3:"☁️ Cotton",4:"🥦 Vegetables",5:"🍎 Fruits"};
const STATUS_MAP   = {0:"Registered",1:"Broker Assigned",2:"With Manufacturer",3:"In Lab",4:"Lab Approved",5:"Lab Rejected"};
const STATUS_CLR   = {0:"#6dce3f",1:"#f0a500",2:"#3fa8ce",3:"#a06dce",4:"#6dce3f",5:"#e05c5c"};

const FILTERS = [
  { value: "all",      label: "📋 All Crops" },
  { value: "assign",   label: "🔔 Assign Broker" },
  { value: "progress", label: "⏳ In Progress" },
  { value: "approved", label: "✅ Lab Approved" },
  { value: "rejected", label: "❌ Lab Rejected" },
  { value: "reassign", label: "🔄 Re-Assign Broker" },
];

function matchFilter(status, filter) {
  if (filter === "all")      return true;
  if (filter === "assign")   return status === 0;
  if (filter === "progress") return status === 1 || status === 2 || status === 3;
  if (filter === "approved") return status === 4;
  if (filter === "rejected") return status === 5;
  if (filter === "reassign") return status === 5;
  return true;
}

/* ── QR Modal for Collector ── */
function QRModalCollector({ data, approved, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.QRCode) return;
    window.QRCode.toCanvas(canvasRef.current, data, {
      width: 220, margin: 2,
      color: { dark: "#0a0f07", light: approved ? "#6dce3f" : "#e05c5c" },
    }).catch(console.error);
  }, [data, approved]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `agrichain-qr-${approved ? "approved" : "rejected"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.82)", backdropFilter:"blur(10px)",
      display:"flex", alignItems:"center", justifyContent:"center",
    }} onClick={onClose}>
      <div style={{
        background:"rgba(8,18,4,0.97)",
        border:`1px solid ${approved ? "rgba(109,206,63,0.4)" : "rgba(224,92,92,0.4)"}`,
        borderRadius:22, padding:"34px 28px", textAlign:"center",
        maxWidth:340, width:"90%",
        boxShadow:`0 20px 60px rgba(0,0,0,0.6)`,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          fontSize:13, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
          color: approved ? "#6dce3f" : "#e05c5c", marginBottom:4,
        }}>
          {approved ? "✅ Lab Approved" : "❌ Lab Rejected"}
        </div>
        <div style={{ fontSize:11, color:"rgba(240,247,235,0.35)", marginBottom:20 }}>
          {approved ? "Scan to verify crop quality certificate" : "Scan to verify — crop needs re-inspection"}
        </div>
        <div style={{
          display:"inline-block", padding:10, borderRadius:14,
          background: approved ? "rgba(109,206,63,0.08)" : "rgba(224,92,92,0.08)",
          border:`1px solid ${approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)"}`,
          marginBottom:18,
        }}>
          <canvas ref={canvasRef} style={{ display:"block", borderRadius:8 }} />
        </div>
        <div style={{
          fontSize:10, color:"rgba(240,247,235,0.35)", marginBottom:18, lineHeight:1.6,
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:8, padding:"8px 12px", textAlign:"left", fontFamily:"monospace",
        }}>
          Scan reveals: Crop ID · Farmer · District · Crop Type · Weight · Test Results · Solana Explorer link
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <button onClick={download} style={{
            background:"linear-gradient(135deg,#3da81c,#6dce3f)",
            border:"none", borderRadius:9, color:"#050a03",
            fontWeight:700, fontSize:12, padding:"9px 18px",
            cursor:"pointer", fontFamily:"inherit",
          }}>⬇ Download QR</button>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:9, color:"rgba(240,247,235,0.8)",
            fontSize:12, padding:"9px 18px",
            cursor:"pointer", fontFamily:"inherit",
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Collector() {
  const { publicKey, connected } = useWallet();
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [crops,     setCrops]     = useState([]);
  const [farmers,   setFarmers]   = useState({});
  const [loading,   setLoading]   = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [brokerSel, setBrokerSel] = useState({});
  const [txSigs,    setTxSigs]    = useState({});
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState("all");
  const [qrModal,   setQrModal]   = useState(null);
  const [mfgSel,    setMfgSel]    = useState({});

  const fetchAll = useCallback(async () => {
    if (!program || !connection) return;
    setLoading(true); setError("");
    try {
      const raw = await connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed" });
      const allCrops = [];
      const fMap     = {};
      for (const { pubkey, account } of raw) {
        try { allCrops.push({ publicKey: pubkey, account: program.coder.accounts.decode("crop", account.data) }); continue; } catch (_) {}
        try { fMap[pubkey.toString()] = program.coder.accounts.decode("farmer", account.data); } catch (_) {}
      }
      setCrops(allCrops);
      setFarmers(fMap);
    } catch (err) { console.error(err); setError("Failed to fetch from blockchain."); }
    finally { setLoading(false); }
  }, [program, connection]);

  useEffect(() => { if (connected && program) fetchAll(); }, [connected, program]);

  /* Load QRCode lib */
  useEffect(() => {
    if (!window.QRCode) {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
      document.head.appendChild(s);
    }
  }, []);

  const assignBroker = async (cropPda) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    const brokerIdx = brokerSel[cropPda] ?? 0;
    let brokerKey;
    try { brokerKey = new PublicKey(BROKERS[brokerIdx].pubkey); }
    catch { alert("Invalid broker address"); return; }
    setAssigning(cropPda);
    try {
      const tx = await program.methods
        .assignBroker(brokerKey)
        .accounts({ collector: publicKey, crop: new PublicKey(cropPda) })
        .rpc({ commitment: "confirmed" });
      setTxSigs((p) => ({ ...p, [cropPda]: tx }));
      alert("Broker assigned successfully ✅");
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed: " + (err?.logs?.find((l) => l.includes("Error")) || err?.message));
    } finally { setAssigning(null); }
  };

  /* Re-assign directly to Manufacturer (after lab rejection) */
  const assignManufacturer = async (cropPda) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    const brokerIdx = brokerSel[cropPda] ?? 0;
    let brokerKey;
    try { brokerKey = new PublicKey(BROKERS[brokerIdx].pubkey); }
    catch { alert("Invalid broker address"); return; }
    setAssigning(cropPda);
    try {
      const tx = await program.methods
        .assignBroker(brokerKey)
        .accounts({ collector: publicKey, crop: new PublicKey(cropPda) })
        .rpc({ commitment: "confirmed" });
      setTxSigs((p) => ({ ...p, [cropPda]: tx }));
      alert("Re-assigned to Broker for reprocessing ✅\nBroker will select a new Manufacturer.");
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed: " + (err?.logs?.find((l) => l.includes("Error")) || err?.message));
    } finally { setAssigning(null); }
  };

  const buildQRData = (cropPda, crop, farmer) => {
    const status = crop.status === 4 ? "APPROVED ✓" : "REJECTED ✗";
    const rows = [
      ["AGRICHAIN",    "Blockchain Traceability"],
      ["Status",       status],
      ["─────────",    "──────────────────────"],
      ["Crop ID",      crop.cropId || "—"],
      ["Farmer",       farmer?.name || "Unknown"],
      ["District",     DISTRICT_MAP[farmer?.district] || "—"],
      ["─────────",    "──────────────────────"],
      ["Crop Type",    (CROP_MAP[crop.cropType]||"—").replace(/\p{Emoji}/u,"").trim()],
      ["Weight",       (crop.approxWeight?.toString() || "—") + " kg"],
      ["─────────",    "──────────────────────"],
      ["Test Results", (crop.testResults || []).join(", ") || "—"],
      ["─────────",    "──────────────────────"],
      ["Verified on",  "Solana Devnet"],
      ["Explorer",     "https://explorer.solana.com/address/" + cropPda + "?cluster=devnet"],
    ];
    const w = Math.max(...rows.map(([k]) => k.length));
    return rows.map(([k, v]) => k.padEnd(w) + "  " + v).join("\n");
  };

  const showQR = (cropPda, crop, farmer) =>
    setQrModal({ data: buildQRData(cropPda, crop, farmer), approved: crop.status === 4 });

  const getFarmer = (crop) => farmers[crop.farmer?.toString()] || null;
  const isDefault = (pk)   => !pk || pk.toString() === "11111111111111111111111111111111";

  const filtered = crops.filter(({ account }) => matchFilter(account.status ?? 0, filter));

  const counts = {
    all:      crops.length,
    assign:   crops.filter(({ account }) => (account.status ?? 0) === 0).length,
    progress: crops.filter(({ account }) => [1,2,3].includes(account.status ?? 0)).length,
    approved: crops.filter(({ account }) => (account.status ?? 0) === 4).length,
    rejected: crops.filter(({ account }) => (account.status ?? 0) === 5).length,
    reassign: crops.filter(({ account }) => (account.status ?? 0) === 5).length,
  };

  return (
    <>
      {qrModal && <QRModalCollector data={qrModal.data} approved={qrModal.approved} onClose={() => setQrModal(null)} />}
      <div className="page">
      <div className="step-badge">Step 2 of 5</div>
      <div className="page-tag">🚛 Collector Dashboard</div>
      <h1 className="page-title">Manage <em>Crops</em></h1>
      <p className="page-sub">All registered crops fetched live from Solana Devnet</p>

      {connected && publicKey && (
        <div className="wpill">
          <span className="wpill-dot"/>
          {publicKey.toString().slice(0,6)}...{publicKey.toString().slice(-4)}
        </div>
      )}

      {!connected ? (
        <div className="card" style={{ maxWidth: 400 }}>
          <div className="no-wallet">
            <div className="no-wallet-icon">🔒</div>
            <p>Connect your Phantom wallet</p>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 1100 }}>

          {/* Top bar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button className="loc-btn" onClick={fetchAll} disabled={loading} style={{ height: 40, padding: "0 20px" }}>
              {loading ? "Fetching…" : "🔄 Refresh from Chain"}
            </button>
            {error && <span style={{ color: "#e05c5c", fontSize: 13 }}>{error}</span>}
          </div>

          {/* ══ FILTER PILLS ══ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "#6dce3f", textTransform: "uppercase", marginBottom: 10 }}>
              Filter Crops
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map(({ value, label }) => {
                const active = filter === value;
                const count  = counts[value];
                return (
                  <button key={value} onClick={() => setFilter(value)} style={{
                    background: active ? "rgba(109,206,63,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "#6dce3f" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 999, padding: "7px 16px",
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    color: active ? "#6dce3f" : "rgba(240,247,235,0.55)",
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.18s",
                    boxShadow: active ? "0 0 12px rgba(109,206,63,0.2)" : "none",
                  }}>
                    {label}
                    <span style={{
                      background: active ? "#6dce3f" : "rgba(255,255,255,0.1)",
                      color: active ? "#050a03" : "rgba(240,247,235,0.5)",
                      borderRadius: 999, fontSize: 10, fontWeight: 700,
                      padding: "1px 7px", minWidth: 20, textAlign: "center",
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Crop cards ── */}
          {loading ? (
            <div style={{ display: "flex", gap: 12, color: "rgba(240,247,235,0.45)", fontSize: 14, padding: "40px 0" }}>
              <span className="spinner"/> Fetching crops from Solana Devnet…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(240,247,235,0.45)" }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📦</div>
              <p>No crops found for <strong style={{ color: "#6dce3f" }}>{FILTERS.find(f => f.value === filter)?.label}</strong></p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
              {filtered.map(({ publicKey: cropPk, account: crop }) => {
                const farmer     = getFarmer(crop);
                const cropPda    = cropPk.toString();
                const statusNum  = crop.status ?? 0;
                const isRejected = statusNum === 5;

                return (
                  <div key={cropPda} className="crop-card">

                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#6dce3f", textTransform: "uppercase" }}>
                          ID: {crop.cropId || "N/A"}
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(240,247,235,0.35)", fontFamily: "monospace", marginTop: 2 }}>
                          {cropPda.slice(0,10)}…{cropPda.slice(-6)}
                        </div>
                      </div>
                      <span className="status-badge" style={{ color: STATUS_CLR[statusNum], borderColor: STATUS_CLR[statusNum] }}>
                        {STATUS_MAP[statusNum]}
                      </span>
                    </div>

                    {/* Farmer info */}
                    <div className="clabel">Farmer Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {[["Farmer", farmer?.name||"N/A"], ["Mobile", farmer?.mobile||"N/A"],
                        ["District", DISTRICT_MAP[farmer?.district]||"N/A"], ["Location", farmer?.location||"N/A"]
                      ].map(([l,v]) => (
                        <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    {/* Crop info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      {[["Crop", CROP_MAP[crop.cropType]||"N/A"],
                        ["Weight", (crop.approxWeight?.toString()||"N/A")+" kg"],
                        ["Status", STATUS_MAP[statusNum]],
                        ["Date", crop.collectionDate ? new Date(crop.collectionDate.toNumber()*1000).toLocaleDateString("en-IN") : "N/A"]
                      ].map(([l,v]) => (
                        <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    {/* ══ ACTION SECTION ══ */}

                    {/* ✅ Lab Approved */}
                    {statusNum === 4 && (
                      <div>
                        <div style={{
                          background: "rgba(109,206,63,0.08)", border: "1px solid rgba(109,206,63,0.2)",
                          borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#6dce3f", fontWeight: 600, marginBottom: 8,
                        }}>
                          ✅ Lab Approved — Ready for dispatch
                        </div>
                        <button onClick={() => showQR(cropPda, crop, farmer)} style={{
                          width:"100%", background:"rgba(109,206,63,0.1)",
                          border:"1px solid rgba(109,206,63,0.3)", borderRadius:9,
                          color:"#6dce3f", fontWeight:700, fontSize:12, padding:"9px",
                          cursor:"pointer", fontFamily:"inherit",
                          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                        }}>📱 View Lab QR Certificate</button>
                      </div>
                    )}

                    {/* ⏳ In Progress */}
                    {(statusNum === 1 || statusNum === 2 || statusNum === 3) && (
                      <div style={{
                        background: "rgba(160,109,206,0.08)", border: "1px solid rgba(160,109,206,0.25)",
                        borderRadius: 8, padding: "10px 14px",
                      }}>
                        <div style={{ fontSize: 12, color: "#a06dce", fontWeight: 600, marginBottom: 4 }}>
                          ⏳ In Progress — {STATUS_MAP[statusNum]}
                        </div>
                        {!isDefault(crop.broker) && (
                          <div style={{ fontSize: 10, color: "rgba(240,247,235,0.35)", fontFamily: "monospace" }}>
                            Broker: {crop.broker?.toString().slice(0,14)}…
                          </div>
                        )}
                      </div>
                    )}

                    {/* ❌ Rejected — smart logic */}
                    {isRejected && (() => {
                      const labRejected = !isDefault(crop.lab);
                      return (
                        <div>
                          {/* Banner */}
                          <div style={{
                            background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)",
                            borderRadius: 8, padding: "8px 12px",
                            fontSize: 11, color: "#e05c5c", fontWeight: 600, marginBottom: 8,
                          }}>
                            {labRejected ? "❌ Lab Rejected" : "❌ Broker Rejected — Re-assign to a Broker"}
                          </div>

                          {/* QR button — always shown */}
                          <button onClick={() => showQR(cropPda, crop, farmer)} style={{
                            width:"100%", background:"rgba(224,92,92,0.1)",
                            border:"1px solid rgba(224,92,92,0.3)", borderRadius:9,
                            color:"#e05c5c", fontWeight:700, fontSize:12, padding:"9px",
                            cursor:"pointer", fontFamily:"inherit",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            marginBottom: labRejected ? 0 : 10,
                          }}>
                            📱 View Lab Rejection QR
                          </button>

                          {/* BROKER REJECTED only → Re-assign Broker */}
                          {!labRejected && (
                            <div>
                              <div className="flabel" style={{ marginBottom: 5 }}>Re-Assign to Broker</div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <select className="inline-select" value={brokerSel[cropPda] ?? 0}
                                  onChange={(e) => setBrokerSel((p) => ({ ...p, [cropPda]: Number(e.target.value) }))}>
                                  {BROKERS.map((b,i) => <option key={i} value={i}>{b.label}</option>)}
                                </select>
                                <button className="btn-accept"
                                  style={{ flexShrink:0, flex:"unset", padding:"0 18px", fontSize:13 }}
                                  disabled={assigning === cropPda}
                                  onClick={() => assignBroker(cropPda)}>
                                  {assigning === cropPda ? "…" : "🔄 Re-Assign"}
                                </button>
                              </div>
                              {txSigs[cropPda] && (
                                <div className="tx-link" style={{ marginTop: 8 }}>
                                  <a href={"https://explorer.solana.com/tx/"+txSigs[cropPda]+"?cluster=devnet"} target="_blank" rel="noreferrer">
                                    View transaction ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 🔔 Not yet assigned — Assign Broker */}
                    {statusNum === 0 && (
                      <div>
                        <div className="flabel" style={{ marginBottom: 5 }}>Assign Broker</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <select className="inline-select" value={brokerSel[cropPda] ?? 0}
                            onChange={(e) => setBrokerSel((p) => ({ ...p, [cropPda]: Number(e.target.value) }))}>
                            {BROKERS.map((b,i) => <option key={i} value={i}>{b.label}</option>)}
                          </select>
                          <button className="btn-accept"
                            style={{ flexShrink: 0, flex: "unset", padding: "0 18px", fontSize: 13 }}
                            disabled={assigning === cropPda}
                            onClick={() => assignBroker(cropPda)}>
                            {assigning === cropPda ? "…" : "Assign"}
                          </button>
                        </div>
                        {txSigs[cropPda] && (
                          <div className="tx-link" style={{ marginTop: 8 }}>
                            <a href={"https://explorer.solana.com/tx/"+txSigs[cropPda]+"?cluster=devnet"} target="_blank" rel="noreferrer">
                              View transaction ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}