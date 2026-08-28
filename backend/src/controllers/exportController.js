const { query } = require("../config/db");

const {
  createTransactionWorkbook,
  createLabourWorkbook
} = require("../services/exportService");


/* =====================================================
   BUILD TRANSACTION FILTERS
   ===================================================== */

function buildTransactionFilters(req) {

  const {
    from,
    to,
    type,
    categories
  } = req.query;

  const conditions = [];
  const params = [];


  /* DATE FROM */

  if (from) {

    params.push(from);

    conditions.push(
      `t.transaction_date >= $${params.length}`
    );

  }


  /* DATE TO */

  if (to) {

    params.push(to);

    conditions.push(
      `t.transaction_date <= $${params.length}`
    );

  }


  /* TRANSACTION TYPE */

  if (
    type === "credit" ||
    type === "debit"
  ) {

    params.push(type);

    conditions.push(
      `t.transaction_type = $${params.length}`
    );

  }


  /* CATEGORY */

  if (
    categories &&
    categories.trim()
  ) {

    const ids =
      categories
        .split(",")
        .map(Number)
        .filter(
          Number.isInteger
        );

    if (ids.length) {

      params.push(ids);

      conditions.push(
        `t.category_id = ANY($${params.length}::BIGINT[])`
      );

    }

  }


  return {
    conditions,
    params
  };

}


/* =====================================================
   GET TRANSACTION DATA
   ===================================================== */

async function getTransactionRows(req) {

  const {
    conditions,
    params
  } =
    buildTransactionFilters(req);


  const whereClause =
    conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";


  const result =
    await query(
      `
      SELECT

        t.id,

        t.transaction_date AS date,

        t.description,

        c.name AS category,

        t.transaction_type AS type,

        t.amount,

        t.notes,

        t.created_at AS "createdAt"

      FROM transactions t

      INNER JOIN categories c
        ON c.id = t.category_id

      ${whereClause}

      ORDER BY
        t.transaction_date ASC,
        t.id ASC
      `,
      params
    );


  let balance = 0;


  return result.rows.map(row => {

    const amount =
      Number(row.amount) || 0;


    if (
      row.type === "credit"
    ) {

      balance += amount;

    } else {

      balance -= amount;

    }


    return {
      ...row,
      amount,
      balance
    };

  });

}


/* =====================================================
   GET LABOUR DATA
   ===================================================== */

async function getLabourRows(req) {

  /*
    Labour categories supported by the application.
  */

  const allowedCategories = [
    "Kothanar",
    "Nimdhal",
    "Sithal"
  ];


  /*
    Frontend can send:

    ?labourCategories=Kothanar,Nimdhal

    or

    ?labourCategories=Kothanar,Sithal
  */

  let selectedCategories =
    allowedCategories;


  if (
    req.query.labourCategories &&
    req.query.labourCategories.trim()
  ) {

    const requested =
      req.query.labourCategories
        .split(",")
        .map(
          category =>
            category.trim()
        )
        .filter(Boolean);


    selectedCategories =
      requested.filter(
        category =>
          allowedCategories.includes(
            category
          )
      );


    /*
      If the frontend sends only
      invalid category names,
      return no labour records
      rather than accidentally
      exporting everything.
    */

    if (
      selectedCategories.length === 0
    ) {

      return [];

    }

  }


  /*
    Get records using the existing
    date filtering logic.
  */

  const data =
    await getTransactionRows(req);


  /*
    Keep only labour categories
    selected by the user.
  */

  return data.filter(
    row =>
      selectedCategories.includes(
        row.category
      )
  );

}


/* =====================================================
   PREVIEW / JSON DATA
   ===================================================== */

async function getExportData(
  req,
  res,
  next
) {

  try {

    const data =
      await getTransactionRows(req);


    const totalCredit =
      data
        .filter(
          row =>
            row.type === "credit"
        )
        .reduce(
          (sum, row) =>
            sum + row.amount,
          0
        );


    const totalDebit =
      data
        .filter(
          row =>
            row.type === "debit"
        )
        .reduce(
          (sum, row) =>
            sum + row.amount,
          0
        );


    res.json({

      success: true,

      filters: {

        from:
          req.query.from || null,

        to:
          req.query.to || null,

        type:
          req.query.type || "all",

        categories:
          req.query.categories || "all"

      },

      summary: {

        transactionCount:
          data.length,

        totalCredit,

        totalDebit,

        balance:
          totalCredit -
          totalDebit

      },

      data

    });

  } catch (error) {

    next(error);

  }

}


/* =====================================================
   EXPORT TRANSACTIONS TO EXCEL
   ===================================================== */

async function exportTransactionsExcel(
  req,
  res,
  next
) {

  try {

    const data =
      await getTransactionRows(req);


    /*
      Columns selected by frontend.

      Example:

      ?columns=date,description,category,credit,debit,balance
    */

    const columns =
      req.query.columns
        ? req.query.columns
            .split(",")
            .map(
              column =>
                column.trim()
            )
            .filter(Boolean)
        : [];


    const workbook =
      await createTransactionWorkbook(
        data,
        columns
      );


    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    res.setHeader(
      "Content-Disposition",
      'attachment; filename="house-expense-transactions.xlsx"'
    );


    await workbook.xlsx.write(
      res
    );


    res.end();

  } catch (error) {

    next(error);

  }

}


/* =====================================================
   EXPORT LABOUR CATEGORIES TO EXCEL
   ===================================================== */

async function exportLabourExcel(
  req,
  res,
  next
) {

  try {

    const labourRows =
      await getLabourRows(req);


    /*
      Create the standard labour
      workbook.

      The workbook already contains:

      Date
      Kothanar
      Nimdhal
      Sithal
      Total
    */

    const workbook =
      await createLabourWorkbook(
        labourRows
      );


    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    res.setHeader(
      "Content-Disposition",
      'attachment; filename="daily-labour.xlsx"'
    );


    await workbook.xlsx.write(
      res
    );


    res.end();

  } catch (error) {

    next(error);

  }

}


/* =====================================================
   EXPORTS
   ===================================================== */

module.exports = {

  getExportData,

  exportTransactionsExcel,

  exportLabourExcel

};