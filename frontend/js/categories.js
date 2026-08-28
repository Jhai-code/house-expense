/* =========================================================
   HOUSE EXPENSE TRACKER
   CATEGORIES PAGE
   PostgreSQL API VERSION
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

const CATEGORY_API =
  "http://localhost:3000/api/categories";


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const categoryRows =
      document.querySelector(
        "#categoryRows"
      );

    const searchInput =
      document.querySelector(
        "#categorySearch"
      );

    const modal =
      document.querySelector(
        "#categoryModal"
      );

    const form =
      document.querySelector(
        "#categoryForm"
      );

    const modalTitle =
      document.querySelector(
        "#modalTitle"
      );

    const categoryName =
      document.querySelector(
        "#categoryName"
      );

    const categoryDescription =
      document.querySelector(
        "#categoryDescription"
      );

    const saveButton =
      document.querySelector(
        "#saveCategoryBtn"
      );

    const cancelButton =
      document.querySelector(
        "#cancelCategoryBtn"
      );

    const closeButton =
      document.querySelector(
        "#closeModalBtn"
      );


    let categories = [];

    let editingId = null;



    /* =====================================================
       MONEY FORMATTER
    ===================================================== */

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



    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    }



    /* =====================================================
       SHOW TOAST
    ===================================================== */

    function toast(
      title,
      message,
      type = "success"
    ) {

      if (
        typeof HouseExpense !==
        "undefined" &&
        HouseExpense.showToast
      ) {

        HouseExpense.showToast(
          title,
          message,
          type
        );

        return;
      }


      alert(
        `${title}\n\n${message}`
      );

    }



    /* =====================================================
       DATABASE CONNECTION STATUS
    ===================================================== */

    function setConnectionStatus(
      connected
    ) {

      const element =
        document.querySelector(
          "#connectionStatus"
        );

      if (!element) {
        return;
      }


      if (connected) {

        element.textContent =
          "Database connected";

      } else {

        element.textContent =
          "Database unavailable";

      }

    }



    /* =====================================================
       LOAD CATEGORIES
    ===================================================== */

    async function loadCategories() {

      try {

        showLoading();


        const response =
          await fetch(
            CATEGORY_API
          );


        if (!response.ok) {

          throw new Error(
            `Server returned ${response.status}`
          );

        }


        const result =
          await response.json();


        if (
          !result.success
        ) {

          throw new Error(
            result.message ||
            "Unable to load categories."
          );

        }


        categories =
          Array.isArray(
            result.data
          )
            ? result.data
            : [];


        setConnectionStatus(
          true
        );


        updateSummary();


        renderCategories(
          categories
        );


      } catch (error) {

        console.error(
          "Category loading error:",
          error
        );


        setConnectionStatus(
          false
        );


        categoryRows.innerHTML = `

          <tr>

            <td colspan="7">

              <div class="empty">

                <div class="empty-icon">
                  !
                </div>

                <strong>
                  Unable to load categories
                </strong>

                <span>
                  Make sure your backend server
                  is running on port 3000.
                </span>

                <button
                  type="button"
                  class="secondary-btn"
                  id="retryCategoriesBtn"
                  style="margin-top:16px;"
                >
                  Try Again
                </button>

              </div>

            </td>

          </tr>

        `;


        document
          .querySelector(
            "#retryCategoriesBtn"
          )
          ?.addEventListener(
            "click",
            loadCategories
          );

      }

    }



    /* =====================================================
       LOADING STATE
    ===================================================== */

    function showLoading() {

      categoryRows.innerHTML = `

        <tr>

          <td colspan="7">

            <div class="loading-state">

              <div class="loading-spinner"></div>

              <strong>
                Loading categories...
              </strong>

              <span>
                Getting your categories from PostgreSQL.
              </span>

            </div>

          </td>

        </tr>

      `;

    }



    /* =====================================================
       UPDATE SUMMARY CARDS
    ===================================================== */

    function updateSummary() {

      const total =
        categories.length;


      const active =
        categories.filter(
          category =>
            category.isActive
        ).length;


      const spending =
        categories.reduce(
          (
            total,
            category
          ) => {

            return (
              total +
              Number(
                category.totalSpent || 0
              )
            );

          },
          0
        );


      const received =
        categories.reduce(
          (
            total,
            category
          ) => {

            return (
              total +
              Number(
                category.totalReceived || 0
              )
            );

          },
          0
        );


      document.querySelector(
        "#totalCategories"
      ).textContent =
        total;


      document.querySelector(
        "#activeCategories"
      ).textContent =
        active;


      document.querySelector(
        "#totalSpending"
      ).textContent =
        money(spending);


      document.querySelector(
        "#totalReceived"
      ).textContent =
        money(received);

    }



    /* =====================================================
       RENDER CATEGORIES
    ===================================================== */

    function renderCategories(
      list
    ) {

      if (!list.length) {

        categoryRows.innerHTML = `

          <tr>

            <td colspan="7">

              <div class="empty">

                <div class="empty-icon">
                  ▦
                </div>

                <strong>
                  No categories found
                </strong>

                <span>
                  Create your first category
                  to start organizing expenses.
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


      categoryRows.innerHTML =
        list
          .map(
            category => {

              const active =
                Boolean(
                  category.isActive
                );


              const transactionCount =
                Number(
                  category.transactionCount ||
                  0
                );


              return `

                <tr>

                  <!-- CATEGORY -->

                  <td>

                    <div class="category-name-cell">

                      <div class="category-avatar">
                        ${escapeHtml(
                          category.name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div>

                        <strong>
                          ${escapeHtml(
                            category.name
                          )}
                        </strong>

                        <span class="small muted">
                          Category #${category.id}
                        </span>

                      </div>

                    </div>

                  </td>


                  <!-- DESCRIPTION -->

                  <td>

                    <span
                      class="category-description"
                    >
                      ${
                        category.description
                          ? escapeHtml(
                              category.description
                            )
                          : "No description"
                      }
                    </span>

                  </td>


                  <!-- TRANSACTION COUNT -->

                  <td>

                    <strong>
                      ${transactionCount}
                    </strong>

                    <div class="small muted">
                      ${
                        transactionCount === 1
                          ? "transaction"
                          : "transactions"
                      }
                    </div>

                  </td>


                  <!-- SPENT -->

                  <td>

                    <span class="debit">
                      ${money(
                        category.totalSpent
                      )}
                    </span>

                  </td>


                  <!-- RECEIVED -->

                  <td>

                    <span class="credit">
                      ${money(
                        category.totalReceived
                      )}
                    </span>

                  </td>


                  <!-- STATUS -->

                  <td>

                    ${
                      active
                        ? `
                          <span class="status-badge active">
                            <i></i>
                            Active
                          </span>
                        `
                        : `
                          <span class="status-badge inactive">
                            <i></i>
                            Inactive
                          </span>
                        `
                    }

                  </td>


                  <!-- ACTIONS -->

                  <td>

                    <div class="actions">

                      <button
                        type="button"
                        class="action-btn"
                        data-edit="${category.id}"
                        title="Edit category"
                      >
                        ✎
                      </button>


                      <button
                        type="button"
                        class="action-btn"
                        data-delete="${category.id}"
                        title="${
                          transactionCount > 0
                            ? "Deactivate category"
                            : "Delete category"
                        }"
                      >
                        ×
                      </button>

                    </div>

                  </td>

                </tr>

              `;

            }
          )
          .join("");


      updateResultCount(
        list.length
      );

    }



    /* =====================================================
       RESULT COUNT
    ===================================================== */

    function updateResultCount(
      count
    ) {

      const element =
        document.querySelector(
          "#categoryResultCount"
        );


      if (!element) {
        return;
      }


      element.textContent =
        `${count} ${
          count === 1
            ? "category"
            : "categories"
        }`;

    }



    /* =====================================================
       SEARCH
    ===================================================== */

    function filterCategories() {

      const query =
        searchInput.value
          .trim()
          .toLowerCase();


      if (!query) {

        renderCategories(
          categories
        );

        return;

      }


      const filtered =
        categories.filter(
          category => {

            const name =
              String(
                category.name || ""
              ).toLowerCase();


            const description =
              String(
                category.description || ""
              ).toLowerCase();


            return (
              name.includes(query) ||
              description.includes(query)
            );

          }
        );


      renderCategories(
        filtered
      );

    }



    /* =====================================================
       OPEN CREATE MODAL
    ===================================================== */

    function openCreateModal() {

      editingId =
        null;


      form.reset();


      modalTitle.textContent =
        "Create Category";


      saveButton.textContent =
        "Create Category";


      modal.classList.remove(
        "hidden"
      );


      setTimeout(
        () => categoryName.focus(),
        100
      );

    }



    /* =====================================================
       OPEN EDIT MODAL
    ===================================================== */

    function openEditModal(
      id
    ) {

      const category =
        categories.find(
          item =>
            Number(item.id) ===
            Number(id)
        );


      if (!category) {

        toast(
          "Category not found",
          "The selected category could not be found.",
          "danger"
        );

        return;

      }


      editingId =
        Number(id);


      categoryName.value =
        category.name || "";


      categoryDescription.value =
        category.description || "";


      modalTitle.textContent =
        "Edit Category";


      saveButton.textContent =
        "Save Changes";


      modal.classList.remove(
        "hidden"
      );


      setTimeout(
        () => categoryName.focus(),
        100
      );

    }



    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeModal() {

      modal.classList.add(
        "hidden"
      );


      editingId =
        null;


      form.reset();

    }



    /* =====================================================
       CREATE / UPDATE
    ===================================================== */

    async function saveCategory(
      event
    ) {

      event.preventDefault();


      const name =
        categoryName.value
          .trim();


      const description =
        categoryDescription.value
          .trim();


      if (!name) {

        toast(
          "Category name required",
          "Please enter a category name.",
          "danger"
        );

        categoryName.focus();

        return;

      }


      if (name.length < 2) {

        toast(
          "Invalid category",
          "Category name must contain at least 2 characters.",
          "danger"
        );

        categoryName.focus();

        return;

      }


      if (name.length > 100) {

        toast(
          "Category name too long",
          "Category name cannot exceed 100 characters.",
          "danger"
        );

        return;

      }


      const isEditing =
        editingId !== null;


      const url =
        isEditing
          ? `${CATEGORY_API}/${editingId}`
          : CATEGORY_API;


      const method =
        isEditing
          ? "PUT"
          : "POST";


      const originalText =
        saveButton.textContent;


      saveButton.disabled =
        true;


      saveButton.textContent =
        isEditing
          ? "Saving..."
          : "Creating...";


      try {

        const response =
          await fetch(
            url,
            {
              method,

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  name,
                  description
                })
            }
          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(
            result.message ||
            "Unable to save category."
          );

        }


        toast(
          isEditing
            ? "Category updated"
            : "Category created",
          result.message ||
            "Category saved successfully."
        );


        closeModal();


        await loadCategories();


      } catch (error) {

        console.error(
          "Save category error:",
          error
        );


        toast(
          "Unable to save",
          error.message ||
            "Something went wrong while saving the category.",
          "danger"
        );


      } finally {

        saveButton.disabled =
          false;


        saveButton.textContent =
          originalText;

      }

    }



    /* =====================================================
       DELETE / DEACTIVATE
    ===================================================== */

    async function deleteCategory(
      id
    ) {

      const category =
        categories.find(
          item =>
            Number(item.id) ===
            Number(id)
        );


      if (!category) {
        return;
      }


      const hasTransactions =
        Number(
          category.transactionCount ||
          0
        ) > 0;


      const actionText =
        hasTransactions
          ? "deactivate"
          : "delete";


      const confirmed =
        confirm(
          hasTransactions
            ? `The category "${category.name}" is used by ${category.transactionCount} transaction(s).\n\nIt cannot be permanently deleted because existing transactions depend on it.\n\nDo you want to deactivate it?`
            : `Delete the category "${category.name}"?\n\nThis category has no transactions and can be permanently deleted.`
        );


      if (!confirmed) {
        return;
      }


      try {

        const response =
          await fetch(
            `${CATEGORY_API}/${id}`,
            {
              method: "DELETE"
            }
          );


        const result =
          await response.json();


        if (!response.ok) {

          throw new Error(
            result.message ||
            `Unable to ${actionText} category.`
          );

        }


        toast(
          hasTransactions
            ? "Category deactivated"
            : "Category deleted",
          result.message ||
            "Category operation completed successfully."
        );


        await loadCategories();


      } catch (error) {

        console.error(
          "Delete category error:",
          error
        );


        toast(
          "Operation failed",
          error.message ||
            "Unable to delete the category.",
          "danger"
        );

      }

    }



    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    document
      .querySelector(
        "#addCategoryBtn"
      )
      ?.addEventListener(
        "click",
        openCreateModal
      );


    cancelButton
      ?.addEventListener(
        "click",
        closeModal
      );


    closeButton
      ?.addEventListener(
        "click",
        closeModal
      );


    modal
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            modal
          ) {

            closeModal();

          }

        }
      );


    searchInput
      ?.addEventListener(
        "input",
        filterCategories
      );


    form
      ?.addEventListener(
        "submit",
        saveCategory
      );


    categoryRows
      ?.addEventListener(
        "click",
        event => {

          const editButton =
            event.target.closest(
              "[data-edit]"
            );


          const deleteButton =
            event.target.closest(
              "[data-delete]"
            );


          if (editButton) {

            openEditModal(
              Number(
                editButton.dataset.edit
              )
            );

            return;

          }


          if (deleteButton) {

            deleteCategory(
              Number(
                deleteButton.dataset.delete
              )
            );

          }

        }
      );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape" &&
          !modal.classList.contains(
            "hidden"
          )
        ) {

          closeModal();

        }

      }
    );


    /* =====================================================
       START
    ===================================================== */

    loadCategories();

  }
);