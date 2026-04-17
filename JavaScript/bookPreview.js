var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
);

const pdfContainer = document.getElementById("pdfContainer");
const bookNameEl = document.getElementById("bookName");
const pageInput = document.getElementById("currentPageNum");
const pageCountEl = document.getElementById("pageCount");
const pageSizeOption = document.getElementById("pageSizeOption");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const bookId = localStorage.getItem("selectedBookId");

let pdfDoc = null;
let currentPage = 1;
let scale = 0.7;

async function loadBook() {
  if (!bookId) {
    document.body.innerHTML = "<h2>No book selected</h2>";
    return;
  }

  const book = await db.books.get(Number(bookId));

  if (!book) {
    document.body.innerHTML = "<h2>Book not found</h2>";
    return;
  }

  bookNameEl.innerText = book.name;

  const arrayBuffer = await book.file.arrayBuffer();

  loadPDF(arrayBuffer);
}

loadBook();

async function loadPDF(data) {
  pdfDoc = await pdfjsLib.getDocument({ data }).promise;

  pageCountEl.textContent = pdfDoc.numPages;

  pageInput.max = pdfDoc.numPages;

  for (let pageN = 1; pageN <= pdfDoc.numPages; pageN++) {
    renderPage(pageN);
  }
}

async function renderPage(pageNum) {
  pdfContainer.innerHTML = "";

  const page = await pdfDoc.getPage(pageNum);

  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  canvas.classList.add("d-block", "mx-auto");

  pdfContainer.appendChild(canvas);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  pageInput.value = currentPage;
}

const prevPage = () => {
  if (currentPage <= 1) return;

  currentPage--;

  renderPage(currentPage);
};

const nextPage = () => {
  if (currentPage >= pdfDoc.numPages) return;
  currentPage++;
  renderPage(currentPage);
};

pageInput.addEventListener("change", () => {
  const pageInputVal = Number(pageInput.value);
  if (pageInputVal <= pdfDoc.numPages) {
    currentPage = pageInputVal;
    renderPage(currentPage);
  }
});

const toFirstPage = () => {
  const firstPage = (pdfDoc.numPages - pdfDoc.numPages) + 1;
  currentPage = firstPage;
  renderPage(firstPage);
};

const toLastPage = () => {
  const lastPage = pdfDoc.numPages;
  currentPage = lastPage;
  renderPage(currentPage);
};

const zoomOut = () => {
  scale -= 0.1;
  renderPage(currentPage);

  pageSizeOption.value = "";
};

const zoomIn = () => {
  scale += 0.1;
  renderPage(currentPage);

  pageSizeOption.value = "";
};

const setPageSize = () => {
  if (pageSizeOption.value === "Page-Fit") {
    scale = 1;
  } else if (pageSizeOption.value === "Zoom-In") {
    scale = 1.5;
  } else if (pageSizeOption.value === "Zoom-Out") {
    scale = 0.5;
  }
  renderPage(currentPage);
};

// Validate Number Input (no "dash", "e", "+" allowed)
const validateNumberInput = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
};
