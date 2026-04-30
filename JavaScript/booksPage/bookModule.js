// DOM Elements
const bookName = document.getElementById("bookName");
const bookPDF = document.getElementById("bookPdf");
const bookType = document.getElementById("bookType");

const bookCategory = document.getElementById("categoryFilter");

const booksGrid = document.getElementById("booksGrid");
const submitBtn = document.getElementById("submitBtn");

const addBookModal = document.getElementById("addBook");
const addBookForm = document.getElementById("bookForm");

let books;
let selectedBookId = null;

submitBtn.disabled = true;

// Initialize Dexie database
var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

// Function to render books based on selected category
const renderBooks = async (category = "All") => {
  if (category === "All") {
    books = await db.books.toArray();
  } else {
    books = await db.books.where("category").equals(category).toArray();
  }

  if (books.length === 0 && booksGrid) {
    booksGrid.innerHTML = `
    <div class='d-flex flex-column justify-content-center align-items-center mx-auto vh-50 text-center'>
      <p class="fw-medium text-secondary fs-5 m-0">No Books Found!</p>
    </div>`
    return;
  }

  if (booksGrid) {
    booksGrid.innerHTML = books
      .map(
        (book) =>
          `<div class="col-xl-2 col-lg-3 col-sm-4 col-6">
                                <div 
                                    class="card booksCard shadow cursor-pointer border-5 border-primary border-start border-bottom-0 border-top-0 border-end-0 rounded-3">
                                    <div class="card-header bg-transparent border-bottom-0 align-content-center">
                                        <div
                                            class="d-flex py-1 justify-content-between align-items-center">
                                            <p
                                                class="card-title text-wrap h5 w-100 m-0 fw-semibold overflow-hidden ${book.category === "Self-help" ? "text-primary" : book.category === "Finance" ? "text-success" : book.category === "Fiction" ? "text-danger" : book.category === "Historical" ? "text-secondary" : book.category === "Sci-Fi" ? "text-warning" : ""} ">${book.category}</p>
                                            <div class="dropdown rounded-circle">
                                                <img
                                                    src="../../Icons/three-dots-vertical.svg"
                                                    class="dropdown-toggle"
                                                    alt="action-menu"
                                                    data-bs-offset="0,5"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false">
                                                <ul
                                                    class="dropdown-menu">
                                                    <li><button onclick="openBook('${book.id}')"
                                                            class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                                src="../../Icons/preview-icon.svg"
                                                                alt="preview"
                                                                width="20"
                                                                height="20">
                                                            Preview</button></li>
                                                    <li><button onclick="openDeleteModal(${book.id})" data-bs-toggle="modal" data-bs-target="#deleteModal"
                                                            class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                                src="../../Icons/delete-icon.svg"
                                                                alt="delete"
                                                                width="20"
                                                                height="20">Delete</button></li>
                                                </ul>
                                            </div>

                                        </div>
                                    </div>
                                    <div class="card-body px-3 py-0" onclick="openBook('${book.id}')">
                                        <p class="fw-medium fs-5">${book.name}</p>
                                    </div>
                                    <div class="card-footer infoBtn border-top-0 bg-transparent py-2 px-3 justify-content-end align-items-center">
                                      <img src="../../Icons/info-circle-fill.svg" alt="info-icon" width="16" height="16" data-bs-toggle="tooltip" data-bs-title="${book.name}" data-bs-placement="left"/>
                                    </div>
                                </div>
                            </div>`,
      )
      .join("");
  }

  attachDropdownCloseLogic();

  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  [...tooltipTriggerList].map((tooltipTriggerEl) => {
    tooltipTriggerEl.addEventListener("show.bs.tooltip", (e) => {
      const sidebar = document.getElementById("sidebar");
      if (
        sidebar &&
        sidebar.contains(tooltipTriggerEl) &&
        !sidebar.classList.contains("collapsed")
      ) {
        e.preventDefault();
      }
    });
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
};
renderBooks();

// Event listener for category filter change
const filterBooks = () => {
  const selectedCategory = bookCategory.value;
  renderBooks(selectedCategory);
};

// Event listener for form submission to add a new book
addBookForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await db.books.add({
    name: bookName.value,
    category: bookType.value,
    file: bookPDF.files[0],
  });

  const modal = bootstrap.Modal.getInstance(addBookModal);

  addBookForm.reset();
  modal.hide();
  renderBooks();
  showAcknowledgeToast("Book added successfully!");
});

// Event listener to reset form and validation states when the modal is closed
addBookModal?.addEventListener("hidden.bs.modal", () => {
  bookName.value = "";
  bookCategory.value = "All";
  bookPDF.value = "";
  bookName.classList.remove("is-invalid");
  bookPDF.classList.remove("is-invalid");

  submitBtn.disabled = true;
  renderBooks();
});

// Logic to validate book name input field.
const validateName = () => {
  if (/^\s|\d+/.test(bookName.value) || bookName.value === "") {
    bookName.classList.add("is-invalid");
    submitBtn.disabled = true;
  } else {
    bookName.classList.remove("is-invalid");
  }
};

// Logic to Validate Form Input fields.
function validateFormInput() {
  const isFormValid =
    bookName.value.trim() !== "" &&
    bookPDF.value !== "" &&
    isValidPDF(bookPDF.files[0]);

  submitBtn.disabled = !isFormValid;
}

// Function to open book preview page with selected book's ID stored in localStorage
const openBook = (id) => {
  localStorage.setItem("selectedBookId", id);
  window.location.href = "../../HTML/Books/bookPreview.html";
};

// Function to open delete confirmation modal and store selected book's ID for deletion
const openDeleteModal = (id) => {
  selectedBookId = id;
};

// Function to confirm deletion of the selected book and update the UI accordingly
const confirmDelete = async () => {
  if (!selectedBookId) return;

  await db.books.delete(selectedBookId);
  selectedBookId = null;
  renderBooks();
  showAcknowledgeToast("Book deleted successfully!");
};

// Function to show acknowledgment toast with customizable message and background color
const showAcknowledgeToast = (message, background = "text-bg-success") => {
  const toastContainer = document.getElementById("notificationToast");
  const toastBody = toastContainer.querySelector(".toast-message");

  toastBody.textContent = message;
  toastContainer.classList.add(background);

  const toast = new bootstrap.Toast(toastContainer);
  toast.show();
};

// Function to validate the selected file type for book PDF input
function validateFileType() {
  const file = bookPDF.files[0];

  if (!isValidPDF(file)) {
    bookPDF.classList.add("is-invalid");
    submitBtn.disabled = true;
    return;
  } else {
    bookPDF.classList.remove("is-invalid");
  }

  validateFormInput();
}

// Function to attach logic for closing dropdowns when mouse leaves card
const attachDropdownCloseLogic = () => {
  const cards = document.querySelectorAll(".booksCard");

  cards.forEach((card) => {
    card.addEventListener("mouseleave", () => {
      const toggle = card.querySelector('[data-bs-toggle="dropdown"]');

      if (toggle) {
        const instance = bootstrap.Dropdown.getInstance(toggle);
        if (instance) instance.hide();
      }
    });
  });
};

// Utility function to check if the selected file is a valid PDF
function isValidPDF(file) {
  return file && file.type === "application/pdf";
}