const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({
    path: path.resolve(__dirname, "../../../.env")
});

const rpcUrl = process.env.SEPOLIA_RPC_URL;

if (!rpcUrl) {
    throw new Error(
        "SEPOLIA_RPC_URL is missing from .env"
    );
}

const provider = new ethers.JsonRpcProvider(
    rpcUrl
);


// ============================================================
// DID REGISTRY CONTRACT
// ============================================================

const didAbi = require(
    "../../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
).abi;

const didContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    didAbi,
    provider
);


// ============================================================
// TRANSACTION QUEUE
// ============================================================

// Queue the COMPLETE blockchain lifecycle.
// This prevents multiple in-flight transactions
// and helps avoid nonce conflicts.
let transactionQueue = Promise.resolve();


// ============================================================
// SEND AND CONFIRM TRANSACTION
// ============================================================

async function sendAndConfirmTransaction({
    privateKey,
    recipient,
    amount
}) {

    if (!privateKey) {
        throw new Error(
            "Private key is required"
        );
    }

    if (!ethers.isAddress(recipient)) {
        throw new Error(
            "Invalid recipient address"
        );
    }

    const value = ethers.parseEther(
        String(amount)
    );

    if (value <= 0n) {
        throw new Error(
            "Transaction amount must be greater than zero"
        );
    }

    // Create signer from the DID wallet's
    // decrypted private key
    const signer = new ethers.Wallet(
        privateKey,
        provider
    );

    // Queue the complete blockchain lifecycle
    const runTransaction = async () => {

        console.log(
            "Submitting blockchain transaction..."
        );

        const transaction =
            await signer.sendTransaction({
                to: recipient,
                value
            });

        console.log(
            "Blockchain transaction submitted:",
            transaction.hash
        );

        const receipt =
            await provider.waitForTransaction(
                transaction.hash,
                1
            );

        if (!receipt) {
            throw new Error(
                "Transaction confirmation failed"
            );
        }

        if (receipt.status !== 1) {
            throw new Error(
                "Blockchain transaction failed"
            );
        }

        console.log(
            "Blockchain transaction confirmed:",
            receipt.hash
        );

        return {
            transaction_hash: receipt.hash,
            block_number: receipt.blockNumber,
            sender: signer.address,
            recipient,
            amount: String(amount),
            chain: "sepolia"
        };
    };

    const result = transactionQueue.then(
        runTransaction,
        runTransaction
    );

    // Keep queue alive even if the current
    // transaction fails
    transactionQueue = result.catch(() => {});

    return result;
}


// ============================================================
// GET WALLET ADDRESS
// ============================================================

async function getWalletAddress(privateKey) {

    if (!privateKey) {
        throw new Error(
            "Private key is required"
        );
    }

    const signer = new ethers.Wallet(
        privateKey,
        provider
    );

    return signer.address;
}


// ============================================================
// GET CONNECTED BLOCKCHAIN NETWORK
// ============================================================

async function getNetwork() {
    return await provider.getNetwork();
}


// ============================================================
// GET ETH BALANCE
// ============================================================

async function getBalance(address) {

    if (!ethers.isAddress(address)) {
        throw new Error(
            "Invalid wallet address"
        );
    }

    const balanceWei =
        await provider.getBalance(address);

    return {
        address,
        balance_wei: balanceWei.toString(),
        balance_eth: ethers.formatEther(
            balanceWei
        ),
        chain: "sepolia"
    };
}


// ============================================================
// SIGN MESSAGE WITH PRIVATE KEY
// ============================================================

async function signMessageWithPrivateKey(
    privateKey,
    message
) {

    if (!privateKey) {
        throw new Error(
            "Private key is required"
        );
    }

    if (!message) {
        throw new Error(
            "Message is required"
        );
    }

    const signer = new ethers.Wallet(
        privateKey,
        provider
    );

    const signature =
        await signer.signMessage(message);

    return {
        address: signer.address,
        message,
        signature
    };
}


// ============================================================
// CREATE WALLET IDENTITY
// ============================================================

async function createWalletIdentity({
    privateKey,
    did,
    kycHash
}) {

    if (!privateKey) {
        throw new Error(
            "Private key is required"
        );
    }

    if (!did) {
        throw new Error(
            "DID is required"
        );
    }

    if (!kycHash) {
        throw new Error(
            "KYC hash is required"
        );
    }

    const signer = new ethers.Wallet(
        privateKey,
        provider
    );

    const contract =
        didContract.connect(signer);


    // ========================================================
    // CHECK WHETHER IDENTITY ALREADY EXISTS
    // ========================================================

    // DIDRegistry reverts with IdentityNotFound()
    // when this wallet has no identity yet.

    try {

        const existing =
            await contract.getIdentity(
                signer.address
            );

        if (
            existing[0] &&
            existing[0] !== ""
        ) {
            throw new Error(
                "Identity already exists for this wallet"
            );
        }

    } catch (error) {

        const message =
            error.reason ||
            error.shortMessage ||
            error.message ||
            "";

        // This is expected for a wallet
        // that has not registered a DID yet.
        if (
            !message.includes(
                "IdentityNotFound"
            )
        ) {
            throw error;
        }
    }


    // ========================================================
    // CREATE DID IDENTITY
    // ========================================================

    console.log(
        "Creating DID identity for:",
        signer.address
    );

    const tx =
        await contract.createIdentity(
            did,
            kycHash
        );

    console.log(
        "DID transaction sent:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    if (
        !receipt ||
        receipt.status !== 1
    ) {
        throw new Error(
            "DID creation transaction failed"
        );
    }

    return {
        wallet_address: signer.address,
        did,
        kyc_hash: kycHash,
        transaction_hash: tx.hash,
        block_number: receipt.blockNumber,
        status: "pending"
    };
}


// ============================================================
// VERIFY DID IDENTITY
// ============================================================

async function verifyWalletIdentity({
    did,
    walletAddress
}) {

    if (!did) {
        throw new Error("DID is required");
    }

    if (!walletAddress) {
        throw new Error(
            "Wallet address is required"
        );
    }

    const adminPrivateKey =
        process.env.DID_ADMIN_PRIVATE_KEY;

    if (!adminPrivateKey) {
        throw new Error(
            "DID_ADMIN_PRIVATE_KEY is missing"
        );
    }

    // --------------------------------------------------------
    // CREATE ADMIN WALLET
    // --------------------------------------------------------

    const adminWallet =
        new ethers.Wallet(
            adminPrivateKey,
            provider
        );

    // --------------------------------------------------------
    // CONNECT CONTRACT USING ADMIN WALLET
    // --------------------------------------------------------

    const adminContract =
        didContract.connect(
            adminWallet
        );

    // --------------------------------------------------------
    // VERIFY CONTRACT ADMIN
    // --------------------------------------------------------

    const contractAdmin =
        await didContract.admin();

    if (
        adminWallet.address.toLowerCase() !==
        contractAdmin.toLowerCase()
    ) {
        throw new Error(
            "Configured DID admin key does not match contract admin"
        );
    }

    // --------------------------------------------------------
    // CHECK CURRENT IDENTITY
    // --------------------------------------------------------

    const identity =
        await didContract.getIdentity(
            walletAddress
        );

    if (!identity) {
        throw new Error(
            "DID identity not found"
        );
    }

    const storedDid =
        identity[0];

    if (
        storedDid.toLowerCase() !==
        did.toLowerCase()
    ) {
        throw new Error(
            "DID does not match the wallet identity"
        );
    }

    const currentStatus =
        Number(identity[3]);

    // --------------------------------------------------------
    // ALREADY VERIFIED
    // --------------------------------------------------------

    if (currentStatus === 1) {

        return {
            wallet_address: walletAddress,
            did: storedDid,
            status: "verified",
            transaction_hash: null,
            block_number: null
        };
    }

    // --------------------------------------------------------
    // ONLY PENDING IDENTITY CAN BE VERIFIED
    // --------------------------------------------------------

    if (currentStatus !== 0) {
        throw new Error(
            `DID cannot be verified from current status: ${currentStatus}`
        );
    }

    // --------------------------------------------------------
    // UPDATE STATUS → VERIFIED
    // Status enum:
    // 0 = PENDING
    // 1 = VERIFIED
    // 2 = REJECTED
    // --------------------------------------------------------

    console.log(
        "Updating DID status to VERIFIED for:",
        walletAddress
    );

    const tx =
        await adminContract.updateStatus(
            walletAddress,
            1
        );

    console.log(
        "DID verification transaction sent:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    if (
        !receipt ||
        receipt.status !== 1
    ) {
        throw new Error(
            "DID verification transaction failed"
        );
    }

    // --------------------------------------------------------
    // READ STATUS AGAIN FROM BLOCKCHAIN
    // --------------------------------------------------------

    const updatedIdentity =
        await didContract.getIdentity(
            walletAddress
        );

    const updatedStatus =
        Number(updatedIdentity[3]);

    if (updatedStatus !== 1) {
        throw new Error(
            "DID verification was not confirmed on-chain"
        );
    }

    return {
        wallet_address:
            updatedIdentity[1],
        did:
            updatedIdentity[0],
        kyc_hash:
            updatedIdentity[2],
        status: "verified",
        transaction_hash:
            tx.hash,
        block_number:
            receipt.blockNumber
    };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    sendAndConfirmTransaction,
    getWalletAddress,
    getNetwork,
    getBalance,
    signMessageWithPrivateKey,
    createWalletIdentity,
    verifyWalletIdentity
};