require("dotenv").config();

const { ethers } = require("ethers");

const ESCROW_ADDRESS = "0x33A36Ee84a765670E0510072E76c39Eaf3BeD09f";

const escrowAbi = [
    "function deposit() payable",
    "function getCurrentState() view returns (string)",
    "function getBalance() view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_URL
    );

    const wallet = new ethers.Wallet(
        process.env.PRIVATE_KEY,
        provider
    );

    const escrow = new ethers.Contract(
        ESCROW_ADDRESS,
        escrowAbi,
        wallet
    );

    console.log("Buyer:", wallet.address);

    console.log(
        "Before State:",
        await escrow.getCurrentState()
    );

    console.log(
        "Before Balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );

    console.log("Depositing 0.01 ETH...");

    const tx = await escrow.deposit({
        value: ethers.parseEther("0.01")
    });

    console.log("Transaction Hash:", tx.hash);

    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log(
        "Confirmed in Block:",
        receipt.blockNumber
    );

    console.log(
        "After State:",
        await escrow.getCurrentState()
    );

    console.log(
        "After Balance:",
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