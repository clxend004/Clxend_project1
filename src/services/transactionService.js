import { getRequest } from "./api";

export const getTransactions = async () => {
  try {
    const data = await getRequest("/transactions");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch transactions");
  }
};