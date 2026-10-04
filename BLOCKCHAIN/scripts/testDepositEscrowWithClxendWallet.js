require("dotenv").config();

const { ethers } = require("ethers");

const {
    findWalletByDid
} = require("../api/api/storage/walletStore");

const {
    decryptPrivateKey
} = require("../api/api/services/walletService");


const DID = "did:clxend:test004";

const ESCROW_ADDRESS =
    "0x84eC08EDa4201421e796afCbA91c89Ca21bC58f9";


const DEPOSIT_AMOUNT = "0.001";


const escrowAbi = [
    "function buyer() view returns (address)",
    "function seller() view returns (address)",
    "function arbiter() view returns (address)",
    "function state() view returns (uint8)",
    "function deposit() payable",
    "function getBalance() view returns (uint256)",
    "function getCurrentState() view returns (string)"
];


async function main() {

    // ========================================================
    // 1. Find CLXEND wallet
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
    // 2. Decrypt private key
    // ========================================================

    const privateKey =
        decryptPrivateKey(
            walletRecord.encrypted_private_key
        );


    // ========================================================
    // 3. Connect to Sepolia
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
        "Signer:",
        buyer.address
    );


    // ========================================================
    // 4. Verify buyer
    // ========================================================

    if (
        buyer.address.toLowerCase() !==
        walletRecord.wallet_address.toLowerCase()
    ) {

        throw new Error(
            "Signer does not match CLXEND wallet"
        );
    }


    // ========================================================
    // 5. Connect to escrow
    // ========================================================

    const escrow =
        new ethers.Contract(
            ESCROW_ADDRESS,
            escrowAbi,
            buyer
        );


    // ========================================================
    // 6. Read current state
    // ========================================================

    console.log(
        "\nEscrow:",
        ESCROW_ADDRESS
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
        "Before state:",
        await escrow.getCurrentState()
    );

    console.log(
        "Before balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );


    // ========================================================
    // 7. Deposit
    // ========================================================

    console.log(
        `\nDepositing ${DEPOSIT_AMOUNT} ETH...`
    );


    const tx =
        await escrow.deposit({
            value:
                ethers.parseEther(
                    DEPOSIT_AMOUNT
                )
        });


    console.log(
        "Deposit transaction:",
        tx.hash
    );


    // ========================================================
    // 8. Wait confirmation
    // ========================================================

    const receipt =
        await tx.wait();


    console.log(
        "Confirmed in block:",
        receipt.blockNumber
    );


    // ========================================================
    // 9. Read updated state
    // ========================================================

    console.log(
        "\nAfter state:",
        await escrow.getCurrentState()
    );

    console.log(
        "After balance:",
        ethers.formatEther(
            await escrow.getBalance()
        ),
        "ETH"
    );


    // ========================================================
    // 10. Verify
    // ========================================================

    const state =
        await escrow.getCurrentState();

    const balance =
        await escrow.getBalance();


    if (state !== "Funded") {

        throw new Error(
            `Expected Funded state, got ${state}`
        );
    }


    if (
        balance !==
        ethers.parseEther(DEPOSIT_AMOUNT)
    ) {

        throw new Error(
            "Escrow balance does not match deposit"
        );
    }


    console.log(
        "\nESCROW DEPOSIT TEST PASSED"
    );
}


main().catch((error) => {

    console.error(
        "\nESCROW DEPOSIT TEST FAILED"
    );

    console.error(
        error.message
    );

    process.exitCode = 1;
});