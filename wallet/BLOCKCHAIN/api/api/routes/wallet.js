const express = require("express");

const {
    create,
    connect,
    getWallet,
    verifySignature,
    getBalance,
    signMessage,
    sendTransaction,
    createIdentity,
    verifyIdentityController,
    getIdentity
} = require("../controllers/walletController");

const router = express.Router();


// ============================================================
// WALLET ROUTES
// ============================================================

// Create a new wallet
router.post("/create", create);

// Connect an existing wallet
router.post("/connect", connect);

// Verify wallet signature
router.post("/verify-signature", verifySignature);

// Sign a message using the DID-mapped wallet
router.post("/sign-message", signMessage);


// ============================================================
// WALLET GET ROUTES
// ============================================================
router.post(
    "/send-transaction",
    sendTransaction
);

// Create DID identity on blockchain
router.post(
    "/create-identity",
    createIdentity
);

router.post(
    "/verify-identity",
    verifyIdentityController
);

router.get("/identity/:walletAddress", getIdentity);

// Get wallet balance
router.get("/:did/balance", getBalance);

// Get wallet information by DID
router.get("/:did", getWallet);

module.exports = router;