const express = require("express");

const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactioncontroller");

const router = express.Router();

router.get(
  "/",
  getTransactions
);

router.get(
  "/:id",
  getTransactionById
);

router.post(
  "/",
  createTransaction
);

router.put(
  "/:id",
  updateTransaction
);

router.delete(
  "/:id",
  deleteTransaction
);

module.exports = router;