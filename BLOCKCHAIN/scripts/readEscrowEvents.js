require("dotenv").config();

const { ethers } = require("ethers");

const ESCROW_ADDRESS =
    "0x33A36Ee84a765670E0510072E76c39Eaf3BeD09f";

const REFUND_BLOCK = 11620620;

const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL
);

async function main() {
    console.log("Escrow Address:", ESCROW_ADDRESS);
    console.log("Refund Block:", REFUND_BLOCK);

    const logs = await provider.getLogs({
        address: ESCROW_ADDRESS,
        fromBlock: REFUND_BLOCK,
        toBlock: REFUND_BLOCK
    });

    console.log("Found logs:", logs.length);

    for (const log of logs) {
        console.log("--------------------------------");
        console.log("Event: Refunded");

        const buyer = ethers.getAddress(
            "0x" + log.topics[1].slice(-40)
        );

        const amount = BigInt(log.topics[2]);

        console.log("Buyer:", buyer);

        console.log(
            "Amount:",
            ethers.formatEther(amount),
            "ETH"
        );

        console.log(
            "Transaction Hash:",
            log.transactionHash
        );

        console.log(
            "Block Number:",
            log.blockNumber
        );
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exitCode = 1;
});