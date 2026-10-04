const path = require("path");
const { ethers } = require("ethers");

// ============================================================
// LOAD ROOT .ENV
// ============================================================
require("dotenv").config({
    path: path.resolve(__dirname, "../../../.env")
});

// ============================================================
// LOAD DID REGISTRY ABI
// ============================================================
const abi = require(
    "../../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
).abi;

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================
const rpcUrl = process.env.SEPOLIA_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================
if (!rpcUrl) {
    throw new Error(
        "SEPOLIA_RPC_URL is missing from .env"
    );
}

if (!contractAddress) {
    throw new Error(
        "CONTRACT_ADDRESS is missing from .env"
    );
}

if (!ethers.isAddress(contractAddress)) {
    throw new Error(
        `Invalid DID Registry contract address: ${contractAddress}`
    );
}

// ============================================================
// PROVIDER
// ============================================================
const provider = new ethers.JsonRpcProvider(
    rpcUrl
);

// ============================================================
// DID REGISTRY CONTRACT
// ============================================================
const contract = new ethers.Contract(
    contractAddress,
    abi,
    provider
);

// ============================================================
// GET WALLET IDENTITY
// ============================================================
async function getWalletIdentity(walletAddress) {

    // Validate wallet address
    if (!walletAddress) {
        throw new Error(
            "Wallet address is required"
        );
    }

    if (!ethers.isAddress(walletAddress)) {
        throw new Error(
            "Invalid wallet address"
        );
    }

    try {

        const data =
            await contract.getIdentity(
                walletAddress
            );

        /*
         * Expected contract response:
         *
         * data[0] = DID ID
         * data[1] = Wallet address
         * data[2] = KYC hash
         * data[3] = DID status
         * data[4] = Created timestamp
         */

        const didId = data[0];
        const wallet = data[1];
        const kycHash = data[2];
        const status = Number(data[3]);
        const createdAt = Number(data[4]);

        /*
         * Determine whether a DID actually exists.
         *
         * Depending on the Solidity contract, an unregistered
         * wallet may return an empty DID ID.
         */
        const exists =
            didId !== undefined &&
            didId !== null &&
            didId !== "" &&
            didId !== "0x" &&
            didId !== ethers.ZeroHash;

        return {
            exists,
            did_id: didId,
            wallet,
            kyc_hash: kycHash,
            status,
            created_at: createdAt
        };

    } catch (error) {

        console.error(
            "GET WALLET IDENTITY ERROR:",
            error
        );

        throw new Error(
            "Wallet is not associated with a DID"
        );
    }
}

// ============================================================
// GET IDENTITY STATUS
// ============================================================
async function getIdentityStatus(
    walletAddress
) {

    try {

        const identity =
            await getWalletIdentity(
                walletAddress
            );

        // No DID registered
        if (
            !identity ||
            !identity.exists
        ) {
            return "not_registered";
        }

        const status =
            Number(identity.status);

        /*
         * DID status:
         *
         * 0 = Pending
         * 1 = Verified
         * 2 = Rejected
         */

        if (status === 0) {
            return "pending";
        }

        if (status === 1) {
            return "verified";
        }

        if (status === 2) {
            return "rejected";
        }

        return "unknown";

    } catch (error) {

        /*
         * If the wallet does not have a DID,
         * return not_registered instead of
         * crashing the caller.
         */
        if (
            error.message ===
            "Wallet is not associated with a DID"
        ) {
            return "not_registered";
        }

        throw error;
    }
}

// ============================================================
// VERIFY WALLET DID
// ============================================================
async function verifyWalletDID(
    walletAddress
) {

    const identity =
        await getWalletIdentity(
            walletAddress
        );

    // Check DID exists
    if (
        !identity ||
        !identity.exists
    ) {
        throw new Error(
            "Wallet is not associated with a DID"
        );
    }

    const status =
        Number(identity.status);

    // Pending
    if (status === 0) {
        throw new Error(
            "DID is not verified"
        );
    }

    // Rejected
    if (status === 2) {
        throw new Error(
            "DID has been rejected"
        );
    }

    // Verified
    if (status !== 1) {
        throw new Error(
            "Invalid DID status"
        );
    }

    return identity;
}

// ============================================================
// EXPORT SERVICES
// ============================================================
module.exports = {
    getWalletIdentity,
    verifyWalletDID,
    getIdentityStatus
};