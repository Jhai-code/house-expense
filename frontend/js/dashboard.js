document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:3000";

  // -----------------------------
  // DOM ELEMENTS
  // -----------------------------

  const totalCreditEl =
    document.getElementById("totalCredit");

  const totalDebitEl =
    document.getElementById("totalDebit");

  const currentBalanceEl =
    document.getElementById("currentBalance");

  const labourCostEl =
    document.getElementById("labourCost");

  const dailyBarsEl =
    document.getElementById("dailyBars");

  const recentRowsEl =
    document.getElementById("recentRows");

  const expenseDonutEl =
    document.getElementById("expenseDonut");

  const categoryLegendEl =
    document.getElementById("categoryLegend");

  const addExpenseBtn =
    document.getElementById("addExpenseBtn");

  const addLabourBtn =
    document.getElementById("addLabourBtn");


  // -----------------------------
  // FORMAT CURRENCY
  // -----------------------------

  function formatCurrency(value) {
    const amount = Number(value) || 0;

    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }


  // -----------------------------
  // FORMAT DATE
  // -----------------------------

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }


  // -----------------------------
  // API REQUEST
  // -----------------------------

  async function getDashboard() {
    const response = await fetch(
      `${API_BASE_URL}/api/dashboard`
    );

    if (!response.ok) {
      throw new Error(
        `Dashboard request failed: ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message ||
        "Unable to load dashboard data."
      );
    }

    return result.data;
  }


  // -----------------------------
  // UPDATE SUMMARY CARDS
  // -----------------------------

  function renderTotals(data) {
    const totals =
      data.totals || {};

    if (totalCreditEl) {
      totalCreditEl.textContent =
        formatCurrency(
          totals.credit
        );
    }

    if (totalDebitEl) {
      totalDebitEl.textContent =
        formatCurrency(
          totals.debit
        );
    }

    if (currentBalanceEl) {
      currentBalanceEl.textContent =
        formatCurrency(
          totals.balance
        );
    }


    /*
      Labour is not included in the
      dashboard controller yet.

      Keep the card safe instead of
      showing incorrect information.
    */

    if (labourCostEl) {
      labourCostEl.textContent =
        formatCurrency(0);
    }
  }


  // -----------------------------
  // DAILY SPENDING CHART
  // -----------------------------

  function renderDailySpending(data) {
    if (!dailyBarsEl) {
      return;
    }

    dailyBarsEl.innerHTML = "";

    const daily =
      Array.isArray(data.dailySpending)
        ? data.dailySpending
        : [];

    if (daily.length === 0) {
      dailyBarsEl.innerHTML = `
        <div class="empty-state">
          <strong>No spending data</strong>
          <span>No debit transactions found.</span>
        </div>
      `;

      return;
    }


    const amounts =
      daily.map(item =>
        Number(item.amount) || 0
      );

    const maxAmount =
      Math.max(...amounts, 1);


    daily.forEach(item => {
      const amount =
        Number(item.amount) || 0;

      const date =
        new Date(item.date);

      const dayName =
        Number.isNaN(date.getTime())
          ? "—"
          : date.toLocaleDateString(
              "en-IN",
              {
                weekday: "short"
              }
            );

      const height =
        amount === 0
          ? 4
          : Math.max(
              8,
              (amount / maxAmount) * 100
            );


      const bar =
        document.createElement("div");

      bar.className =
        "bar-item";

      bar.innerHTML = `
        <div class="bar-value">
          ${formatCurrency(amount)}
        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            style="height:${height}%"
            title="${formatCurrency(amount)}"
          ></div>
        </div>

        <div class="bar-label">
          ${dayName}
        </div>
      `;

      dailyBarsEl.appendChild(bar);
    });
  }


  // -----------------------------
  // RECENT TRANSACTIONS
  // -----------------------------

  function renderRecentTransactions(data) {
    if (!recentRowsEl) {
      return;
    }

    recentRowsEl.innerHTML = "";

    const transactions =
      Array.isArray(data.recentTransactions)
        ? data.recentTransactions
        : [];


    if (transactions.length === 0) {
      recentRowsEl.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="empty-table"
          >
            No transactions found.
          </td>
        </tr>
      `;

      return;
    }


    let runningBalance = 0;

    /*
      Controller returns newest first.

      Reverse temporarily so we can
      calculate the running balance
      correctly from oldest → newest.
    */

    const ordered =
      [...transactions].reverse();


    const balances =
      new Map();


    ordered.forEach(transaction => {
      const amount =
        Number(transaction.amount) || 0;

      if (
        transaction.type === "credit"
      ) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      balances.set(
        transaction.id,
        runningBalance
      );
    });


    transactions.forEach(transaction => {
      const amount =
        Number(transaction.amount) || 0;

      const isCredit =
        transaction.type === "credit";

      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td>
          ${formatDate(transaction.date)}
        </td>

        <td>
          <div class="transaction-description">
            <strong>
              ${escapeHtml(
                transaction.description ||
                "Untitled transaction"
              )}
            </strong>

            ${
              transaction.notes
                ? `
                  <small>
                    ${escapeHtml(
                      transaction.notes
                    )}
                  </small>
                `
                : ""
            }
          </div>
        </td>

        <td>
          <span class="category-badge">
            ${escapeHtml(
              transaction.category ||
              "Uncategorized"
            )}
          </span>
        </td>

        <td>
          <span
            class="${
              isCredit
                ? "amount-credit"
                : "amount-debit"
            }"
          >
            ${
              isCredit
                ? "+"
                : "-"
            }${formatCurrency(amount)}
          </span>
        </td>

        <td>
          <strong>
            ${formatCurrency(
              balances.get(
                transaction.id
              ) || 0
            )}
          </strong>
        </td>
      `;

      recentRowsEl.appendChild(row);
    });
  }


  // -----------------------------
  // EXPENSE DONUT
  // -----------------------------

  function renderExpenseMix(data) {
    if (
      !expenseDonutEl ||
      !categoryLegendEl
    ) {
      return;
    }

    const categories =
      Array.isArray(data.categorySpending)
        ? data.categorySpending
        : [];


    expenseDonutEl.innerHTML = "";
    categoryLegendEl.innerHTML = "";


    if (categories.length === 0) {
      expenseDonutEl.style.background =
        "var(--border)";

      categoryLegendEl.innerHTML = `
        <div class="empty-state">
          <strong>No expense data</strong>
          <span>No debit transactions yet.</span>
        </div>
      `;

      return;
    }


    const total =
      categories.reduce(
        (sum, category) =>
          sum +
          (Number(
            category.totalSpent
          ) || 0),
        0
      );


    if (total <= 0) {
      return;
    }


    /*
      Generate CSS conic-gradient
      segments dynamically.
    */

    const colors = [
      "#4169e1",
      "#22a06b",
      "#f59e0b",
      "#e85d75",
      "#8b5cf6",
      "#14b8a6",
      "#f97316",
      "#64748b"
    ];


    let current = 0;

    const segments =
      categories.map(
        (category, index) => {
          const value =
            Number(
              category.totalSpent
            ) || 0;

          const percentage =
            (value / total) * 100;

          const start =
            current;

          current += percentage;

          const color =
            colors[
              index %
              colors.length
            ];

          return {
            name:
              category.name,
            value,
            percentage,
            start,
            end: current,
            color
          };
        }
      );


    expenseDonutEl.style.background =
      `conic-gradient(${
        segments
          .map(segment =>
            `${segment.color} ${segment.start}% ${segment.end}%`
          )
          .join(", ")
      })`;


    segments.forEach(segment => {
      const item =
        document.createElement("div");

      item.className =
        "legend-item";

      item.innerHTML = `
        <span class="legend-left">
          <span
            class="legend-dot"
            style="
              background:${segment.color}
            "
          ></span>

          <span>
            ${escapeHtml(
              segment.name
            )}
          </span>
        </span>

        <strong>
          ${formatCurrency(
            segment.value
          )}
        </strong>
      `;

      categoryLegendEl.appendChild(item);
    });
  }


  // -----------------------------
  // HTML ESCAPE
  // -----------------------------

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  // -----------------------------
  // QUICK ACTIONS
  // -----------------------------

  if (addExpenseBtn) {
    addExpenseBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "transactions.html";
      }
    );
  }


  if (addLabourBtn) {
    addLabourBtn.addEventListener(
      "click",
      () => {
        /*
          Labour page was removed from
          the current frontend structure.

          Send the user to Transactions
          instead of creating a broken link.
        */

        window.location.href =
          "transactions.html";
      }
    );
  }


  // -----------------------------
  // LOAD DASHBOARD
  // -----------------------------

  async function init() {
    try {
      const data =
        await getDashboard();

      renderTotals(data);
      renderDailySpending(data);
      renderRecentTransactions(data);
      renderExpenseMix(data);

    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      if (window.HouseExpense &&
          HouseExpense.showToast) {

        HouseExpense.showToast(
          "Dashboard error",
          "Unable to load dashboard data.",
          "danger"
        );
      }
    }
  }


  init();
});