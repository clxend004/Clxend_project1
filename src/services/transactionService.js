import { getRequest, postRequest } from "./api";

// ================= SEND TRANSACTION =================
export const saveTransaction = async (tx) => {
  try {
    const response = await postRequest("/send", {
      receiver: tx.receiver,
      amount: Number(tx.amount),
    });

    return response;
  } catch (error) {
    throw new Error(error.message || "Transaction failed");
  }
};

// ================= GET TRANSACTIONS =================
export const getTransactions = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:3001/transactions"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }

    const data = await response.json();

    return data.transactions || [];
  } catch (error) {
    console.error(
      "GET TRANSACTIONS ERROR:",
      error
    );

    throw new Error(
      "Failed to fetch transactions"
    );
  }
};

// ================= GET BALANCE =================
export const getBalance = async () => {
  try {
    const response = await getRequest("/balance");
    return response;
  } catch (error) {
    throw new Error("Failed to fetch balance");
  }
};