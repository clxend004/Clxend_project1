const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const abi = require(
    "../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
).abi;

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const privateKey = process.env.DID_ADMIN_PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing");
}

if (!privateKey) {
    throw new Error("PRIVATE_KEY is missing");
}

if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is missing");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);

const adminWallet = new ethers.Wallet(
    privateKey,
    provider
);

const contract = new ethers.Contract(
    contractAddress,
    abi,
    adminWallet
);

async function main() {

    const userWallet =
        "0x4B5d9D37a9aA3e6f6AED7E0BF0dc5137fde1C6f6";

    console.log("Admin wallet:", adminWallet.address);
    console.log("User wallet:", userWallet);

    // Confirm that this wallet is actually the contract admin
    const contractAdmin = await contract.admin();

    if (
        contractAdmin.toLowerCase() !==
        adminWallet.address.toLowerCase()
    ) {
        throw new Error(
            "This wallet is not the DID Registry admin"
        );
    }

    console.log("Admin verification passed");

    // VERIFIED = 1
    const tx = await contract.updateStatus(
        userWallet,
        1
    );

    console.log(
        "Verification transaction:",
        tx.hash
    );

    const receipt = await tx.wait();

    console.log(
        "Confirmed in block:",
        receipt.blockNumber
    );

    console.log(
        "Identity status updated to VERIFIED"
    );
}

main().catch((error) => {
    console.error("ERROR:", error.message);
    process.exit(1);
});