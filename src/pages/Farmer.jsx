import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");
const DISTRICTS = [{v:"1",l:"Adilabad"},{v:"2",l:"Bhupalpally"},{v:"3",l:"Suryapet"},{v:"4",l:"Rangareddy"},{v:"5",l:"Warangal"}];
const CROPS     = [{v:"1",l:"🌾 Paddy"},{v:"2",l:"🌿Wheat"},{v:"3",l:"☁️Cotton"},{v:"4",l:"🥦Vegetables"},{v:"5",l:"🍎Fruits"}];

/* ── SHA-256 hash via Web Crypto API (salted) ── */
async function hashAadhaar(aadhaar) {
  const salt    = "agrichain_2026_devnet";
  const encoder = new TextEncoder();
  const data     = encoder.encode(salt + aadhaar.trim());
  const hashBuf  = await crypto.subtle.digest("SHA-256", data);
  const hashArr  = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Farmer() {
  const { publicKey, connected } = useWallet();
  const ctx = useAnchor();
  const program = ctx?.program ?? null;

  const [form, setForm] = useState({
    name:"", mobile:"", aadhaar:"", geoLocation:"", district:"1", cropType:"1",
    approxWeight:"", collectionDate: new Date().toISOString().split("T")[0]
  });
  const [txSig,     setTxSig]     = useState("");
  const [cropId,    setCropId]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const locateMe = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((p) => ({ ...p, geoLocation: pos.coords.latitude.toFixed(5) + "," + pos.coords.longitude.toFixed(5) })),
      () => alert("Location access denied")
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!connected || !publicKey)       { alert("Connect Phantom wallet first"); return; }
    if (!program)                        { alert("Program not initialized — reload page"); return; }
    if (!form.geoLocation)              { alert("Capture GPS location first"); return; }
    if (!/^\d{12}$/.test(form.aadhaar)) { alert("Aadhaar must be exactly 12 digits"); return; }
    if (form.mobile.length !== 10)      { alert("Mobile must be 10 digits"); return; }

    setLoading(true); setTxSig(""); setStatusMsg("Hashing Aadhaar...");
    try {
      const aadhaarHash = await hashAadhaar(form.aadhaar);
      const [farmerPda] = PublicKey.findProgramAddressSync([Buffer.from("farmer"), publicKey.toBuffer()], PROGRAM_ID);
      const [cropPda]   = PublicKey.findProgramAddressSync([Buffer.from("crop"),   publicKey.toBuffer()], PROGRAM_ID);
      const timestamp   = Math.floor(new Date(form.collectionDate).getTime() / 1000);
      setStatusMsg("Sending transaction to Devnet...");
      const tx = await program.methods
        .registerFarmer(form.name, form.mobile, aadhaarHash, form.geoLocation,
          Number(form.district), Number(form.cropType),
          new anchor.BN(Number(form.approxWeight)), new anchor.BN(timestamp))
        .accounts({ authority: publicKey, farmer: farmerPda, crop: cropPda, systemProgram: SystemProgram.programId })
        .rpc({ skipPreflight: false, commitment: "confirmed" });
      setTxSig(tx);
      setStatusMsg("Fetching Crop ID...");
      try {
        const cropAccount = await program.account.crop.fetch(cropPda);
        setCropId(cropAccount.cropId || "");
      } catch (_) {}
      setStatusMsg("");
      alert("Crop registered successfully");
    } catch (err) {
      console.error("TX ERROR:", err);
      console.log("PROGRAM LOGS:", err?.logs);
      const logMsg = err?.logs?.find((l) => l.includes("Error"));
      alert("Transaction failed: " + (logMsg || err?.message));
      setStatusMsg("");
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="step-badge">Step 1 of 5</div>
      <div className="page-tag">Farmer Registration</div>
      <h1 className="page-title">Register <em>Crop</em></h1>
      <p className="page-sub">Record your crop details permanently on Solana Devnet</p>

      {connected && publicKey && (
        <div className="wpill">
          <span className="wpill-dot" />
          {publicKey.toString().slice(0,6)}...{publicKey.toString().slice(-4)}
        </div>
      )}

      <div className="card">
        {!connected ? (
          <div className="no-wallet">
            <div className="no-wallet-icon">🔒</div>
            <p>Connect your Phantom wallet to register</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="slabel">Personal Info</div>
            <div className="row2">
              <div className="field">
                <label>Full Name</label>
                <input type="text" placeholder="e.g. Ravi Kumar" required onChange={f("name")} />
              </div>
              <div className="field">
                <label>Mobile</label>
                <input type="tel" placeholder="10-digit mobile" maxLength={10} required onChange={f("mobile")} />
              </div>
            </div>
            <div className="field">
              <label>Aadhaar Number (12 digits)</label>
              <input
                type="password"
                placeholder="Enter 12-digit Aadhaar"
                maxLength={12}
                inputMode="numeric"
                pattern="\d{12}"
                autoComplete="off"
                required
                onChange={f("aadhaar")}
              />
              <div style={{fontSize:10,color:"rgba(240,247,235,0.3)",marginTop:5,fontWeight:300,letterSpacing:"0.2px"}}>
         
              </div>
            </div>

            <div className="slabel">Location</div>
            <div className="field">
              <label>GPS Location</label>
              <div style={{ display:"flex", gap:8 }}>
                <input type="text" placeholder="lat,lng — click Locate Me" value={form.geoLocation} readOnly style={{ flex:1 }} />
                <button type="button" className="loc-btn" onClick={locateMe}>📍 Locate Me</button>
              </div>
            </div>
            <div className="field">
              <label>District</label>
              <select value={form.district} onChange={f("district")}>
                {DISTRICTS.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            </div>

            <div className="slabel">Crop Details</div>
            <div className="row2">
              <div className="field">
                <label>Crop Type</label>
                <select value={form.cropType} onChange={f("cropType")}>
                  {CROPS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Approx Weight (kg)</label>
                <input type="number" placeholder="e.g. 500" min="1" required onChange={f("approxWeight")} />
              </div>
            </div>
            <div className="field">
              <label>Collection Date</label>
              <input type="date" value={form.collectionDate} onChange={f("collectionDate")} />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Processing..." : "🌾 Register Crop On-Chain"}
            </button>

            {loading && (
              <div className="status-row">
                <span className="spinner" />{statusMsg}
              </div>
            )}
          </form>
        )}

        {txSig && (
          <div className="txbox">
            <div className="txbox-label">✅ Crop Registered On-Chain</div>
            {cropId && (
              <div className="cropid-box">Crop ID: {cropId}</div>
            )}
            <div style={{ fontSize:11, color:"rgba(240,247,235,0.4)", marginBottom:6 }}>
              Save this Crop ID and share with your Collector
            </div>
            <a href={"https://explorer.solana.com/tx/"+txSig+"?cluster=devnet"} target="_blank" rel="noreferrer">
              {txSig.slice(0,28)}...{txSig.slice(-6)} (view)
            </a>

            {/* 🖨️ Print Slip */}
            {cropId && (
              <button
                onClick={() => {
                  const DISTRICT_LABELS = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
                  const CROP_LABELS     = {1:"Paddy",2:"Wheat",3:"Cotton",4:"Vegetables",5:"Fruits"};
                  const mobile  = form.mobile ? "XXXXXX" + form.mobile.slice(-4) : "—";
                  const aadhaar = form.aadhaar ? "XXXX-XXXX-" + form.aadhaar.slice(-4) : "****";
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
                    .footer{text-align:center;margin-top:24px;padding-top:14px;border-top:1px solid #e0f0d8;font-size:9px;color:#aaa;letter-spacing:1px;}
                    .privacy{background:#fffbe6;border:1px solid #f0c040;border-radius:6px;padding:8px 12px;font-size:9px;color:#7a6000;margin-top:14px;}
                  </style></head><body>
                  <div class="header">
                    <div class="logo">🌾 AGRICHAIN</div>
                    <div class="sub">BLOCKCHAIN AGRICULTURAL SUPPLY CHAIN — SOLANA DEVNET</div>
                  </div>
                  <div class="crop-id">
                    <div class="crop-id-label">Crop ID</div>
                    <div class="crop-id-val">${cropId}</div>
                  </div>
                  <div class="section">
                    <div class="section-title">Farmer Details</div>
                    <div class="grid">
                      <div><div class="field-label">Name</div><div class="field-val">${form.name}</div></div>
                      <div><div class="field-label">Mobile</div><div class="field-val">${mobile}</div></div>
                      <div><div class="field-label">Aadhaar (last 4)</div><div class="field-val">${aadhaar}</div></div>
                      <div><div class="field-label">District</div><div class="field-val">${DISTRICT_LABELS[form.district]||"—"}</div></div>
                    </div>
                  </div>
                  <div class="section">
                    <div class="section-title">Crop Details</div>
                    <div class="grid">
                      <div><div class="field-label">Crop Type</div><div class="field-val">${CROP_LABELS[form.cropType]||"—"}</div></div>
                      <div><div class="field-label">Approx Weight</div><div class="field-val">${form.approxWeight} kg</div></div>
                      <div><div class="field-label">Status</div><div class="field-val">Registered ✅</div></div>
                      <div><div class="field-label">Date</div><div class="field-val">${new Date().toLocaleDateString("en-IN")}</div></div>
                    </div>
                  </div>
                  <div class="privacy">🔒 Aadhaar is protected — only last 4 digits shown. Original number never leaves your browser.</div>
                  <div class="footer">AgriChain · Solana Devnet · © 2026 · Auto-generated from blockchain data</div>
                  </body></html>`;
                  const w = window.open("", "_blank");
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => { w.print(); }, 500);
                }}
                style={{
                  marginTop: 14,
                  background: "linear-gradient(135deg,#f0c040,#f5d060)",
                  border: "none", borderRadius: 8,
                  color: "#3a2800", fontWeight: 700,
                  fontSize: 13, padding: "10px 22px",
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 4px 14px rgba(240,192,64,0.4)",
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", justifyContent: "center",
                }}
              >
                🖨️ Print Crop Slip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}