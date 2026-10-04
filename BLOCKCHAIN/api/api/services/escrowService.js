const path = require("path");
const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config({
    path: path.resolve(__dirname, "../../../.env")
});

const {
    createEscrow,
    findEscrowById,
    findEscrowByTransactionId,
    updateEscrow
} = require("../storage/escrowStore");

const {
    findTransactionById,
    updateTransaction
} = require("../storage/transactionStore");

const {
    findWalletByDid
} = require("../storage/walletStore");

const {
    decryptPrivateKey
} = require("./walletService");

const {
    verifyWalletDID
} = require("./didService");


// ============================================================
// ESCROW CONTRACT ARTIFACT
// ============================================================

const escrowArtifact = require(
    "../../../artifacts/contracts/EscrowAdvanced.sol/EscrowAdvanced.json"
);


// ============================================================
// PROVIDER
// ============================================================

const rpcUrl = process.env.SEPOLIA_RPC_URL;

if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);


// ============================================================
// CONTRACT HELPER
// ============================================================

function getEscrowContract(address, signer = provider) {

    if (!ethers.isAddress(address)) {
        throw new Error(
            "Invalid escrow contract address"
        );
    }

    return new ethers.Contract(
        address,
        escrowArtifact.abi,
        signer
    );
}


// ============================================================
// DEPLOY ESCROW
// ============================================================

async function deployEscrowContract({
    buyerPrivateKey,
    seller,
    arbiter
}) {

    if (!buyerPrivateKey) {
        throw new Error(
            "Buyer private key is required"
        );
    }

    if (!ethers.isAddress(seller)) {
        throw new Error(
            "Invalid seller address"
        );
    }

    if (!ethers.isAddress(arbiter)) {
        throw new Error(
            "Invalid arbiter address"
        );
    }

    const buyerWallet = new ethers.Wallet(
        buyerPrivateKey,
        provider
    );

    const factory = new ethers.ContractFactory(
        escrowArtifact.abi,
        escrowArtifact.bytecode,
        buyerWallet
    );

    const escrow = await factory.deploy(
        seller,
        arbiter
    );

    const deploymentTx = escrow.deploymentTransaction();

    await escrow.waitForDeployment();

    const contractAddress =
        await escrow.getAddress();

    let deploymentReceipt = null;

    if (deploymentTx) {
        deploymentReceipt =
            await deploymentTx.wait();
    }

    return {
        contract_address: contractAddress,
        deployment_transaction_hash:
            deploymentTx
                ? deploymentTx.hash
                : null,
        deployment_block_number:
            deploymentReceipt
                ? deploymentReceipt.blockNumber
                : null,
        buyer: buyerWallet.address,
        seller,
        arbiter
    };
}


// ============================================================
// CREATE ESCROW REQUEST
// ============================================================

async function createEscrowRequest({
    tx_id,
    amount,
    seller,
    arbiter
}) {

    // --------------------------------------------------------
    // Validate input
    // --------------------------------------------------------

    if (!tx_id) {
        throw new Error(
            "tx_id is required"
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

    let escrowAmount;

    try {

        escrowAmount =
            ethers.parseEther(
                String(amount)
            );

        if (escrowAmount <= 0n) {
            throw new Error();
        }

    } catch (error) {

        throw new Error(
            "Invalid amount. Amount must be a valid positive ETH value"
        );
    }


    if (!seller || !ethers.isAddress(seller)) {
        throw new Error(
            "Invalid seller address"
        );
    }


    if (!arbiter) {

        if (!process.env.ARBITER_PRIVATE_KEY) {
            throw new Error(
                "ARBITER_PRIVATE_KEY is not configured"
            );
        }

        const arbiterWallet =
            new ethers.Wallet(
                process.env.ARBITER_PRIVATE_KEY
            );

        arbiter = arbiterWallet.address;
    }


    if (!ethers.isAddress(arbiter)) {
        throw new Error(
            "Invalid arbiter address"
        );
    }


    // --------------------------------------------------------
    // Find transaction
    // --------------------------------------------------------

    const transaction =
        findTransactionById(tx_id);

    if (!transaction) {
        throw new Error(
            "Transaction not found"
        );
    }


    // --------------------------------------------------------
    // Prevent duplicate escrow
    // --------------------------------------------------------

    const existing =
        findEscrowByTransactionId(tx_id);

    if (existing) {
        throw new Error(
            "Escrow already exists for this transaction"
        );
    }


    // --------------------------------------------------------
    // Verify transaction sender DID
    // --------------------------------------------------------

    const identity =
        await verifyWalletDID(
            transaction.sender
        );


    // --------------------------------------------------------
    // Find CLXEND wallet mapped to DID
    // --------------------------------------------------------

    const wallet =
        findWalletByDid(
            identity.did_id
        );

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found for DID"
        );
    }


    // --------------------------------------------------------
    // Verify sender matches wallet
    // --------------------------------------------------------

    if (
        wallet.wallet_address.toLowerCase() !==
        transaction.sender.toLowerCase()
    ) {

        throw new Error(
            "Transaction sender does not match DID wallet"
        );
    }


    // --------------------------------------------------------
    // Private key must exist for backend-controlled wallet
    // --------------------------------------------------------

    if (!wallet.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found for wallet"
        );
    }


    let buyerPrivateKey = null;

    try {

        // ----------------------------------------------------
        // Decrypt buyer private key
        // ----------------------------------------------------

        try {

            buyerPrivateKey =
                decryptPrivateKey(
                    wallet.encrypted_private_key
                );

        } catch (error) {

            throw new Error(
                "Unable to decrypt buyer wallet private key"
            );
        }


        // ----------------------------------------------------
        // Confirm decrypted key belongs to sender
        // ----------------------------------------------------

        const buyerWallet =
            new ethers.Wallet(
                buyerPrivateKey
            );

        if (
            buyerWallet.address.toLowerCase() !==
            transaction.sender.toLowerCase()
        ) {

            throw new Error(
                "Decrypted wallet does not match transaction sender"
            );
        }


        // ----------------------------------------------------
        // Deploy escrow
        // ----------------------------------------------------

        const deployment =
            await deployEscrowContract({
                buyerPrivateKey,
                seller,
                arbiter
            });


        // ----------------------------------------------------
        // Read initial blockchain state
        // ----------------------------------------------------

        const escrowContract =
            getEscrowContract(
                deployment.contract_address
            );

        const blockchainState =
            await escrowContract.getCurrentState();

        const blockchainBalance =
            await escrowContract.getBalance();


        // ----------------------------------------------------
        // Create off-chain escrow record
        // ----------------------------------------------------

        const escrow = {

            escrow_id:
                `escrow_${uuidv4()}`,

            tx_id,

            did_id:
                identity.did_id,

            contract_address:
                deployment.contract_address,

            buyer:
                deployment.buyer,

            seller:
                deployment.seller,

            arbiter:
                deployment.arbiter,

            amount:
                String(amount),

            status:
                blockchainState,

            blockchain_balance:
                ethers.formatEther(
                    blockchainBalance
                ),

            deployment_transaction_hash:
                deployment.deployment_transaction_hash,

            transaction_hash:
                transaction.transaction_hash || null,

            block_number:
                transaction.block_number || null,

            created_at:
                new Date().toISOString()
        };


        return createEscrow(escrow);

    } finally {

        // Never keep the decrypted key around
        buyerPrivateKey = null;
    }
}


// ============================================================
// DEPOSIT INTO ESCROW
// ============================================================

async function depositEscrow(escrowId) {

    const escrow =
        findEscrowById(escrowId);

    if (!escrow) {
        throw new Error(
            "Escrow not found"
        );
    }


    if (escrow.status !== "Created") {

        throw new Error(
            `Escrow cannot be funded from state ${escrow.status}`
        );
    }


    // --------------------------------------------------------
    // Find linked transaction
    // --------------------------------------------------------

    const transaction =
        findTransactionById(
            escrow.tx_id
        );

    if (!transaction) {
        throw new Error(
            "Linked transaction not found"
        );
    }


    // --------------------------------------------------------
    // Verify DID
    // --------------------------------------------------------

    const identity =
        await verifyWalletDID(
            transaction.sender
        );


    const wallet =
        findWalletByDid(
            identity.did_id
        );

    if (!wallet) {
        throw new Error(
            "Wallet mapping not found for DID"
        );
    }


    if (!wallet.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found"
        );
    }


    let buyerPrivateKey = null;

    try {

        buyerPrivateKey =
            decryptPrivateKey(
                wallet.encrypted_private_key
            );


        const buyerWallet =
            new ethers.Wallet(
                buyerPrivateKey,
                provider
            );


        // ----------------------------------------------------
        // Verify buyer address
        // ----------------------------------------------------

        if (
            buyerWallet.address.toLowerCase() !==
            escrow.buyer.toLowerCase()
        ) {

            throw new Error(
                "Wallet does not match escrow buyer"
            );
        }


        const contract =
            getEscrowContract(
                escrow.contract_address,
                buyerWallet
            );


        // ----------------------------------------------------
        // Deposit exact escrow amount
        // ----------------------------------------------------

        const value =
            ethers.parseEther(
                String(escrow.amount)
            );


        const tx =
            await contract.deposit({
                value
            });


        const receipt =
            await tx.wait();


        // ----------------------------------------------------
        // Track Deposited event
        // ----------------------------------------------------

        let eventDetected = false;

        for (const log of receipt.logs) {

            try {

                const parsed =
                    contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });

                if (
                    parsed &&
                    parsed.name === "Deposited"
                ) {
                    eventDetected = true;
                    break;
                }

            } catch (error) {
                // Ignore unrelated logs
            }
        }


        // ----------------------------------------------------
        // Read blockchain state
        // ----------------------------------------------------

        const state =
            await contract.getCurrentState();

        const balance =
            await contract.getBalance();


        // ----------------------------------------------------
        // Update escrow
        // ----------------------------------------------------

        const updatedEscrow =
            updateEscrow(
                escrowId,
                {
                    status: state,

                    blockchain_balance:
                        ethers.formatEther(
                            balance
                        ),

                    deposit_transaction_hash:
                        tx.hash,

                    deposit_block_number:
                        receipt.blockNumber,

                    deposit_event_detected:
                        eventDetected
                }
            );


        // ----------------------------------------------------
        // Update linked transaction
        // ----------------------------------------------------

        updateTransaction(
            escrow.tx_id,
            {
                status: "funded"
            }
        );


        return updatedEscrow;

    } finally {

        buyerPrivateKey = null;
    }
}


// ============================================================
// RELEASE ESCROW
// ============================================================

async function releaseEscrow(escrowId) {

    const escrow =
        findEscrowById(escrowId);

    if (!escrow) {
        throw new Error(
            "Escrow not found"
        );
    }


    if (escrow.status !== "Funded") {

        throw new Error(
            `Escrow cannot be released from state ${escrow.status}`
        );
    }


    if (!process.env.ARBITER_PRIVATE_KEY) {
        throw new Error(
            "ARBITER_PRIVATE_KEY is not configured"
        );
    }


    let arbiterPrivateKey =
        process.env.ARBITER_PRIVATE_KEY;

    try {

        const arbiterWallet =
            new ethers.Wallet(
                arbiterPrivateKey,
                provider
            );


        // ----------------------------------------------------
        // Verify arbiter
        // ----------------------------------------------------

        if (
            arbiterWallet.address.toLowerCase() !==
            escrow.arbiter.toLowerCase()
        ) {

            throw new Error(
                "Configured arbiter wallet does not match escrow arbiter"
            );
        }


        const contract =
            getEscrowContract(
                escrow.contract_address,
                arbiterWallet
            );


        // ----------------------------------------------------
        // Release
        // ----------------------------------------------------

        const tx =
            await contract.release();

        const receipt =
            await tx.wait();


        // ----------------------------------------------------
        // Track event
        // ----------------------------------------------------

        let eventDetected = false;

        for (const log of receipt.logs) {

            try {

                const parsed =
                    contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });

                if (
                    parsed &&
                    parsed.name === "Released"
                ) {
                    eventDetected = true;
                    break;
                }

            } catch (error) {
                // Ignore unrelated logs
            }
        }


        const state =
            await contract.getCurrentState();

        const balance =
            await contract.getBalance();


        const updatedEscrow =
            updateEscrow(
                escrowId,
                {
                    status: state,

                    blockchain_balance:
                        ethers.formatEther(
                            balance
                        ),

                    release_transaction_hash:
                        tx.hash,

                    release_block_number:
                        receipt.blockNumber,

                    release_event_detected:
                        eventDetected
                }
            );


        updateTransaction(
            escrow.tx_id,
            {
                status: "released"
            }
        );


        return updatedEscrow;

    } finally {

        arbiterPrivateKey = null;
    }
}


// ============================================================
// REFUND ESCROW
// ============================================================

async function refundEscrow(escrowId) {

    const escrow =
        findEscrowById(escrowId);

    if (!escrow) {
        throw new Error(
            "Escrow not found"
        );
    }


    if (escrow.status !== "Funded") {

        throw new Error(
            `Escrow cannot be refunded from state ${escrow.status}`
        );
    }


    if (!process.env.ARBITER_PRIVATE_KEY) {
        throw new Error(
            "ARBITER_PRIVATE_KEY is not configured"
        );
    }


    let arbiterPrivateKey =
        process.env.ARBITER_PRIVATE_KEY;

    try {

        const arbiterWallet =
            new ethers.Wallet(
                arbiterPrivateKey,
                provider
            );


        if (
            arbiterWallet.address.toLowerCase() !==
            escrow.arbiter.toLowerCase()
        ) {

            throw new Error(
                "Configured arbiter wallet does not match escrow arbiter"
            );
        }


        const contract =
            getEscrowContract(
                escrow.contract_address,
                arbiterWallet
            );


        // ----------------------------------------------------
        // Refund
        // ----------------------------------------------------

        const tx =
            await contract.refund();

        const receipt =
            await tx.wait();


        // ----------------------------------------------------
        // Track Refunded event
        // ----------------------------------------------------

        let eventDetected = false;

        for (const log of receipt.logs) {

            try {

                const parsed =
                    contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });

                if (
                    parsed &&
                    parsed.name === "Refunded"
                ) {
                    eventDetected = true;
                    break;
                }

            } catch (error) {
                // Ignore unrelated logs
            }
        }


        const state =
            await contract.getCurrentState();

        const balance =
            await contract.getBalance();


        const updatedEscrow =
            updateEscrow(
                escrowId,
                {
                    status: state,

                    blockchain_balance:
                        ethers.formatEther(
                            balance
                        ),

                    refund_transaction_hash:
                        tx.hash,

                    refund_block_number:
                        receipt.blockNumber,

                    refund_event_detected:
                        eventDetected
                }
            );


        updateTransaction(
            escrow.tx_id,
            {
                status: "refunded"
            }
        );


        return updatedEscrow;

    } finally {

        arbiterPrivateKey = null;
    }
}


// ============================================================
// GET ESCROW STATUS
// ============================================================

async function getEscrowStatus(escrowId) {

    const escrow =
        findEscrowById(escrowId);

    if (!escrow) {
        throw new Error(
            "Escrow not found"
        );
    }


    const escrowContract =
        getEscrowContract(
            escrow.contract_address
        );


    const blockchainState =
        await escrowContract.getCurrentState();

    const blockchainBalance =
        await escrowContract.getBalance();


    return {
        ...escrow,

        blockchain_status:
            blockchainState,

        blockchain_balance:
            ethers.formatEther(
                blockchainBalance
            )
    };
}


// ============================================================
// SYNC ESCROW WITH BLOCKCHAIN
// ============================================================

async function syncEscrowFromBlockchain(escrowId) {

    const escrow =
        findEscrowById(escrowId);

    if (!escrow) {
        throw new Error(
            "Escrow not found"
        );
    }


    const escrowContract =
        getEscrowContract(
            escrow.contract_address
        );


    const blockchainState =
        await escrowContract.getCurrentState();

    const blockchainBalance =
        await escrowContract.getBalance();


    const updatedEscrow =
        updateEscrow(
            escrowId,
            {
                status: blockchainState,

                blockchain_balance:
                    ethers.formatEther(
                        blockchainBalance
                    )
            }
        );


    // --------------------------------------------------------
    // Synchronize linked transaction
    // --------------------------------------------------------

    let updatedTransaction = null;

    if (escrow.tx_id) {

        let transactionStatus =
            "created";

        if (
            blockchainState === "Funded"
        ) {
            transactionStatus = "funded";
        }

        if (
            blockchainState === "Released"
        ) {
            transactionStatus = "released";
        }

        if (
            blockchainState === "Refunded"
        ) {
            transactionStatus = "refunded";
        }


        updatedTransaction =
            updateTransaction(
                escrow.tx_id,
                {
                    status:
                        transactionStatus
                }
            );
    }


    return {
        escrow: updatedEscrow,
        transaction: updatedTransaction
    };
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    deployEscrowContract,

    createEscrowRequest,

    depositEscrow,

    releaseEscrow,

    refundEscrow,

    getEscrowStatus,

    syncEscrowFromBlockchain,

    updateEscrow
};