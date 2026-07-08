import React, { useState } from "react";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { saveTransaction } from "../services/transactionService";
import { useNavigate } from "react-router-dom";

export default function SendTransactionScreen() {
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleSend = async () => {
  if (!receiver) {
    setStatus("❌ Enter receiver address");
    return;
  }

  if (!amount) {
    setStatus("❌ Enter amount");
    return;
  }

  if (Number(amount) <= 0) {
    setStatus("❌ Invalid amount");
    return;
  }

  setStatus("⏳ Processing transaction...");

  try {
    const tx = await saveTransaction({
    receiver,
    amount: Number(amount), 
    });

    setStatus(`✅ Sent! Tx: ${tx.txHash}`);

// 👉 go to history after 1.5 sec
setTimeout(() => {
  navigate("/transactions");
}, 1500);
  } catch (err) {
    setStatus(`❌ ${err.message}`); // ✅ shows real error
}
};

  
  return (
    <BackgroundWrapper>
  <AppLayout>
     <div style={{ width: "400px", margin: "0 auto" }}>
        <h2>Send Transaction</h2>

        <input
          type="text"
          placeholder="Receiver Wallet Address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          style={{
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "rgba(255,255,255,0.6)",
    marginBottom: 10,
  }}
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "rgba(255,255,255,0.6)",
    marginBottom: 10,
  }}
        />

        <button
        className="btn"
        onClick={handleSend}
        disabled={!receiver || !amount}
        style={{ marginTop: 10 }}
        >
         Send
         </button>
         <button onClick={() => navigate("/transactions")}
          style={{ marginTop: 10 }}
          >
  View Transactions
</button>

        {status && <p style={{ marginTop: 10 }}>{status}</p>}
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}