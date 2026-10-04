const express = require("express");

const {
    createTransaction,
    getTransaction
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/", createTransaction);

router.get("/:txId", getTransaction);

module.exports = router;