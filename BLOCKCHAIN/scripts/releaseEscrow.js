const hre = require("hardhat");

async function main() {
    const provider = hre.ethers.provider;

    const arbiter = new hre.ethers.Wallet(
        process.env.ARBITER_PRIVATE_KEY,
        provider
    );

    console.log("Arbiter:", await arbiter.getAddress());

    const escrow = await hre.ethers.getContractAt(
        "EscrowAdvanced",
        "0x75f03c012D35F48205a167CC0C60F76760FB904a",
        arbiter
    );

    console.log("\nBefore release:");
    console.log("State:", await escrow.getCurrentState());
    console.log(
        "Balance:",
        hre.ethers.formatEther(await escrow.getBalance()),
        "ETH"
    );

    const tx = await escrow.release();

    console.log("\nRelease transaction:", tx.hash);

    const receipt = await tx.wait();

    console.log("Confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    console.log("\nAfter release:");
    console.log("State:", await escrow.getCurrentState());
    console.log(
        "Balance:",
        hre.ethers.formatEther(await escrow.getBalance()),
        "ETH"
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});