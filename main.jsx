import { Buffer } from "buffer";
window.Buffer = Buffer;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "@solana/wallet-adapter-react-ui/styles.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { AnchorProviderWrapper } from "./context/AnchorContext";

const endpoint = clusterApiUrl("devnet");
const wallets  = [new PhantomWalletAdapter()];

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        {/* ✅ AnchorProviderWrapper must be INSIDE WalletProvider */}
        <AnchorProviderWrapper>
          <App />
        </AnchorProviderWrapper>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);