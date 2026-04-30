// Initialize Dexie.
var db = new Dexie("Dreamboard");
db.version(2).stores({
  dreams: "++id, name, isPinned",
});

// DOM Elements
const dropArea = document.getElementById("drop-area");
const newDropArea = document.getElementById("newDrop-area");
const inputFile = document.getElementById("addDreamImage");
const addDreamModal = document.getElementById("addDream");
const submitBtn = document.getElementById("submitBtn");
const availableImages = document.getElementById("availableImages");
const dreamName = document.getElementById("dreamName");
const dreamBoardGrid = document.getElementById("dreamBoardGrid");
const carouselContainer = document.getElementById("imageCarousel");
const renameDreamInput = document.getElementById("renameDreamInput");
const addNewImageInput = document.getElementById("addNewImage");

// initial rotation degree for carousel images
let rotationDegrees = 0;

const fileSizeLimit = 5 * 1024 * 1024;

let totalImages;
let selectedDreamId;
let availableSlots;

// array that stores images selected by user from modal
let uploadedImages = [];
let newUploadedImages = [];

submitBtn.disabled = true;

// get dreams data from Dexie.
async function getDreamsData() {
  dreamBoardGrid.innerHTML = generateSkeletons(8);

  try {
    const dreams = await db.dreams.toArray();
    dreams.sort((a, b) => b.isPinned - a.isPinned);
    renderDreamboard(dreams);
  } catch (error) {
    console.error("Error fetching dreams:", error);
    dreamBoardGrid.innerHTML =
      "<p class='text-center fs-4 fw-semibold'>Failed to load dreams. Please try again.</p>";
  }
}
getDreamsData();

// function to render Dreamboards from Dexie
function renderDreamboard(res) {
  if (res.length === 0) {
    dreamBoardGrid.innerHTML = `
    <div class='d-flex flex-column justify-content-center align-items-center mx-auto vh-50 text-center'>
      <p class="fw-medium text-secondary fs-5 m-0">No Dreams Created!</p>
    </div>`
    return;
  }
  dreamBoardGrid.innerHTML = res
    .map((d) => {
      const url = URL.createObjectURL(d.images[0]);

      return `
                            <div class="col-sm-6 col-lg-4 col-xl-3">
                                 <div class="position-relative dreamCard shadow-sm">
                                     <img data-bs-toggle="modal" data-bs-target="#carouselGallery" onclick="renderCarousel(${d.id})"
                                         src="${url}"
                                         alt="${d.name}"
                                         class="img-fluid cursor-pointer">
                                     <img src="${d.isPinned ? "../../Icons/pin-filled.svg" : "../../Icons/pin-outlined.svg"}"
                                           onclick="togglePin(event, ${d.id})"
                                         class="cursor-pointer position-absolute top-0 start-0 m-3 pinIcon z-3" id="pinIcon"
                                         alt="pin" width="20" height="20">
                                    <div id="loadingIcon-${d.id}" class="spinner-border spinner-border-sm text-white position-absolute top-0 start-0 ps-3 pt-3 mt-3 ms-3 d-none" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    
                                    <div
                                        class="dropdown position-absolute top-0 end-0 m-3 dropdownIcon z-3">
                                        <img
                                            src="../../Icons/three-dots-vertical-filled-light.svg"
                                            class="dropdown-toggle cursor-pointer"
                                            alt="action-menu" width="30"
                                            height="30"
                                            data-bs-offset="0,5"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false">
                                        <ul
                                            class="dropdown-menu">
                                            <li><button onclick="renameDream(${d.id}, '${d.name}')" data-bs-toggle="modal" data-bs-target="#renameModal"
                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-1"><img
                                                        src="../../Icons/edit.svg"
                                                        alt="rename"
                                                        width="25"
                                                        height="25">
                                                    Rename</button></li>
                                            <li><button onclick="openUploadModal(${d.id})"
                                                      data-bs-toggle="modal" data-bs-target="#uploadNewImage"
                                                    class="dropdown-item ${d.images.length === 5 ? "d-none" : "d-flex"} justify-content-start align-items-center gap-2"><img
                                                        src="../../Icons/add_image.svg" class="uploadImg"
                                                        alt="upload"
                                                        width="20"
                                                        height="22">Upload
                                                    Image</button></li>
                                            <li><button onclick="openDeleteModal(${d.id})" data-bs-toggle="modal" data-bs-target="#deleteModal"

                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                        src="../../Icons/delete-icon.svg"
                                                        alt="delete"
                                                        width="20"
                                                        height="20">Delete Dream</button></li>
                                        </ul>
                                    </div>

                                    <div
                                        class="position-absolute bottom-0 p-xl-3 p-md-2 p-3 imgText">
                                        <p
                                            class="fw-semibold text-white mb-1 fs-5 cardPara">${d.name}</p>
                                        <span
                                            class="fw-semibold text-white fs-6 cardSubpara">Created
                                            by, User</span>
                                    </div>

                                </div>
                            </div>
    `;
    })
    .join("");

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

  [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl),
  );
}

// function to render carousel with available images
async function renderCarousel(dreamId) {
  if (!carouselContainer) return;

  const dream = await db.dreams.get(dreamId);
  totalImages = dream.images.length;
  if (!dream || !dream.images) return;

  const imageListHtml = dream.images
    .map((img) => {
      const url = URL.createObjectURL(img);

      return `
                                                <li class="splide__slide d-flex justify-content-center align-items-center">
                                                    <img
                                                        src="${url}"
                                                        alt="carousel-img1"
                                                        class="img-fluid w-auto h-100 cursor-pointer object-fit-cover rounded-2" />
                                                </li>`;
    })
    .join("");

  const imageThumbnails = dream.images
    .map((img) => {
      const url = URL.createObjectURL(img);

      return `                          <li class="thumbnail overflow-hidden object-fit-cover cursor-pointer list-unstyled">
                                            <img
                                                src="${url}"
                                                alt="thumbnail-img1" width="100"
                                                height="100"
                                                class="img-fluid object-fit-cover rounded cursor-pointer w-100 h-100" />
                                        </li>`;
    })
    .join("");

  carouselContainer.innerHTML = `
    <div class="splideContainer">
      <section id="main-slider" class="splide">
        <span id="dreamName" class="fs-6 text-white bg-dark-transparent px-1 rounded mt-1 text-center position-absolute z-3 top-7 start-50 translate-middle-x text-wrap">${dream.name}</span>
        <div class="splide__track mx-auto">
          <span id="imageCounter" class="font-14 text-white bg-dark-transparent px-2 py-0 rounded mt-1 text-center position-absolute z-3 top-0 start-50 translate-middle-x"></span>
          <ul class="splide__list rounded d-flex gap-1">
            ${imageListHtml}
          </ul>
        </div>
      </section>
      <div class="bg-dark d-flex gap-3 justify-content-center text-center mx-auto actionBtnGrp py-1 mt-2 rounded">
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center " onclick="rotateLeft(${dreamId})">
          <img src="../../Icons/rotate-left.svg" alt="rotate-btn" class="img-fluid" width="16" height="16">
        </button>
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center" onclick="rotateRight(${dreamId})">
          <img src="../../Icons/rotate-right.svg" alt="rotate-btn" class="img-fluid" width="16" height="16">
        </button>
        <button class="btn btn-light rounded p-0 d-flex justify-content-center align-items-center" onclick="downloadCurrentImage()">
          <img src="../../Icons/download-img-icon.svg" alt="download-btn" class="img-fluid" width="25" height="25">
        </button>
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center deleteImg" onclick="deleteCurrentImage(${dreamId})">
          <span class="spinner-border spinner-border-sm d-none" aria-hidden="true" id="deleteImgSpinner"></span>
          <img src="../../Icons/delete-img-icon.svg" alt="delete-btn" class="img-fluid" width="16" height="16" id="deleteImgIcon">
        </button>
      </div>
      <ul id="thumbnails" class="thumbnails d-flex justify-content-center gap-sm-2 gap-1 mt-5 p-0">
          ${imageThumbnails}
      </ul>
    </div>`;

  const firstImg = document.querySelector(".splide__list .splide__slide img");

  if (firstImg) {
    firstImg.classList.add("border", "border-3", "border-primary", "rounded-3");
  }

  const counter = document.getElementById("imageCounter");

  function updateCounter(index) {
    counter.innerText = `${index + 1} / ${totalImages}`;
  }

  updateCounter(0);

  const thumbnails = document.querySelectorAll("#thumbnails .thumbnail");
  let current;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const splide = new Splide("#main-slider", {
    pagination: isMobile,
  });

  splide.on("mounted move", () => {
    const thumb = thumbnails[splide.index];
    if (thumb) {
      if (current) current.classList.remove("is-active");
      thumb.classList.add("is-active");
      current = thumb;
    }
  });

  if (isMobile) {
    splide.on("pagination:mounted", function (data) {
      data.list.classList.add("splide__pagination--custom");
    });
  }

  splide.mount();

  const deleteBtn = document.querySelector(".deleteImg");

  splide.on("moved", (index) => {
    if (deleteBtn) {
      deleteBtn.disabled = index === 0;
    }
  });

  if (deleteBtn) {
    deleteBtn.disabled = splide.index === 0;
  }

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      splide.go(index);
    });
  });

  splide.on("move", () => {
    rotationDegrees = 0;

    // Reset all images to original state
    document
      .querySelectorAll("#main-slider .splide__slide img")
      .forEach((img) => {
        img.style.transform = "rotate(0deg)";
        img.style.width = "";
        img.style.height = "";
        img.style.maxWidth = "";
        img.style.maxHeight = "";
        img.style.objectFit = "";
      });

    // Reset slide containers
    document
      .querySelectorAll("#main-slider .splide__slide")
      .forEach((slide) => {
        slide.style.display = "";
        slide.style.justifyContent = "";
        slide.style.alignItems = "";
        slide.style.overflow = "";
      });

    updateCounter(splide.index);
  });
}

// Common function to render selected images
function renderImages() {
  availableImages.innerHTML = uploadedImages
    .map(
      (img, i) => `
        <table class="table table-borderless m-0">
            <tbody>
                <tr>
                    <td class="col-11">
                      <p class="overflow-ellipsis fs-6 m-0">${i + 1} <span class="ps-3 text-wrap">${img.file.name}</span></p>
                    </td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeImg(${i})"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");

  dropArea.classList.toggle("d-none", uploadedImages.length >= 5);
}

inputFile.addEventListener("change", uploadImage);

// function to upload image on modal
function uploadImage() {
  if (!inputFile.files || inputFile.files.length === 0) {
    return;
  }

  for (let file of inputFile.files) {
    if (file.size > fileSizeLimit) {
      document.getElementById("invalidFileMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload images smaller than 5MB.</div>";
      document.getElementById("img-view").classList.add("is-invalid");
      return;
    } else {
      document.getElementById("img-view").classList.remove("is-invalid");
    }
  }

  const files = Array.from(inputFile.files);

  for (let file of files) {
    if (
      !file.type.startsWith("image/") ||
      !["image/jpg", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      document.getElementById("invalidFileMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload supported Files!</div>";
      document.getElementById("img-view").classList.add("is-invalid");
      return;
    } else {
      document.getElementById("img-view").classList.remove("is-invalid");
    }
  }

  files.forEach((file) => {
    if (uploadedImages.length < 5) {
      uploadedImages.push({ file });
    }
  });

  renderImages();
  validateFormInput();
}

// handler function that handles dragover event
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// handler function that handles drop event
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();

  for (let file of e.dataTransfer.files) {
    if (file.size > fileSizeLimit) {
      document.getElementById("invalidFileMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload images smaller than 5MB.</div>";
      document.getElementById("img-view").classList.add("is-invalid");
      return;
    } else {
      document.getElementById("img-view").classList.remove("is-invalid");
    }
  }

  const files = Array.from(e.dataTransfer.files);

  for (let file of files) {
    if (
      !file.type.startsWith("image/") ||
      !["image/jpg", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      document.getElementById("invalidFileMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload supported Files!</div>";
      document.getElementById("img-view").classList.add("is-invalid");
      return;
    } else {
      document.getElementById("img-view").classList.remove("is-invalid");
    }
  }
  files.forEach((file) => {
    if (uploadedImages.length < 5) {
      uploadedImages.push({ file });
    }
  });

  renderImages();
  validateFormInput();
});

// function to remove image from modal
function removeImg(id) {
  uploadedImages.splice(id, 1);
  renderImages();

  validateFormInput();
}

// Logic to add form data to Dexie
document.getElementById("dreamForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  document.getElementById("formSubmitSpinner").classList.remove("d-none");

  try {
    const name = dreamName.value;
    const imageFiles = uploadedImages.map((img) => img.file);
    await db.dreams.add({
      name: name,
      images: imageFiles,
      isPinned: false,
    });

    document.getElementById("dreamForm").reset();
    getDreamsData();
    bootstrap.Modal.getInstance(addDreamModal).hide();

    showAcknowledgeToast("Dream Added.");
  } catch (error) {
    console.error("Error adding dream:", error);
    showAcknowledgeToast(
      "Failed to add dream. Please try again.",
      "text-bg-danger",
    );
  }
});

// Store id of Selected dream which is going to be deleted
function openDeleteModal(id) {
  selectedDreamId = id;
}

// function to delete dream
async function deleteDream() {
  document.getElementById("deleteSpinner").classList.remove("d-none");
  document.getElementById("confirmDelete").disabled = true;

  try {
    await db.dreams.delete(selectedDreamId);

    getDreamsData();

    showAcknowledgeToast("Dream Deleted!");
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();

    document.getElementById("deleteSpinner").classList.add("d-none");
    document.getElementById("confirmDelete").disabled = false;
  } catch (error) {
    console.error("Error deleting dream:", error);
    showAcknowledgeToast(
      "Failed to delete dream. Please try again.",
      "text-bg-danger",
    );
  }
}

// function to validate name input
function validateNameInput() {
  if (/^\s|\d+/.test(dreamName.value) || dreamName.value === "") {
    dreamName.classList.add("is-invalid");
    submitBtn.disabled = true;
  } else {
    dreamName.classList.remove("is-invalid");
  }

  if (/^\s|\d+/.test(renameDreamInput.value) || renameDreamInput.value === "") {
    renameDreamInput.classList.add("is-invalid");
    document.getElementById("confirmRename").disabled = true;
  } else {
    renameDreamInput.classList.remove("is-invalid");
    document.getElementById("confirmRename").disabled = false;
  }
}

// function to validate form input
function validateFormInput() {
  const isFormValid =
    dreamName.value.trim() !== "" && uploadedImages.length > 0;

  submitBtn.disabled = !isFormValid;
}

// function to reset add dream form values when closed
addDreamModal.addEventListener("hidden.bs.modal", () => {
  dreamName.value = "";
  uploadedImages = [];
  document.getElementById("dreamForm").reset();
  availableImages.innerHTML = "";
  dropArea.classList.remove("d-none");
  submitBtn.disabled = true;
  document.getElementById("img-view").classList.remove("is-invalid");
  renameDreamInput.classList.remove("is-invalid");
  document.getElementById("formSubmitSpinner").classList.add("d-none");

  dreamName.classList.remove("is-invalid");
});

// function to close dreamboard action dropdown when mouseleave
function attachDropdownCloseLogic() {
  const cards = document.querySelectorAll(".dreamCard");

  cards.forEach((card) => {
    card.addEventListener("mouseleave", () => {
      const toggle = card.querySelector('[data-bs-toggle="dropdown"]');

      if (toggle) {
        const instance = bootstrap.Dropdown.getInstance(toggle);
        if (instance) instance.hide();
      }
    });
  });
}

// Show toast message for acknowledgement.
function showAcknowledgeToast(message, background = "text-bg-success") {
  const toastContainer = document.getElementById("notificationToast");
  const toastBody = toastContainer.querySelector(".toast-message");

  toastBody.textContent = message;
  toastContainer.classList.add(background);

  const toast = new bootstrap.Toast(toastContainer);
  toast.show();
}

// function to rotate carousel image to left
function rotateLeft() {
  const activeSlide = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );

  if (activeSlide) {
    rotationDegrees -= 90;
    activeSlideResize();
  }
}

// function to rotate carousel image to right
function rotateRight() {
  const activeSlide = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );

  if (activeSlide) {
    rotationDegrees += 90;
    activeSlideResize();
  }
}

// function to download current carousel image
function downloadCurrentImage() {
  const activeSlideImg = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );

  if (activeSlideImg && activeSlideImg.src) {
    const imageUrl = activeSlideImg.src;

    const link = document.createElement("a");
    link.href = imageUrl;

    link.download = `dream-image-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Delete currently active image of carousel
async function deleteCurrentImage(dreamId) {
  document.getElementById("deleteImgSpinner").classList.remove("d-none");
  document.getElementById("deleteImgIcon").classList.add("d-none");

  try {
    const activeSlide = document.querySelector(
      "#main-slider .splide__slide.is-active",
    );
    if (!activeSlide) return;

    const allSlides = Array.from(
      document.querySelectorAll("#main-slider .splide__slide"),
    );
    const currentIndex = allSlides.indexOf(activeSlide);

    const dream = await db.dreams.get(dreamId);

    if (dream && dream.images) {
      dream.images.splice(currentIndex, 1);

      if (dream.images.length === 0) {
        await db.dreams.delete(dreamId);
        location.reload();
      } else {
        await db.dreams.put(dream);
        renderCarousel(dreamId);
      }
    }
    getDreamsData();
    document.getElementById("deleteImgSpinner").classList.add("d-none");
  } catch (error) {
    console.error("Error deleting image:", error);
    showAcknowledgeToast(
      "Failed to delete image. Please try again.",
      "text-bg-danger",
    );
  }
}

// Save id & name of the Dream which is going to be renamed
function renameDream(id, name) {
  selectedDreamId = id;
  renameDreamInput.value = name;
}

// Rename dream name and reflect changes on UI
async function updateDreamName() {
  document.getElementById("confirmRename").disabled = true;

  document.getElementById("renameSpinner").classList.remove("d-none");

  try {
    const newName = renameDreamInput.value.trim();

    await db.dreams.update(selectedDreamId, {
      name: renameDreamInput.value,
    });

    getDreamsData();

    const modalEl = document.getElementById("renameModal");

    let modal = bootstrap.Modal.getInstance(modalEl);

    if (!modal) {
      modal = new bootstrap.Modal(modalEl);
    }

    validateNameInput();
    modal.hide();
    showAcknowledgeToast("Dream renamed!");
  } catch (error) {
    console.error("Error renaming dream:", error);
    showAcknowledgeToast(
      "Failed to rename dream. Please try again.",
      "text-bg-danger",
    );
  }
}

// Rename name input fields when rename modal closes
document
  .getElementById("renameModal")
  .addEventListener("hidden.bs.modal", () => {
    renameDreamInput.classList.remove("is-invalid");
    dreamName.classList.remove("is-invalid");

    document.getElementById("renameSpinner").classList.add("d-none");
    document.getElementById("confirmRename").disabled = true;
  });

addNewImageInput.addEventListener("change", uploadNewImage);

// handles image upload for upload new image Modal.
function uploadNewImage() {
  if (!addNewImageInput.files || addNewImageInput.files.length === 0) {
    return;
  }

  for (let file of addNewImageInput.files) {
    if (file.size > fileSizeLimit) {
      document.getElementById("newFileUploadMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload images smaller than 5MB.</div>";
      document.getElementById("uploadedImg-view").classList.add("is-invalid");
      return;
    } else {
      document
        .getElementById("uploadedImg-view")
        .classList.remove("is-invalid");
    }
  }

  const files = Array.from(addNewImageInput.files);

  for (let file of files) {
    if (
      !file.type.startsWith("image/") ||
      !["image/jpg", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      document.getElementById("newFileUploadMsg").innerHTML =
        `<div class="fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2"><img src="../../Icons/exclamation-circle-fill.svg" alt="exclamation" width="16" height="16">Please upload supported Files!</div>`;
      document.getElementById("uploadedImg-view").classList.add("is-invalid");
      return;
    } else {
      document
        .getElementById("uploadedImg-view")
        .classList.remove("is-invalid");
    }
  }

  files.forEach((file) => {
    if (newUploadedImages.length < availableSlots) {
      newUploadedImages.push({ file });
    }
  });

  renderNewImages();
  updateUploadUI();
  validateFormInput();
}

// handler function that handles dragover event
newDropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// handler function that handles drop event
newDropArea.addEventListener("drop", (e) => {
  e.preventDefault();

  for (let file of e.dataTransfer.files) {
    if (file.size > fileSizeLimit) {
      document.getElementById("newFileUploadMsg").innerHTML =
        "<div class='fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2'><img src='../../Icons/exclamation-circle-fill.svg' alt='exclamation' width='16' height='16'>Please upload images smaller than 5MB.</div>";
      document.getElementById("uploadedImg-view").classList.add("is-invalid");
      return;
    } else {
      document
        .getElementById("uploadedImg-view")
        .classList.remove("is-invalid");
    }
  }

  const files = Array.from(e.dataTransfer.files);

  for (let file of files) {
    if (
      !file.type.startsWith("image/") ||
      !["image/jpg", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      document.getElementById("newFileUploadMsg").innerHTML =
        `<div class="fw-semibold text-center h6 d-flex justify-content-center align-items-center gap-2"><img src="../../Icons/exclamation-circle-fill.svg" alt="exclamation" width="16" height="16">Please upload supported Files!</div>`;
      document.getElementById("uploadedImg-view").classList.add("is-invalid");
      return;
    } else {
      document
        .getElementById("uploadedImg-view")
        .classList.remove("is-invalid");
    }
  }

  files.forEach((file) => {
    if (newUploadedImages.length < availableSlots) {
      newUploadedImages.push({ file });
    }
  });

  renderNewImages();
  updateUploadUI();
  validateFormInput();
});

// renders selected images from user in upload new image modal
function renderNewImages() {
  document.getElementById("addedImages").innerHTML = newUploadedImages
    .map(
      (img, i) => `
        <table class="table table-borderless m-0">
            <tbody>
                <tr>
                    <th scope="row" class="col-1 text-center fs-6">${i + 1}</th>
                    <td class="col-10"><span class="overflow-ellipsis fs-6">${img.file.name}</span></td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeNewImg(${i})" width="20" height="20"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");

  document.getElementById("submitNewImgUpload").disabled =
    newUploadedImages.length === 0;
}

// function to remove image from selected images in upload new image modal
function removeNewImg(id) {
  newUploadedImages.splice(id, 1);
  renderNewImages();
  updateUploadUI();
}

// function to open upload new image modal and set available upload slots based on number of existing images in the dream
async function openUploadModal(id) {
  selectedDreamId = id;

  const dream = await db.dreams.get(id);

  if (!dream) return;

  availableSlots = 5 - dream.images.length;

  updateUploadUI();
}

// function to handle upload of new images to existing dream in Dexie and reflect changes on UI
document
  .getElementById("newImgUploadForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    document.getElementById("submitNewImgUpload").disabled = true;
    document
      .getElementById("uploadImageSubmitSpinner")
      .classList.remove("d-none");

    try {
      const dream = await db.dreams.get(selectedDreamId);

      const imageFiles = newUploadedImages.map((img) => img.file);

      const updatedImages = [...dream.images, ...imageFiles];

      await db.dreams.put({
        ...dream,
        images: updatedImages,
      });

      newUploadedImages = [];

      document.getElementById("newImgUploadForm").reset();

      getDreamsData();
      bootstrap.Modal.getInstance(
        document.getElementById("uploadNewImage"),
      ).hide();

      showAcknowledgeToast("Images added successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      showAcknowledgeToast(
        "Failed to upload images. Please try again.",
        "text-bg-danger",
      );
    }
  });

// function to reset upload new image modal values when closed
document
  .getElementById("uploadNewImage")
  .addEventListener("hidden.bs.modal", () => {
    newUploadedImages = [];

    document.getElementById("addedImages").innerHTML = "";

    document.getElementById("newDrop-area").classList.remove("d-none");

    document.getElementById("submitNewImgUpload").disabled = true;

    document.getElementById("uploadMessage").classList.add("d-none");
    document.getElementById("uploadImageSubmitSpinner").classList.add("d-none");

    document.getElementById("uploadedImg-view").classList.remove("is-invalid");
  });

// function to update upload new image modal UI based on number of images selected by user and available upload slots
function updateUploadUI() {
  const dropArea = document.getElementById("newDrop-area");
  const messageBox = document.getElementById("uploadMessage");
  const limitMessage = document.getElementById("limitMessage");
  const submitBtn = document.getElementById("submitNewImgUpload");

  const remainingSlots = availableSlots - newUploadedImages.length;

  if (remainingSlots <= 0) {
    dropArea.classList.add("d-none");

    limitMessage.innerText =
      "You have reached maximum upload limit (5 images).";
    limitMessage.classList.remove("d-none");
  } else {
    dropArea.classList.remove("d-none");
    limitMessage.classList.add("d-none");

    messageBox.innerText = `You can upload ${remainingSlots} more image(s).`;
    messageBox.classList.remove("d-none");
  }

  submitBtn.disabled = newUploadedImages.length === 0;
}

// function to toggle pin status of dream and reflect changes on UI
async function togglePin(event, id) {
  const pinIcon = event.currentTarget;
  const loadingIcon = document.getElementById(`loadingIcon-${id}`);

  pinIcon.classList.add("d-none");
  loadingIcon.classList.remove("d-none");

  try {
    const dream = await db.dreams.get(id);
    const newPinnedStatus = !dream.isPinned;

    await db.dreams.update(id, { isPinned: newPinnedStatus });

    await getDreamsData();
  } catch (error) {
    console.error("Failed to toggle pin:", error);
    pinIcon.classList.remove("d-none");
    loadingIcon.classList.add("d-none");
  }
}

// function to generate skeleton loaders based on count
function generateSkeletons(count) {
  return Array(count)
    .fill(0)
    .map(
      () => ` 
                            <div class="col-sm-6 col-md-4 col-lg-3" aria-hidden="true">
                                 <div class="position-relative dreamCard placeholder-glow">
                                      <div class="img-fluid placeholder w-100 h-100 col-4 bg-body-secondary"></div>
                                </div>
                            </div>`,
    )
    .join("");
}

// function to rotate active carousel image based on rotationDegrees value and maintain its aspect ratio within the slide container
function activeSlideResize() {
  const activeSlide = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );
  activeSlide.style.transform = `rotate(${rotationDegrees}deg)`;
  activeSlide.style.transition = "transform 0.3s ease";
  activeSlide.style.width = "auto";
  activeSlide.style.height = "auto";
  activeSlide.style.maxWidth = "100%";
  activeSlide.style.maxHeight = "100%";
  activeSlide.style.objectFit = "contain";
}

// function to sort dreams based on selected filter and render them on UI
async function sortDreams() {
  const categoryFilter = document.getElementById("categoryFilter").value;
  const dreams = await db.dreams.toArray();

  let sortedDreams = [];

  if (categoryFilter === "ASC") {
    sortedDreams = dreams.sort((a, b) => a.name.localeCompare(b.name));
  } else if (categoryFilter === "DESC") {
    sortedDreams = dreams.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    sortedDreams = dreams;
  }
  dreams.forEach((d) => {
    if (categoryFilter === "ASC" || categoryFilter === "DESC") {
      d.isPinned = false;
    }
    db.dreams.update(d.id, { isPinned: d.isPinned });
  });
  renderDreamboard(sortedDreams);
}
