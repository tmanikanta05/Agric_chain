import { Buffer } from "buffer";
window.Buffer = Buffer;
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { AnchorProviderWrapper } from "./context/AnchorContext";

const endpoint = clusterApiUrl("devnet");

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <AnchorProviderWrapper>
          <App />
        </AnchorProviderWrapper>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
