require("dotenv").config({
    path: "../../.env"
});

const express = require("express");
const cors = require("cors");

const transactionRoutes = require("./routes/transaction");
const walletRoutes = require("./routes/wallet");
const escrowRoutes = require("./routes/escrow");

const { getIdentityStatus } = require("./services/didService");

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        service: "Blockchain Transaction Service",
        status: "running"
    });
});

app.use("/transactions", transactionRoutes);
app.use("/wallets", walletRoutes);
app.use("/escrows", escrowRoutes);

app.get("/did/status/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const identityStatus =
            await getIdentityStatus(walletAddress);

        res.json({
            success: true,
            walletAddress,
            identityStatus
        });

    } catch (error) {
        console.error(
            "DID STATUS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Transaction API running on port ${PORT}`);
});

setInterval(() => {
    console.log("Blockchain API process is still running...");
}, 5000);