const {
    createEscrowRequest,
    depositEscrow,
    releaseEscrow,
    refundEscrow,
    getEscrowStatus,
    syncEscrowFromBlockchain
} = require("../services/escrowService");


// ============================================================
// CREATE ESCROW
// POST /escrows
// ============================================================

async function createEscrow(req, res) {

    try {

        const escrow =
            await createEscrowRequest(req.body);

        return res.status(201).json({
            success: true,
            escrow
        });

    } catch (error) {

        console.error(
            "Create escrow failed:",
            error.message
        );

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// DEPOSIT
// POST /escrows/:escrowId/deposit
// ============================================================

async function deposit(req, res) {

    try {

        const escrow =
            await depositEscrow(
                req.params.escrowId
            );

        return res.status(200).json({
            success: true,
            message: "Escrow funded successfully",
            escrow
        });

    } catch (error) {

        console.error(
            "Escrow deposit failed:",
            error.message
        );

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// RELEASE
// POST /escrows/:escrowId/release
// ============================================================

async function release(req, res) {

    try {

        const escrow =
            await releaseEscrow(
                req.params.escrowId
            );

        return res.status(200).json({
            success: true,
            message: "Escrow released successfully",
            escrow
        });

    } catch (error) {

        console.error(
            "Escrow release failed:",
            error.message
        );

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// REFUND
// POST /escrows/:escrowId/refund
// ============================================================

async function refund(req, res) {

    try {

        const escrow =
            await refundEscrow(
                req.params.escrowId
            );

        return res.status(200).json({
            success: true,
            message: "Escrow refunded successfully",
            escrow
        });

    } catch (error) {

        console.error(
            "Escrow refund failed:",
            error.message
        );

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// GET ESCROW
// GET /escrows/:escrowId
// ============================================================

async function getEscrow(req, res) {

    try {

        const escrow =
            await getEscrowStatus(
                req.params.escrowId
            );

        return res.status(200).json({
            success: true,
            escrow
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// SYNC ESCROW
// POST /escrows/:escrowId/sync
// ============================================================

async function syncEscrow(req, res) {

    try {

        const result =
            await syncEscrowFromBlockchain(
                req.params.escrowId
            );

        return res.status(200).json({
            success: true,
            message:
                "Escrow synchronized with blockchain",
            ...result
        });

    } catch (error) {

        console.error(
            "Escrow sync failed:",
            error.message
        );

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createEscrow,
    deposit,
    release,
    refund,
    getEscrow,
    syncEscrow
};