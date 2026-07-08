import React, { useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function ReceiveTransactionScreen() {
  const walletAddress =
    localStorage.getItem("walletAddress") || "0xABC123";

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h2>Receive Transaction</h2>

            <p><strong>Your Wallet Address:</strong></p>

            <div
              style={{
                padding: 10,
                background: "#eee",
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              {walletAddress}
            </div>

            <button
              onClick={handleCopy}
              style={{
                padding: "8px 12px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied ✅" : "Copy Address"}
            </button>

            <p>Share this address to receive funds</p>
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },

  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "20px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
};