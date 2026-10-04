require("dotenv").config({ path: "./.env" });
const { ethers } = require("ethers");
const abi = require("../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
);

async function lookup(walletAddress) {
    try {
        console.log("Using contract:", process.env.CONTRACT_ADDRESS);
        console.log("Looking up address:", walletAddress);

        const data = await contract.getIdentity(walletAddress);

        const result = {
            did_id: data[0],
            wallet: data[1],
            kyc_hash: data[2],
            status: data[3],
            created_at: new Date(Number(data[4]) * 1000).toLocaleString() //  human readable
        };

        console.log("\n Identity Lookup Result:");
        console.table(result); //  cleaner output

    } catch (error) {
        console.error(" Error:", error.message);
    }
}

//  Use the wallet that created the identity
lookup(wallet.address);