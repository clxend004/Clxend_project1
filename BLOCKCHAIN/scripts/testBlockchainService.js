require("dotenv").config();

const {
    getWalletAddress
} = require(
    "../api/api/services/blockchainService"
);

async function main() {

    const address =
        await getWalletAddress();

    console.log(
        "Backend wallet:",
        address
    );
}

main().catch((error) => {

    console.error(
        "Error:",
        error.message
    );

    process.exit(1);
});