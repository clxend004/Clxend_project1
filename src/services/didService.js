export const getDIDData = async (walletAddress) => {
  try {
    // MOCK MODE
    if (process.env.REACT_APP_API_TYPE === "mock") {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!walletAddress) {
            resolve(null);
            return;
          }

          const mockDB = {
            "0x123": {
              did: "did:example:123",
              status: "verified",
            },
            "0x456": {
              did: "did:example:456",
              status: "pending",
            },
          };

          resolve(mockDB[walletAddress] || null);
        }, 1000);
      });
    }

    // REAL API (future)
    const response = await fetch(`/did/${walletAddress}`);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("DID Error:", error);
    throw new Error("Failed to fetch DID data");
  }
};