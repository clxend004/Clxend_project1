import axios from "axios";

const API_URL = "http://localhost:3000/transactions";

// Fetch all transactions
export const getTransactions = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch transactions");
  }
};