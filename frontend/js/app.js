/* =========================================================
   HOUSELEDGER
   SHARED FRONTEND APPLICATION
   ========================================================= */

const HouseExpense = (() => {

  const API_BASE_URL = "https://house-expense-gdlf.onrender.com";


  /* =======================================================
     API REQUEST
     ======================================================= */

  async function apiRequest(
    endpoint,
    options = {}
  ) {

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      }
    );


    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {

      throw new Error(
        data?.message ||
        `Request failed with status ${response.status}`
      );
    }


    return data;
  }


  /* =======================================================
     DASHBOARD
     ======================================================= */

  async function getDashboard() {

    return apiRequest(
      "/api/dashboard"
    );
  }


  /* =======================================================
     CATEGORIES
     ======================================================= */

  async function getCategories() {

    return apiRequest(
      "/api/categories"
    );
  }


  async function getCategory(
    id
  ) {

    return apiRequest(
      `/api/categories/${id}`
    );
  }


  async function createCategory(
    data
  ) {

    return apiRequest(
      "/api/categories",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }


  async function updateCategory(
    id,
    data
  ) {

    return apiRequest(
      `/api/categories/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
  }


  async function deleteCategory(
    id
  ) {

    return apiRequest(
      `/api/categories/${id}`,
      {
        method: "DELETE"
      }
    );
  }


  /* =======================================================
     TRANSACTIONS
     ======================================================= */

  async function getTransactions(
    query = ""
  ) {

    const endpoint =
      query
        ? `/api/transactions?${query}`
        : "/api/transactions";

    return apiRequest(
      endpoint
    );
  }


  async function getTransaction(
    id
  ) {

    return apiRequest(
      `/api/transactions/${id}`
    );
  }


  async function createTransaction(
    data
  ) {

    return apiRequest(
      "/api/transactions",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }


  async function updateTransaction(
    id,
    data
  ) {

    return apiRequest(
      `/api/transactions/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
  }


  async function deleteTransaction(
    id
  ) {

    return apiRequest(
      `/api/transactions/${id}`,
      {
        method: "DELETE"
      }
    );
  }


  /* =======================================================
     EXPORT DATA
     ======================================================= */

  async function getExportData(
    query = ""
  ) {

    const endpoint =
      query
        ? `/api/export/data?${query}`
        : "/api/export/data";

    return apiRequest(
      endpoint
    );
  }


  /* =======================================================
     MONEY FORMAT
     ======================================================= */

  function formatMoney(
    value
  ) {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(
      Number(value) || 0
    );
  }


  /* =======================================================
     NUMBER FORMAT
     ======================================================= */

  function formatNumber(
    value
  ) {

    return new Intl.NumberFormat(
      "en-IN"
    ).format(
      Number(value) || 0
    );
  }


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  function formatDate(
    value
  ) {

    if (!value) {
      return "-";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);
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


  /* =======================================================
     TOAST
     ======================================================= */

  function showToast(
    title,
    message,
    type = "success"
  ) {

    let container =
      document.getElementById(
        "toastContainer"
      );


    if (!container) {

      container =
        document.createElement(
          "div"
        );

      container.id =
        "toastContainer";

      container.className =
        "toast-container";

      document.body.appendChild(
        container
      );
    }


    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      `toast toast-${type}`;


    toast.innerHTML = `
      <div class="toast-icon">
        ${
          type === "danger"
            ? "!"
            : type === "info"
              ? "i"
              : "✓"
        }
      </div>

      <div class="toast-content">
        <strong>
          ${title}
        </strong>

        <span>
          ${message}
        </span>
      </div>

      <button
        class="toast-close"
        aria-label="Close"
      >
        ×
      </button>
    `;


    container.appendChild(
      toast
    );


    toast
      .querySelector(
        ".toast-close"
      )
      .addEventListener(
        "click",
        () => {
          toast.remove();
        }
      );


    setTimeout(
      () => {

        if (
          toast.parentElement
        ) {
          toast.remove();
        }

      },
      4000
    );
  }


  /* =======================================================
     CONFIRMATION
     ======================================================= */

  function confirmAction(
    message
  ) {

    return window.confirm(
      message
    );
  }


  /* =======================================================
     MOBILE SIDEBAR
     ======================================================= */

  function initSidebar() {

    const menuButton =
      document.querySelector(
        ".menu-btn"
      );

    const sidebar =
      document.querySelector(
        ".sidebar"
      );

    const overlay =
      document.querySelector(
        ".overlay"
      );


    if (
      !menuButton ||
      !sidebar
    ) {
      return;
    }


    function closeSidebar() {

      sidebar.classList.remove(
        "open"
      );

      if (overlay) {
        overlay.classList.remove(
          "show"
        );
      }
    }


    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );

        if (overlay) {
          overlay.classList.toggle(
            "show"
          );
        }
      }
    );


    if (overlay) {

      overlay.addEventListener(
        "click",
        closeSidebar
      );
    }


    document
      .querySelectorAll(
        ".nav-link"
      )
      .forEach(
        link => {

          link.addEventListener(
            "click",
            closeSidebar
          );

        }
      );
  }


  /* =======================================================
     ACTIVE SIDEBAR
     ======================================================= */

  function initActivePage() {

    const page =
      document.body.dataset.page;


    if (!page) {
      return;
    }


    document
      .querySelectorAll(
        ".nav-link"
      )
      .forEach(
        link => {

          if (
            link.dataset.page ===
            page
          ) {

            link.classList.add(
              "active"
            );

          } else {

            link.classList.remove(
              "active"
            );
          }

        }
      );
  }


  /* =======================================================
     GLOBAL INITIALIZATION
     ======================================================= */

  function init() {

    initSidebar();
    initActivePage();
  }


  /* =======================================================
     PUBLIC API
     ======================================================= */

  return {

    API_BASE_URL,

    apiRequest,

    getDashboard,

    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,

    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,

    getExportData,

    formatMoney,
    formatNumber,
    formatDate,

    showToast,
    confirmAction,

    init
  };

})();


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    HouseExpense.init();

  }
);