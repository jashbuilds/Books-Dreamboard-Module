const bookName = document.getElementById("bookName");
const bookPDF = document.getElementById("bookPdf");
const bookType = document.getElementById("bookType");

const bookCategory = document.getElementById("categoryFilter");

const booksGrid = document.getElementById("booksGrid");
const submitBtn = document.getElementById("submitBtn");

const addBookModal = document.getElementById("addBook");
const addBookForm = document.getElementById("bookForm");

var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

let books;
const renderBooks = async (category = "All") => {
  if (category === "All") {
    books = await db.books.toArray();
  } else {
    books = await db.books.where("category").equals(category).toArray();
  }

  if (books.length === 0 && booksGrid) {
    booksGrid.innerHTML =
      "<p class='fw-medium d-flex h4 justify-content-center align-items-center mx-auto'>No books found!</p>";
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
                                            <div class="dropdown">
                                                <img id="actionDropdown"
                                                    src="../Icons/three-dots-vertical.svg"
                                                    class="dropdown-toggle"
                                                    alt="action-menu"
                                                    data-bs-offset="0,5"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false">
                                                <ul
                                                    class="dropdown-menu"
                                                    id="actionButtons">
                                                    <li><a onclick="openBook('${book.id}')"
                                                            class="dropdown-item d-flex justify-content-start align-items-center gap-2"
                                                            href="#"><img
                                                                src="../Icons/preview-icon.svg"
                                                                alt="preview"
                                                                width="20"
                                                                height="20">
                                                            Preview</a></li>
                                                    <li><a
                                                            class="dropdown-item d-flex justify-content-start align-items-center gap-2"
                                                            href="#"><img
                                                                src="../Icons/delete-icon.svg"
                                                                alt="delete"
                                                                width="20"
                                                                height="20">Delete</a></li>
                                                </ul>
                                            </div>

                                        </div>
                                    </div>
                                    <div class="card-body px-3 py-0" onclick="openBook('${book.id}')">
                                        <p class="fw-medium fs-5">${book.name}</p>
                                    </div>
                                    <div class="card-footer infoBtn border-top-0 bg-transparent py-2 px-3 justify-content-end align-items-center">
                                      <img src="../Icons/info-circle-fill.svg" alt="info-icon" width="16" height="16" data-bs-toggle="tooltip"
                        data-bs-placement="left" data-bs-title="Book Name: ${book.name}, Book Category: ${book.category}"/>
                                    </div>
                                </div>
                            </div>`,
      )
      .join("");
  }

  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
  );
};
renderBooks();

const filterBooks = () => {
  const selectedCategory = bookCategory.value;
  renderBooks(selectedCategory);
};

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
});

addBookModal?.addEventListener("hidden.bs.modal", () => {
  bookName.value = "";
  bookCategory.value = "All";
  bookPDF.value = "";

  submitBtn.disabled = true;
  renderBooks();
});

// Logic to Validate Form Input fields.
const validateFormInput = () => {
  const isFormValid =
    bookName.value.trim() !== "" &&
    bookPDF.value !== "" &&
    bookType.value.trim() !== "";

  submitBtn.disabled = !isFormValid;
};

const openBook = (id) => {
  localStorage.setItem("selectedBookId", id)
  window.location.href = "../HTML/bookPreview.html"
}


