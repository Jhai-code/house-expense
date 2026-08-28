/* =========================================================
   HOUSE EXPENSE TRACKER
   EXPORT PAGE
   PostgreSQL → Express API → Preview → Excel
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const API_BASE_URL = "http://localhost:3000";


  /* =======================================================
     DOM ELEMENTS
     ======================================================= */

  const exportTypeCards =
    document.querySelectorAll(".export-type-card");

  const exportTypeBadge =
    document.getElementById("exportTypeBadge");

  const fromDate =
    document.getElementById("fromDate");

  const toDate =
    document.getElementById("toDate");

  const categoryFilter =
    document.getElementById("categoryFilter");

  const transactionType =
    document.getElementById("transactionType");

  const transactionColumns =
    document.getElementById("transactionColumns");

  const labourColumns =
    document.getElementById("labourColumns");

  const categoryGroup =
    document.getElementById("categoryGroup");

  const transactionTypeGroup =
    document.getElementById("transactionTypeGroup");

  const previewBtn =
    document.getElementById("previewBtn");

  const exportBtn =
    document.getElementById("exportBtn");

  const recordCount =
    document.getElementById("recordCount");

  const filterSummary =
    document.getElementById("filterSummary");

  const previewCount =
    document.getElementById("previewCount");

  const previewHead =
    document.getElementById("previewHead");

  const previewBody =
    document.getElementById("previewBody");


  /* =======================================================
     STATE
     ======================================================= */

  let currentType = "transactions";

  let previewData = [];


  /* =======================================================
     TOAST
     ======================================================= */

  function toast(title, message, type = "info") {

    if (
      window.HouseExpense &&
      typeof window.HouseExpense.showToast === "function"
    ) {

      window.HouseExpense.showToast(
        title,
        message,
        type
      );

      return;
    }

    console.log(
      `${title}: ${message}`
    );
  }


  /* =======================================================
     API REQUEST
     ======================================================= */

  async function apiRequest(url) {

    const response =
      await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });


    const contentType =
      response.headers.get("content-type") || "";


    let result;


    if (
      contentType.includes("application/json")
    ) {

      result =
        await response.json();

    } else {

      const text =
        await response.text();

      result = {
        success: false,
        message:
          text ||
          "Server returned an invalid response."
      };
    }


    if (!response.ok) {

      throw new Error(
        result.message ||
        `Request failed with status ${response.status}`
      );
    }


    return result;
  }


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  function formatDate(value) {

    if (!value) {
      return "—";
    }


    const stringValue =
      String(value);


    const dateOnlyMatch =
      stringValue.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );


    if (dateOnlyMatch) {

      return (
        `${dateOnlyMatch[3]}-` +
        `${dateOnlyMatch[2]}-` +
        `${dateOnlyMatch[1]}`
      );
    }


    const timestampMatch =
      stringValue.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );


    if (timestampMatch) {

      return (
        `${timestampMatch[3]}-` +
        `${timestampMatch[2]}-` +
        `${timestampMatch[1]}`
      );
    }


    return stringValue;
  }


  /* =======================================================
     FILE DATE
     ======================================================= */

  function getFileDate() {

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  /* =======================================================
     MONEY FORMAT
     ======================================================= */

  function formatMoney(value) {

    const number =
      Number(value) || 0;

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(number);
  }


  /* =======================================================
     LOAD CATEGORIES
     ======================================================= */

  async function loadCategories() {

    if (!categoryFilter) {
      return;
    }


    try {

      const result =
        await apiRequest(
          `${API_BASE_URL}/api/categories`
        );


      categoryFilter.innerHTML =
        `<option value="">All categories</option>`;


      const categories =
        Array.isArray(result.data)
          ? result.data
          : [];


      categories
        .filter(
          category =>
            category.isActive !== false
        )
        .forEach(
          category => {

            const option =
              document.createElement(
                "option"
              );

            option.value =
              category.id;

            option.textContent =
              category.name;

            categoryFilter.appendChild(
              option
            );
          }
        );

    } catch (error) {

      console.error(
        "Category loading error:",
        error
      );

      categoryFilter.innerHTML =
        `<option value="">All categories</option>`;

      toast(
        "Category loading failed",
        error.message,
        "danger"
      );
    }
  }


 /* =======================================================
   LABOUR CATEGORY SELECTOR
   ======================================================= */

function createLabourCategorySelector() {

  if (!labourColumns) {
    return;
  }

  /*
    Hide the old "Labour columns" section.
    We don't need it because the labour export
    format is fixed.
  */

  labourColumns.style.display = "none";


  /*
    Prevent duplicate selector.
  */

  if (
    document.getElementById(
      "labourCategorySelector"
    )
  ) {
    return;
  }


  const wrapper =
    document.createElement("div");

  wrapper.id =
    "labourCategorySelector";

  wrapper.className =
    "labour-category-selector";


  wrapper.innerHTML = `

    <div class="labour-category-header">

      <div>
        <strong>Labour categories</strong>

        <span>
          Select one or more labour categories to export.
        </span>
      </div>

      <span
        class="labour-selected-count"
        id="labourSelectedCount"
      >
        0 selected
      </span>

    </div>


    <div class="labour-category-options">

      <label class="labour-category-option">

        <input
          type="checkbox"
          value="Kothanar"
          class="labour-category-checkbox"
        >

        <span class="labour-check"></span>

        <span class="labour-category-text">
          <strong>Kothanar</strong>
          <small>Daily labour wages</small>
        </span>

      </label>


      <label class="labour-category-option">

        <input
          type="checkbox"
          value="Nimdhal"
          class="labour-category-checkbox"
        >

        <span class="labour-check"></span>

        <span class="labour-category-text">
          <strong>Nimdhal</strong>
          <small>Daily labour wages</small>
        </span>

      </label>


      <label class="labour-category-option">

        <input
          type="checkbox"
          value="Sithal"
          class="labour-category-checkbox"
        >

        <span class="labour-check"></span>

        <span class="labour-category-text">
          <strong>Sithal</strong>
          <small>Daily labour wages</small>
        </span>

      </label>

    </div>
  `;


  /*
    Insert the new category selector
    where the old Labour columns section was.
  */

  labourColumns.parentNode.insertBefore(
    wrapper,
    labourColumns
  );


  /*
    Update selected count.
  */

  updateLabourSelectedCount();
}
 function getSelectedLabourCategories() {

  return Array.from(
    document.querySelectorAll(
      ".labour-category-checkbox:checked"
    )
  ).map(
    checkbox =>
      checkbox.value
  );
}
/* =======================================================
   UPDATE LABOUR SELECTED COUNT
   ======================================================= */

function updateLabourSelectedCount() {

  const countElement =
    document.getElementById(
      "labourSelectedCount"
    );

  if (!countElement) {
    return;
  }


  const selected =
    getSelectedLabourCategories();


  const count =
    selected.length;


  countElement.textContent =
    `${count} ${
      count === 1
        ? "category"
        : "categories"
    } selected`;
}
  /* =======================================================
     BUILD TRANSACTION FILTER PARAMETERS
     ======================================================= */

  function buildFilterParams() {

    const params =
      new URLSearchParams();


    if (
      fromDate &&
      fromDate.value
    ) {

      params.set(
        "from",
        fromDate.value
      );
    }


    if (
      toDate &&
      toDate.value
    ) {

      params.set(
        "to",
        toDate.value
      );
    }


    if (
      transactionType &&
      transactionType.value
    ) {

      params.set(
        "type",
        transactionType.value
      );
    }


    /*
      IMPORTANT:
      Export backend expects "categories".
    */

    if (
      categoryFilter &&
      categoryFilter.value
    ) {

      params.set(
        "categories",
        categoryFilter.value
      );
    }


    return params;
  }


  /* =======================================================
     DATE VALIDATION
     ======================================================= */

  function validateDates() {

    if (
      fromDate &&
      toDate &&
      fromDate.value &&
      toDate.value &&
      fromDate.value > toDate.value
    ) {

      toast(
        "Invalid date range",
        "From date cannot be later than To date.",
        "danger"
      );

      return false;
    }


    return true;
  }


  /* =======================================================
     SELECTED TRANSACTION COLUMNS
     ======================================================= */

  function getSelectedColumns() {

    if (!transactionColumns) {
      return [];
    }


    return Array.from(
      transactionColumns.querySelectorAll(
        'input[type="checkbox"]:checked'
      )
    ).map(
      checkbox =>
        checkbox.value
    );
  }


  /* =======================================================
     FILTER SUMMARY
     ======================================================= */

  function updateFilterSummary() {

    if (!filterSummary) {
      return;
    }


    const parts = [];


    if (
      fromDate &&
      fromDate.value
    ) {

      parts.push(
        `From ${formatDate(fromDate.value)}`
      );
    }


    if (
      toDate &&
      toDate.value
    ) {

      parts.push(
        `To ${formatDate(toDate.value)}`
      );
    }


    if (
      currentType === "transactions" &&
      categoryFilter &&
      categoryFilter.value
    ) {

      const selected =
        categoryFilter.options[
          categoryFilter.selectedIndex
        ];


      if (selected) {

        parts.push(
          `Category: ${selected.textContent}`
        );
      }
    }


    if (
      currentType === "transactions" &&
      transactionType &&
      transactionType.value
    ) {

      const selected =
        transactionType.options[
          transactionType.selectedIndex
        ];


      if (selected) {

        parts.push(
          selected.textContent
        );
      }
    }


    if (
      currentType === "labour"
    ) {

      const selected =
        getSelectedLabourCategories();


      if (selected.length) {

        parts.push(
          `Labour: ${selected.join(", ")}`
        );

      } else {

        parts.push(
          "No labour category selected"
        );
      }
    }


    filterSummary.textContent =
      parts.length
        ? parts.join(" • ")
        : "All available records";
  }


  /* =======================================================
     UPDATE COUNTS
     ======================================================= */

  function updateRecordCount(count) {

    const label =
      count === 1
        ? "record"
        : "records";


    if (recordCount) {

      recordCount.textContent =
        `${count} ${label}`;
    }


    if (previewCount) {

      previewCount.textContent =
        `${count} ${label}`;
    }
  }


  /* =======================================================
     CLEAR PREVIEW
     ======================================================= */

  function clearPreview() {

    previewData = [];


    if (previewHead) {
      previewHead.innerHTML = "";
    }


    if (previewBody) {

      previewBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty">

              <div class="empty-icon">
                ⇩
              </div>

              <strong>
                No preview available
              </strong>

              <span>
                Adjust your filters or click Preview to load records.
              </span>

            </div>
          </td>
        </tr>
      `;
    }


    updateRecordCount(0);
  }


  /* =======================================================
     TRANSACTION PREVIEW
     ======================================================= */

  function renderTransactionPreview(data) {

    const columns =
      getSelectedColumns();


    if (
      !previewHead ||
      !previewBody
    ) {
      return;
    }


    previewHead.innerHTML = "";

    previewBody.innerHTML = "";


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      clearPreview();

      return;
    }


    const columnNames = {

      date:
        "Date",

      description:
        "Description",

      category:
        "Category",

      credit:
        "Credit",

      debit:
        "Debit",

      balance:
        "Balance",

      notes:
        "Notes"
    };


    const headerRow =
      document.createElement("tr");


    columns.forEach(
      column => {

        const th =
          document.createElement("th");


        th.textContent =
          columnNames[column] ||
          column;


        headerRow.appendChild(th);
      }
    );


    previewHead.appendChild(
      headerRow
    );


    data.forEach(
      transaction => {

        const tr =
          document.createElement("tr");


        columns.forEach(
          column => {

            const td =
              document.createElement("td");


            switch (column) {

              case "date":

                td.textContent =
                  formatDate(
                    transaction.date
                  );

                break;


              case "description":

                td.textContent =
                  transaction.description ||
                  "—";

                break;


              case "category":

                td.textContent =
                  transaction.category ||
                  "—";

                break;


              case "credit":

                td.textContent =
                  transaction.type === "credit"
                    ? formatMoney(
                        transaction.amount
                      )
                    : "—";

                break;


              case "debit":

                td.textContent =
                  transaction.type === "debit"
                    ? formatMoney(
                        transaction.amount
                      )
                    : "—";

                break;


              case "balance":

                td.textContent =
                  formatMoney(
                    transaction.balance
                  );

                break;


              case "notes":

                td.textContent =
                  transaction.notes ||
                  "—";

                break;


              default:

                td.textContent =
                  transaction[column] ??
                  "—";
            }


            tr.appendChild(td);
          }
        );


        previewBody.appendChild(tr);
      }
    );


    updateRecordCount(
      data.length
    );
  }


  /* =======================================================
     LABOUR PREVIEW
     ======================================================= */

  function renderLabourPreview(data) {

    if (
      !previewHead ||
      !previewBody
    ) {
      return;
    }


    previewHead.innerHTML = "";

    previewBody.innerHTML = "";


    const selectedCategories =
      getSelectedLabourCategories();


    if (
      selectedCategories.length === 0
    ) {

      previewBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty">

              <div class="empty-icon">
                !
              </div>

              <strong>
                Select a labour category
              </strong>

              <span>
                Choose Kothanar, Nimdhal or Sithal above.
              </span>

            </div>
          </td>
        </tr>
      `;

      updateRecordCount(0);

      return;
    }


    /*
      Group transactions by date.
    */

    const grouped = {};


    data.forEach(row => {

      const category =
        String(row.category || "")
          .trim();


      if (
        !selectedCategories.includes(
          category
        )
      ) {
        return;
      }


      const date =
        formatDate(row.date);


      if (!grouped[date]) {

        grouped[date] = {
          date,
          Kothanar: 0,
          Nimdhal: 0,
          Sithal: 0
        };
      }


      const amount =
        Number(row.amount) || 0;


      grouped[date][category] +=
        amount;
    });


    const rows =
      Object.values(grouped);


    /*
      Sort by date.
    */

    rows.sort(
      (a, b) =>
        new Date(
          a.date.split("-").reverse().join("-")
        ) -
        new Date(
          b.date.split("-").reverse().join("-")
        )
    );


    if (rows.length === 0) {

      previewBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty">

              <div class="empty-icon">
                ⇩
              </div>

              <strong>
                No labour records found
              </strong>

              <span>
                Try another date range or labour category.
              </span>

            </div>
          </td>
        </tr>
      `;

      updateRecordCount(0);

      return;
    }


    /*
      HEADER
    */

    const headerRow =
      document.createElement("tr");


    const headers = [
      "Date",
      "Kothanar",
      "Nimdhal",
      "Sithal",
      "Total"
    ];


    headers.forEach(
      header => {

        const th =
          document.createElement("th");

        th.textContent =
          header;

        headerRow.appendChild(th);
      }
    );


    previewHead.appendChild(
      headerRow
    );


    /*
      BODY
    */

    rows.forEach(row => {

      const tr =
        document.createElement("tr");


      const total =
        row.Kothanar +
        row.Nimdhal +
        row.Sithal;


      const values = [
        row.date,
        row.Kothanar,
        row.Nimdhal,
        row.Sithal,
        total
      ];


      values.forEach(
        (value, index) => {

          const td =
            document.createElement("td");


          if (index === 0) {

            td.textContent =
              value;

          } else {

            td.textContent =
              formatMoney(value);
          }


          tr.appendChild(td);
        }
      );


      previewBody.appendChild(tr);
    });


    updateRecordCount(
      rows.length
    );
  }


  /* =======================================================
     LOAD TRANSACTION DATA
     ======================================================= */

  async function loadTransactions() {

    if (!validateDates()) {
      return;
    }


    try {

      if (previewBtn) {

        previewBtn.disabled =
          true;

        previewBtn.textContent =
          "Loading...";
      }


      const params =
        buildFilterParams();


      /*
        Use export/data because it returns
        exactly the structure required by
        the export preview.
      */

      const url =
        `${API_BASE_URL}/api/export/data?${params.toString()}`;


      const result =
        await apiRequest(url);


      previewData =
        Array.isArray(result.data)
          ? result.data
          : [];


      renderTransactionPreview(
        previewData
      );


      updateFilterSummary();


    } catch (error) {

      console.error(
        "Transaction preview error:",
        error
      );


      clearPreview();


      toast(
        "Preview failed",
        error.message ||
        "Unable to load transaction records.",
        "danger"
      );


    } finally {

      if (previewBtn) {

        previewBtn.disabled =
          false;

        previewBtn.textContent =
          "Preview";
      }
    }
  }


  /* =======================================================
     LOAD LABOUR DATA
     ======================================================= */

  async function loadLabour() {

    if (!validateDates()) {
      return;
    }


    const selectedCategories =
      getSelectedLabourCategories();


    if (
      selectedCategories.length === 0
    ) {

      previewData = [];

      renderLabourPreview([]);

      updateFilterSummary();

      toast(
        "Select labour category",
        "Please select at least one labour category.",
        "danger"
      );

      return;
    }


    try {

      if (previewBtn) {

        previewBtn.disabled =
          true;

        previewBtn.textContent =
          "Loading...";
      }


      /*
        Get all transaction data using
        the same date filters.

        We filter labour categories
        safely in the frontend for preview.
      */

      const params =
        new URLSearchParams();


      if (
        fromDate &&
        fromDate.value
      ) {

        params.set(
          "from",
          fromDate.value
        );
      }


      if (
        toDate &&
        toDate.value
      ) {

        params.set(
          "to",
          toDate.value
        );
      }


      const url =
        `${API_BASE_URL}/api/export/data?${params.toString()}`;


      const result =
        await apiRequest(url);


      const allData =
        Array.isArray(result.data)
          ? result.data
          : [];


      previewData =
        allData.filter(
          row =>
            selectedCategories.includes(
              String(row.category || "").trim()
            )
        );


      renderLabourPreview(
        previewData
      );


      updateFilterSummary();


    } catch (error) {

      console.error(
        "Labour preview error:",
        error
      );


      clearPreview();


      toast(
        "Labour preview failed",
        error.message ||
        "Unable to load labour records.",
        "danger"
      );


    } finally {

      if (previewBtn) {

        previewBtn.disabled =
          false;

        previewBtn.textContent =
          "Preview";
      }
    }
  }


  /* =======================================================
     DOWNLOAD EXCEL
     ======================================================= */

  async function downloadExcel(
    url,
    filename,
    successTitle,
    successMessage
  ) {

    const originalText =
      exportBtn
        ? exportBtn.innerHTML
        : "";


    try {

      if (exportBtn) {

        exportBtn.disabled =
          true;

        exportBtn.innerHTML =
          "Preparing Excel...";
      }


      console.log(
        "Excel export request:",
        url
      );


      const response =
        await fetch(url);


      if (!response.ok) {

        let message =
          "Excel export failed.";


        try {

          const contentType =
            response.headers.get(
              "content-type"
            ) || "";


          if (
            contentType.includes(
              "application/json"
            )
          ) {

            const errorData =
              await response.json();

            message =
              errorData.message ||
              message;

          } else {

            const text =
              await response.text();

            if (text) {
              message = text;
            }
          }

        } catch (error) {

          console.error(
            "Error reading export error:",
            error
          );
        }


        throw new Error(
          message
        );
      }


      const blob =
        await response.blob();


      if (
        blob.size === 0
      ) {

        throw new Error(
          "The server returned an empty Excel file."
        );
      }


      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      /*
        Make sure backend really returned
        an Excel file.
      */

      if (
        contentType.includes("application/json")
      ) {

        const text =
          await blob.text();


        try {

          const errorData =
            JSON.parse(text);

          throw new Error(
            errorData.message ||
            "Server returned an error instead of an Excel file."
          );

        } catch (jsonError) {

          if (
            jsonError.message &&
            jsonError.message !==
              "Unexpected end of JSON input"
          ) {

            throw jsonError;
          }

          throw new Error(
            "Server returned JSON instead of an Excel file."
          );
        }
      }


      const downloadUrl =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement("a");


      link.href =
        downloadUrl;

      link.download =
        filename;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      setTimeout(
        () => {

          URL.revokeObjectURL(
            downloadUrl
          );

        },
        1000
      );


      toast(
        successTitle,
        successMessage,
        "success"
      );


    } catch (error) {

      console.error(
        "Excel export error:",
        error
      );


      toast(
        "Export failed",
        error.message ||
        "Unable to create the Excel file.",
        "danger"
      );


    } finally {

      if (exportBtn) {

        exportBtn.disabled =
          false;

        exportBtn.innerHTML =
          originalText ||
          "⇩ Export Excel";
      }
    }
  }


  /* =======================================================
     TRANSACTION EXCEL EXPORT
     ======================================================= */

  async function exportTransactionsExcel() {

    if (!validateDates()) {
      return;
    }


    const columns =
      getSelectedColumns();


    if (
      columns.length === 0
    ) {

      toast(
        "Select columns",
        "Please select at least one column to export.",
        "danger"
      );

      return;
    }


    const params =
      buildFilterParams();


    params.set(
      "columns",
      columns.join(",")
    );


    const url =
      `${API_BASE_URL}/api/export/excel?${params.toString()}`;


    await downloadExcel(

      url,

      `house-expense-transactions-${getFileDate()}.xlsx`,

      "Excel exported",

      `${previewData.length} ${
        previewData.length === 1
          ? "transaction"
          : "transactions"
      } exported successfully.`
    );
  }


  /* =======================================================
     LABOUR EXCEL EXPORT
     ======================================================= */

  async function exportLabourExcel() {

    if (!validateDates()) {
      return;
    }


    const selectedCategories =
      getSelectedLabourCategories();


    if (
      selectedCategories.length === 0
    ) {

      toast(
        "Select labour category",
        "Please select at least one labour category.",
        "danger"
      );

      return;
    }


    const params =
      new URLSearchParams();


    if (
      fromDate &&
      fromDate.value
    ) {

      params.set(
        "from",
        fromDate.value
      );
    }


    if (
      toDate &&
      toDate.value
    ) {

      params.set(
        "to",
        toDate.value
      );
    }


    /*
      IMPORTANT:
      Send selected labour categories
      to the backend.
    */

    params.set(
      "labourCategories",
      selectedCategories.join(",")
    );


    const url =
      `${API_BASE_URL}/api/export/labour-excel?${params.toString()}`;


    await downloadExcel(

      url,

      `daily-labour-${getFileDate()}.xlsx`,

      "Labour Excel exported",

      `${selectedCategories.join(", ")} labour data exported successfully.`
    );
  }


  /* =======================================================
     SWITCH EXPORT TYPE
     ======================================================= */

  function switchExportType(type) {

    currentType =
      type;


    exportTypeCards.forEach(
      card => {

        card.classList.toggle(
          "active",
          card.dataset.exportType ===
          type
        );
      }
    );


    if (
      type === "transactions"
    ) {

      if (exportTypeBadge) {

        exportTypeBadge.textContent =
          "Transactions";
      }


      if (transactionColumns) {

        transactionColumns.classList.remove(
          "hidden"
        );
      }


      if (labourColumns) {

        labourColumns.classList.add(
          "hidden"
        );
      }


      if (categoryGroup) {

        categoryGroup.classList.remove(
          "hidden"
        );
      }


      if (transactionTypeGroup) {

        transactionTypeGroup.classList.remove(
          "hidden"
        );
      }


      /*
        Hide labour category selector.
      */

      const labourSelector =
        document.getElementById(
          "labourCategorySelector"
        );

      if (labourSelector) {

        labourSelector.classList.add(
          "hidden"
        );
      }


    } else {

      if (exportTypeBadge) {

        exportTypeBadge.textContent =
          "Labour";
      }


      if (transactionColumns) {

        transactionColumns.classList.add(
          "hidden"
        );
      }


     if (labourColumns) {

  labourColumns.classList.add(
    "hidden"
  );

}


      if (categoryGroup) {

        categoryGroup.classList.add(
          "hidden"
        );
      }


      if (transactionTypeGroup) {

        transactionTypeGroup.classList.add(
          "hidden"
        );
      }


      /*
        Show labour category selector.
      */

      const labourSelector =
        document.getElementById(
          "labourCategorySelector"
        );

      if (labourSelector) {

        labourSelector.classList.remove(
          "hidden"
        );
      }
    }


    clearPreview();

    updateFilterSummary();
  }


  /* =======================================================
     EXPORT TYPE EVENTS
     ======================================================= */

  exportTypeCards.forEach(
    card => {

      card.addEventListener(
        "click",
        () => {

          switchExportType(
            card.dataset.exportType
          );
        }
      );
    }
  );


  /* =======================================================
     PREVIEW BUTTON
     ======================================================= */

  if (previewBtn) {

    previewBtn.addEventListener(
      "click",
      async () => {

        if (
          currentType ===
          "transactions"
        ) {

          await loadTransactions();

        } else {

          await loadLabour();
        }
      }
    );
  }


  /* =======================================================
     EXPORT BUTTON
     ======================================================= */

  if (exportBtn) {

    exportBtn.addEventListener(
      "click",
      async () => {

        if (
          currentType ===
          "transactions"
        ) {

          await exportTransactionsExcel();

          return;
        }


        if (
          currentType ===
          "labour"
        ) {

          await exportLabourExcel();

          return;
        }


        toast(
          "Select export type",
          "Please select Transactions or Labour.",
          "info"
        );
      }
    );
  }


  /* =======================================================
     FILTER EVENTS
     ======================================================= */

  [
    fromDate,
    toDate,
    categoryFilter,
    transactionType
  ].forEach(
    element => {

      if (!element) {
        return;
      }


      element.addEventListener(
        "change",
        async () => {

          updateFilterSummary();


          /*
            Don't automatically load data.
            User clicks Preview.
          */

          clearPreview();
        }
      );
    }
  );


  document.addEventListener(
  "change",
  event => {

    if (
      event.target.matches(
        ".labour-category-checkbox"
      )
    ) {

      updateLabourSelectedCount();

      updateFilterSummary();

      clearPreview();
    }
  }
);

  /* =======================================================
     INITIALIZE
     ======================================================= */

  async function init() {

    createLabourCategorySelector();

    updateFilterSummary();

    clearPreview();

    await loadCategories();

    switchExportType(
      "transactions"
    );
  }


  init();

});