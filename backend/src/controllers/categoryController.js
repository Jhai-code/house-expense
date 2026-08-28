const { query } = require("../config/db");


/* ----------------------------------------
   GET CATEGORIES
----------------------------------------- */

async function getCategories(
  req,
  res,
  next
) {
  try {
    const result =
      await query(
        `
        SELECT
          c.id,
          c.name,
          c.description,
          c.is_active AS "isActive",
          c.created_at AS "createdAt",

          COUNT(t.id)::INTEGER
            AS "transactionCount",

          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'debit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) AS "totalSpent",

          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'credit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) AS "totalReceived"

        FROM categories c

        LEFT JOIN transactions t
          ON t.category_id = c.id

        GROUP BY
          c.id,
          c.name,
          c.description,
          c.is_active,
          c.created_at

        ORDER BY
          c.is_active DESC,
          c.name ASC
        `
      );

    const categories =
      result.rows.map(
        category => ({
          ...category,

          transactionCount:
            Number(
              category.transactionCount
            ),

          totalSpent:
            Number(
              category.totalSpent
            ),

          totalReceived:
            Number(
              category.totalReceived
            )
        })
      );

    res.json({
      success: true,
      count:
        categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   GET CATEGORY BY ID
----------------------------------------- */

async function getCategoryById(
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
          "Invalid category ID."
      });
    }

    const result =
      await query(
        `
        SELECT
          c.id,
          c.name,
          c.description,
          c.is_active AS "isActive",

          COUNT(t.id)::INTEGER
            AS "transactionCount",

          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'debit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) AS "totalSpent",

          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'credit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) AS "totalReceived"

        FROM categories c

        LEFT JOIN transactions t
          ON t.category_id = c.id

        WHERE c.id = $1

        GROUP BY
          c.id
        `,
        [id]
      );

    if (
      result.rowCount === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found."
      });
    }

    const category =
      result.rows[0];

    res.json({
      success: true,
      data: {
        ...category,

        transactionCount:
          Number(
            category.transactionCount
          ),

        totalSpent:
          Number(
            category.totalSpent
          ),

        totalReceived:
          Number(
            category.totalReceived
          )
      }
    });
  } catch (error) {
    next(error);
  }
}


/* ----------------------------------------
   CREATE CATEGORY
----------------------------------------- */

async function createCategory(
  req,
  res,
  next
) {
  try {
    const name =
      String(
        req.body.name || ""
      ).trim();

    const description =
      String(
        req.body.description || ""
      ).trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Category name is required."
      });
    }

    if (
      name.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Category name must contain at least 2 characters."
      });
    }

    if (
      name.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Category name cannot exceed 100 characters."
      });
    }

    const result =
      await query(
        `
        INSERT INTO categories (
          name,
          description
        )

        VALUES (
          $1,
          $2
        )

        RETURNING
          id,
          name,
          description,
          is_active AS "isActive",
          created_at AS "createdAt"
        `,
        [
          name,
          description
        ]
      );

    res.status(201).json({
      success: true,
      message:
        "Category created successfully.",
      data: result.rows[0]
    });
  } catch (error) {
    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A category with this name already exists."
      });
    }

    next(error);
  }
}


/* ----------------------------------------
   UPDATE CATEGORY
----------------------------------------- */

async function updateCategory(
  req,
  res,
  next
) {
  try {
    const id =
      Number(req.params.id);

    const name =
      String(
        req.body.name || ""
      ).trim();

    const description =
      String(
        req.body.description || ""
      ).trim();

    if (
      !Number.isInteger(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid category ID."
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Category name is required."
      });
    }

    const result =
      await query(
        `
        UPDATE categories

        SET
          name = $1,
          description = $2,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $3

        RETURNING
          id,
          name,
          description,
          is_active AS "isActive",
          created_at AS "createdAt"
        `,
        [
          name,
          description,
          id
        ]
      );

    if (
      result.rowCount === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Category not found."
      });
    }

    res.json({
      success: true,
      message:
        "Category updated successfully.",
      data: result.rows[0]
    });
  } catch (error) {
    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A category with this name already exists."
      });
    }

    next(error);
  }
}


/* ----------------------------------------
   DELETE / DEACTIVATE CATEGORY
----------------------------------------- */

async function deleteCategory(
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
          "Invalid category ID."
      });
    }

    const transactionCheck =
      await query(
        `
        SELECT COUNT(*)::INTEGER AS count
        FROM transactions
        WHERE category_id = $1
        `,
        [id]
      );

    const transactionCount =
      Number(
        transactionCheck
          .rows[0]
          .count
      );

    if (
      transactionCount > 0
    ) {
      const result =
        await query(
          `
          UPDATE categories

          SET
            is_active = FALSE,
            updated_at =
              CURRENT_TIMESTAMP

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
            "Category not found."
        });
      }

      return res.json({
        success: true,
        message:
          "Category has been deactivated because it is used by existing transactions."
      });
    }

    const result =
      await query(
        `
        DELETE FROM categories
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
          "Category not found."
      });
    }

    res.json({
      success: true,
      message:
        "Category deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}


module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};