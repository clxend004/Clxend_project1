import axios from "axios";

const BLOCKCHAIN_API =
  process.env.REACT_APP_BLOCKCHAIN_API ||
  "http://127.0.0.1:3001";

// Create escrow transaction intent
export const createEscrowTransaction = async ({
  sender,
  seller,
  amount,
  arbiter,
}) => {
  // 1. Create transaction intent
  const transactionResponse = await axios.post(
    `${BLOCKCHAIN_API}/transactions`,
    {
      sender,
      recipient: seller,
      amount: String(amount),
      chain: "sepolia",
      type: "escrow",
    }
  );

  if (!transactionResponse.data?.success) {
    throw new Error(
      transactionResponse.data?.error ||
        "Failed to create escrow transaction"
    );
  }

  const transaction =
    transactionResponse.data.transaction;

  // 2. Create escrow
  const escrowResponse = await axios.post(
    `${BLOCKCHAIN_API}/escrows`,
    {
      tx_id: transaction.tx_id,
      amount: String(amount),
      seller,
      ...(arbiter ? { arbiter } : {}),
    }
  );

  if (!escrowResponse.data?.success) {
    throw new Error(
      escrowResponse.data?.error ||
        "Failed to create escrow"
    );
  }

  return escrowResponse.data;
};

// Deposit into escrow
export const depositEscrow = async (escrowId) => {
  const response = await axios.post(
    `${BLOCKCHAIN_API}/escrows/${escrowId}/deposit`
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.error ||
        "Escrow deposit failed"
    );
  }

  return response.data;
};

// Release escrow
export const releaseEscrow = async (escrowId) => {
  const response = await axios.post(
    `${BLOCKCHAIN_API}/escrows/${escrowId}/release`
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.error ||
        "Escrow release failed"
    );
  }

  return response.data;
};

// Refund escrow
export const refundEscrow = async (escrowId) => {
  const response = await axios.post(
    `${BLOCKCHAIN_API}/escrows/${escrowId}/refund`
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.error ||
        "Escrow refund failed"
    );
  }

  return response.data;
};

// Get escrow status
export const getEscrow = async (escrowId) => {
  const response = await axios.get(
    `${BLOCKCHAIN_API}/escrows/${escrowId}`
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.error ||
        "Failed to fetch escrow"
    );
  }

  return response.data;
};

// Sync escrow with blockchain
export const syncEscrow = async (escrowId) => {
  const response = await axios.post(
    `${BLOCKCHAIN_API}/escrows/${escrowId}/sync`
  );

  if (!response.data?.success) {
    throw new Error(
      response.data?.error ||
        "Failed to sync escrow"
    );
  }

  return response.data;
};