// Get wallet data from localStorage
export const getWalletData = async () => {
  const data = localStorage.getItem("walletData");

  if (!data) {
    const initialData = { balance: 5000, transactions: [] };
    localStorage.setItem("walletData", JSON.stringify(initialData));
    return initialData;
  }

  return JSON.parse(data);
};

// Send money
export const sendMoney = async (amount, to) => {
  const data = await getWalletData();

  if (amount > data.balance) throw new Error("Insufficient balance");

  const newTransaction = {
    id: Date.now(),
    to,
    amount,
    date: new Date().toLocaleString(),
  };

  const updatedData = {
    balance: data.balance - amount,
    transactions: [newTransaction, ...data.transactions],
  };

  localStorage.setItem("walletData", JSON.stringify(updatedData));
  return updatedData;
};