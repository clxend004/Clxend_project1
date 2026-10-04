const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

// Use the complete Hardhat artifact
const escrowArtifact = require(
    "../artifacts/contracts/EscrowAdvanced.sol/EscrowAdvanced.json"
);

const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL
);

const buyerPrivateKey = process.env.DID_ADMIN_PRIVATE_KEY;
const arbiterPrivateKey = process.env.ARBITER_PRIVATE_KEY;

if (!buyerPrivateKey) {
    throw new Error("DID_ADMIN_PRIVATE_KEY is missing");
}

if (!arbiterPrivateKey) {
    throw new Error("ARBITER_PRIVATE_KEY is missing");
}

const buyerWallet = new ethers.Wallet(
    buyerPrivateKey,
    provider
);

const arbiterWallet = new ethers.Wallet(
    arbiterPrivateKey,
    provider
);

// Existing test seller wallet
const sellerAddress =
    "0x78ca8CD44C90669baB6A2E365511576d9D7519fa";


async function main() {

    console.log("\n========== ESCROW REFUND TEST ==========\n");

    console.log("Buyer:", buyerWallet.address);
    console.log("Seller:", sellerAddress);
    console.log("Arbiter:", arbiterWallet.address);


    // ==================================================
    // 1. DEPLOY FRESH ESCROW
    // ==================================================

    console.log("\n1. Deploying fresh escrow...");

    const factory = new ethers.ContractFactory(
        escrowArtifact.abi,
        escrowArtifact.bytecode,
        buyerWallet
    );

    const escrow = await factory.deploy(
        sellerAddress,
        arbiterWallet.address
    );

    await escrow.waitForDeployment();

    const escrowAddress =
        await escrow.getAddress();

    console.log(
        "Escrow deployed:",
        escrowAddress
    );


    // ==================================================
    // 2. VERIFY PARTICIPANTS
    // ==================================================

    console.log("\n2. Checking escrow participants...");

    const buyer = await escrow.buyer();
    const seller = await escrow.seller();
    const arbiter = await escrow.arbiter();

    console.log("Buyer:", buyer);
    console.log("Seller:", seller);
    console.log("Arbiter:", arbiter);

    console.log(
        "Initial state:",
        await escrow.getCurrentState()
    );

    console.log(
        "Initial balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );


    // ==================================================
    // 3. DEPOSIT
    // ==================================================

    console.log("\n3. Depositing 0.001 ETH...");

    const depositTx = await escrow.deposit({
        value: ethers.parseEther("0.001")
    });

    console.log(
        "Deposit transaction:",
        depositTx.hash
    );

    const depositReceipt =
        await depositTx.wait();

    console.log(
        "Deposit confirmed in block:",
        depositReceipt.blockNumber
    );

    console.log(
        "State after deposit:",
        await escrow.getCurrentState()
    );

    console.log(
        "Balance after deposit:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );


    // ==================================================
    // 4. CONNECT AS ARBITER
    // ==================================================

    console.log("\n4. Connecting as arbiter...");

    const arbiterEscrow =
        new ethers.Contract(
            escrowAddress,
            escrowArtifact.abi,
            arbiterWallet
        );

    console.log(
        "Arbiter connected:",
        arbiterWallet.address
    );


    // ==================================================
    // 5. REFUND
    // ==================================================

    console.log("\n5. Calling refund()...");

    const refundTx =
        await arbiterEscrow.refund();

    console.log(
        "Refund transaction:",
        refundTx.hash
    );

    const refundReceipt =
        await refundTx.wait();

    console.log(
        "Refund confirmed in block:",
        refundReceipt.blockNumber
    );


    // ==================================================
    // 6. VERIFY FINAL STATE
    // ==================================================

    console.log("\n6. Checking final escrow state...");

    const finalState =
        await escrow.getCurrentState();

    const finalBalance =
        await escrow.getBalance();

    console.log(
        "Final state:",
        finalState
    );

    console.log(
        "Final balance:",
        ethers.formatEther(finalBalance),
        "ETH"
    );


    // ==================================================
    // 7. VALIDATION
    // ==================================================

    if (finalState !== "Refunded") {
        throw new Error(
            `Expected Refunded, got ${finalState}`
        );
    }

    if (finalBalance !== 0n) {
        throw new Error(
            `Expected escrow balance 0, got ${ethers.formatEther(finalBalance)}`
        );
    }


    // ==================================================
    // SUCCESS
    // ==================================================

    console.log("\n========================================");
    console.log("ESCROW REFUND TEST: PASSED");
    console.log("========================================");

    console.log(
        "\nEscrow address:",
        escrowAddress
    );

    console.log(
        "Deposit tx:",
        depositTx.hash
    );

    console.log(
        "Refund tx:",
        refundTx.hash
    );

    console.log(
        "Final state:",
        finalState
    );

    console.log(
        "Final balance:",
        ethers.formatEther(finalBalance),
        "ETH"
    );

    console.log();
}


main().catch((error) => {

    console.error(
        "\nESCROW REFUND TEST FAILED"
    );

    console.error(
        "Error:",
        error.message
    );

    if (error.code) {
        console.error(
            "Error code:",
            error.code
        );
    }

    process.exitCode = 1;
});