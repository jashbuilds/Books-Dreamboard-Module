const bookName = document.getElementById("bookName");
const bookPDF = document.getElementById("bookPdf");
const bookCategory = document.getElementById("bookType");

const booksGrid = document.getElementById("booksGrid");
const submitBtn = document.getElementById("submitBtn");

const addBookModal = document.getElementById("addBook");
const addBookForm = document.getElementById("bookForm");

var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

let currentDisplayBooks = [];
const availableBooks = [];

// Logic to Toggle Sidebar with Responsive View.
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleBtn = document.getElementById("sidebarCollapseBtn");

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", () => {
      const isMobileView = window.innerWidth < 992;

      if (isMobileView) {
        sidebar.classList.toggle("mobile-active");
      } else {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      sidebar.classList.remove("mobile-active");
    }
  });

  document.addEventListener("click", (event) => {
    const isMobile = window.innerWidth < 992;

    if (isMobile && sidebar.classList.contains("mobile-active")) {
      const clickInsideSidebar = sidebar.contains(event.target);
      const clickOnToggleButton = sidebarToggleBtn.contains(event.target);

      if (!clickInsideSidebar && !clickOnToggleButton) {
        sidebar.classList.remove("mobile-active");
      }
    }
  });
});

// Function to generate Random book IDs.
const randomId = () => {
  return Math.floor(Math.random() * 1000);
};

const getBooksInfo = async () => {
  // const books = await db.books.toArray()
  currentDisplayBooks = await db.books.toArray()
  console.log(currentDisplayBooks);
}
getBooksInfo().then(() => renderBooks(currentDisplayBooks))

const renderBooks = (data) => {
  // const books = await db.books.toArray();

  booksGrid.innerHTML = data
    .map(
      (book) =>
        `
                            <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                                <div
                                    class="card booksCard shadow border-5 ${book.category === "Self-help" ? "border-primary" : book.category === "Finance" ? "border-success" : book.category === "Fiction" ? "border-danger" : book.category === "Historical" ? "border-secondary" : book.category === "Sci-Fi" ? "border-warning" : ""}  border-start border-bottom-0 border-top-0 border-end-0 rounded-3">
                                    <div class="card-body">
                                        <div
                                            class="d-flex mb-2 justify-content-between align-items-center">
                                            <p
                                                class="card-title text-nowrap h5 w-100 ${book.category === "Self-help" ? "text-primary" : book.category === "Finance" ? "text-success" : book.category === "Fiction" ? "text-danger" : book.category === "Historical" ? "text-secondary" : book.category === "Sci-Fi" ? "text-warning" : ""} m-0">${book.category}</p>
                                            <div class="dropdown">
                                                <img id="actionDropdown"
                                                    src="../Icons/three-dots-vertical.svg"
                                                    class="dropdown-toggle cursor-pointer"
                                                    alt="action-menu"
                                                    data-bs-offset="0,5"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false">
                                                <ul
                                                    class="dropdown-menu"
                                                    id="actionButtons">
                                                    <li><a
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
                                        <p class="fw-light fs-5">${book.name}</p>
                                    </div>
                                </div>
                            </div>`,
    )
    .join("");
};
// renderBooks(currentDisplayBooks)


const filterBooks = () => {
  const selectedCategory = document.getElementById("bookType").value;
  const filteredBooks = currentDisplayBooks.filter(book => {
    const bookFilter = selectedCategory === "" || book.category === selectedCategory
    return bookFilter
  })
  console.log(filteredBooks);
  
  currentDisplayBooks = filteredBooks
  renderBooks(filteredBooks)
};

addBookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await db.books.add({
    name: bookName.value,
    category: bookCategory.value,
    file: bookPDF.files[0],
  });

  const modal = bootstrap.Modal.getInstance(addBookModal);

  addBookForm.reset();
  modal.hide();
  renderBooks();
});

addBookModal.addEventListener("hidden.bs.modal", () => {
  bookName.value = "";
  bookCategory.value = "";
  bookPDF.value = "";

  submitBtn.disabled = true;
});

// Logic to Validate Form Input fields.
const validateFormInput = () => {
  const isFormValid =
    bookName.value.trim() !== "" &&
    bookPDF.value !== "" &&
    bookCategory.value.trim() !== "";

  submitBtn.disabled = !isFormValid;
};
