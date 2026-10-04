const crypto = require("crypto");

const {
    Wallet,
    isAddress,
    verifyMessage
} = require("ethers");

const {
    createWalletMapping,
    findWalletByDid,
    findWalletByAddress
} = require("../storage/walletStore");

// Import blockchain functions
const {
    getBalance,
    signMessageWithPrivateKey,
    sendAndConfirmTransaction,
    createWalletIdentity,
    verifyWalletIdentity
} = require("./blockchainService");


const SUPPORTED_CHAINS = [
    "sepolia",
    "mainnet",
    "hardhat",
    "localhost"
];


// ============================================================
// WALLET PRIVATE KEY ENCRYPTION
// ============================================================

function getEncryptionKey() {
    const key = process.env.WALLET_ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            "WALLET_ENCRYPTION_KEY is not configured"
        );
    }

    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error(
            "WALLET_ENCRYPTION_KEY must be a 64-character hexadecimal key"
        );
    }

    return Buffer.from(key, "hex");
}


function encryptPrivateKey(privateKey) {

    const key = getEncryptionKey();

    // Generate a unique IV for this encryption
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    let encrypted = cipher.update(
        privateKey,
        "utf8",
        "hex"
    );

    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    /*
     * Store everything needed for decryption:
     *
     * iv
     * authTag
     * encrypted private key
     */
    return {
        iv: iv.toString("hex"),
        auth_tag: authTag.toString("hex"),
        encrypted_data: encrypted
    };
}


function decryptPrivateKey(encryptedWallet) {

    const key = getEncryptionKey();

    const iv = Buffer.from(
        encryptedWallet.iv,
        "hex"
    );

    const authTag = Buffer.from(
        encryptedWallet.auth_tag,
        "hex"
    );

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(
        encryptedWallet.encrypted_data,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
}


// ============================================================
// CREATE NEW WALLET
// ============================================================

function createWallet({
    did,
    chain = "sepolia"
}) {

    if (!did || typeof did !== "string") {
        throw new Error("DID is required");
    }

    if (!SUPPORTED_CHAINS.includes(chain)) {
        throw new Error(
            `Unsupported chain. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`
        );
    }

    // Check if DID already has a wallet
    const existingWallet = findWalletByDid(did);

    if (existingWallet) {
        throw new Error(
            "Wallet already exists for this DID"
        );
    }

    // Generate a new Ethereum wallet
    const wallet = Wallet.createRandom();

    // Encrypt private key
    const encryptedPrivateKey =
        encryptPrivateKey(wallet.privateKey);

    // Store wallet information
    const mapping = {
        did,
        wallet_address: wallet.address,
        chain,
        status: "created",
        created_at: new Date().toISOString(),

        encrypted_private_key: encryptedPrivateKey
    };

    const savedWallet =
        createWalletMapping(mapping);

    /*
     * IMPORTANT:
     * Never return the encrypted private key
     * to the frontend.
     */
    return {
        mapping_id: savedWallet.mapping_id,
        did: savedWallet.did,
        wallet_address: savedWallet.wallet_address,
        chain: savedWallet.chain,
        status: savedWallet.status,
        created_at: savedWallet.created_at
    };
}


// ============================================================
// VALIDATE EXTERNALLY CONNECTED WALLET
// ============================================================

function validateWalletInput({
    did,
    wallet_address,
    chain
}) {
    if (!did || typeof did !== "string") {
        throw new Error("DID is required");
    }

    if (!wallet_address || !isAddress(wallet_address)) {
        throw new Error("Invalid wallet address");
    }

    if (!chain || !SUPPORTED_CHAINS.includes(chain)) {
        throw new Error(
            `Unsupported chain. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`
        );
    }
}


// ============================================================
// CONNECT EXISTING WALLET
// ============================================================

function connectWallet({
    did,
    wallet_address,
    chain
}) {
    validateWalletInput({
        did,
        wallet_address,
        chain
    });

    const existingDid = findWalletByDid(did);

    if (existingDid) {

        if (
            existingDid.wallet_address.toLowerCase() !==
            wallet_address.toLowerCase()
        ) {
            throw new Error(
                "DID is already mapped to another wallet"
            );
        }

        return existingDid;
    }

    const existingWallet =
        findWalletByAddress(wallet_address);

    if (existingWallet) {
        throw new Error(
            "Wallet is already mapped to another DID"
        );
    }

    const mapping = {
        did,
        wallet_address,
        chain,
        status: "connected",
        connected_at: new Date().toISOString()
    };

    return createWalletMapping(mapping);
}


// ============================================================
// GET WALLET BY DID
// ============================================================

function getWalletByDid(did) {

    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    /*
     * Never expose private key information
     * through the GET wallet API.
     */
    return {
        mapping_id: wallet.mapping_id,
        did: wallet.did,
        wallet_address: wallet.wallet_address,
        chain: wallet.chain,
        status: wallet.status,
        created_at: wallet.created_at,
        connected_at: wallet.connected_at
    };
}


// ============================================================
// GET WALLET BALANCE
// ============================================================

async function getWalletBalance(did) {

    // Find wallet using DID
    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    // Currently balance lookup is supported only on Sepolia
    if (wallet.chain !== "sepolia") {
        throw new Error(
            "Balance lookup currently supports Sepolia only"
        );
    }

    // Get balance from blockchain
    return await getBalance(
        wallet.wallet_address
    );
}


// ============================================================
// SIGN WALLET MESSAGE
// ============================================================

async function signWalletMessage({
    did,
    message
}) {
    if (!did) {
        throw new Error(
            "DID is required"
        );
    }

    if (!message) {
        throw new Error(
            "Message is required"
        );
    }

    // Find wallet mapping using DID
    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    // Make sure the encrypted private key exists
    if (!wallet.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found for this wallet"
        );
    }

    let privateKey;

    // Decrypt private key only when signing is required
    try {
        privateKey = decryptPrivateKey(
            wallet.encrypted_private_key
        );
    } catch (error) {
        throw new Error(
            "Unable to decrypt wallet private key"
        );
    }

    // Sign the message using the decrypted private key
    const result =
        await signMessageWithPrivateKey(
            privateKey,
            message
        );

    /*
     * Security:
     * Never return the private key.
     */
    return {
        did,
        wallet_address: wallet.wallet_address,
        signer_address: result.address,
        message: result.message,
        signature: result.signature
    };
}
async function sendWalletTransaction({
    did,
    recipient,
    amount
}) {

    if (!did) {
        throw new Error(
            "DID is required"
        );
    }

    if (!recipient) {
        throw new Error(
            "Recipient is required"
        );
    }

    if (amount === undefined || amount === null) {
        throw new Error(
            "Amount is required"
        );
    }

    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    if (wallet.chain !== "sepolia") {
        throw new Error(
            "Transaction currently supports Sepolia only"
        );
    }

    if (!wallet.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found for this wallet"
        );
    }

    let privateKey;

    try {
        privateKey = decryptPrivateKey(
            wallet.encrypted_private_key
        );
    } catch (error) {
        throw new Error(
            "Unable to decrypt wallet private key"
        );
    }

    try {

        const result =
            await sendAndConfirmTransaction({
                privateKey,
                recipient,
                amount
            });

        return {
            did,
            wallet_address: wallet.wallet_address,
            transaction_hash: result.transaction_hash,
            block_number: result.block_number,
            sender: result.sender,
            recipient: result.recipient,
            amount: result.amount,
            chain: result.chain
        };

    } finally {

        /*
         * Remove our local reference after signing.
         * This does not guarantee immediate memory wiping,
         * but ensures we don't intentionally retain it.
         */
        privateKey = null;
    }
}

// ============================================================
// VERIFY WALLET SIGNATURE
// ============================================================

function verifyWalletSignature({
    did,
    message,
    signature
}) {
    if (!did) {
        throw new Error("DID is required");
    }

    if (!message) {
        throw new Error("Message is required");
    }

    if (!signature) {
        throw new Error("Signature is required");
    }

    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    let recoveredAddress;

    try {
        recoveredAddress = verifyMessage(
            message,
            signature
        );
    } catch (error) {
        throw new Error(
            "Invalid signature"
        );
    }

    const isValid =
        recoveredAddress.toLowerCase() ===
        wallet.wallet_address.toLowerCase();

    if (!isValid) {
        throw new Error(
            "Signature does not match the wallet mapped to this DID"
        );
    }

    return {
        verified: true,
        did,
        wallet_address: wallet.wallet_address,
        recovered_address: recoveredAddress
    };
}

async function registerWalletIdentity(did, kycHash) {

    if (!did) {
        throw new Error("DID is required");
    }

    if (!kycHash) {
        throw new Error("KYC hash is required");
    }

    const wallet = findWalletByDid(did);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    if (!wallet.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found for this wallet"
        );
    }

    let privateKey;

    try {
        privateKey = decryptPrivateKey(
            wallet.encrypted_private_key
        );
    } catch (error) {
        throw new Error(
            "Unable to decrypt wallet private key"
        );
    }

    try {
        return await createWalletIdentity({
            privateKey,
            did,
            kycHash
        });

    } catch (error) {
        throw new Error(
            `Unable to create DID identity: ${error.message}`
        );
    }
}

async function verifyIdentity(did, walletAddress) {
    if (!did) {
        throw new Error("DID is required");
    }

    if (!walletAddress) {
        throw new Error("Wallet address is required");
    }

    try {
        return await verifyWalletIdentity({
            did,
            walletAddress
        });
    } catch (error) {
        throw new Error(
            `Unable to verify DID identity: ${error.message}`
        );
    }
}
// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createWallet,
    connectWallet,
    getWalletByDid,
    validateWalletInput,
    verifyWalletSignature,
    decryptPrivateKey,
    getWalletBalance,
    signWalletMessage,
    sendWalletTransaction,
    registerWalletIdentity,
    verifyIdentity
};