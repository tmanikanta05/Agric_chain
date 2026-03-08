import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");

const LABS = [
  { label: "Lab 1 - AgriTest Certified", pubkey: "DLgx9THCwkwjYSisSWkLUfJG8UdWS1NrsiKhk6yNuemG" },
  { label: "Lab 2 - GreenQuality Labs",  pubkey: "2Xqq5TNNi9bhwpEC2xRS78z9YD3C5UUAAhndSLrYmcLY" },
];

const DISTRICT_MAP   = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
const CROP_MAP       = {1:"🌾 Paddy",2:"🌿 Wheat",3:"☁️ Cotton",4:"🥦 Vegetables",5:"🍎 Fruits"};
const STATUS_MAP     = {0:"Registered",1:"Broker Assigned",2:"With Manufacturer",3:"In Lab",4:"Approved",5:"Rejected"};
const STATUS_CLR     = {0:"#6dce3f",1:"#f0a500",2:"#3fa8ce",3:"#a06dce",4:"#6dce3f",5:"#e05c5c"};
const PROC_TYPES     = {1:"Raw",2:"Cleaned",3:"Dried",4:"Milled",5:"Processed"};
const QUALITY_GRADES = {1:"Grade A",2:"Grade B",3:"Grade C",4:"Rejected"};
const PKG_TYPES      = {1:"Jute Bag",2:"Plastic Bag",3:"Carton Box",4:"Bulk"};

const DEFAULT_FORM = {
  processingType:"1", qualityGrade:"1", moisture:"",
  packageType:"1", totalPackages:"", packagingMaterial:"", labIdx:"0",
};

/* ── Build QR data string ── */
const buildQRData = (cropPda, crop, farmer) => {
  const status = crop.status === 4 ? "APPROVED ✓" : crop.status === 5 ? "REJECTED ✗" : "IN LAB";
  const rows = [
    ["AGRICHAIN",    "Blockchain Traceability"],
    ["Status",       status],
    ["─────────",    "──────────────────────"],
    ["Crop ID",      crop.cropId || "—"],
    ["Farmer",       farmer?.name || "Unknown"],
    ["District",     DISTRICT_MAP[farmer?.district] || "—"],
    ["─────────",    "──────────────────────"],
    ["Crop Type",    CROP_MAP[crop.cropType]?.replace(/\p{Emoji}/u,"").trim() || "—"],
    ["Final Weight", (crop.finalWeight?.toString() || "—") + " kg"],
    ["Processing",   PROC_TYPES[crop.processingType] || "—"],
    ["Grade",        QUALITY_GRADES[crop.qualityGrade] || "—"],
    ["Moisture",     crop.moisture ? crop.moisture + "%" : "—"],
    ["Packages",     crop.totalPackages?.toString() || "—"],
    ["Pkg Type",     PKG_TYPES[crop.packageType] || "—"],
    ["Material",     crop.packagingMaterial || "—"],
    ["─────────",    "──────────────────────"],
    ["Test Results", (crop.testResults || []).join(", ") || "—"],
    ["─────────",    "──────────────────────"],
    ["Verified on",  "Solana Devnet"],
    ["Explorer",     "https://explorer.solana.com/address/" + cropPda + "?cluster=devnet"],
  ];
  const w = Math.max(...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => k.padEnd(w) + "  " + v).join("\n");
};

/* ── QR Modal (shared with Lab) ── */
function QRModal({ data, approved, onClose }) {
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
        boxShadow:`0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${approved ? "rgba(109,206,63,0.1)" : "rgba(224,92,92,0.1)"}`,
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{
          fontSize:13, fontWeight:700, letterSpacing:"2px", textTransform:"uppercase",
          color: approved ? "#6dce3f" : "#e05c5c", marginBottom:4,
        }}>
          {approved ? "✅ Lab Approved" : "❌ Lab Rejected"}
        </div>
        <div style={{ fontSize:11, color:"rgba(240,247,235,0.35)", marginBottom:20 }}>
          {approved ? "Scan to verify crop quality certificate" : "Scan to verify — crop returned to collector"}
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
          Scan reveals: Crop ID · Farmer · District · Crop Type ·
          Weight · Grade · Moisture · Test Results · Solana Explorer link
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <button onClick={download} style={{
            background:"linear-gradient(135deg,#3da81c,#6dce3f)",
            border:"none", borderRadius:9, color:"#050a03",
            fontWeight:700, fontSize:12, padding:"9px 18px",
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 3px 12px rgba(109,206,63,0.3)",
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

export default function Manufacturer() {
  const { publicKey, connected } = useWallet();
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [crops,      setCrops]      = useState([]);
  const [farmers,    setFarmers]    = useState({});
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [forms,      setForms]      = useState({});
  const [processing, setProcessing] = useState(null);
  const [txSigs,     setTxSigs]     = useState({});
  const [qrModal,    setQrModal]    = useState(null); // { data, approved }

  /* Load QRCode library */
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
      const raw = await connection.getProgramAccounts(PROGRAM_ID, { commitment:"confirmed" });
      const allCrops = [];
      const fMap = {};
      for (const { pubkey, account } of raw) {
        try { allCrops.push({ publicKey:pubkey, account:program.coder.accounts.decode("crop", account.data) }); continue; } catch(_) {}
        try { fMap[pubkey.toString()] = program.coder.accounts.decode("farmer", account.data); } catch(_) {}
      }
      const myCrops = allCrops.filter(({account}) => account.manufacturer?.toString() === publicKey.toString());
      setCrops(myCrops); setFarmers(fMap);
      const initForms = {};
      myCrops.forEach(({publicKey:pk}) => { if (!forms[pk.toString()]) initForms[pk.toString()] = {...DEFAULT_FORM}; });
      setForms((p) => ({...initForms,...p}));
    } catch(err) { console.error(err); setError("Failed to fetch from blockchain."); }
    finally { setLoading(false); }
  }, [program, publicKey]);

  useEffect(() => { if (connected && program) fetchAll(); }, [connected, program]);

  const setField = (cropPda, key, val) =>
    setForms((p) => ({...p,[cropPda]:{...(p[cropPda]||DEFAULT_FORM),[key]:val}}));

  const submitProcess = async (cropPda) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    const form = forms[cropPda];
    if (!form) return;
    if (!form.moisture)          { alert("Enter moisture %"); return; }
    if (!form.totalPackages)     { alert("Enter total packages"); return; }
    if (!form.packagingMaterial) { alert("Enter packaging material"); return; }
    let labKey;
    try { labKey = new PublicKey(LABS[Number(form.labIdx)].pubkey); }
    catch { alert("Invalid lab address"); return; }
    setProcessing(cropPda);
    try {
      const tx = await program.methods
        .manufacturerProcess(
          Number(form.processingType), Number(form.qualityGrade), Number(form.moisture),
          Number(form.packageType), Number(form.totalPackages), form.packagingMaterial, labKey
        )
        .accounts({ manufacturer:publicKey, crop:new PublicKey(cropPda) })
        .rpc({ commitment:"confirmed" });
      setTxSigs((p) => ({...p,[cropPda]:tx}));
      alert("Processed & sent to lab ✅");
      fetchAll();
    } catch(err) {
      console.error(err);
      alert("Failed ❌\n"+(err?.logs?.find(l=>l.includes("Error"))||err?.message));
    } finally { setProcessing(null); }
  };

  const showQR = (cropPda, crop, farmer) =>
    setQrModal({ data: buildQRData(cropPda, crop, farmer), approved: crop.status === 4 });

  const isDefault = (pk) => !pk || pk.toString() === "11111111111111111111111111111111";

  return (
    <>
      {qrModal && <QRModal data={qrModal.data} approved={qrModal.approved} onClose={() => setQrModal(null)} />}

      <div className="page">
        <div className="step-badge">Step 4 of 5</div>
        <div className="page-tag">🏭 Manufacturer Dashboard</div>
        <h1 className="page-title">Process <em>&amp; Package</em></h1>
        <p className="page-sub">Crops assigned to your wallet — fetched live from Solana Devnet</p>

        {connected && publicKey && (
          <div className="wpill"><span className="wpill-dot"/>
            {publicKey.toString().slice(0,6)}…{publicKey.toString().slice(-4)}
          </div>
        )}

        {!connected ? (
          <div className="card" style={{maxWidth:400}}>
            <div className="no-wallet"><div className="no-wallet-icon">🔒</div><p>Connect the Manufacturer Phantom wallet</p></div>
          </div>
        ) : (
          <div style={{width:"100%",maxWidth:1100}}>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <button className="loc-btn" onClick={fetchAll} disabled={loading} style={{height:40,padding:"0 20px"}}>
                {loading ? "Fetching…" : "🔄 Refresh from Chain"}
              </button>
              {error && <span style={{color:"#e05c5c",fontSize:13,alignSelf:"center"}}>{error}</span>}
            </div>

            {loading ? (
              <div style={{display:"flex",gap:12,color:"rgba(240,247,235,0.45)",fontSize:14,padding:"40px 0"}}>
                <span className="spinner"/> Fetching your crops…
              </div>
            ) : crops.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(240,247,235,0.45)"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:0.4}}>🏭</div>
                <p>No crops assigned to your manufacturer wallet yet.</p>
                <p style={{fontSize:11,marginTop:6,fontFamily:"monospace"}}>{publicKey.toString()}</p>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))",gap:20}}>
                {crops.map(({publicKey:cropPk, account:crop}) => {
                  const farmer    = farmers[crop.farmer?.toString()] || null;
                  const cropPda   = cropPk.toString();
                  const statusNum = crop.status ?? 0;
                  const sentToLab = statusNum >= 3;
                  const labDone   = statusNum === 4 || statusNum === 5;
                  const approved  = statusNum === 4;
                  const form      = forms[cropPda] || DEFAULT_FORM;
                  const txSig     = txSigs[cropPda];

                  return (
                    <div key={cropPda} className="crop-card" style={{
                      borderColor: labDone
                        ? (approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)")
                        : "rgba(255,255,255,0.1)",
                    }}>
                      {/* Header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",color:"#6dce3f",textTransform:"uppercase"}}>
                            Crop ID: {crop.cropId||"—"}
                          </div>
                          <div style={{fontSize:10,color:"rgba(240,247,235,0.35)",fontFamily:"monospace",marginTop:2}}>
                            {cropPda.slice(0,10)}…{cropPda.slice(-6)}
                          </div>
                        </div>
                        <span className="status-badge" style={{color:STATUS_CLR[statusNum],borderColor:STATUS_CLR[statusNum]}}>
                          {STATUS_MAP[statusNum]}
                        </span>
                      </div>

                      <div className="clabel">Farmer Info</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                        {[["Name",farmer?.name||"—"],["Mobile",farmer?.mobile||"—"],
                          ["District",DISTRICT_MAP[farmer?.district]||"—"],["Location",farmer?.location||"—"]
                        ].map(([l,v]) => (
                          <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                        ))}
                      </div>

                      <div className="card-divider"/>

                      <div className="clabel">Crop Info</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
                        {[["Crop Type",CROP_MAP[crop.cropType]||"—"],
                          ["Approx Wt",(crop.approxWeight?.toString()||"—")+" kg"],
                          ["Final Wt",crop.finalWeight?.toString()>"0"?crop.finalWeight.toString()+" kg":"—"],
                          ["Collection",crop.collectionDate?new Date(crop.collectionDate.toNumber()*1000).toLocaleDateString("en-IN"):"—"]
                        ].map(([l,v]) => (
                          <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                        ))}
                      </div>

                      <div className="card-divider"/>

                      {/* ══ LAB RESULT + QR (status 4 or 5) ══ */}
                      {labDone && (
                        <div style={{marginBottom:14}}>
                          <div style={{
                            background: approved ? "rgba(109,206,63,0.08)" : "rgba(224,92,92,0.08)",
                            border:`1px solid ${approved ? "rgba(109,206,63,0.25)" : "rgba(224,92,92,0.25)"}`,
                            borderRadius:10, padding:"10px 14px", marginBottom:10,
                          }}>
                            <div style={{fontSize:13,fontWeight:700,color:approved?"#6dce3f":"#e05c5c",marginBottom:4}}>
                              {approved ? "✅ Lab Approved — Crop Certified" : "❌ Lab Rejected — Crop Returned"}
                            </div>
                            {crop.testResults?.length > 0 && (
                              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
                                {crop.testResults.map((r,i) => (
                                  <span key={i} style={{
                                    fontSize:10,padding:"2px 8px",borderRadius:999,
                                    background:"rgba(109,206,63,0.1)",border:"1px solid rgba(109,206,63,0.2)",
                                    color:"#6dce3f",
                                  }}>{r}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QR Button */}
                          <button onClick={() => showQR(cropPda, crop, farmer)} style={{
                            width:"100%",
                            background: approved ? "rgba(109,206,63,0.1)" : "rgba(224,92,92,0.1)",
                            border:`1px solid ${approved ? "rgba(109,206,63,0.3)" : "rgba(224,92,92,0.3)"}`,
                            borderRadius:9, color:approved?"#6dce3f":"#e05c5c",
                            fontWeight:700, fontSize:12, padding:"10px",
                            cursor:"pointer", fontFamily:"inherit",
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                          }}>
                            📱 View Lab QR Certificate
                          </button>
                          <div className="card-divider" style={{marginTop:12}}/>
                        </div>
                      )}

                      {/* ══ SENT TO LAB (status 3) ══ */}
                      {sentToLab && !labDone && (
                        <div>
                          <div style={{fontSize:12,color:"#a06dce",marginBottom:10,fontWeight:600}}>⏳ Sent to Lab — Awaiting result</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {[["Processing",PROC_TYPES[crop.processingType]||"—"],
                              ["Grade",QUALITY_GRADES[crop.qualityGrade]||"—"],
                              ["Moisture",crop.moisture?crop.moisture+"%":"—"],
                              ["Packages",crop.totalPackages?.toString()||"—"],
                              ["Pkg Type",PKG_TYPES[crop.packageType]||"—"],
                              ["Material",crop.packagingMaterial||"—"]
                            ].map(([l,v]) => (
                              <div key={l}><div className="flabel">{l}</div><div className="fval" style={{fontSize:12}}>{v}</div></div>
                            ))}
                          </div>
                          {!isDefault(crop.lab) && (
                            <div style={{marginTop:8,fontSize:11,color:"rgba(240,247,235,0.4)"}}>
                              Lab: {crop.lab?.toString().slice(0,16)}…
                            </div>
                          )}
                        </div>
                      )}

                      {/* ══ PROCESS FORM (status 2) ══ */}
                      {!sentToLab && (
                        <>
                          <div className="clabel">Processing Details</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            <div>
                              <div className="flabel" style={{marginBottom:5}}>Processing Type</div>
                              <select className="inline-select" value={form.processingType}
                                onChange={(e) => setField(cropPda,"processingType",e.target.value)}>
                                {Object.entries(PROC_TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="flabel" style={{marginBottom:5}}>Quality Grade</div>
                              <select className="inline-select" value={form.qualityGrade}
                                onChange={(e) => setField(cropPda,"qualityGrade",e.target.value)}>
                                {Object.entries(QUALITY_GRADES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                          </div>

                          <div style={{marginTop:10}}>
                            <div className="flabel" style={{marginBottom:5}}>Moisture (%)</div>
                            <input type="number" placeholder="e.g. 14" min="0" max="100"
                              className="inline-input" value={form.moisture}
                              onChange={(e) => setField(cropPda,"moisture",e.target.value)} />
                          </div>

                          <div className="clabel" style={{marginTop:14}}>Packaging</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                            <div>
                              <div className="flabel" style={{marginBottom:5}}>Package Type</div>
                              <select className="inline-select" value={form.packageType}
                                onChange={(e) => setField(cropPda,"packageType",e.target.value)}>
                                {Object.entries(PKG_TYPES).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="flabel" style={{marginBottom:5}}>Total Packages</div>
                              <input type="number" placeholder="e.g. 20" min="1"
                                className="inline-input" value={form.totalPackages}
                                onChange={(e) => setField(cropPda,"totalPackages",e.target.value)} />
                            </div>
                          </div>

                          <div style={{marginTop:10}}>
                            <div className="flabel" style={{marginBottom:5}}>Packaging Material</div>
                            <input type="text" placeholder="e.g. HDPE 50kg bags"
                              className="inline-input" value={form.packagingMaterial}
                              onChange={(e) => setField(cropPda,"packagingMaterial",e.target.value)} />
                          </div>

                          <div className="clabel" style={{marginTop:14}}>Assign Lab</div>
                          <div>
                            <div className="flabel" style={{marginBottom:5}}>Select Lab</div>
                            <select className="inline-select" value={form.labIdx}
                              onChange={(e) => setField(cropPda,"labIdx",e.target.value)}>
                              {LABS.map((lab,i) => <option key={i} value={i}>{lab.label}</option>)}
                            </select>
                          </div>

                          <button className="btn-process" onClick={() => submitProcess(cropPda)} disabled={processing===cropPda}>
                            {processing===cropPda ? "Processing…" : "🏭 Process & Send to Lab →"}
                          </button>

                          {txSig && (
                            <div className="tx-link">
                              <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer">
                                View transaction ↗
                              </a>
                            </div>
                          )}
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