const { expect } = require("chai");
const proxyquire = require("proxyquire").noCallThru();

const {
    getTransactions,
    saveTransactions
} = require("../api/api/storage/transactionStore");


// ============================================================
// MOCK DID SERVICE
// ============================================================
//
// Transaction unit tests should not depend on the real
// Sepolia blockchain.
//
// The real application still uses verifyWalletDID()
// from didService.js.
//
const mockDidService = {
    verifyWalletDID: async function (walletAddress) {

        return {
            exists: true,
            did_id: "did:ethr:test-user",
            wallet: walletAddress,
            kyc_hash: "test-kyc-hash",
            status: 1,
            created_at: Date.now()
        };
    }
};


// ============================================================
// MOCK WALLET STORE
// ============================================================
//
// This represents the local wallet belonging to the
// verified DID.
//
const mockWalletStore = {
    findWalletByDid: function (didId) {

        return {
            wallet_address:
                "0x1234567890123456789012345678901234567890",

            encrypted_private_key:
                "test-encrypted-private-key",

            did_id: didId
        };
    }
};


// ============================================================
// LOAD TRANSACTION SERVICE WITH MOCKS
// ============================================================

const {
    createTransactionRequest,
    getTransactionStatus,
    validateTransactionInput
} = proxyquire(
    "../api/api/services/transactionService",
    {
        "../services/didService":
            mockDidService,

        "../storage/walletStore":
            mockWalletStore
    }
);


// ============================================================
// TEST SUITE
// ============================================================

describe("Transaction Service", function () {

    const validTransaction = {
        sender:
            "0x1234567890123456789012345678901234567890",

        recipient:
            "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",

        amount:
            "0.01",

        chain:
            "sepolia",

        type:
            "escrow"
    };


    // ========================================================
    // CLEAN TRANSACTION STORE BEFORE EACH TEST
    // ========================================================

    beforeEach(function () {

        saveTransactions([]);
    });


    // ========================================================
    // TRANSACTION CREATION
    // ========================================================

    describe("Transaction Creation", function () {

        it(
            "Should create a valid transaction",
            async function () {

                const transaction =
                    await createTransactionRequest(
                        validTransaction
                    );

                expect(transaction)
                    .to.have.property("tx_id");

                expect(transaction.sender)
                    .to.equal(
                        validTransaction.sender
                    );

                expect(transaction.recipient)
                    .to.equal(
                        validTransaction.recipient
                    );

                expect(transaction.amount)
                    .to.equal("0.01");

                expect(transaction.chain)
                    .to.equal("sepolia");

                expect(transaction.type)
                    .to.equal("escrow");

                expect(transaction.status)
                    .to.equal("created");
            }
        );


        it(
            "Should generate a unique tx_id",
            async function () {

                const transaction1 =
                    await createTransactionRequest(
                        validTransaction
                    );

                const transaction2 =
                    await createTransactionRequest(
                        validTransaction
                    );

                expect(transaction1.tx_id)
                    .to.not.equal(
                        transaction2.tx_id
                    );
            }
        );


        it(
            "Should persist the transaction",
            async function () {

                const transaction =
                    await createTransactionRequest(
                        validTransaction
                    );

                const storedTransaction =
                    getTransactionStatus(
                        transaction.tx_id
                    );

                expect(storedTransaction.tx_id)
                    .to.equal(
                        transaction.tx_id
                    );

                expect(storedTransaction.status)
                    .to.equal("created");
            }
        );

    });


    // ========================================================
    // TRANSACTION VALIDATION
    // ========================================================

    describe("Transaction Validation", function () {

        it(
            "Should reject an invalid sender",
            function () {

                expect(() => {

                    validateTransactionInput({
                        ...validTransaction,
                        sender:
                            "invalid-address"
                    });

                }).to.throw(
                    "Invalid sender address"
                );
            }
        );


        it(
            "Should reject an invalid recipient",
            function () {

                expect(() => {

                    validateTransactionInput({
                        ...validTransaction,
                        recipient:
                            "invalid-address"
                    });

                }).to.throw(
                    "Invalid recipient address"
                );
            }
        );


        it(
            "Should reject zero amount",
            function () {

                expect(() => {

                    validateTransactionInput({
                        ...validTransaction,
                        amount: "0"
                    });

                }).to.throw(
                    "Amount must be greater than zero"
                );
            }
        );


        it(
            "Should reject negative amount",
            function () {

                expect(() => {

                    validateTransactionInput({
                        ...validTransaction,
                        amount: "-1"
                    });

                }).to.throw(
                    "Amount must be greater than zero"
                );
            }
        );


        it(
            "Should reject unsupported chain",
            function () {

                expect(() => {

                    validateTransactionInput({
                        ...validTransaction,
                        chain: "bitcoin"
                    });

                }).to.throw(
                    "Unsupported chain"
                );
            }
        );


        it(
            "Should reject missing amount",
            function () {

                expect(() => {

                    validateTransactionInput({
                        sender:
                            validTransaction.sender,

                        recipient:
                            validTransaction.recipient,

                        chain:
                            validTransaction.chain
                    });

                }).to.throw(
                    "Amount is required"
                );
            }
        );

    });


    // ========================================================
    // TRANSACTION STATUS
    // ========================================================

    describe("Transaction Status", function () {

        it(
            "Should retrieve transaction by tx_id",
            async function () {

                const transaction =
                    await createTransactionRequest(
                        validTransaction
                    );

                const result =
                    getTransactionStatus(
                        transaction.tx_id
                    );

                expect(result.tx_id)
                    .to.equal(
                        transaction.tx_id
                    );

                expect(result.status)
                    .to.equal("created");
            }
        );


        it(
            "Should reject unknown tx_id",
            function () {

                expect(() => {

                    getTransactionStatus(
                        "tx_does_not_exist"
                    );

                }).to.throw(
                    "Transaction not found"
                );
            }
        );

    });

});