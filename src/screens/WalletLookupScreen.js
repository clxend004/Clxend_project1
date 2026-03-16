import React, { useState } from "react";
import { lookupWallet } from "../services/walletService";
import TransactionCard from "../components/TransactionCard";
import { getTransactions } from "../services/transactionService";

export default function WalletLookupScreen() {
  const [searchValue, setSearchValue] = useState("");
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= SEARCH HANDLER =================
  const handleSearch = async () => {
    if (!searchValue) {
      setError("Enter phone number or email id");
      return;
    }

    setLoading(true);
    setError("");
    setWalletData(null);
    setShowTransactions(false);

    try {
      const response = await lookupWallet(searchValue);

      if (response.success) {
        setWalletData(response.data);
      } else {
        setError("No wallet found");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  // ================= LOAD TRANSACTIONS =================
  const handleViewTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
      setShowTransactions(true);
    } catch (error) {
      console.error("Transaction fetch error:", error);
    }
  };

  // ================= RETRY =================
  const handleRetry = () => {
    setError("");
    handleSearch();
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f2f2f2",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "85%",
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
          Wallet Lookup
        </h2>

        {/* INPUT */}
        <input
          type="text"
          placeholder="Enter Phone / Email"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{
            width: "65%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 15,
          }}
        />

        {/* SEARCH BUTTON */}
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            width: "60%",
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#4CAF50",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          {loading ? "Searching..." : "Search Wallet"}
        </button>

        {/* LOADING */}
        {loading && <p style={{ marginTop: 20 }}>Loading wallet details...</p>}

        {/* ERROR */}
        {error && (
          <div style={{ marginTop: 15 }}>
            <p style={{ color: "red" }}>{error}</p>

            <button
              onClick={handleRetry}
              style={{
                marginTop: 10,
                padding: 8,
                borderRadius: 6,
                backgroundColor: "#ff9800",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* WALLET DETAILS */}
        {walletData && (
          <>
            <div
              style={{
                width: "100%",
                marginTop: 20,
                padding: 15,
                borderRadius: 10,
                backgroundColor: "#f1f1f1",
                textAlign: "left",
              }}
            >
              <p style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                Wallet Details
              </p>

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
                <strong>User Reference:</strong> {walletData.userReference}
              </p>

              <p>
                <strong>Wallet Address:</strong> {walletData.walletAddress}
              </p>

              <p>
                <strong>Balance:</strong> ₹{walletData.balance}
              </p>

              {/* VIEW TRANSACTIONS BUTTON */}
              <button
                onClick={handleViewTransactions}
                style={{
                  marginTop: 15,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#2196F3",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Transactions
              </button>
            </div>

            {/* TRANSACTION HISTORY */}
            {showTransactions && (
              <div style={{ marginTop: 30, textAlign: "left" }}>
                <h3>Transaction History</h3>

                {transactions.length === 0 && (
                  <p>No transactions found</p>
                )}

                {transactions.map((tx) => (
                  <TransactionCard key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}