require("dotenv").config();

const {
    verifyWalletDID
} = require("../api/api/services/didService");

async function main() {

    const wallet =
        "0x01a119788F69a727529D3d4b2c9e0A71B5e822ef";

    try {

        const identity =
            await verifyWalletDID(wallet);

        console.log("DID verification successful");

        console.log("DID:", identity.did_id);
        console.log("Wallet:", identity.wallet);
        console.log("Status:", identity.status);

    } catch (error) {

        console.error(
            "DID verification failed:",
            error.message
        );
    }
}

main();