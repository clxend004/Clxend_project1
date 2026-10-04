const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "transactions.json");

function ensureDataFile() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "[]");
    }
}

function getTransactions() {
    ensureDataFile();

    const data = fs.readFileSync(dataFile, "utf8");

    return JSON.parse(data);
}

function saveTransactions(transactions) {
    ensureDataFile();

    fs.writeFileSync(
        dataFile,
        JSON.stringify(transactions, null, 2)
    );
}

function createTransaction(transaction) {
    const transactions = getTransactions();

    transactions.push(transaction);

    saveTransactions(transactions);

    return transaction;
}

function findTransactionById(txId) {
    const transactions = getTransactions();

    return transactions.find(
        transaction => transaction.tx_id === txId
    );
}

// NEW: Find transaction using idempotency key
function findTransactionByIdempotencyKey(idempotencyKey) {
    const transactions = getTransactions();

    return transactions.find(
        transaction =>
            transaction.idempotency_key === idempotencyKey
    );
}

function updateTransaction(txId, updates) {
    const transactions = getTransactions();

    const index = transactions.findIndex(
        transaction => transaction.tx_id === txId
    );

    if (index === -1) {
        throw new Error("Transaction not found");
    }

    transactions[index] = {
        ...transactions[index],
        ...updates
    };

    saveTransactions(transactions);

    return transactions[index];
}

module.exports = {
    getTransactions,
    saveTransactions,
    createTransaction,
    findTransactionById,
    findTransactionByIdempotencyKey,
    updateTransaction
};