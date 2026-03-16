// ================= MOCK WALLET DATABASE =================
const wallets = [
  {
    email: "test@mail.com",
    phone: "9876543210",
    walletId: "WLT-894739",
    userReference: "USER-001",
    walletAddress: "0x9a34Fbc89012345",
    balance: 5200,
  },
  {
    email: "demo@mail.com",
    phone: "9123456789",
    walletId: "WLT-456123",
    userReference: "USER-002",
    walletAddress: "0x7f22Abc90123456",
    balance: 3100,
  },
];

// ================= WALLET LOOKUP =================
export const lookupWallet = async (query) => {
  if (!query) {
    throw new Error("Phone or Email is required");
  }

  try {
    // simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const wallet = wallets.find(
      (w) =>
        w.email.toLowerCase() === query.toLowerCase() ||
        w.phone === query
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