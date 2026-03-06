// Mock wallet database
const wallets = [
  {
    email: "test@mail.com",
    walletId: "WLT-894739",
    userReference: "USER-001",
  },
  {
    email: "demo@mail.com",
    walletId: "WLT-456123",
    userReference: "USER-002",
  },
];

// ================= WALLET LOOKUP =================
export const lookupWallet = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  // simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const wallet = wallets.find(
    (w) => w.email.toLowerCase() === email.toLowerCase()
  );

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet;
};