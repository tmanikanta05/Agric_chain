import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useAnchor } from "../context/AnchorContext";

const PROGRAM_ID = new PublicKey("4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv");
const BROKERS = [
  { label: "Broker 1 - Raju Traders",    pubkey: "HogGTnGkpkeDMKHNwwGJ6jSPig8fy2dpCJpQrihHchRp" },
  { label: "Broker 2 - Krishna Exports", pubkey: "5Qbkn6cYg4GxNFRnuhroFhsSVMyG5Sb3E6NTtCLFLqMW" },
];
const DISTRICT_MAP = {1:"Adilabad",2:"Bhupalpally",3:"Suryapet",4:"Rangareddy",5:"Warangal"};
const CROP_MAP     = {1:"🌾 Paddy",2:"🌿 Wheat",3:"☁️ Cotton",4:"🥦 Vegetables",5:"🍎 Fruits"};
const STATUS_MAP   = {0:"Registered",1:"Broker Assigned",2:"With Manufacturer",3:"In Lab",4:"Approved",5:"Rejected"};
const STATUS_CLR   = {0:"#6dce3f",1:"#f0a500",2:"#3fa8ce",3:"#a06dce",4:"#6dce3f",5:"#e05c5c"};

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

  const fetchAll = useCallback(async () => {
    if (!program || !connection) return;
    setLoading(true); setError("");
    try {
      const rawCrops = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment:"confirmed", filters:[{memcmp:{offset:0,bytes:"bLrwCTwwMB2"}}],
      });
      const allCrops = rawCrops.map(({pubkey,account}) => ({
        publicKey: pubkey, account: program.coder.accounts.decode("crop", account.data),
      }));
      const rawFarmers = await connection.getProgramAccounts(PROGRAM_ID, {
        commitment:"confirmed", filters:[{memcmp:{offset:0,bytes:"jXX2LSteZVk"}}],
      });
      const fMap = {};
      rawFarmers.forEach(({pubkey,account}) => { fMap[pubkey.toString()] = program.coder.accounts.decode("farmer", account.data); });
      setCrops(allCrops); setFarmers(fMap);
    } catch(err) { console.error(err); setError("Failed to fetch from blockchain."); }
    finally { setLoading(false); }
  }, [program, connection]);

  useEffect(() => { if (connected && program) fetchAll(); }, [connected, program]);

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
      setTxSigs((p) => ({...p, [cropPda]: tx}));
      alert("Broker assigned successfully ✅");
      fetchAll();
    } catch(err) {
      console.error(err);
      const logMsg = err?.logs?.find((l) => l.includes("Error"));
      alert("Failed: " + (logMsg || err?.message));
    } finally { setAssigning(null); }
  };

  const getFarmer  = (crop) => farmers[crop.farmer?.toString()] || null;
  const isDefault  = (pk)   => !pk || pk.toString() === "11111111111111111111111111111111";

  return (
    <div className="page">
      <div className="step-badge">Step 2 of 5</div>
      <div className="page-tag">Collector Dashboard</div>
      <h1 className="page-title">Assign <em>Brokers</em></h1>
      <p className="page-sub">All registered crops fetched live from Solana Devnet</p>

      {connected && publicKey && (
        <div className="wpill">
          <span className="wpill-dot"/>
          {publicKey.toString().slice(0,6)}...{publicKey.toString().slice(-4)}
        </div>
      )}

      {!connected ? (
        <div className="card" style={{maxWidth:400}}>
          <div className="no-wallet">
            <div className="no-wallet-icon">🔒</div>
            <p>Connect your Phantom wallet</p>
          </div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:1100}}>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            <button className="loc-btn" onClick={fetchAll} disabled={loading} style={{height:40,padding:"0 20px"}}>
              {loading ? "Fetching..." : "🔄 Refresh from Chain"}
            </button>
            {error && <span style={{color:"#e05c5c",fontSize:13,alignSelf:"center"}}>{error}</span>}
          </div>

          {loading ? (
            <div style={{display:"flex",gap:12,color:"rgba(240,247,235,0.45)",fontSize:14,padding:"40px 0"}}>
              <span className="spinner"/> Fetching crops from Solana Devnet…
            </div>
          ) : crops.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(240,247,235,0.45)"}}>
              <div style={{fontSize:40,marginBottom:12,opacity:0.4}}>📦</div>
              <p>No crops registered yet.</p>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))",gap:18}}>
              {crops.map(({publicKey:cropPk, account:crop}) => {
                const farmer    = getFarmer(crop);
                const cropPda   = cropPk.toString();
                const assigned  = !isDefault(crop.broker);
                const statusNum = crop.status ?? 0;

                return (
                  <div key={cropPda} className="crop-card">
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",color:"#6dce3f",textTransform:"uppercase"}}>
                          ID: {crop.cropId || "N/A"}
                        </div>
                        <div style={{fontSize:10,color:"rgba(240,247,235,0.35)",fontFamily:"monospace",marginTop:2}}>
                          {cropPda.slice(0,10)}...{cropPda.slice(-6)}
                        </div>
                      </div>
                      <span className="status-badge" style={{color:STATUS_CLR[statusNum],borderColor:STATUS_CLR[statusNum]}}>
                        {STATUS_MAP[statusNum]}
                      </span>
                    </div>

                    {/* Farmer info */}
                    <div className="clabel">Farmer Info</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      {[["Farmer",farmer?.name||"N/A"],["Mobile",farmer?.mobile||"N/A"],
                        ["District",DISTRICT_MAP[farmer?.district]||"N/A"],["Location",farmer?.location||"N/A"]
                      ].map(([l,v]) => (
                        <div key={l}>
                          <div className="flabel">{l}</div>
                          <div className="fval">{v}</div>
                        </div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    {/* Crop info */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                      {[["Crop",CROP_MAP[crop.cropType]||"N/A"],
                        ["Weight",(crop.approxWeight?.toString()||"N/A")+" kg"],
                        ["Status",STATUS_MAP[statusNum]],
                        ["Date",crop.collectionDate?new Date(crop.collectionDate.toNumber()*1000).toLocaleDateString("en-IN"):"N/A"]
                      ].map(([l,v]) => (
                        <div key={l}>
                          <div className="flabel">{l}</div>
                          <div className="fval">{v}</div>
                        </div>
                      ))}
                    </div>

                    <div className="card-divider"/>

                    {/* Action */}
                    {assigned ? (
                      <div style={{fontSize:12,color:"#6dce3f",paddingTop:4}}>
                        ✅ Broker Assigned: {crop.broker?.toString().slice(0,12)}...
                      </div>
                    ) : (
                      <div>
                        <div style={{display:"flex",gap:8}}>
                          <select
                            className="inline-select"
                            value={brokerSel[cropPda]??0}
                            onChange={(e) => setBrokerSel((p) => ({...p,[cropPda]:Number(e.target.value)}))}
                          >
                            {BROKERS.map((b,i) => <option key={i} value={i}>{b.label}</option>)}
                          </select>
                          <button
                            className="btn-accept"
                            style={{flexShrink:0,flex:"unset",padding:"0 18px",fontSize:13}}
                            disabled={assigning===cropPda}
                            onClick={() => assignBroker(cropPda)}
                          >
                            {assigning===cropPda ? "..." : "Assign"}
                          </button>
                        </div>
                        {txSigs[cropPda] && (
                          <div className="tx-link" style={{marginTop:8}}>
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
  );
}
