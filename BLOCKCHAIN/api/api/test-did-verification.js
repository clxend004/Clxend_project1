const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const abi = require("../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json").abi;

const rpcUrl = process.env.SEPOLIA_RPC_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;
const adminPrivateKey = process.env.DID_ADMIN_PRIVATE_KEY;

if (!rpcUrl) {
    throw new Error("SEPOLIA_RPC_URL is missing");
}

if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is missing");
}

if (!adminPrivateKey) {
    throw new Error("DID_ADMIN_PRIVATE_KEY is missing");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
const contract = new ethers.Contract(
    contractAddress,
    abi,
    adminWallet
);

const userWallet =
    "0xA3e2F389aD996148626C8BbA4B8B04368103cCaA";

async function main() {

    console.log("Admin wallet:", adminWallet.address);

    const contractAdmin = await contract.admin();

    console.log("Contract admin:", contractAdmin);

    if (
        adminWallet.address.toLowerCase() !==
        contractAdmin.toLowerCase()
    ) {
        throw new Error(
            "Configured DID admin key does not match contract admin"
        );
    }

    console.log("Admin verification: PASSED");

    const identity = await contract.getIdentity(userWallet);

    console.log("Current DID:", identity[0]);
    console.log("Wallet:", identity[1]);
    console.log("Current status:", Number(identity[3]));

    if (Number(identity[3]) === 1) {
        console.log("DID is already VERIFIED");
        return;
    }

    console.log("Updating DID status to VERIFIED...");

    const tx = await contract.updateStatus(
        userWallet,
        1
    );

    console.log("Transaction submitted:", tx.hash);

    const receipt = await tx.wait();

    console.log(
        "Verification confirmed in block:",
        receipt.blockNumber
    );

    const updatedIdentity =
        await contract.getIdentity(userWallet);

    console.log("DID:", updatedIdentity[0]);
    console.log("Wallet:", updatedIdentity[1]);
    console.log("New status:", Number(updatedIdentity[3]));

    console.log("DID verification completed successfully.");
}

main().catch((error) => {
    console.error("Verification failed:", error.message);
});