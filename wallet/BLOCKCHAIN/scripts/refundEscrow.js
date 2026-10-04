require("dotenv").config();

const { ethers } = require("ethers");

const ESCROW_ADDRESS =
    "0x33A36Ee84a765670E0510072E76c39Eaf3BeD09f";

const escrowAbi = [
    "function refund()",
    "function getCurrentState() view returns (string)",
    "function getBalance() view returns (uint256)"
];

async function main() {

    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL
    );

    const arbiter = new ethers.Wallet(
        process.env.ARBITER_PRIVATE_KEY,
        provider
    );

    const escrow = new ethers.Contract(
        ESCROW_ADDRESS,
        escrowAbi,
        arbiter
    );

    console.log("Arbiter:", arbiter.address);
    console.log("Escrow:", ESCROW_ADDRESS);

    console.log("\nBefore refund:");

    console.log(
        "State:",
        await escrow.getCurrentState()
    );

    console.log(
        "Balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );

    console.log("\nCalling refund()...");

    const tx = await escrow.refund();

    console.log(
        "Refund Transaction:",
        tx.hash
    );

    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(
        "Confirmed in block:",
        receipt.blockNumber
    );

    console.log(
        "Gas used:",
        receipt.gasUsed.toString()
    );

    console.log("\nAfter refund:");

    console.log(
        "State:",
        await escrow.getCurrentState()
    );

    console.log(
        "Balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});