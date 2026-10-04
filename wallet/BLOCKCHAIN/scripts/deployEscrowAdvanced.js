const hre = require("hardhat");

async function main() {

    const Escrow = await hre.ethers.getContractFactory("EscrowAdvanced");

    const seller = "0xfbEd81e3a857De32Ec9d680593c94E2a65746dCD";
    const arbiter = "0xF805FB0543188AA87829aDB88a9B6f047dCaA3b7";

    console.log("Deploying Escrow...");

    const escrow = await Escrow.deploy(seller, arbiter);

    await escrow.waitForDeployment();

    console.log("Escrow deployed to:", await escrow.getAddress());

    console.log("Seller:", await escrow.seller());
    console.log("Arbiter:", await escrow.arbiter());
    console.log("Buyer:", await escrow.buyer());
    console.log("Current State:", await escrow.getCurrentState());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});