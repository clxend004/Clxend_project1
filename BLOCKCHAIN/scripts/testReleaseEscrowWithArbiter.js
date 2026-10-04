require("dotenv").config();

const { ethers } = require("ethers");

const ESCROW_ADDRESS =
    "0x84eC08EDa4201421e796afCbA91c89Ca21bC58f9";

const escrowAbi = [
    "function buyer() view returns (address)",
    "function seller() view returns (address)",
    "function arbiter() view returns (address)",
    "function state() view returns (uint8)",
    "function release()",
    "function getBalance() view returns (uint256)",
    "function getCurrentState() view returns (string)"
];


async function main() {

    // ========================================================
    // 1. Connect to Sepolia
    // ========================================================

    const provider =
        new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL
        );


    // ========================================================
    // 2. Load arbiter
    // ========================================================

    if (!process.env.ARBITER_PRIVATE_KEY) {
        throw new Error(
            "ARBITER_PRIVATE_KEY is missing"
        );
    }


    const arbiter =
        new ethers.Wallet(
            process.env.ARBITER_PRIVATE_KEY,
            provider
        );


    console.log(
        "Arbiter:",
        arbiter.address
    );


    // ========================================================
    // 3. Connect to escrow
    // ========================================================

    const escrow =
        new ethers.Contract(
            ESCROW_ADDRESS,
            escrowAbi,
            arbiter
        );


    console.log(
        "Escrow:",
        ESCROW_ADDRESS
    );


    // ========================================================
    // 4. Read current escrow
    // ========================================================

    const buyer =
        await escrow.buyer();

    const seller =
        await escrow.seller();

    const contractArbiter =
        await escrow.arbiter();

    const beforeState =
        await escrow.getCurrentState();

    const beforeBalance =
        await escrow.getBalance();


    console.log("\nBefore release:");

    console.log(
        "Buyer:",
        buyer
    );

    console.log(
        "Seller:",
        seller
    );

    console.log(
        "Contract arbiter:",
        contractArbiter
    );

    console.log(
        "State:",
        beforeState
    );

    console.log(
        "Balance:",
        ethers.formatEther(
            beforeBalance
        ),
        "ETH"
    );


    // ========================================================
    // 5. Verify arbiter authorization
    // ========================================================

    if (
        arbiter.address.toLowerCase() !==
        contractArbiter.toLowerCase()
    ) {

        throw new Error(
            "Configured arbiter does not match escrow arbiter"
        );
    }


    if (beforeState !== "Funded") {

        throw new Error(
            `Escrow must be Funded before release. Current state: ${beforeState}`
        );
    }


    // ========================================================
    // 6. Release
    // ========================================================

    console.log(
        "\nCalling release()..."
    );


    const tx =
        await escrow.release();


    console.log(
        "Release transaction:",
        tx.hash
    );


    // ========================================================
    // 7. Wait for confirmation
    // ========================================================

    const receipt =
        await tx.wait();


    console.log(
        "Confirmed in block:",
        receipt.blockNumber
    );


    // ========================================================
    // 8. Read final state
    // ========================================================

    const afterState =
        await escrow.getCurrentState();

    const afterBalance =
        await escrow.getBalance();


    console.log(
        "\nAfter release:"
    );

    console.log(
        "State:",
        afterState
    );

    console.log(
        "Balance:",
        ethers.formatEther(
            afterBalance
        ),
        "ETH"
    );


    // ========================================================
    // 9. Verify release
    // ========================================================

    if (afterState !== "Released") {

        throw new Error(
            `Expected Released state, got ${afterState}`
        );
    }


    if (afterBalance !== 0n) {

        throw new Error(
            "Escrow balance should be zero after release"
        );
    }


    console.log(
        "\nESCROW RELEASE TEST PASSED"
    );
}


main().catch((error) => {

    console.error(
        "\nESCROW RELEASE TEST FAILED"
    );

    console.error(
        error.message
    );

    process.exitCode = 1;
});