require("dotenv").config();

const { ethers } = require("ethers");

const {
    findWalletByDid
} = require("../api/api/storage/walletStore");

const {
    decryptPrivateKey
} = require("../api/api/services/walletService");


const DID = "did:clxend:test004";

const SELLER =
    "0x78ca8CD44C90669baB6A2E365511576d9D7519fa";


async function main() {

    // ========================================================
    // 1. Load CLXEND buyer wallet
    // ========================================================

    const walletRecord =
        findWalletByDid(DID);

    if (!walletRecord) {
        throw new Error(
            "CLXEND wallet not found"
        );
    }


    console.log("DID:", DID);

    console.log(
        "Buyer wallet:",
        walletRecord.wallet_address
    );


    // ========================================================
    // 2. Decrypt buyer private key
    // ========================================================

    if (!walletRecord.encrypted_private_key) {
        throw new Error(
            "Encrypted private key not found"
        );
    }


    const privateKey =
        decryptPrivateKey(
            walletRecord.encrypted_private_key
        );


    // ========================================================
    // 3. Connect buyer to Sepolia
    // ========================================================

    const provider =
        new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL
        );


    const buyer =
        new ethers.Wallet(
            privateKey,
            provider
        );


    console.log(
        "Signer address:",
        buyer.address
    );


    // ========================================================
    // 4. Verify wallet mapping
    // ========================================================

    if (
        buyer.address.toLowerCase() !==
        walletRecord.wallet_address.toLowerCase()
    ) {

        throw new Error(
            "Decrypted wallet does not match stored wallet address"
        );
    }


    // ========================================================
    // 5. Load arbiter
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
        "Arbiter address:",
        arbiter.address
    );


    // ========================================================
    // 6. Load contract artifact
    // ========================================================

    const artifact =
        require(
            "../artifacts/contracts/EscrowAdvanced.sol/EscrowAdvanced.json"
        );


    // ========================================================
    // 7. Create Contract Factory
    // ========================================================

    const factory =
        new ethers.ContractFactory(
            artifact.abi,
            artifact.bytecode,
            buyer
        );


    // ========================================================
    // 8. Deploy escrow
    // ========================================================

    console.log(
        "\nDeploying EscrowAdvanced..."
    );


    const escrow =
        await factory.deploy(
            SELLER,
            arbiter.address
        );


    console.log(
        "Deployment transaction:",
        escrow.deploymentTransaction().hash
    );


    await escrow.waitForDeployment();


    const escrowAddress =
        await escrow.getAddress();


    // ========================================================
    // 9. Read deployed contract
    // ========================================================

    console.log(
        "\nEscrow deployed successfully!"
    );

    console.log(
        "Escrow address:",
        escrowAddress
    );


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


    // ========================================================
    // 10. Verify deployment
    // ========================================================

    if (
        (await escrow.buyer()).toLowerCase() !==
        buyer.address.toLowerCase()
    ) {
        throw new Error(
            "Escrow buyer does not match CLXEND wallet"
        );
    }


    if (
        (await escrow.seller()).toLowerCase() !==
        SELLER.toLowerCase()
    ) {
        throw new Error(
            "Escrow seller does not match expected seller"
        );
    }


    if (
        (await escrow.arbiter()).toLowerCase() !==
        arbiter.address.toLowerCase()
    ) {
        throw new Error(
            "Escrow arbiter does not match configured arbiter"
        );
    }


    console.log(
        "\nESCROW DEPLOYMENT TEST PASSED"
    );
}


main().catch((error) => {

    console.error(
        "\nESCROW DEPLOYMENT TEST FAILED"
    );

    console.error(
        error.message
    );

    process.exitCode = 1;
});