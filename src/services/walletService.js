import { getRequest } from "./api";

// ================= WALLET LOOKUP =================
export const lookupWallet = async (searchValue) => {
  try {
    if (!searchValue) {
      throw new Error("Email or phone is required");
    }

    // 🔥 Fetch all wallets from API
    const wallets = await getRequest("/wallets");

    // 🔍 Find matching wallet (email OR phone)
    const wallet = wallets.find(
      (w) =>
        w.email?.toLowerCase() === searchValue.toLowerCase() ||
        w.phone === searchValue
    );

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return {
      success: true,
      data: wallet,
    };

  } catch (error) {
    throw new Error(error.message || "Wallet lookup failed");
  }
};