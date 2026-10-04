import { getRequest } from "./api";

// ================= GET LOGGED-IN USER WALLET =================
export const getWallet = async () => {
  try {
    // ✅ Fetch wallet from backend
    const wallet = await getRequest("/wallet");

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // ✅ Return backend data directly
    return wallet;

  } catch (error) {
    throw new Error(error.message || "Failed to fetch wallet");
  }
};