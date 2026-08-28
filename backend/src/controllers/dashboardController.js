const { query } = require("../config/db");


async function getDashboard(
  req,
  res,
  next
) {
  try {

    /* ------------------------------
       FINANCIAL TOTALS
    ------------------------------- */

    const totals =
      await query(
        `
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'credit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "totalCredit",

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'debit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "totalDebit",

          COUNT(*)::INTEGER
            AS "transactionCount"

        FROM transactions
        `
      );

    const totalCredit =
      Number(
        totals.rows[0].totalCredit
      );

    const totalDebit =
      Number(
        totals.rows[0].totalDebit
      );

    const balance =
      totalCredit -
      totalDebit;


    /* ------------------------------
       TODAY
    ------------------------------- */

    const today =
      await query(
        `
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'credit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "credit",

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'debit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "debit"

        FROM transactions

        WHERE transaction_date =
              CURRENT_DATE
        `
      );


    /* ------------------------------
       CURRENT MONTH
    ------------------------------- */

    const month =
      await query(
        `
        SELECT

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'credit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "credit",

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'debit'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS "debit"

        FROM transactions

        WHERE transaction_date >=
              DATE_TRUNC(
                'month',
                CURRENT_DATE
              )

        AND transaction_date <
            DATE_TRUNC(
              'month',
              CURRENT_DATE
            ) + INTERVAL '1 month'
        `
      );


    /* ------------------------------
       RECENT TRANSACTIONS
    ------------------------------- */

    const recent =
      await query(
        `
        SELECT

          t.id,

          t.transaction_date AS date,

          t.description,

          t.transaction_type AS type,

          t.amount,

          c.name AS category,

          t.notes

        FROM transactions t

        INNER JOIN categories c
          ON c.id = t.category_id

        ORDER BY
          t.transaction_date DESC,
          t.id DESC

        LIMIT 8
        `
      );


    /* ------------------------------
       CATEGORY SPENDING
    ------------------------------- */

    const categories =
      await query(
        `
        SELECT

          c.id,

          c.name,

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

          COUNT(
            CASE
              WHEN t.transaction_type = 'debit'
              THEN 1
            END
          )::INTEGER
            AS "transactionCount"

        FROM categories c

        LEFT JOIN transactions t
          ON t.category_id = c.id

        GROUP BY
          c.id,
          c.name

        HAVING
          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'debit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) > 0

        ORDER BY
          "totalSpent" DESC

        LIMIT 8
        `
      );


    /* ------------------------------
       DAILY SPENDING - LAST 7 DAYS
    ------------------------------- */

    const daily =
      await query(
        `
        SELECT

          d.day::DATE AS date,

          COALESCE(
            SUM(
              CASE
                WHEN t.transaction_type = 'debit'
                THEN t.amount
                ELSE 0
              END
            ),
            0
          ) AS amount

        FROM generate_series(
          CURRENT_DATE - INTERVAL '6 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS d(day)

        LEFT JOIN transactions t
          ON t.transaction_date =
             d.day::DATE

        GROUP BY
          d.day

        ORDER BY
          d.day ASC
        `
      );


    res.json({
      success: true,

      data: {
        totals: {
          credit: totalCredit,
          debit: totalDebit,
          balance,
          transactionCount:
            Number(
              totals.rows[0]
                .transactionCount
            )
        },

        today: {
          credit:
            Number(
              today.rows[0].credit
            ),

          debit:
            Number(
              today.rows[0].debit
            )
        },

        currentMonth: {
          credit:
            Number(
              month.rows[0].credit
            ),

          debit:
            Number(
              month.rows[0].debit
            )
        },

        recentTransactions:
          recent.rows.map(
            row => ({
              ...row,
              amount:
                Number(
                  row.amount
                )
            })
          ),

        categorySpending:
          categories.rows.map(
            row => ({
              ...row,
              totalSpent:
                Number(
                  row.totalSpent
                ),

              transactionCount:
                Number(
                  row.transactionCount
                )
            })
          ),

        dailySpending:
          daily.rows.map(
            row => ({
              date: row.date,
              amount:
                Number(
                  row.amount
                )
            })
          )
      }
    });

  } catch (error) {
    next(error);
  }
}


module.exports = {
  getDashboard
};