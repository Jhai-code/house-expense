const express = require("express");

const {
  getExportData,
  exportTransactionsExcel,
  exportLabourExcel
} = require("../controllers/exportController");


const router =
  express.Router();


/*
  Preview / JSON
*/

router.get(
  "/data",
  getExportData
);


/*
  Real Excel transaction export
*/

router.get(
  "/excel",
  exportTransactionsExcel
);


/*
  Real Excel labour export
*/

router.get(
  "/labour-excel",
  exportLabourExcel
);


module.exports = router;