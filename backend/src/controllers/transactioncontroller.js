const { query } = require("../config/db");

function validateTransaction(body) {
  const {
    date,
    description,
    categoryId,
    type,
    amount
  } = body;

  if (!date) {
    return "Transaction date is required.";
  }

  if (
    typeof description !== "string" ||
    !description.trim()
  ) {
    return "Transaction description is required.";
  }

  if (
    !Number.isInteger(
      Number(categoryId)
    )
  ) {
    return "A valid category is required.";
  }

  if (
    type !== "credit" &&
    type !== "debit"
  ) {
    return "Transaction type must be credit or debit.";
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {
    return "Amount must be greater than zero.";
  }

  return null;
}


/* ----------------------------------------
   GET ALL TRANSACTIONS
----------------------------------------- */

async function getTransactions(req, res, next) {
  try {
    const {
      search = "",
      categoryId,
      type,
      from,
      to
    } = req.query;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      params.push(
        `%${search.trim()}%`
      );

      conditions.push(`
        (
          LOWER(t.description)
          LIKE LOWER($${params.length})
          OR
          LOWER(COALESCE(t.notes, ''))
          LIKE LOWER($${params.length})
        )
      `);
    }

    if (categoryId) {
      params.push(
        Number(categoryId)
      );

      conditions.push(
        `t.category_id = $${params.length}`
      );
    }

    if (
      type === "credit" ||
      type === "debit"
    ) {
      params.push(type);

      conditions.push(
        `t.transaction_type = $${params.length}`
      );
    }

    if (from) {
      params.push(from);

      conditions.push(
        `t.transaction_date >= $${params.length}`
      );
    }

    if (to) {
      params.push(to);

      conditions.push(
        `t.transaction_date <= $${params.length}`
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await query(
      `
      SELECT
        t.id,
        t.transaction_date AS date,
        t.description,
        t.category_id AS "categoryId",
        c.name AS category,
        t.transaction_type AS type,
        t.amount,
        t.notes,
        t.created_at AS "createdAt",
        t.updated_at AS "updatedAt"

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

    const transactions =
      result.rows.map(row => {
        const amount =
          Number(row.amount);

        if (row.type === "credit") {
          balance += amount;
        } else {
          balance -= amount;
        }

        return {
          ...row,
          amount,
          credit:
            row.type === "credit"
              ? amount
              : 0,
          debit:
            row.type === "debit"
              ? amount
              : 0,
          balance
        };
      });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   GET SINGLE TRANSACTION
----------------------------------------- */

async function getTransactionById(
  req,
  res,
  next
) {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction ID."
      });
    }

    const result = await query(
      `
      SELECT
        t.id,
        t.transaction_date AS date,
        t.description,
        t.category_id AS "categoryId",
        c.name AS category,
        t.transaction_type AS type,
        t.amount,
        t.notes,
        t.created_at AS "createdAt",
        t.updated_at AS "updatedAt"

      FROM transactions t

      INNER JOIN categories c
        ON c.id = t.category_id

      WHERE t.id = $1
      `,
      [id]
    );

    if (
      result.rowCount === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found."
      });
    }

    const row =
      result.rows[0];

    res.json({
      success: true,
      data: {
        ...row,
        amount: Number(
          row.amount
        )
      }
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   CREATE TRANSACTION
----------------------------------------- */

async function createTransaction(
  req,
  res,
  next
) {
  try {
    const validationError =
      validateTransaction(
        req.body
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const {
      date,
      description,
      categoryId,
      type,
      amount,
      notes = ""
    } = req.body;

    const category =
      await query(
        `
        SELECT id, name
        FROM categories
        WHERE id = $1
          AND is_active = TRUE
        `,
        [Number(categoryId)]
      );

    if (
      category.rowCount === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist or is inactive."
      });
    }

    const result =
      await query(
        `
        INSERT INTO transactions (
          transaction_date,
          description,
          category_id,
          transaction_type,
          amount,
          notes
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )

        RETURNING
          id,
          transaction_date AS date,
          description,
          category_id AS "categoryId",
          transaction_type AS type,
          amount,
          notes,
          created_at AS "createdAt"
        `,
        [
          date,
          description.trim(),
          Number(categoryId),
          type,
          Number(amount),
          notes.trim()
        ]
      );

    const transaction =
      result.rows[0];

    res.status(201).json({
      success: true,
      message:
        "Transaction created successfully.",
      data: {
        ...transaction,
        category:
          category.rows[0].name,
        amount: Number(
          transaction.amount
        )
      }
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   UPDATE TRANSACTION
----------------------------------------- */

async function updateTransaction(
  req,
  res,
  next
) {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction ID."
      });
    }

    const validationError =
      validateTransaction(
        req.body
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const {
      date,
      description,
      categoryId,
      type,
      amount,
      notes = ""
    } = req.body;

    const category =
      await query(
        `
        SELECT id, name
        FROM categories
        WHERE id = $1
          AND is_active = TRUE
        `,
        [Number(categoryId)]
      );

    if (
      category.rowCount === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected category does not exist or is inactive."
      });
    }

    const result =
      await query(
        `
        UPDATE transactions

        SET
          transaction_date = $1,
          description = $2,
          category_id = $3,
          transaction_type = $4,
          amount = $5,
          notes = $6,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $7

        RETURNING
          id,
          transaction_date AS date,
          description,
          category_id AS "categoryId",
          transaction_type AS type,
          amount,
          notes,
          updated_at AS "updatedAt"
        `,
        [
          date,
          description.trim(),
          Number(categoryId),
          type,
          Number(amount),
          notes.trim(),
          id
        ]
      );

    if (
      result.rowCount === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found."
      });
    }

    const transaction =
      result.rows[0];

    res.json({
      success: true,
      message:
        "Transaction updated successfully.",
      data: {
        ...transaction,
        category:
          category.rows[0].name,
        amount: Number(
          transaction.amount
        )
      }
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   DELETE TRANSACTION
----------------------------------------- */

async function deleteTransaction(
  req,
  res,
  next
) {
  try {
    const id =
      Number(req.params.id);

    if (
      !Number.isInteger(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid transaction ID."
      });
    }

    const result =
      await query(
        `
        DELETE FROM transactions

        WHERE id = $1

        RETURNING id
        `,
        [id]
      );

    if (
      result.rowCount === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction not found."
      });
    }

    res.json({
      success: true,
      message:
        "Transaction deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
};