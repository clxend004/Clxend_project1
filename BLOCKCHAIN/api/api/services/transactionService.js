const { v4: uuidv4 } = require("uuid");
const { isAddress, parseEther } = require("ethers");

const {
    createTransaction,
    findTransactionById,
    findTransactionByIdempotencyKey,
    updateTransaction
} = require("../storage/transactionStore");

const { verifyWalletDID } = require("./didService");
const { findWalletByDid } = require("../storage/walletStore");
const { decryptPrivateKey } = require("./walletService");
const {
    sendAndConfirmTransaction
} = require("./blockchainService");

const SUPPORTED_CHAINS = ["sepolia"];
const SUPPORTED_TYPES = ["transfer", "escrow"];


/**
 * Validate transaction input
 */
function validateTransactionInput({
    sender,
    recipient,
    amount,
    chain,
    type
}) {
    if (!sender || !isAddress(sender)) {
        throw new Error(
            "Invalid sender address"
        );
    }

    if (!recipient || !isAddress(recipient)) {
        throw new Error(
            "Invalid recipient address"
        );
    }

    if (
        amount === undefined ||
        amount === null ||
        amount === ""
    ) {
        throw new Error(
            "Amount is required"
        );
    }

    try {
    const weiAmount = parseEther(String(amount));

    if (weiAmount === 0n) {
        throw new Error("Amount must be greater than zero");
    }

    if (weiAmount < 0n) {
        throw new Error("Amount must be greater than zero");
    }

} catch (error) {
    if (error.message === "Amount must be greater than zero") {
        throw error;
    }

    throw new Error(
        "Invalid amount. Amount must be a valid positive ETH value"
    );
}

    if (
        !chain ||
        !SUPPORTED_CHAINS.includes(
            chain.toLowerCase()
        )
    ) {
        throw new Error(
            `Unsupported chain. Supported chains: ${SUPPORTED_CHAINS.join(", ")}`
        );
    }

    if (
        !type ||
        !SUPPORTED_TYPES.includes(
            type.toLowerCase()
        )
    ) {
        throw new Error(
            `Invalid transaction type. Supported types: ${SUPPORTED_TYPES.join(", ")}`
        );
    }
}


/**
 * Create transaction request
 *
 * transfer:
 *   Creates and immediately broadcasts blockchain transaction.
 *
 * escrow:
 *   Creates transaction intent only.
 *   Blockchain ETH transfer happens later through escrow deposit().
 */
async function createTransactionRequest({
    sender,
    recipient,
    amount,
    chain,
    type = "transfer",
    idempotency_key
}) {

    type = type.toLowerCase();

    /**
     * 1. Validate transaction input
     */
    validateTransactionInput({
        sender,
        recipient,
        amount,
        chain,
        type
    });

    /**
     * 2. Check duplicate request
     *
     * If the same idempotency key was already used,
     * return the existing transaction instead of
     * creating another transaction.
     */
    if (idempotency_key) {

        const existingTransaction =
            findTransactionByIdempotencyKey(
                idempotency_key
            );

        if (existingTransaction) {
            return existingTransaction;
        }
    }

    /**
     * 3. Verify DID on blockchain
     */
    const identity =
        await verifyWalletDID(sender);

    /**
     * 4. Find local DID → wallet mapping
     */
    const wallet =
        findWalletByDid(identity.did_id);

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found for DID"
        );
    }

    /**
     * 5. Make sure sender matches DID wallet
     */
    if (
        wallet.wallet_address.toLowerCase() !==
        sender.toLowerCase()
    ) {
        throw new Error(
            "Sender address does not match DID wallet"
        );
    }

    /**
     * 6. Create transaction record
     */
    const transaction = {

        tx_id: `tx_${uuidv4()}`,

        sender,

        recipient,

        amount: String(amount),

        chain: chain.toLowerCase(),

        type,

        idempotency_key:
            idempotency_key || null,

        did_id: identity.did_id,

        status: "created",

        transaction_hash: null,

        block_number: null,

        timestamp: new Date().toISOString()
    };

    createTransaction(transaction);

    /**
     * ESCROW TRANSACTION
     *
     * Do NOT send ETH here.
     *
     * This transaction is only an intent/record.
     * The escrow contract will receive the ETH
     * through the deposit endpoint.
     */
    if (type === "escrow") {
        return transaction;
    }

    /**
     * NORMAL TRANSFER
     *
     * Decrypt the DID wallet's private key
     * and use it to sign/send the transaction.
     */
    let privateKey = null;

    try {

        /**
         * 7. Make sure encrypted private key exists
         */
        if (!wallet.encrypted_private_key) {
            throw new Error(
                "Encrypted private key not found for wallet"
            );
        }

        /**
         * 8. Decrypt wallet private key
         */
        try {

            privateKey =
                decryptPrivateKey(
                    wallet.encrypted_private_key
                );

        } catch (error) {

            throw new Error(
                "Unable to decrypt wallet private key"
            );
        }

        /**
         * 9. Send blockchain transaction
         */
        const confirmation =
            await sendAndConfirmTransaction({
                privateKey,
                recipient,
                amount
            });

        /**
         * 10. Update local transaction record
         */
        return updateTransaction(
            transaction.tx_id,
            {
                status: "confirmed",

                transaction_hash:
                    confirmation.transaction_hash,

                block_number:
                    confirmation.block_number
            }
        );

    } catch (error) {

        console.error(
            "Transaction failed"
        );

        console.error(
            "Transaction ID:",
            transaction.tx_id
        );

        console.error(
            "Error code:",
            error.code
        );

        console.error(
            "Error message:",
            error.message
        );

        /**
         * Mark transaction as failed
         */
        updateTransaction(
            transaction.tx_id,
            {
                status: "failed",

                error: error.message
            }
        );

        throw error;

    } finally {

        /**
         * Remove the local reference to the
         * decrypted private key.
         */
        privateKey = null;
    }
}


/**
 * Get transaction status
 */
function getTransactionStatus(txId) {

    const transaction =
        findTransactionById(txId);

    if (!transaction) {
        throw new Error(
            "Transaction not found"
        );
    }

    return transaction;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createTransactionRequest,
    getTransactionStatus,
    validateTransactionInput
};