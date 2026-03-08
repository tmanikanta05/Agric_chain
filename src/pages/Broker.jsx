import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");

const MANUFACTURERS = [
  { label: "Manufacturer 1 - AgroPro Mills",       pubkey: "AkX9x6BhDDFaoPnir8kyz7gcn4FS3eSL9XbdyaxU32wF" },
  { label: "Manufacturer 2 - GreenPack Industries", pubkey: "8busLmxoBGYP4sG2xdRMhnCc8PCLmgP7TwxNSC9cH4BP" },
];

const DISTRICT_MAP = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
const CROP_MAP     = {1:"🌾 Paddy",2:"🌿 Wheat",3:"☁️ Cotton",4:"🥦 Vegetables",5:"🍎 Fruits"};
const STATUS_MAP   = {0:"Registered",1:"Broker Assigned",2:"With Manufacturer",3:"In Lab",4:"Approved",5:"Rejected"};
const STATUS_CLR   = {0:"#6dce3f",1:"#f0a500",2:"#3fa8ce",3:"#a06dce",4:"#6dce3f",5:"#e05c5c"};

export default function Broker() {
  const { publicKey, connected } = useWallet();
  const ctx        = useAnchor();
  const program    = ctx?.program ?? null;
  const connection = ctx?.connection ?? null;

  const [crops,      setCrops]      = useState([]);
  const [farmers,    setFarmers]    = useState({});
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [weights,    setWeights]    = useState({});
  const [mfgSel,     setMfgSel]     = useState({});
  const [processing, setProcessing] = useState(null);
  const [txSigs,     setTxSigs]     = useState({});

  const fetchAll = useCallback(async () => {
    if (!program || !publicKey) return;
    setLoading(true); setError("");
    try {
      /* Fetch ALL program accounts — decode each safely, no fragile discriminator filters */
      const raw = await connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed" });

      const allCrops = [];
      const fMap = {};

      for (const { pubkey, account } of raw) {
        try {
          const decoded = program.coder.accounts.decode("crop", account.data);
          allCrops.push({ publicKey: pubkey, account: decoded });
          continue;
        } catch (_) {}
        try {
          const decoded = program.coder.accounts.decode("farmer", account.data);
          fMap[pubkey.toString()] = decoded;
        } catch (_) {}
      }

      /* Only show crops assigned to this broker's wallet */
      setCrops(allCrops.filter(({ account }) =>
        account.broker?.toString() === publicKey.toString()
      ));
      setFarmers(fMap);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch from blockchain: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => { if (connected && program) fetchAll(); }, [connected, program]);

  const acceptCrop = async (cropPda) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    const weight = weights[cropPda];
    if (!weight || Number(weight) <= 0) { alert("Enter a valid final weight"); return; }
    const mfgIdx = mfgSel[cropPda] ?? 0;
    let mfgKey;
    try { mfgKey = new PublicKey(MANUFACTURERS[mfgIdx].pubkey); }
    catch { alert("Invalid manufacturer address"); return; }
    setProcessing(cropPda);
    try {
      const tx = await program.methods
        .brokerAccept(new anchor.BN(Number(weight)), mfgKey)
        .accounts({ broker:publicKey, crop:new PublicKey(cropPda) })
        .rpc({ commitment:"confirmed" });
      setTxSigs((p) => ({...p,[cropPda]:{sig:tx,action:"accepted"}}));
      alert("Crop accepted & sent to manufacturer ✅");
      fetchAll();
    } catch(err) {
      console.error(err);
      alert("Failed ❌\n"+(err?.logs?.find(l=>l.includes("Error"))||err?.message));
    } finally { setProcessing(null); }
  };

  const rejectCrop = async (cropPda) => {
    if (!publicKey) { alert("Connect wallet first"); return; }
    if (window.prompt("Enter rejection reason (optional):") === null) return;
    setProcessing(cropPda);
    try {
      const tx = await program.methods
        .brokerReject()
        .accounts({ broker:publicKey, crop:new PublicKey(cropPda) })
        .rpc({ commitment:"confirmed" });
      setTxSigs((p) => ({...p,[cropPda]:{sig:tx,action:"rejected"}}));
      alert("Crop REJECTED ❌ — Sent back to Collector");
      fetchAll();
    } catch(err) {
      console.error(err);
      alert("Failed ❌\n"+(err?.logs?.find(l=>l.includes("Error"))||err?.message));
    } finally { setProcessing(null); }
  };

  const isDefault = (pk) => !pk || pk.toString() === "11111111111111111111111111111111";

  return (
    <div className="page">
      <div className="step-badge">Step 3 of 5</div>
      <div className="page-tag">🤝 Broker Dashboard</div>
      <h1 className="page-title">My Assigned <em>Crops</em></h1>
      <p className="page-sub">Crops assigned to your wallet — fetched live from Solana Devnet</p>

      {connected && publicKey && (
        <div className="wpill"><span className="wpill-dot"/>
          {publicKey.toString().slice(0,6)}…{publicKey.toString().slice(-4)}
        </div>
      )}

      {!connected ? (
        <div className="card" style={{maxWidth:400}}>
          <div className="no-wallet"><div className="no-wallet-icon">🔒</div><p>Connect the Broker Phantom wallet</p></div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:1100}}>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <button className="loc-btn" onClick={fetchAll} disabled={loading} style={{height:40,padding:"0 20px"}}>
              {loading ? "Fetching…" : "🔄 Refresh from Chain"}
            </button>
            {error && <span style={{color:"#e05c5c",fontSize:13,alignSelf:"center"}}>{error}</span>}
          </div>

          {loading ? (
            <div style={{display:"flex",gap:12,color:"rgba(240,247,235,0.45)",fontSize:14,padding:"40px 0"}}>
              <span className="spinner"/> Fetching your assigned crops…
            </div>
          ) : crops.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(240,247,235,0.45)"}}>
              <div style={{fontSize:40,marginBottom:12,opacity:0.4}}>📦</div>
              <p>No crops assigned to your wallet yet.</p>
              <p style={{fontSize:12,marginTop:6,fontFamily:"monospace"}}>{publicKey.toString()}</p>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))",gap:18}}>
              {crops.map(({publicKey:cropPk, account:crop}) => {
                const farmer      = farmers[crop.farmer?.toString()] || null;
                const cropPda     = cropPk.toString();
                const statusNum   = crop.status ?? 0;
                const alreadySent = statusNum >= 2;
                const txInfo      = txSigs[cropPda];

                return (
                  <div key={cropPda} className="crop-card">
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
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      {[["Name",farmer?.name||"—"],["Mobile",farmer?.mobile||"—"],
                        ["District",DISTRICT_MAP[farmer?.district]||"—"],["Location",farmer?.location||"—"]
                      ].map(([l,v]) => (
                        <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    <div className="clabel">Crop Info</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                      {[["Type",CROP_MAP[crop.cropType]||"—"],
                        ["Approx Wt",(crop.approxWeight?.toString()||"—")+" kg"],
                        ["Collection",crop.collectionDate?new Date(crop.collectionDate.toNumber()*1000).toLocaleDateString("en-IN"):"—"],
                        ["Collector",isDefault(crop.collector)?"Not set":crop.collector?.toString().slice(0,10)+"…"]
                      ].map(([l,v]) => (
                        <div key={l}><div className="flabel">{l}</div><div className="fval">{v}</div></div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    {alreadySent ? (
                      <div>
                        <div style={{fontSize:12,color:"#6dce3f",marginBottom:4}}>✅ Sent to Manufacturer</div>
                        {!isDefault(crop.manufacturer) && (
                          <div style={{fontSize:11,color:"rgba(240,247,235,0.4)",fontFamily:"monospace"}}>
                            Mfg: {crop.manufacturer?.toString().slice(0,16)}…
                          </div>
                        )}
                        {crop.finalWeight?.toString() > "0" && (
                          <div style={{fontSize:11,color:"rgba(240,247,235,0.4)",marginTop:4}}>
                            Final Weight: {crop.finalWeight?.toString()} kg
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="clabel" style={{marginBottom:10}}>Accept Crop</div>
                        <div style={{marginBottom:10}}>
                          <div className="flabel" style={{marginBottom:5}}>Final Weight (kg)</div>
                          <input type="number" placeholder="Enter actual weight after inspection" min="1"
                            className="inline-input" value={weights[cropPda]||""}
                            onChange={(e) => setWeights((p) => ({...p,[cropPda]:e.target.value}))} />
                        </div>
                        <div style={{marginBottom:12}}>
                          <div className="flabel" style={{marginBottom:5}}>Send to Manufacturer</div>
                          <select className="inline-select" value={mfgSel[cropPda]??0}
                            onChange={(e) => setMfgSel((p) => ({...p,[cropPda]:Number(e.target.value)}))}>
                            {MANUFACTURERS.map((m,i) => <option key={i} value={i}>{m.label}</option>)}
                          </select>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button className="btn-accept" onClick={() => acceptCrop(cropPda)} disabled={processing===cropPda}>
                            {processing===cropPda ? "…" : "✅ Accept →"}
                          </button>
                          <button className="btn-reject" onClick={() => rejectCrop(cropPda)} disabled={processing===cropPda}>
                            ❌ Reject
                          </button>
                        </div>
                        {txInfo && (
                          <div className="tx-link">
                            <a href={`https://explorer.solana.com/tx/${txInfo.sig}?cluster=devnet`} target="_blank" rel="noreferrer">
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
  );
}