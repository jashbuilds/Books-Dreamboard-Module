// Global variables to manage reading state and PDF document
let readChunks = [];
let currentChunkIndex = 0;
let readInterval = null;

// PDF document and rendering state
let pdfDoc = null;
let currentPage = 1;
let scale = 0.7;

let isPlaying = false;

// Default reading settings
let readingSettings = {
  wpm: 200,
  wordsPerChunk: 3,
};

const controlBtn = document.getElementById("playBtn");

// Initialize IndexedDB using Dexie.js
var db = new Dexie("BooksDB");
db.version(1).stores({
  books: "++id, name, category, file",
});

// Initialize Bootstrap tooltips and add logic to prevent them from showing when the sidebar is expanded
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]',
);
const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => {
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

// DOM elements for book preview and read mode
const bookPdfContainer = document.getElementById("bookInfo");
const pdfContainer = document.getElementById("pdfContainer");
const readModeContainer = document.getElementById("readModeContainer");
const readText = document.getElementById("readText");
const bookNameEl = document.getElementById("bookName");
const pageInput = document.getElementById("currentPageNum");
const pageCountEl = document.getElementById("pageCount");
const pageSizeOption = document.getElementById("pageSizeOption");
const preferencesModal = document.getElementById("preferencesModal");
const wpmCount = document.getElementById("wpmCount");
const chunkSizeInput = document.getElementById("chunkSize");
const savePreferencesBtn = document.getElementById("savePreferences");

// Configure PDF.js worker source
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const bookId = localStorage.getItem("selectedBookId");

// Helper function to show toast notifications for read mode state changes
const showReadModeState = (message) => {
  const toastContainer = document.getElementById("notificationToast");
  const toastBody = toastContainer.querySelector(".toast-message");

  toastBody.textContent = message;

  const toast = new bootstrap.Toast(toastContainer);
  toast.show();
};

// Load the selected book from IndexedDB and render it
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

  document.getElementById("readModeSwitch").disabled = false;
}

loadBook();

// Load PDF document and render the first page, also handle loading state
async function loadPDF(data) {
  const skeleton = document.getElementById("skeleton")

  try {
    pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    pageCountEl.textContent = pdfDoc.numPages;
    pageInput.max = pdfDoc.numPages;
    for (let pageN = 1; pageN <= pdfDoc.numPages; pageN++) {
      renderPage(pageN);
    }
    skeleton.classList.add("d-none")
  } catch(error) {
    console.log(error);
  }
}

// Extracts text from all pages of the PDF document and concatenates it into a single string
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

// Splits the input text into chunks of a specified size (number of words) and returns an array of these chunks
function createChunks(text, size) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}

// Displays the chunk of text at the specified index in the reading area, ensuring the index is within bounds
function showChunk(index) {
  if (index < 0 || index >= readChunks.length) return;

  readText.innerText = readChunks[index];
}

// Centralized helper to stop reading and reset the UI icons
const pauseReading = () => {
  if (isPlaying) {
    stopReading();
    isPlaying = false;
    controlBtn.src = "../../Icons/play-icon.svg";
  }
};

// Shows the next chunk of words and stops playback
function nextChunk() {
  if (currentChunkIndex < readChunks.length - 1) {
    currentChunkIndex++;
    showChunk(currentChunkIndex);
  }
  pauseReading();
}

// Shows the previous chunk of words and stops playback
function prevChunk() {
  if (currentChunkIndex > 0) {
    currentChunkIndex--;
    showChunk(currentChunkIndex);
  }
  pauseReading();
}

// Begins the automatic playback based on the set reading speed
function startReading() {
  stopReading();

  const speed = getReadingSpeed();

  readInterval = setInterval(() => {
    currentChunkIndex++;

    if (currentChunkIndex >= readChunks.length) {
      pauseReading();
      return;
    }

    showChunk(currentChunkIndex);
  }, speed);
}

// Only clears the reading interval timer explicitly
function stopReading() {
  if (readInterval) {
    clearInterval(readInterval);
    readInterval = null;
  }
}

// Toggles between play and pause reading modes updating UI
const toggleReading = () => {
  if (isPlaying) {
    pauseReading();
  } else {
    startReading();
    isPlaying = true;
    controlBtn.src = "../../Icons/pause-icon.svg";
  }
};

// Enables read mode by hiding the PDF view, showing the text view, extracting text, creating chunks, and displaying the first chunk
async function enableReadMode() {
  bookPdfContainer.classList.add("d-none");

  readModeContainer.classList.remove("d-none");

  const text = await extractFullText();

  readChunks = createChunks(text, readingSettings.wordsPerChunk);

  currentChunkIndex = 0;

  showChunk(currentChunkIndex);
}

// Calculates the reading speed in milliseconds based on the words per minute and words per chunk settings
function getReadingSpeed() {
  const wpm = readingSettings.wpm;

  const wordsPerChunk = readingSettings.wordsPerChunk;

  const timePerWord = 60000 / wpm;

  const interval = timePerWord * wordsPerChunk;

  return interval;
}

// Applies the user's reading preferences by updating the settings
const applyPreferences = async () => {
  const wpm = Number(wpmCount.value);
  const chunkSize = Number(chunkSizeInput.value);

  readingSettings.wpm = wpm;
  readingSettings.wordsPerChunk = chunkSize;

  if (isPlaying) {
    startReading();
  }

  if (!readModeContainer.classList.contains("d-none")) {
    const text = await extractFullText();

    readChunks = createChunks(text, readingSettings.wordsPerChunk);

    showChunk(currentChunkIndex);
  }
};

// Resets the reading preferences to default values and applies them
const restoreDefaultPreferences = () => {
  wpmCount.value = 200;
  chunkSizeInput.value = 3;

  validateWPMCount();

  applyPreferences();
};

// Disables read mode by hiding the text view
function disableReadMode() {
  readModeContainer.classList.add("d-none");

  bookPdfContainer.classList.remove("d-none");

  stopReading();
}

// Event listener for the read mode toggle switch to enable or disable read mode and reset preferences
document
  .getElementById("readModeSwitch")
  .addEventListener("change", async (e) => {
    if (e.target.checked) {
      await enableReadMode();
      restoreDefaultPreferences();
      stopReading();

      showReadModeState("Read Mode Enabled!");
    } else {
      disableReadMode();
      restoreDefaultPreferences();
      stopReading();
      controlBtn.src = "../../Icons/play-icon.svg";

      showReadModeState("Read Mode Disabled!");
    }
  });

  // Renders the specified page of the PDF document onto a canvas element, scaling it according to the current zoom level
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

// Navigates to the previous page of the PDF document
const prevPage = () => {
  if (currentPage <= 1) return;

  currentPage--;

  if (currentPage === 1) {
    loadBook();
  } else {
    renderPage(currentPage);
  }
};

// Navigates to the next page of the PDF document
const nextPage = () => {
  if (currentPage >= pdfDoc.numPages) return;
  currentPage++;
  renderPage(currentPage);
};

// Event listener for the page number input field to navigate to the specified page
pageInput.addEventListener("change", () => {
  const pageInputVal = Number(pageInput.value);
  if (pageInputVal <= pdfDoc.numPages) {
    currentPage = pageInputVal;
    renderPage(currentPage);
  }
});

// Navigates to the first page of the PDF document
const toFirstPage = () => {
  const firstPage = pdfDoc.numPages - pdfDoc.numPages + 1;
  currentPage = firstPage;
  if (currentPage === 1) {
    loadBook();
  } else {
    renderPage(firstPage);
  }
};

// Navigates to the last page of the PDF document
const toLastPage = () => {
  const lastPage = pdfDoc.numPages;
  currentPage = lastPage;
  renderPage(currentPage);
};

// Zooms out the PDF view by decreasing the scale and re-rendering the current page, also resets page size option
const zoomOut = () => {
  scale -= 0.1;
  renderPage(currentPage);

  pageSizeOption.value = "";
};

// Zooms in the PDF view by increasing the scale and re-rendering the current page, also resets page size option
const zoomIn = () => {
  scale += 0.1;
  renderPage(currentPage);

  pageSizeOption.value = "";
};

// Sets the page size based on the selected option (fit, zoom in, zoom out) and re-renders the current page
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
  if (e.key === "-" || e.key === "e" || e.key === "+" || e.key === ".") e.preventDefault();
};

// Validate input field "Words per Minute" to prevent empty input.
const validateWPMCount = () => {
  if (wpmCount.value !== "" && !/^0+$/.test(wpmCount.value) && /^[1-9]\d*$/.test(wpmCount.value)) {
    wpmCount.classList.remove("is-invalid");
    savePreferencesBtn.disabled = false;
    savePreferencesBtn.classList.remove("cursor-nodrop");
  } else {
    wpmCount.classList.add("is-invalid");
    savePreferencesBtn.disabled = true;
    savePreferencesBtn.classList.add("cursor-nodrop");
  }

  if (wpmCount.value === "") {
    document.getElementById("countValidationMessage").textContent =
      "Words per minute is required!";
  }
  if (/^0+$/.test(wpmCount.value)) {
    document.getElementById("countValidationMessage").textContent =
      "Please enter a valid Words per minute!";
  }
};

preferencesModal.addEventListener("show.bs.modal", () => {
  pauseReading();
});

// Event listener for when the preferences modal is hidden to pause reading and restore default preferences if WPM input is invalid
preferencesModal.addEventListener("hidden.bs.modal", () => {
  pauseReading();
  if(wpmCount.value === "" || /^0+$/.test(wpmCount.value)) {
    restoreDefaultPreferences()
  }
  wpmCount.classList.remove("is-invalid");
});