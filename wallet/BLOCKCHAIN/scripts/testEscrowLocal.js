const hre = require("hardhat");

async function main() {
    const escrowAddress =
        "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const escrow = await hre.ethers.getContractAt(
        "EscrowAdvanced",
        escrowAddress
    );

    console.log("Escrow:", escrowAddress);

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
        "Initial State:",
        await escrow.getCurrentState()
    );

    console.log(
        "Initial Balance:",
        hre.ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});