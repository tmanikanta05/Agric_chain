import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");

const DISTRICT_MAP   = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
const CROP_MAP       = {1:"Paddy",2:"Wheat",3:"Cotton",4:"Vegetables",5:"Fruits"};
const STATUS_MAP     = {0:"Registered",1:"Broker Assigned",2:"With Manufacturer",3:"In Lab",4:"✅ Approved",5:"❌ Rejected"};
const STATUS_CLR     = {0:"#6dce3f",1:"#f0a500",2:"#3fa8ce",3:"#a06dce",4:"#6dce3f",5:"#e05c5c"};
const PROC_TYPES     = {1:"Raw",2:"Cleaned",3:"Dried",4:"Milled",5:"Processed"};
const QUALITY_GRADES = {1:"Grade A",2:"Grade B",3:"Grade C",4:"Rejected"};
const PKG_TYPES      = {1:"Jute Bag",2:"Plastic Bag",3:"Carton Box",4:"Bulk"};

/* ── Build QR content as plain-text table (no mobile, no JSON) ── */
const buildQRData = (cropPda, crop, farmer) => {
  const status = crop.status === 4 ? "APPROVED ✓" : "REJECTED ✗";
  const rows = [
    ["AGRICHAIN",     "Blockchain Traceability"],
    ["Status",        status],
    ["───────────",   "────────────────────────"],
    ["Crop ID",       crop.cropId || "—"],
    ["Farmer",        farmer?.name || "Unknown"],
    ["District",      DISTRICT_MAP[farmer?.district] || "—"],
    ["───────────",   "────────────────────────"],
    ["Crop Type",     CROP_MAP[crop.cropType] || "—"],
    ["Final Weight",  (crop.finalWeight?.toString() || "—") + " kg"],
    ["Processing",    PROC_TYPES[crop.processingType] || "—"],
    ["Grade",         QUALITY_GRADES[crop.qualityGrade] || "—"],
    ["Moisture",      crop.moisture ? crop.moisture + "%" : "—"],
    ["Packages",      crop.totalPackages?.toString() || "—"],
    ["Pkg Type",      PKG_TYPES[crop.packageType] || "—"],
    ["Material",      crop.packagingMaterial || "—"],
    ["───────────",   "────────────────────────"],
    ["Test Results",  (crop.testResults || []).join(", ") || "—"],
    ["───────────",   "────────────────────────"],
    ["Verified on",   "Solana Devnet"],
    ["Explorer",      `https://explorer.solana.com/address/${cropPda}?cluster=devnet`],
  ];
  const col1Width = Math.max(...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => `${k.padEnd(col1Width)}  ${v}`).join("\n");
};

const drawQR = async (canvasRef, data) => {
  if (!canvasRef.current || !window.QRCode) return;
  try {
    await window.QRCode.toCanvas(canvasRef.current, data, {
      width: 220, margin: 2,
      color: { dark: "#0a0f07", light: "#6dce3f" },
    });
  } catch (err) { console.error("QR error:", err); }
};

/* ── QR Modal ── */
function QRModal({ data, onClose, approved }) {
  const canvasRef = useRef(null);
  useEffect(() => { drawQR(canvasRef, data); }, [data]);

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
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "rgba(8,18,4,0.97)",
        border: `1px solid ${approved ? "rgba(109,206,63,0.4)" : "rgba(224,92,92,0.4)"}`,
        borderRadius: 22, padding: "34px 28px", textAlign: "center",
        maxWidth: 340, width: "90%",
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${approved ? "rgba(109,206,63,0.1)" : "rgba(224,92,92,0.1)"}`,
      }} onClick={(e) => e.stopPropagation()}>

        {/* Title */}
        <div style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "2px",
          textTransform: "uppercase",
          color: approved ? "#6dce3f" : "#e05c5c",
          marginBottom: 4,
        }}>
          {approved ? "✅ Crop Approved" : "❌ Crop Rejected"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(240,247,235,0.35)", marginBottom: 20 }}>
          {approved ? "Scan to verify — Manufacturer handoff" : "Scan to verify — Collector re-routing"}
        </div>

        {/* QR canvas */}
        <div style={{
          display: "inline-block", padding: 10, borderRadius: 14,
          background: approved ? "rgba(109,206,63,0.08)" : "rgba(224,92,92,0.08)",
          border: `1px solid ${approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)"}`,
          marginBottom: 18,
        }}>
          <canvas ref={canvasRef} style={{ display: "block", borderRadius: 8 }} />
        </div>

        {/* What scanning reveals note */}
        <div style={{
          fontSize: 10, color: "rgba(240,247,235,0.35)",
          marginBottom: 18, lineHeight: 1.6,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "8px 12px",
          textAlign: "left",
          fontFamily: "monospace",
        }}>
          Scan reveals: Crop ID · Farmer · District · Crop Type ·
          Weight · Grade · Moisture · Test Results · Solana Explorer link
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={download} style={{
            background: "linear-gradient(135deg,#3da81c,#6dce3f)",
            border: "none", borderRadius: 9, color: "#050a03",
            fontWeight: 700, fontSize: 12, padding: "9px 18px",
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 3px 12px rgba(109,206,63,0.3)",
          }}>⬇ Download QR</button>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 9, color: "rgba(240,247,235,0.8)",
            fontSize: 12, padding: "9px 18px",
            cursor: "pointer", fontFamily: "inherit",
          }}>Close</button>
        </div>

      </div>
    </div>
  );
}

/* ── Main Lab Component ── */
export default function Lab() {
  const { publicKey, connected } = useWallet();
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [crops,        setCrops]        = useState([]);
  const [farmers,      setFarmers]      = useState({});
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [resultInputs, setResultInputs] = useState({});
  const [decisions,    setDecisions]    = useState({});
  const [submitting,   setSubmitting]   = useState(null);
  const [txSigs,       setTxSigs]       = useState({});
  const [qrModal,      setQrModal]      = useState(null);

  useEffect(() => {
    if (!window.QRCode) {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js";
      document.head.appendChild(s);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!program || !publicKey) return;
    setLoading(true); setError("");
    try {
      const raw = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed", filters: [{ memcmp: { offset: 0, bytes: "bLrwCTwwMB2" } }],
      });
      const allCrops = raw.map(({ pubkey, account }) => ({
        publicKey: pubkey, account: program.coder.accounts.decode("crop", account.data),
      }));
      const rawF = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed", filters: [{ memcmp: { offset: 0, bytes: "jXX2LSteZVk" } }],
      });
      const fMap = {};
      rawF.forEach(({ pubkey, account }) => {
        fMap[pubkey.toString()] = program.coder.accounts.decode("farmer", account.data);
      });
      const myCrops = allCrops.filter(({ account }) =>
        account.lab?.toString() === publicKey.toString() && account.status >= 3
      );
      setCrops(myCrops); setFarmers(fMap);
      const initD = {};
      myCrops.forEach(({ publicKey: pk }) => {
        if (decisions[pk.toString()] === undefined) initD[pk.toString()] = true;
      });
      setDecisions((p) => ({ ...initD, ...p }));
    } catch (err) { console.error(err); setError("Failed to fetch from blockchain."); }
    finally { setLoading(false); }
  }, [program, publicKey]);

  useEffect(() => { if (connected && program) fetchAll(); }, [connected, program]);

  const submitTest = async (cropPda, crop, farmer) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    const rawResults = resultInputs[cropPda] || "";
    if (!rawResults.trim()) { alert("Enter at least one test result"); return; }
    const resultsArr = rawResults.split(",").map(r => r.trim()).filter(Boolean);
    const approved   = decisions[cropPda] ?? true;
    setSubmitting(cropPda);
    try {
      const tx = await program.methods
        .labTest(resultsArr, approved)
        .accounts({ lab: publicKey, crop: new PublicKey(cropPda) })
        .rpc({ commitment: "confirmed" });
      setTxSigs((p) => ({ ...p, [cropPda]: tx }));
      const enrichedCrop = { ...crop, testResults: resultsArr, status: approved ? 4 : 5 };
      setQrModal({ data: buildQRData(cropPda, enrichedCrop, farmer), approved });
      alert(approved ? "Crop APPROVED ✅ — QR generated!" : "Crop REJECTED ❌ — QR generated");
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed ❌\n" + (err?.logs?.find(l => l.includes("Error")) || err?.message));
    } finally { setSubmitting(null); }
  };

  const showQR = (cropPda, crop, farmer) =>
    setQrModal({ data: buildQRData(cropPda, crop, farmer), approved: crop.status === 4 });

  return (
    <>
      {qrModal && <QRModal data={qrModal.data} approved={qrModal.approved} onClose={() => setQrModal(null)} />}

      <div className="page">
        <div className="step-badge">Step 5 of 5</div>
        <div className="page-tag">🔬 Lab Dashboard</div>
        <h1 className="page-title">Test <em>&amp; Certify</em></h1>
        <p className="page-sub">Crops assigned to your lab — approve or reject with QR generation</p>

        {connected && publicKey && (
          <div className="wpill">
            <span className="wpill-dot" />
            {publicKey.toString().slice(0, 6)}…{publicKey.toString().slice(-4)}
          </div>
        )}

        {!connected ? (
          <div className="card" style={{ maxWidth: 400 }}>
            <div className="no-wallet">
              <div className="no-wallet-icon">🔒</div>
              <p>Connect the Lab Phantom wallet</p>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 1100 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button className="loc-btn" onClick={fetchAll} disabled={loading} style={{ height: 40, padding: "0 20px" }}>
                {loading ? "Fetching…" : "🔄 Refresh from Chain"}
              </button>
              {error && <span style={{ color: "#e05c5c", fontSize: 13, alignSelf: "center" }}>{error}</span>}
            </div>

            {loading ? (
              <div style={{ display: "flex", gap: 12, color: "rgba(240,247,235,0.45)", fontSize: 14, padding: "40px 0" }}>
                <span className="spinner" /> Fetching lab-assigned crops…
              </div>
            ) : crops.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(240,247,235,0.45)" }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🔬</div>
                <p>No crops assigned to your lab wallet yet.</p>
                <p style={{ fontSize: 11, marginTop: 6, fontFamily: "monospace" }}>{publicKey.toString()}</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
                {crops.map(({ publicKey: cropPk, account: crop }) => {
                  const farmer    = farmers[crop.farmer?.toString()] || null;
                  const cropPda   = cropPk.toString();
                  const statusNum = crop.status ?? 0;
                  const decided   = statusNum === 4 || statusNum === 5;
                  const approved  = statusNum === 4;
                  const txSig     = txSigs[cropPda];

                  return (
                    <div key={cropPda} className="crop-card" style={{
                      borderColor: decided
                        ? (approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)")
                        : "rgba(255,255,255,0.1)",
                    }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#6dce3f", textTransform: "uppercase" }}>
                            Crop ID: {crop.cropId || "—"}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(240,247,235,0.35)", fontFamily: "monospace", marginTop: 2 }}>
                            {cropPda.slice(0, 10)}…{cropPda.slice(-6)}
                          </div>
                        </div>
                        <span className="status-badge" style={{ color: STATUS_CLR[statusNum], borderColor: STATUS_CLR[statusNum] }}>
                          {STATUS_MAP[statusNum]}
                        </span>
                      </div>

                      {/* Farmer info — no mobile */}
                      <div className="clabel">Farmer Info</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                        {[
                          ["Name",     farmer?.name || "—"],
                          ["District", DISTRICT_MAP[farmer?.district] || "—"],
                          ["Location", farmer?.location || "—"],
                        ].map(([l, v]) => (
                          <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                        ))}
                      </div>

                      <div className="card-divider" />

                      {/* Crop & Processing */}
                      <div className="clabel">Crop &amp; Processing</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
                        {[
                          ["Crop Type",  CROP_MAP[crop.cropType] || "—"],
                          ["Final Wt",   (crop.finalWeight?.toString() || "—") + " kg"],
                          ["Processing", PROC_TYPES[crop.processingType] || "—"],
                          ["Grade",      QUALITY_GRADES[crop.qualityGrade] || "—"],
                          ["Moisture",   crop.moisture ? crop.moisture + "%" : "—"],
                          ["Packages",   crop.totalPackages?.toString() || "—"],
                          ["Pkg Type",   PKG_TYPES[crop.packageType] || "—"],
                          ["Material",   crop.packagingMaterial || "—"],
                        ].map(([l, v]) => (
                          <div key={l}><div className="flabel">{l}</div><div className="fval" style={{ fontSize: 12 }}>{v}</div></div>
                        ))}
                      </div>

                      <div className="card-divider" />

                      {decided ? (
                        <div>
                          <div style={{ fontSize: 12, color: approved ? "#6dce3f" : "#e05c5c", marginBottom: 10, fontWeight: 700 }}>
                            {approved ? "✅ Approved — QR sent to Manufacturer" : "❌ Rejected — QR sent to Collector"}
                          </div>

                          {crop.testResults?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div className="flabel" style={{ marginBottom: 6 }}>Test Results</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {crop.testResults.map((r, i) => (
                                  <span key={i} style={{
                                    fontSize: 11, padding: "3px 10px", borderRadius: 999,
                                    background: "rgba(109,206,63,0.1)", border: "1px solid rgba(109,206,63,0.25)",
                                    color: "#6dce3f",
                                  }}>{r}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{
                            fontSize: 11, padding: "10px 14px", borderRadius: 10, marginBottom: 12,
                            background: approved ? "rgba(109,206,63,0.05)" : "rgba(224,92,92,0.05)",
                            border: `1px solid ${approved ? "rgba(109,206,63,0.18)" : "rgba(224,92,92,0.18)"}`,
                            color: approved ? "#6dce3f" : "#e05c5c",
                          }}>
                            {approved
                              ? "🏭 Next: Manufacturer receives QR for final product handoff"
                              : "🚛 Next: Collector receives QR — crop needs re-inspection"}
                          </div>

                          <button onClick={() => showQR(cropPda, crop, farmer)} style={{
                            width: "100%",
                            background: approved ? "rgba(109,206,63,0.1)" : "rgba(224,92,92,0.1)",
                            border: `1px solid ${approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)"}`,
                            borderRadius: 9, color: approved ? "#6dce3f" : "#e05c5c",
                            fontWeight: 700, fontSize: 12, padding: "10px",
                            cursor: "pointer", fontFamily: "inherit",
                          }}>📱 Show QR Code</button>

                          {txSig && (
                            <div className="tx-link" style={{ marginTop: 8 }}>
                              <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer">
                                View transaction ↗
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="clabel">Lab Test Results</div>
                          <div style={{ marginBottom: 10 }}>
                            <div className="flabel" style={{ marginBottom: 5 }}>Enter Results (comma-separated)</div>
                            <input type="text"
                              placeholder="e.g. Moisture:12%, Purity:98%, Pesticide:None"
                              className="inline-input"
                              value={resultInputs[cropPda] || ""}
                              onChange={(e) => setResultInputs((p) => ({ ...p, [cropPda]: e.target.value }))} />
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <div className="flabel" style={{ marginBottom: 5 }}>Decision</div>
                            <select className="inline-select"
                              value={decisions[cropPda] ? "true" : "false"}
                              onChange={(e) => setDecisions((p) => ({ ...p, [cropPda]: e.target.value === "true" }))}>
                              <option value="true">✅ Approve — Send QR to Manufacturer</option>
                              <option value="false">❌ Reject — Send QR to Collector</option>
                            </select>
                          </div>

                          <button
                            onClick={() => submitTest(cropPda, crop, farmer)}
                            disabled={submitting === cropPda}
                            className="btn-process"
                            style={{
                              background: submitting === cropPda
                                ? "rgba(109,206,63,0.25)"
                                : decisions[cropPda]
                                  ? "linear-gradient(135deg,#3da81c,#6dce3f)"
                                  : "linear-gradient(135deg,#b82a2a,#e05c5c)",
                              color: decisions[cropPda] ? "#050a03" : "#fff",
                              boxShadow: decisions[cropPda]
                                ? "0 4px 16px rgba(109,206,63,0.28)"
                                : "0 4px 16px rgba(224,92,92,0.25)",
                            }}
                          >
                            {submitting === cropPda
                              ? "Submitting…"
                              : decisions[cropPda]
                                ? "✅ Approve & Generate QR →"
                                : "❌ Reject & Generate QR →"}
                          </button>
                        </>
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
