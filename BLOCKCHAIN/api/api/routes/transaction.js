const express = require("express");

const {
    createTransaction,
    getTransaction,
    getAllTransactions
} = require("../controllers/transactionController");

const router = express.Router();

router.post("/", createTransaction);

router.get("/", getAllTransactions);

router.get("/:txId", getTransaction);

module.exports = router;