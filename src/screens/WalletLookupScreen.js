import React, { useState } from "react";

export default function WalletLookupScreen() {
  const [searchValue, setSearchValue] = useState("");
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= MOCK API =================
  const mockWalletAPI = (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (query === "9876543210" || query === "test@mail.com") {
          resolve({
            walletId: "WLT-894739",
            userRef: "USER-001",
          });
        } else {
          resolve(null);
        }
      }, 1500);
    });
  };

  // ================= SEARCH HANDLER =================
  const handleSearch = async () => {
    if (!searchValue) {
      setError("Enter phone or email");
      return;
    }

    setLoading(true);
    setError("");
    setWalletData(null);

    try {
      const result = await mockWalletAPI(searchValue);

      if (result) {
        setWalletData(result);
      } else {
        setError("No wallet found");
      }
    } catch (err) {
      setError("Something went wrong");
    }

    setLoading(false);
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

        <button
          onClick={handleSearch}
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
          Search Wallet
        </button>

        {loading && <p style={{ marginTop: 20 }}>Loading...</p>}

        {error && <p style={{ color: "red", marginTop: 15 }}>{error}</p>}

        {walletData && (
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
            <p>Wallet ID: {walletData.walletId}</p>
            <p>User Reference: {walletData.userRef}</p>
          </div>
        )}
      </div>
    </div>
  );
}