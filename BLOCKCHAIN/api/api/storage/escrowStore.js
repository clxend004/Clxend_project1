const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "escrows.json");

function ensureDataFile() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, "[]");
    }
}

function getEscrows() {
    ensureDataFile();

    const data = fs.readFileSync(
        dataFile,
        "utf8"
    );

    return JSON.parse(data);
}

function saveEscrows(escrows) {
    ensureDataFile();

    fs.writeFileSync(
        dataFile,
        JSON.stringify(escrows, null, 2)
    );
}

function createEscrow(escrow) {
    const escrows = getEscrows();

    escrows.push(escrow);

    saveEscrows(escrows);

    return escrow;
}

function findEscrowById(escrowId) {
    const escrows = getEscrows();

    return escrows.find(
        escrow => escrow.escrow_id === escrowId
    );
}

function findEscrowByTransactionId(txId) {
    const escrows = getEscrows();

    return escrows.find(
        escrow => escrow.tx_id === txId
    );
}

function updateEscrow(escrowId, updates) {
    const escrows = getEscrows();

    const index = escrows.findIndex(
        escrow => escrow.escrow_id === escrowId
    );

    if (index === -1) {
        throw new Error("Escrow not found");
    }

    escrows[index] = {
        ...escrows[index],
        ...updates
    };

    saveEscrows(escrows);

    return escrows[index];
}

module.exports = {
    getEscrows,
    saveEscrows,
    createEscrow,
    findEscrowById,
    findEscrowByTransactionId,
    updateEscrow
};