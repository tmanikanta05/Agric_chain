import React, { createContext, useContext, useMemo } from "react";
import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../idl/agrichain.json";

const AnchorContext = createContext(null);
export const useAnchor = () => useContext(AnchorContext);

export const AnchorProviderWrapper = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions },
      { preflightCommitment: "processed", commitment: "confirmed" }
    );
  }, [connection, publicKey]);

  const program = useMemo(() => {
    if (!provider) return null;
    try {
      setProvider(provider);
      return new Program(idl, provider);
    } catch (err) {
      console.error("Program init error:", err);
      return null;
    }
  }, [provider]);

  return (
    <AnchorContext.Provider value={{ program, provider, publicKey, connection }}>
      {children}
    </AnchorContext.Provider>
  );
};
