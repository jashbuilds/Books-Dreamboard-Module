var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

const pdfContainer = document.getElementById("pdfContainer");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const bookId = localStorage.getItem("selectedBookId");

let pdfDoc = null;
let currentPage = 1;
let bookPath = null;

async function loadBook() {
  if (!bookId) {
    document.body.innerHTML = "<h2>No book selected</h2>";
    return;
  }

  const book = await db.books.get(Number(bookId));
  bookPath = book.file

  if (!book) {
    document.body.innerHTML = "<h2>Book not found</h2>";
    return;
  }

  document.getElementById("bookName").innerText = book.name;

  const arrayBuffer = await book.file.arrayBuffer();

  loadPDF(arrayBuffer);
}

loadBook();

// ===== Load PDF =====
async function loadPDF(data) {
  pdfDoc = await pdfjsLib.getDocument({ data }).promise;
  currentPage = 1;

  renderPage(currentPage);
}

// ===== Render Page =====
async function renderPage(pageNum) {
  const page = await pdfDoc.getPage(pageNum);

  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");

  const viewport = page.getViewport({ scale: 1.5 });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;
}

// const url = "path/to/your/document.pdf";
const container = document.getElementById("pdfContainer");

pdfjsLib.getDocument(bookPath).promise.then(async (pdfDoc) => {
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    // Create and append canvas for this page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    container.appendChild(canvas);

    // Render the page content
    await page.render({ canvasContext: context, viewport: viewport }).promise;
  }
});

// const loadBook = async () => {
//   if (!bookId) {
//     document.body.innerHTML = "<h3>No book Selected.</h3>";
//     return;
//   }

//   const book = await db.books.get(Number(bookId));
//   bookPath = book.file

//   if (!book) {
//     document.body.innerHTML = "<h3>Book not Found!</h3>";
//     return;
//   }

//   document.getElementById("bookName").innerText = book.name;

//   const arrayBuffer = await book.file.arrayBuffer();

//   loadPDF(arrayBuffer);
// };

// loadBook();

// async function loadPDF(data) {
//   pdfDoc = await pdfjsLib.getDocument({ data }).promise;
//   currentPage = 1
//   renderPage(currentPage);
// }

// async function renderPage(pageNum) {
//   const page = await pdfDoc.getPage(pageNum);

//   const canvas = document.getElementById("pdfCanvas");
//   const ctx = canvas.getContext("2d");

//   const viewport = page.getViewport({ scale: 1.5 });

//   canvas.height = viewport.height;
//   canvas.width = viewport.width;

//   await page.render({
//     canvasContext: ctx,
//     viewport,
//   }).promise;
// }

// pdfjsLib.getDocument(bookPath).promise.then(async (pdfDoc) => {
//   for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
//     const page = await pdfDoc.getPage(pageNum);
//     const viewport = page.getViewport({ scale: 1.5 });

//     // Create and append canvas for this page
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     container.appendChild(canvas);

//     // Render the page content
//     await page.render({ canvasContext: context, viewport: viewport }).promise;
//   }
// });

// pdfjsLib.getDocument(bookPath).promise.then(async (pdfDoc) => {
//   for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
//     const page = await pdfDoc.getPage(pageNum);
//     const viewport = page.getViewport({ scale: 1.5 });

//     // Create and append canvas for this page
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     pdfContainer.appendChild(canvas);

//     // Render the page content
//     await page.render({ canvasContext: context, viewport: viewport }).promise;
//   }
// });

// async function renderPage(currentPage) {
//   for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
//     const page = await pdfDoc.getPage(pageNum);
//     const canvas = document.createElement("canvas")
//     document.getElementById("currentPageNum").max = pdfDoc.numPages
//     document.getElementById("pageCount").textContent = pdfDoc.numPages
//     canvas.classList.add("w-100", "mt-3")

//     const ctx = canvas.getContext("2d");
//     const viewport = page.getViewport({ scale: 1.5 });

//     canvas.height = viewport.height;
//     canvas.width = viewport.width;
//     pdfContainer.appendChild(canvas)
//     await page.render({
//       canvasContext: ctx,
//       viewport: viewport,
//     }).promise;
//   }
// }

// Validate Number Input (no "dash", "e", "+" allowed)
const validateNumberInput = (e) => {
  if (e.key === "-" || e.key === "e" || e.key === "+") e.preventDefault();
};
