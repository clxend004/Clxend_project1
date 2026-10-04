const express = require("express");

const {
    createEscrow,
    deposit,
    release,
    refund,
    getEscrow,
    syncEscrow
} = require("../controllers/escrowController");

const router = express.Router();

router.post("/", createEscrow);

router.post("/:escrowId/deposit", deposit);

router.post("/:escrowId/release", release);

router.post("/:escrowId/refund", refund);

router.get("/:escrowId", getEscrow);

router.post("/:escrowId/sync", syncEscrow);

module.exports = router;