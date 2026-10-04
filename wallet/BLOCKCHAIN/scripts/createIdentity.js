require("dotenv").config();
const { ethers } = require("ethers");
const abi = require("../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json").abi;

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Using contract:", process.env.CONTRACT_ADDRESS);
    console.log("Wallet address:", wallet.address);

    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

    // Step 1: Check if identity already exists before sending tx
    try {
        const existing = await contract.getIdentity(wallet.address);
        console.log("  Identity already exists for this wallet:");
        console.log("   DID:", existing[0]);
        console.log("   Status:", existing[3]);
        return; // Exit early — no need to create again
    } catch (_) {
        console.log("No existing identity found. Proceeding...");
    }

    //  Step 2: Use staticCall first to catch revert reason before wasting gas
    try {
        await contract.createIdentity.staticCall("did:004", "QmFinalHash");
    } catch (err) {
        console.error(" StaticCall failed — tx would revert:", err.reason || err.message);
        return;
    }

    // ✅ Step 3: Send actual transaction
    console.log(" Creating Identity...");
    const tx = await contract.createIdentity("did:004", "QmFinalHash");
    console.log(" TX sent:", tx.hash);

    await tx.wait();
    console.log(" Identity Created Successfully!");
}

main().catch(console.error);