require("dotenv").config();

const { ethers } = require("ethers");

const ESCROW_ADDRESS =
    "0x7effEb1ab4E5a8a1EDc1B64c9aa5904c6A08eb66";

const escrowAbi = [
    "function buyer() view returns (address)",
    "function seller() view returns (address)",
    "function arbiter() view returns (address)",
    "function getCurrentState() view returns (string)",
    "function getBalance() view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL
    );

    const escrow = new ethers.Contract(
        ESCROW_ADDRESS,
        escrowAbi,
        provider
    );

    console.log("Escrow Address:", ESCROW_ADDRESS);

    console.log(
        "Buyer:",
        await escrow.buyer()
    );

    console.log(
        "Seller:",
        await escrow.seller()
    );

    console.log(
        "Arbiter:",
        await escrow.arbiter()
    );

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