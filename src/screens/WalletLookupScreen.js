import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { useNavigate } from "react-router-dom";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { getWallet } from "../services/walletService";

export default function WalletLookupScreen() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletData, setWalletData] = useState(null);

  // ✅ LOAD USER WALLET AUTOMATICALLY
  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);

        // ✅ Fetch wallet from backend
        const data = await getWallet();

        // ✅ Direct backend mapping
        setWalletData({
          email: data.email,
          phone: data.phone,
          walletId: data.walletId,
          userReference: `USER-${data.userId}`,
          walletAddress: data.walletAddress,
          balance: data.balance,
          did: data.did,
          blockchain: data.blockchain,
          txHash: data.txHash,
          identityStatus: data.identityStatus,
        });

      } catch (err) {
        setError(err.message || "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  // ================= NAVIGATION =================
  const handleViewTransactions = () => {
    navigate("/transactions");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div
          style={{
            width: "100%",
            maxWidth: "450px",
            margin: "0 auto",
            marginTop: "40px",
          }}
        >
          <h2 style={{ marginBottom: 20 }}>My Wallet</h2>

          {/* LOADING */}
          {loading && (
            <p style={{ marginTop: 10 }}>
              Fetching your wallet...
            </p>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: "red" }}>{error}</p>

              <button className="btn" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}

          {/* WALLET DETAILS */}
          {walletData && (
            <>
              <div
                style={{
                  marginTop: 20,
                  padding: 20,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                  textAlign: "left",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
              >
                <p>
                  <strong>Email:</strong> {walletData.email}
                </p>

                <p>
                  <strong>Phone:</strong> {walletData.phone}
                </p>

                <p>
                  <strong>Wallet ID:</strong> {walletData.walletId}
                </p>

                <p>
                  <strong>User Ref:</strong> {walletData.userReference}
                </p>

                <p>
                  <strong>Wallet Address:</strong>
                  <br />
                  <span
                    style={{
                      fontSize: 13,
                      wordBreak: "break-all",
                    }}
                  >
                    {walletData.walletAddress}
                  </span>
                </p>

                <p>
                  <strong>Balance:</strong> ₹{walletData.balance}
                </p>

                <p>
                  <strong>DID:</strong>
                  <br />
                  <span
                    style={{
                      fontSize: 13,
                      wordBreak: "break-all",
                    }}
                  >
                    {walletData.did}
                  </span>
                </p>

                <p>
                  <strong>Blockchain:</strong> {walletData.blockchain}
                </p>

                <p>
                  <strong>Transaction Hash:</strong>
                  <br />
                  <a
                    href={`https://polygonscan.com/tx/${walletData.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 13,
                      wordBreak: "break-all",
                    }}
                  >
                    {walletData.txHash}
                  </a>
                </p>

                <p>
                  <strong>Identity Status:</strong>{" "}
                  {walletData.identityStatus === "verified"
                    ? "🟢 VERIFIED"
                    : "🟡 PENDING"}
                </p>

                {/* ✅ VERIFIED BADGE */}
                {walletData.identityStatus === "verified" && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 12px",
                      background: "#e8fff3",
                      color: "#0f9d58",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    ✅ Verified on Blockchain
                  </div>
                )}

                {/* ❌ NO DID */}
                {!walletData.did && (
                  <p style={{ color: "red", marginTop: 10 }}>
                    No DID found for this wallet
                  </p>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <button
                  onClick={handleViewTransactions}
                  className="btn"
                >
                  View Transactions
                </button>

                <button
                  className="btn"
                  onClick={() => navigate("/send")}
                >
                  Send
                </button>

                <button
                  className="btn"
                  onClick={() => navigate("/receive")}
                >
                  Receive
                </button>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}