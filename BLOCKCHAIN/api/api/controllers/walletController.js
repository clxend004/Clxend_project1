const {
    createWallet,
    connectWallet,
    getWalletByDid,
    verifyWalletSignature,
    getWalletBalance,
    signWalletMessage,
    sendWalletTransaction,
    registerWalletIdentity,
    verifyIdentity
} = require("../services/walletService");

const {
    getWalletIdentity
} = require("../services/didService");


// ============================================================
// CREATE WALLET
// ============================================================

function create(req, res) {
    try {
        const wallet = createWallet(req.body);

        res.status(201).json({
            success: true,
            wallet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// CONNECT EXISTING WALLET
// ============================================================

function connect(req, res) {
    try {
        const wallet = connectWallet(req.body);

        res.status(200).json({
            success: true,
            wallet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// GET WALLET BY DID
// ============================================================

function getWallet(req, res) {
    try {
        const wallet = getWalletByDid(req.params.did);

        res.status(200).json({
            success: true,
            wallet
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// VERIFY WALLET SIGNATURE
// ============================================================

function verifySignature(req, res) {
    try {
        const result = verifyWalletSignature(req.body);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// GET WALLET BALANCE
// ============================================================

async function getBalance(req, res) {
    try {
        const result =
            await getWalletBalance(req.params.did);

        res.status(200).json({
            success: true,
            balance: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// SIGN WALLET MESSAGE
// ============================================================

async function signMessage(req, res) {
    try {
        const result =
            await signWalletMessage(req.body);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}
async function sendTransaction(req, res) {

    try {

        const result =
            await sendWalletTransaction(
                req.body
            );

        res.status(200).json({
            success: true,
            result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================================
// CREATE ON-CHAIN DID IDENTITY
// ============================================================

async function createIdentity(req, res) {
    try {
        const { did, kycHash } = req.body;

        const result =
            await registerWalletIdentity(
                did,
                kycHash
            );

        res.status(201).json({
            success: true,
            identity: result
        });

    } catch (error) {
        console.error(
            "CREATE IDENTITY ERROR:",
            error
        );

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

async function verifyIdentityController(req, res) {
    try {
        const {
            did,
            walletAddress
        } = req.body;

        const result =
            await verifyIdentity(
                did,
                walletAddress
            );

        res.status(200).json({
            success: true,
            identity: result
        });

    } catch (error) {
        console.error(
            "VERIFY IDENTITY ERROR:",
            error
        );

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

async function getIdentity(req, res) {
    try {
        const { walletAddress } = req.params;

        const result = await getWalletIdentity(walletAddress);

        return res.json({
            success: true,
            identity: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
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
};