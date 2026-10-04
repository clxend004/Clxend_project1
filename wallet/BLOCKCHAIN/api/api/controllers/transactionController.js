const {
    createTransactionRequest,
    getTransactionStatus
} = require("../services/transactionService");

async function createTransaction(req, res) {
    try {

        const transaction =
            await createTransactionRequest(req.body);

        return res.status(201).json({
            success: true,
            transaction
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

async function getTransaction(req, res) {
    try {

        const transaction =
            getTransactionStatus(req.params.txId);

        return res.status(200).json({
            success: true,
            transaction
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    createTransaction,
    getTransaction
};