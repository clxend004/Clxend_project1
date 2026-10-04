const fs = require("fs");
const path = require("path");

const dataDirectory = path.join(__dirname, "../data");
const filePath = path.join(dataDirectory, "wallets.json");

function ensureStorage() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]");
    }
}

function readWallets() {
    ensureStorage();

    const data = fs.readFileSync(filePath, "utf8");

    return JSON.parse(data);
}

function saveWallets(wallets) {
    ensureStorage();

    fs.writeFileSync(
        filePath,
        JSON.stringify(wallets, null, 2)
    );
}

function createWalletMapping(wallet) {
    const wallets = readWallets();

    wallets.push(wallet);

    saveWallets(wallets);

    return wallet;
}

function findWalletByDid(did) {
    const wallets = readWallets();

    return wallets.find(wallet => wallet.did === did);
}

function findWalletByAddress(walletAddress) {
    const wallets = readWallets();

    return wallets.find(
        wallet =>
            wallet.wallet_address.toLowerCase() ===
            walletAddress.toLowerCase()
    );
}

module.exports = {
    createWalletMapping,
    findWalletByDid,
    findWalletByAddress
};