import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");
const DISTRICTS = [{v:"1",l:"Adilabad"},{v:"2",l:"Bhupalpally"},{v:"3",l:"Suryapet"},{v:"4",l:"Rangareddy"},{v:"5",l:"Warangal"}];
const CROPS     = [{v:"1",l:"Paddy"},{v:"2",l:"Wheat"},{v:"3",l:"Cotton"},{v:"4",l:"Vegetables"},{v:"5",l:"Fruits"}];

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
    if (!connected || !publicKey)  { alert("Connect Phantom wallet first"); return; }
    if (!program)                  { alert("Program not initialized — reload page"); return; }
    if (!form.geoLocation)         { alert("Capture GPS location first"); return; }
    if (form.aadhaar.length < 4)   { alert("Aadhaar must be at least 4 digits"); return; }
    if (form.mobile.length !== 10) { alert("Mobile must be 10 digits"); return; }

    setLoading(true); setTxSig(""); setStatusMsg("Waiting for Phantom approval...");
    try {
      const [farmerPda] = PublicKey.findProgramAddressSync([Buffer.from("farmer"), publicKey.toBuffer()], PROGRAM_ID);
      const [cropPda]   = PublicKey.findProgramAddressSync([Buffer.from("crop"),   publicKey.toBuffer()], PROGRAM_ID);
      const timestamp   = Math.floor(new Date(form.collectionDate).getTime() / 1000);
      setStatusMsg("Sending transaction to Devnet...");
      const tx = await program.methods
        .registerFarmer(form.name, form.mobile, form.aadhaar, form.geoLocation,
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
              <label>Aadhaar (last 4 digits min)</label>
              <input type="text" placeholder="e.g. 1234" required onChange={f("aadhaar")} />
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
          </div>
        )}
      </div>
    </div>
  );
}