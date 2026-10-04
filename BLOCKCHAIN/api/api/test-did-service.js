const {
    verifyWalletDID
} = require("./services/didService");

const walletAddress =
    "0xA3e2F389aD996148626C8BbA4B8B04368103cCaA";

async function main() {
    try {
        console.log("Checking DID for wallet...");
        console.log("Wallet:", walletAddress);

        const identity =
            await verifyWalletDID(walletAddress);

        console.log("\nDID verification PASSED");
        console.log("DID:", identity.did_id);
        console.log("Wallet:", identity.wallet);
        console.log("KYC hash:", identity.kyc_hash);
        console.log("Status:", identity.status);
        console.log("Created at:", identity.created_at);
    } catch (error) {
        console.error("\nDID verification FAILED");
        console.error(error.message);
        process.exitCode = 1;
    }
}

main();