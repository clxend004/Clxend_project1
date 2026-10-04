const hre = require("hardhat");

async function main() {
    const escrowAddress = process.env.ESCROW_ADDRESS;

    if (!escrowAddress) {
        throw new Error("ESCROW_ADDRESS is required");
    }

    const [unauthorizedSigner] = await hre.ethers.getSigners();

    const escrow = await hre.ethers.getContractAt(
        "EscrowAdvanced",
        escrowAddress,
        unauthorizedSigner
    );

    const signerAddress = await unauthorizedSigner.getAddress();
    const arbiterAddress = await escrow.arbiter();

    console.log("Escrow:", escrowAddress);
    console.log("Unauthorized signer:", signerAddress);
    console.log("Contract arbiter:", arbiterAddress);
    console.log(
        "Current state:",
        await escrow.getCurrentState()
    );

    if (
        signerAddress.toLowerCase() ===
        arbiterAddress.toLowerCase()
    ) {
        throw new Error(
            "Test signer is the arbiter. Unauthorized test cannot continue."
        );
    }

    try {
        const tx = await escrow.release();
        await tx.wait();

        console.log(
            "ERROR: Unauthorized release unexpectedly succeeded"
        );
        process.exitCode = 1;
    } catch (error) {
        console.log("EXPECTED FAILURE");
        console.log("Unauthorized release was rejected.");

        if (error.shortMessage) {
            console.log("Reason:", error.shortMessage);
        } else {
            console.log("Reason:", error.message);
        }
    }

    console.log(
        "Final state:",
        await escrow.getCurrentState()
    );

    console.log(
        "Final balance:",
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