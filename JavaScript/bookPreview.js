let readChunks = [];
let currentChunkIndex = 0;
let readInterval = null;

let pdfDoc = null;
let currentPage = 1;
let scale = 0.7;

let isPlaying = false;

let readingSettings = {
  wpm: 200,
  wordsPerChunk: 3
}

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

const bookPdfContainer = document.getElementById("bookInfo");
const pdfContainer = document.getElementById("pdfContainer");
const readModeContainer = document.getElementById("readModeContainer");
const readText = document.getElementById("readText");
const bookNameEl = document.getElementById("bookName");
const pageInput = document.getElementById("currentPageNum");
const pageCountEl = document.getElementById("pageCount");
const pageSizeOption = document.getElementById("pageSizeOption");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const bookId = localStorage.getItem("selectedBookId");

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

async function extractFullText() {
  let fullText = "";

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);

    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => item.str)
      .filter((str) => str.trim() !== "")
      .join(" ");

    fullText += pageText + " ";
  }

  return fullText.trim();
}

function createChunks(text, size) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}

function showChunk(index) {
  if (index < 0 || index >= readChunks.length) return;

  readText.innerText = readChunks[index];
}

function nextChunk() {
  if (currentChunkIndex < readChunks.length - 1) {
    currentChunkIndex++;
    showChunk(currentChunkIndex);
  }
}

function prevChunk() {
  if (currentChunkIndex > 0) {
    currentChunkIndex--;
    showChunk(currentChunkIndex);
  }
}

function startReading() {
  stopReading();

  const speed = getReadingSpeed()

  readInterval = setInterval(() => {
    currentChunkIndex++;

    if (currentChunkIndex >= readChunks.length) {
      stopReading();
      return;
    }

    showChunk(currentChunkIndex);
  }, speed);
}

function stopReading() {
  if (readInterval) {
    clearInterval(readInterval);
    readInterval = null;
  }
}

const toggleReading = () => {
  const btn = document.getElementById("playBtn");

  if (isPlaying) {
    stopReading();
    isPlaying = false;
    btn.src = "../Icons/play-icon.svg"
  } else {
    startReading();
    isPlaying = true;
    btn.src = "../Icons/pause-icon.svg"
  }
};

async function enableReadMode() {
  bookPdfContainer.classList.add("d-none");

  readModeContainer.classList.remove("d-none");

  const text = await extractFullText();

  readChunks = createChunks(text, readingSettings.wordsPerChunk);  

  currentChunkIndex = 0;

  showChunk(currentChunkIndex);
}

function disableReadMode() {
  readModeContainer.classList.add("d-none");

  bookPdfContainer.classList.remove("d-none");

  stopReading();
}

document
  .getElementById("readModeSwitch")
  .addEventListener("change", async (e) => {
    if (e.target.checked) {
      await enableReadMode();
    } else {
      disableReadMode();
    }
  });

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
  const firstPage = pdfDoc.numPages - pdfDoc.numPages + 1;
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

function getReadingSpeed() {
  const wpm = readingSettings.wpm;

  const wordsPerChunk = readingSettings.wordsPerChunk;

  const timePerWord = 60000 / wpm;

  const interval = timePerWord * wordsPerChunk;

  return interval;
}

const restoreDefault = () => {
  document.getElementById("wpmCount").value = 200
  document.getElementById("chunkSize").value = 3
}

const applyPreferences = async () => {
  const wpm = Number(document.getElementById("wpmCount").value)
  const chunkSize = Number(document.getElementById("chunkSize").value)

  readingSettings.wpm = wpm
  readingSettings.wordsPerChunk = chunkSize

  if(isPlaying) {
    startReading()
  }

  if (!readModeContainer.classList.contains("d-none")) {
    const text = await extractFullText();

    readChunks = createChunks(text, readingSettings.wordsPerChunk);

    currentChunkIndex = 0;

    showChunk(currentChunkIndex);
  }
}
