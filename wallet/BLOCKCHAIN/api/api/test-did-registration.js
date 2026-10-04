const path = require("path");
const { ethers } = require("ethers");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const abi = require(
    "../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
).abi;

const {
    findWalletByDid
} = require("./storage/walletStore");

const {
    decryptPrivateKey
} = require("./services/walletService");


async function main() {

    const did = "did:clxend:test004";

    // -----------------------------------------
    // 1. Find wallet mapping
    // -----------------------------------------

    const walletRecord =
        findWalletByDid(did);

    if (!walletRecord) {
        throw new Error(
            "Wallet mapping not found"
        );
    }

    console.log("DID:", walletRecord.did);
    console.log(
        "Wallet:",
        walletRecord.wallet_address
    );


    // -----------------------------------------
    // 2. Decrypt private key
    // -----------------------------------------

    let privateKey;

    try {

        privateKey =
            decryptPrivateKey(
                walletRecord.encrypted_private_key
            );

    } catch (error) {

        throw new Error(
            "Unable to decrypt wallet private key"
        );
    }


    // -----------------------------------------
    // 3. Connect to Sepolia
    // -----------------------------------------

    const provider =
        new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL
        );


    // -----------------------------------------
    // 4. Create signer
    // -----------------------------------------

    const signer =
        new ethers.Wallet(
            privateKey,
            provider
        );


    // -----------------------------------------
    // 5. Verify signer address
    // -----------------------------------------

    if (
        signer.address.toLowerCase() !==
        walletRecord.wallet_address.toLowerCase()
    ) {

        throw new Error(
            "Signer address does not match wallet mapping"
        );
    }

    console.log(
        "Signer:",
        signer.address
    );


    // -----------------------------------------
    // 6. Connect DID Registry
    // -----------------------------------------

    const contract =
        new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            abi,
            signer
        );


    // -----------------------------------------
    // 7. Check existing identity
    // -----------------------------------------

    try {

        const existing =
            await contract.getIdentity(
                signer.address
            );

        console.log(
            "DID already registered:",
            existing[0]
        );

        console.log(
            "Status:",
            Number(existing[3])
        );

        return;

    } catch (error) {

        console.log(
            "No existing DID found. Creating identity..."
        );
    }


    // -----------------------------------------
    // 8. Create DID identity
    // -----------------------------------------

    const kycHash =
        "test-kyc-hash-test004";

    console.log(
        "Calling createIdentity..."
    );

    const tx =
        await contract.createIdentity(
            did,
            kycHash
        );

    console.log(
        "Transaction submitted:",
        tx.hash
    );


    // -----------------------------------------
    // 9. Wait for confirmation
    // -----------------------------------------

    const receipt =
        await tx.wait();

    console.log(
        "DID registration confirmed"
    );

    console.log(
        "Transaction hash:",
        receipt.hash
    );

    console.log(
        "Block number:",
        receipt.blockNumber
    );


    // -----------------------------------------
    // 10. Read identity back
    // -----------------------------------------

    const identity =
        await contract.getIdentity(
            signer.address
        );

    console.log(
        "DID:",
        identity[0]
    );

    console.log(
        "Wallet:",
        identity[1]
    );

    console.log(
        "KYC hash:",
        identity[2]
    );

    console.log(
        "Status:",
        Number(identity[3])
    );

    console.log(
        "Created at:",
        Number(identity[4])
    );


    privateKey = null;
}


main().catch(error => {

    console.error(
        "DID registration failed:"
    );

    console.error(
        error.message
    );

    process.exit(1);
});