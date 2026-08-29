/* =========================================================
   HOUSE EXPENSE TRACKER
   TRANSACTIONS PAGE
   PostgreSQL API VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     CONFIGURATION
  ======================================================= */

   const API_BASE_URL = "https://house-expense-gdlf.onrender.com/api";


  /* =======================================================
     DOM ELEMENTS
  ======================================================= */

  const table =
    document.querySelector("#transactionRows");

  const search =
    document.querySelector("#search");

  const categoryFilter =
    document.querySelector("#categoryFilter");

  const typeFilter =
    document.querySelector("#typeFilter");

  const fromDate =
    document.querySelector("#fromDate");

  const toDate =
    document.querySelector("#toDate");

  const resultCount =
    document.querySelector("#resultCount");

  const pageTotalCredit =
    document.querySelector("#pageTotalCredit");

  const pageTotalDebit =
    document.querySelector("#pageTotalDebit");

  const pageBalance =
    document.querySelector("#pageBalance");

  const pageTransactionCount =
    document.querySelector("#pageTransactionCount");

  const modal =
    document.querySelector("#transactionModal");

  const form =
    document.querySelector("#transactionForm");

  const modalTitle =
    document.querySelector("#modalTitle");

  const formDate =
    document.querySelector("#formDate");

  const formDescription =
    document.querySelector("#formDescription");

  const formCategory =
    document.querySelector("#formCategory");

  const formAmount =
    document.querySelector("#formAmount");

  const formNotes =
    document.querySelector("#formNotes");

  const cancelButton =
    document.querySelector("#cancelBtn");

  const closeModalButton =
    document.querySelector("#closeModalBtn");

  const addButton =
    document.querySelector("#addBtn");

  const addButtonSecondary =
    document.querySelector("#addBtnSecondary");

  const saveButton =
    document.querySelector("#saveTransactionBtn");

  const databaseStatus =
    document.querySelector("#databaseStatus");

  const menuButton =
    document.querySelector("#menuBtn");

  const sidebar =
    document.querySelector(".sidebar");

  const overlay =
    document.querySelector(".overlay");


  /* =======================================================
     STATE
  ======================================================= */

  let transactions = [];

  let categories = [];

  let editingId = null;

  let searchTimer = null;


  /* =======================================================
     HELPERS
  ======================================================= */

  function todayISO() {

    const now = new Date();

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


  function money(value) {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
      }
    ).format(
      Number(value) || 0
    );
  }


  function dateText(value) {

    if (!value) {
      return "-";
    }

    const date =
      new Date(
        String(value).slice(0, 10) +
        "T00:00:00"
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  }


  function escapeHTML(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function showToast(
    title,
    message,
    type = "success"
  ) {

    let toast =
      document.querySelector(
        ".toast"
      );

    if (!toast) {

      toast =
        document.createElement(
          "div"
        );

      toast.className =
        "toast";

      document.body.appendChild(
        toast
      );
    }


    const icon =
      type === "danger"
        ? "!"
        : type === "info"
          ? "i"
          : "✓";


    toast.innerHTML = `

      <div
        class="stat-icon"
        style="
          width:30px;
          height:30px;
          flex:0 0 30px;
        "
      >
        ${icon}
      </div>

      <div>

        <strong>
          ${escapeHTML(title)}
        </strong>

        <span>
          ${escapeHTML(message)}
        </span>

      </div>

    `;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      window.__houseExpenseToast
    );


    window.__houseExpenseToast =
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 3200);
  }


  function setButtonLoading(
    button,
    loading,
    loadingText,
    normalText
  ) {

    if (!button) {
      return;
    }

    button.disabled =
      loading;

    button.textContent =
      loading
        ? loadingText
        : normalText;
  }


  /* =======================================================
     API REQUEST
  ======================================================= */

  async function apiRequest(
    endpoint,
    options = {}
  ) {

    const response =
      await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(options.headers || {})
          }
        }
      );


    let result = null;


    try {

      result =
        await response.json();

    } catch {

      result = null;

    }


    if (!response.ok) {

      const message =
        result?.message ||
        result?.error ||
        `Server returned ${response.status}`;

      throw new Error(
        message
      );
    }


    return result;
  }


  /* =======================================================
     EXTRACT API DATA
  ======================================================= */

  function extractArray(
    response
  ) {

    if (
      Array.isArray(response)
    ) {
      return response;
    }


    if (
      Array.isArray(
        response?.data
      )
    ) {
      return response.data;
    }


    if (
      Array.isArray(
        response?.data?.rows
      )
    ) {
      return response.data.rows;
    }


    if (
      Array.isArray(
        response?.transactions
      )
    ) {
      return response.transactions;
    }


    if (
      Array.isArray(
        response?.categories
      )
    ) {
      return response.categories;
    }


    return [];
  }


  function extractObject(
    response
  ) {

    if (
      response?.data &&
      !Array.isArray(
        response.data
      )
    ) {
      return response.data;
    }


    return response;
  }


  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  async function loadCategories() {

    try {

      const response =
        await apiRequest(
          "/categories"
        );


      categories =
        extractArray(
          response
        );


      renderCategories();


    } catch (error) {

      console.error(
        "Category loading error:",
        error
      );


      categories = [];


      renderCategories();


      showToast(
        "Category loading failed",
        error.message,
        "danger"
      );
    }
  }


  /* =======================================================
     RENDER CATEGORY OPTIONS
  ======================================================= */

  function renderCategories() {

    if (!categoryFilter) {
      return;
    }


    categoryFilter.innerHTML = `

      <option value="">
        All categories
      </option>

    `;


    formCategory.innerHTML = `

      <option value="">
        Select category
      </option>

    `;


    categories
      .filter(
        category =>
          category.isActive !== false
      )
      .forEach(
        category => {

          const id =
            category.id;

          const name =
            category.name ||
            category.category_name ||
            category.title ||
            `Category ${id}`;


          const filterOption =
            document.createElement(
              "option"
            );

          filterOption.value =
            id;

          filterOption.textContent =
            name;


          categoryFilter.appendChild(
            filterOption
          );


          const formOption =
            document.createElement(
              "option"
            );

          formOption.value =
            id;

          formOption.textContent =
            name;


          formCategory.appendChild(
            formOption
          );
        }
      );
  }


  /* =======================================================
     BUILD TRANSACTION QUERY
  ======================================================= */

  function buildQuery() {

    const params =
      new URLSearchParams();


    const searchValue =
      search?.value.trim();


    const categoryId =
      categoryFilter?.value;


    const transactionType =
      typeFilter?.value;


    const from =
      fromDate?.value;


    const to =
      toDate?.value;


    if (searchValue) {

      params.set(
        "search",
        searchValue
      );
    }


    if (categoryId) {

      params.set(
        "categoryId",
        categoryId
      );
    }


    if (transactionType) {

      params.set(
        "type",
        transactionType
      );
    }


    if (from) {

      params.set(
        "from",
        from
      );
    }


    if (to) {

      params.set(
        "to",
        to
      );
    }


    const query =
      params.toString();


    return query
      ? `?${query}`
      : "";
  }


  /* =======================================================
     LOAD TRANSACTIONS
  ======================================================= */

  async function loadTransactions() {

    showLoading();


    try {

      const response =
        await apiRequest(
          `/transactions${buildQuery()}`
        );


      transactions =
        extractArray(
          response
        );


      renderTransactions();


      setDatabaseStatus(
        true
      );


    } catch (error) {

      console.error(
        "Transaction loading error:",
        error
      );


      transactions = [];


      showError(
        error.message
      );


      setDatabaseStatus(
        false
      );
    }
  }


  /* =======================================================
     DATABASE STATUS
  ======================================================= */

  function setDatabaseStatus(
    connected
  ) {

    if (!databaseStatus) {
      return;
    }


    databaseStatus.textContent =
      connected
        ? "Database connected"
        : "Database unavailable";
  }


  /* =======================================================
     LOADING STATE
  ======================================================= */

  function showLoading() {

    if (!table) {
      return;
    }


    table.innerHTML = `

      <tr>

        <td colspan="7">

          <div class="empty">

            <div class="empty-icon">
              ...
            </div>

            <strong>
              Loading transactions
            </strong>

            <span>
              Getting the latest records from PostgreSQL.
            </span>

          </div>

        </td>

      </tr>

    `;
  }


  /* =======================================================
     ERROR STATE
  ======================================================= */

  function showError(
    message
  ) {

    if (!table) {
      return;
    }


    table.innerHTML = `

      <tr>

        <td colspan="7">

          <div class="empty">

            <div
              class="empty-icon"
              style="
                background:var(--danger-soft);
                color:var(--danger);
              "
            >
              !
            </div>

            <strong>
              Unable to load transactions
            </strong>

            <span>
              ${escapeHTML(
                message ||
                "Please make sure the backend server is running."
              )}
            </span>

          </div>

        </td>

      </tr>

    `;
  }


  /* =======================================================
     NORMALIZE TRANSACTION
  ======================================================= */

  function normalizeTransaction(
    transaction
  ) {

    const credit =
      Number(
        transaction.credit ??
        (
          transaction.type === "credit"
            ? transaction.amount
            : 0
        ) ??
        0
      );


    const debit =
      Number(
        transaction.debit ??
        (
          transaction.type === "debit"
            ? transaction.amount
            : 0
        ) ??
        0
      );


    return {
      ...transaction,

      credit:
        Number.isFinite(credit)
          ? credit
          : 0,

      debit:
        Number.isFinite(debit)
          ? debit
          : 0
    };
  }


  /* =======================================================
     CALCULATE BALANCE
  ======================================================= */

  function calculateBalances(
    list
  ) {

    const sorted =
      [...list].sort(
        (a, b) => {

          const dateA =
            String(
              a.date || ""
            );

          const dateB =
            String(
              b.date || ""
            );


          if (
            dateA !== dateB
          ) {

            return dateA.localeCompare(
              dateB
            );
          }


          return (
            Number(a.id || 0) -
            Number(b.id || 0)
          );
        }
      );


    let balance = 0;


    return sorted.map(
      transaction => {

        const item =
          normalizeTransaction(
            transaction
          );


        balance +=
          item.credit -
          item.debit;


        return {
          ...item,

          balance
        };
      }
    );
  }


  /* =======================================================
     RENDER TRANSACTIONS
  ======================================================= */

  function renderTransactions() {

    const list =
      calculateBalances(
        transactions
      );


    updateSummary(
      list
    );


    if (!list.length) {

      table.innerHTML = `

        <tr>

          <td colspan="7">

            <div class="empty">

              <div class="empty-icon">
                ⌁
              </div>

              <strong>
                No transactions found
              </strong>

              <span>
                Add a transaction or change your filters.
              </span>

            </div>

          </td>

        </tr>

      `;


      updateResultCount(
        0
      );


      return;
    }


    const newestFirst =
      [...list].reverse();


    table.innerHTML =
      newestFirst
        .map(
          renderTransactionRow
        )
        .join("");


    updateResultCount(
      newestFirst.length
    );
  }


  /* =======================================================
     SUMMARY
  ======================================================= */

  function updateSummary(
    list
  ) {

    const credit =
      list.reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.credit || 0
          ),
        0
      );


    const debit =
      list.reduce(
        (
          total,
          transaction
        ) =>
          total +
          Number(
            transaction.debit || 0
          ),
        0
      );


    const balance =
      credit -
      debit;


    pageTotalCredit.textContent =
      money(credit);


    pageTotalDebit.textContent =
      money(debit);


    pageBalance.textContent =
      money(balance);


    pageTransactionCount.textContent =
      list.length;
  }


  /* =======================================================
     TRANSACTION ROW
  ======================================================= */

  function renderTransactionRow(
    transaction
  ) {

    const credit =
      Number(
        transaction.credit || 0
      );


    const debit =
      Number(
        transaction.debit || 0
      );


    const categoryName =
      transaction.categoryName ||
      transaction.category_name ||
      transaction.category ||
      "Uncategorized";


    const description =
      escapeHTML(
        transaction.description ||
        "Untitled transaction"
      );


    const notes =
      escapeHTML(
        transaction.notes ||
        ""
      );


    const creditHTML =
      credit > 0
        ? `
          <span class="credit">
            +${money(credit)}
          </span>
        `
        : "—";


    const debitHTML =
      debit > 0
        ? `
          <span class="debit">
            -${money(debit)}
          </span>
        `
        : "—";


    return `

      <tr>

        <td>
          ${dateText(
            transaction.date
          )}
        </td>


        <td>

          <strong
            style="color:var(--navy)"
          >
            ${description}
          </strong>

          ${
            notes
              ? `
                <div class="small muted">
                  ${notes}
                </div>
              `
              : ""
          }

        </td>


        <td>

          <span class="badge badge-blue">
            ${escapeHTML(
              categoryName
            )}
          </span>

        </td>


        <td class="credit">
          ${creditHTML}
        </td>


        <td class="debit">
          ${debitHTML}
        </td>


        <td class="money">
          ${money(
            transaction.balance
          )}
        </td>


        <td>

          <div class="actions">

            <button
              type="button"
              class="action-btn"
              data-edit="${transaction.id}"
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              ✎
            </button>


            <button
              type="button"
              class="action-btn"
              data-delete="${transaction.id}"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              ×
            </button>

          </div>

        </td>

      </tr>

    `;
  }


  /* =======================================================
     RESULT COUNT
  ======================================================= */

  function updateResultCount(
    count
  ) {

    resultCount.textContent =
      `${count} transaction${
        count === 1
          ? ""
          : "s"
      }`;
  }


  /* =======================================================
     OPEN ADD FORM
  ======================================================= */

  function openAddForm() {

    editingId =
      null;


    form.reset();


    formDate.value =
      todayISO();


    document.querySelector(
      'input[name="type"][value="debit"]'
    ).checked =
      true;


    modalTitle.textContent =
      "Add Transaction";


    saveButton.textContent =
      "Save Transaction";


    modal.classList.remove(
      "hidden"
    );


    modal.setAttribute(
      "aria-hidden",
      "false"
    );


    setTimeout(
      () =>
        formDescription.focus(),
      50
    );
  }


  /* =======================================================
     OPEN EDIT FORM
  ======================================================= */

  async function openEditForm(
    id
  ) {

    try {

      const response =
        await apiRequest(
          `/transactions/${id}`
        );


      const transaction =
        extractObject(
          response
        );


      if (!transaction) {

        throw new Error(
          "Transaction not found."
        );
      }


      editingId =
        Number(id);


      formDate.value =
        String(
          transaction.date || ""
        ).slice(
          0,
          10
        );


      formDescription.value =
        transaction.description ||
        "";


      formAmount.value =
        transaction.amount ??
        (
          transaction.credit ||
          transaction.debit ||
          ""
        );


      formNotes.value =
        transaction.notes ||
        "";


      const categoryId =
        transaction.categoryId ??
        transaction.category_id ??
        "";


      formCategory.value =
        String(
          categoryId
        );


      const transactionType =
        transaction.type ||
        (
          Number(
            transaction.credit || 0
          ) > 0
            ? "credit"
            : "debit"
        );


      const radio =
        document.querySelector(
          `input[name="type"][value="${transactionType}"]`
        );


      if (radio) {
        radio.checked = true;
      }


      modalTitle.textContent =
        "Edit Transaction";


      saveButton.textContent =
        "Update Transaction";


      modal.classList.remove(
        "hidden"
      );


      modal.setAttribute(
        "aria-hidden",
        "false"
      );


      setTimeout(
        () =>
          formDescription.focus(),
        50
      );


    } catch (error) {

      console.error(
        "Edit transaction error:",
        error
      );


      showToast(
        "Unable to edit",
        error.message,
        "danger"
      );
    }
  }


  /* =======================================================
     CLOSE FORM
  ======================================================= */

  function closeForm() {

    modal.classList.add(
      "hidden"
    );


    modal.setAttribute(
      "aria-hidden",
      "true"
    );


    editingId =
      null;


    form.reset();
  }


  /* =======================================================
     SAVE TRANSACTION
  ======================================================= */

  async function saveTransaction(
    event
  ) {

    event.preventDefault();


    const date =
      formDate.value;


    const description =
      formDescription.value.trim();


    const categoryId =
      formCategory.value;


    const amount =
      Number(
        formAmount.value
      );


    const type =
      document.querySelector(
        'input[name="type"]:checked'
      )?.value;


    const notes =
      formNotes.value.trim();


    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!date) {

      showToast(
        "Invalid date",
        "Please select a transaction date.",
        "danger"
      );

      return;
    }


    if (!description) {

      showToast(
        "Description required",
        "Enter a description for this transaction.",
        "danger"
      );

      formDescription.focus();

      return;
    }


    if (!categoryId) {

      showToast(
        "Category required",
        "Please select a category.",
        "danger"
      );

      return;
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      showToast(
        "Invalid amount",
        "Amount must be greater than zero.",
        "danger"
      );

      formAmount.focus();

      return;
    }


    if (
      type !== "credit" &&
      type !== "debit"
    ) {

      showToast(
        "Transaction type required",
        "Select Credit or Debit.",
        "danger"
      );

      return;
    }


    const payload = {

      date,

      description,

      categoryId:
        Number(categoryId),

      type,

      amount,

      notes
    };


    try {

      setButtonLoading(
        saveButton,
        true,
        editingId
          ? "Updating..."
          : "Saving...",
        editingId
          ? "Update Transaction"
          : "Save Transaction"
      );


      if (editingId) {

        await apiRequest(
          `/transactions/${editingId}`,
          {
            method: "PUT",

            body:
              JSON.stringify(
                payload
              )
          }
        );


        showToast(
          "Transaction updated",
          "The transaction was updated successfully."
        );

      } else {

        await apiRequest(
          "/transactions",
          {
            method: "POST",

            body:
              JSON.stringify(
                payload
              )
          }
        );


        showToast(
          "Transaction added",
          "The transaction was saved to PostgreSQL."
        );
      }


      closeForm();


      await loadTransactions();


    } catch (error) {

      console.error(
        "Save transaction error:",
        error
      );


      showToast(
        "Unable to save transaction",
        error.message,
        "danger"
      );


    } finally {

      setButtonLoading(
        saveButton,
        false,
        "",
        editingId
          ? "Update Transaction"
          : "Save Transaction"
      );
    }
  }


  /* =======================================================
     DELETE TRANSACTION
  ======================================================= */

  async function deleteTransaction(
    id
  ) {

    const transaction =
      transactions.find(
        item =>
          Number(item.id) ===
          Number(id)
      );


    const description =
      transaction?.description ||
      "this transaction";


    const confirmed =
      window.confirm(
        `Delete "${description}"?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      await apiRequest(
        `/transactions/${id}`,
        {
          method: "DELETE"
        }
      );


      showToast(
        "Transaction deleted",
        "The transaction was removed from PostgreSQL.",
        "danger"
      );


      await loadTransactions();


    } catch (error) {

      console.error(
        "Delete transaction error:",
        error
      );


      showToast(
        "Unable to delete",
        error.message,
        "danger"
      );
    }
  }


  /* =======================================================
     TABLE BUTTONS
  ======================================================= */

  function handleTableClick(
    event
  ) {

    const editButton =
      event.target.closest(
        "[data-edit]"
      );


    const deleteButton =
      event.target.closest(
        "[data-delete]"
      );


    if (editButton) {

      openEditForm(
        editButton.dataset.edit
      );

      return;
    }


    if (deleteButton) {

      deleteTransaction(
        deleteButton.dataset.delete
      );
    }
  }


  /* =======================================================
     FILTER EVENTS
  ======================================================= */

  function handleSearch() {

    clearTimeout(
      searchTimer
    );


    searchTimer =
      setTimeout(
        () => {

          loadTransactions();

        },
        350
      );
  }


  function handleFilterChange() {

    loadTransactions();
  }


  /* =======================================================
     MODAL EVENTS
  ======================================================= */

  function handleModalClick(
    event
  ) {

    if (
      event.target ===
      modal
    ) {

      closeForm();
    }
  }


  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  function openSidebar() {

    sidebar?.classList.add(
      "open"
    );

    overlay?.classList.add(
      "show"
    );
  }


  function closeSidebar() {

    sidebar?.classList.remove(
      "open"
    );

    overlay?.classList.remove(
      "show"
    );
  }


  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleKeyboard(
    event
  ) {

    if (
      event.key === "Escape"
    ) {

      if (
        modal &&
        !modal.classList.contains(
          "hidden"
        )
      ) {

        closeForm();

      } else {

        closeSidebar();

      }
    }
  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================= */

  addButton?.addEventListener(
    "click",
    openAddForm
  );


  addButtonSecondary?.addEventListener(
    "click",
    openAddForm
  );


  cancelButton?.addEventListener(
    "click",
    closeForm
  );


  closeModalButton?.addEventListener(
    "click",
    closeForm
  );


  form?.addEventListener(
    "submit",
    saveTransaction
  );


  table?.addEventListener(
    "click",
    handleTableClick
  );


  modal?.addEventListener(
    "click",
    handleModalClick
  );


  search?.addEventListener(
    "input",
    handleSearch
  );


  categoryFilter?.addEventListener(
    "change",
    handleFilterChange
  );


  typeFilter?.addEventListener(
    "change",
    handleFilterChange
  );


  fromDate?.addEventListener(
    "change",
    handleFilterChange
  );


  toDate?.addEventListener(
    "change",
    handleFilterChange
  );


  menuButton?.addEventListener(
    "click",
    openSidebar
  );


  overlay?.addEventListener(
    "click",
    closeSidebar
  );


  document.addEventListener(
    "keydown",
    handleKeyboard
  );


  /* =======================================================
     INITIALIZATION
  ======================================================= */

  async function initialize() {

    try {

      await loadCategories();

      await loadTransactions();


      if (
        window.location.hash ===
        "#add"
      ) {

        openAddForm();
      }


    } catch (error) {

      console.error(
        "Initialization error:",
        error
      );
    }
  }


  initialize();

});