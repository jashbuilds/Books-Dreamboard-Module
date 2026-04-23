// Initialize Dexie.
var db = new Dexie("Dreamboard");
db.version(1).stores({
  dreams: "++id, name",
});

// DOM Elements
const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("addDreamImage");
const imageView = document.getElementById("imgFile");
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

let totalImages;
let selectedDreamId;

// array that stores images selected by user from modal
let uploadedImages = [];
let newUploadedImages = [];

submitBtn.disabled = true;

// get dreams data from Dexie.
function getDreamsData() {
  const request = indexedDB.open("Dreamboard", 10);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction("dreams");
    const store = transaction.objectStore("dreams");

    const getRequest = store.getAll();

    getRequest.onsuccess = () => {
      renderDreamboard(getRequest.result);
    };
  };
}
getDreamsData();

// function to render Dreamboards from Dexie
function renderDreamboard(res) {
  if (res.length === 0) {
    dreamBoardGrid.innerHTML =
      "<p class='text-center fs-4 fw-semibold'>No Dreams Created!</p>";
    return;
  }
  dreamBoardGrid.innerHTML = res
    .map((d) => {
      const url = URL.createObjectURL(d.images[0]);

      return `
       <div class="col-sm-6 col-md-4 col-lg-3">
                                <div class="position-relative dreamCard h-100" >
                                    <img data-bs-toggle="modal" data-bs-target="#carouselGallery" onclick="renderCarousel(${d.id})"
                                        src="${url}"
                                        alt="nature"
                                        class="img-fluid object-fit-cover rounded cursor-pointer h-100">
                                    <img src="../../Icons/pin-outlined.svg"
                                        class="cursor-pointer position-absolute top-0 start-0 ps-3 pt-3"
                                        alt="pin" width="35" height="35">
                                    <div
                                        class="dropdown rounded-circle dropdownIcon cursor-pointer position-absolute top-0 end-0 pe-3 pt-3">
                                        <img
                                            src="../../Icons/three-dots-vertical-filled.svg"
                                            class="dropdown-toggle"
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
                                            <li><button
                                                      data-bs-toggle="modal" data-bs-target="#uploadNewImage"
                                                    class="dropdown-item d-flex justify-content-start align-items-center gap-2"><img
                                                        src="../../Icons/upload-image.svg"
                                                        alt="upload"
                                                        width="20"
                                                        height="20">Upload
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
                                        <span
                                            class="fw-semibold text-white mb-1 fs-5 cardPara">${d.name}</span> <br>
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
                                                <li class="splide__slide">
                                                    <img
                                                        src="${url}"
                                                        alt="carousel-img1"
                                                        class="img-fluid object-fit-cover rounded cursor-pointer h-100" />
                                                </li>`;
    })
    .join("");

  const imageThumbnails = dream.images
    .map((img) => {
      const url = URL.createObjectURL(img);

      return `                          <li class="thumbnail">
                                            <img
                                                src="${url}"
                                                alt="thumbnail-img1" width="100"
                                                height="100"
                                                class="img-fluid object-fit-cover rounded cursor-pointer h-100" />
                                        </li>`;
    })
    .join("");

  carouselContainer.innerHTML = `
    <div class="splideContainer">
      <section id="main-slider" class="splide">
      <span id="dreamName" class="fs-6 text-white bg-dark-transparent px-1 rounded mt-1 text-center position-absolute z-3 top-7 start-50 translate-middle-x text-wrap">${dream.name}</span>
        <div class="splide__track mx-auto border border-2 border-primary rounded shadow">
          <span id="imageCounter" class="font-14 text-white bg-dark-transparent px-2 py-0 rounded mt-1 text-center position-absolute z-3 top-0 start-50 translate-middle-x"></span>
          <ul class="splide__list">
            ${imageListHtml}
          </ul>
        </div>
      </section>
      <div class="bg-dark d-flex gap-3 justify-content-center text-center mx-auto actionBtnGrp py-1 rounded">
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center" onclick="rotateLeft(${dreamId})">
          <img src="../../Icons/rotate-left.svg" alt="rotate-btn" class="img-fluid" width="16" height="16">
        </button>
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center" onclick="rotateRight(${dreamId})">
          <img src="../../Icons/rotate-right.svg" alt="rotate-btn" class="img-fluid" width="16" height="16">
        </button>
        <button class="btn btn-light rounded p-0 d-flex justify-content-center align-items-center" onclick="downloadCurrentImage()">
          <img src="../../Icons/download-img-icon.svg" alt="download-btn" class="img-fluid" width="25" height="25">
        </button>
        <button class="btn btn-light rounded px-1 py-0 d-flex justify-content-center align-items-center" onclick="deleteCurrentImage(${dreamId})">
          <img src="../../Icons/delete-img-icon.svg" alt="delete-btn" class="img-fluid" width="16" height="16">
        </button>
      </div>
      <ul id="thumbnails" class="thumbnails d-flex gap-2 mt-5">
          ${imageThumbnails}
      </ul>
    </div>`;
  const counter = document.getElementById("imageCounter");

  function updateCounter(index) {
    counter.innerText = `${index + 1} / ${totalImages}`;
  }

  updateCounter(0);

  const splide = new Splide("#main-slider", {
    pagination: false,
  });

  splide.mount();

  const thumbnails = document.querySelectorAll("#thumbnails .thumbnail");

  let current;

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      splide.go(index);
    });
  });

  splide.on("move", () => {
    currentRotation = 0;
    updateCounter(splide.index);
  });

  splide.on("mounted move", () => {
    const thumb = thumbnails[splide.index];
    if (thumb) {
      if (current) current.classList.remove("is-active");
      thumb.classList.add("is-active");
      current = thumb;
    }
  });
}

// Common function to render selected images
const renderImages = () => {
  availableImages.innerHTML = uploadedImages
    .map(
      (img, i) => `
        <table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row" class="col-1">${i + 1}</th>
                    <td class="col-10">${img.file.name}</td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeImg(${i})"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");

  dropArea.classList.toggle("d-none", uploadedImages.length >= 5);
};

inputFile.addEventListener("change", uploadImage);

// function to upload image on modal
function uploadImage() {
  if (!inputFile.files || inputFile.files.length === 0) {
    return;
  }

  const files = Array.from(inputFile.files);

  for (let file of files) {
    if (!file.type.startsWith("image/")) {
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

  const files = Array.from(e.dataTransfer.files);

  for (let file of files) {
    if (!file.type.startsWith("image/")) {
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
const removeImg = (id) => {
  uploadedImages.splice(id, 1);
  renderImages();

  validateFormInput();
};

// Logic to add form data to Dexie
document.getElementById("dreamForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = dreamName.value;
  const imageFiles = uploadedImages.map((img) => img.file);

  await db.dreams.add({
    name: name,
    images: imageFiles,
  });

  document.getElementById("dreamForm").reset();

  bootstrap.Modal.getInstance(addDreamModal).hide();

  getDreamsData();

  showAcknowledgeToast("Dream Added.");
});

// Store id of Selected dream which is going to be deleted
const openDeleteModal = (id) => {
  selectedDreamId = id;
};

// function to delete dream
const deleteDream = async () => {
  await db.dreams.delete(selectedDreamId);
  getDreamsData();

  showAcknowledgeToast("Dream Deleted!");
};

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
const validateFormInput = () => {
  const isFormValid =
    dreamName.value.trim() !== "" && uploadedImages.length > 0;

  submitBtn.disabled = !isFormValid;
};

// function to reset form values when closed
addDreamModal.addEventListener("hidden.bs.modal", () => {
  dreamName.value = "";
  uploadedImages = [];
  document.getElementById("dreamForm").reset();
  availableImages.innerHTML = "";
  dropArea.classList.remove("d-none");
  submitBtn.disabled = true;
  document.getElementById("img-view").classList.remove("is-invalid");
  renameDreamInput.classList.remove("is-invalid");

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
const showAcknowledgeToast = (message, background = "text-bg-success") => {
  const toastContainer = document.getElementById("notificationToast");
  const toastBody = toastContainer.querySelector(".toast-message");

  toastBody.textContent = message;
  toastContainer.classList.add(background);

  const toast = new bootstrap.Toast(toastContainer);
  toast.show();
};

// function to rotate carousel image to left
function rotateLeft() {
  const activeSlide = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );

  if (activeSlide) {
    rotationDegrees -= 90;

    activeSlide.style.transform = `rotate(${rotationDegrees}deg)`;
    activeSlide.style.transition = "transform 0.3s ease";
  }
}

// function to rotate carousel image to right
function rotateRight() {
  const activeSlide = document.querySelector(
    "#main-slider .splide__slide.is-active img",
  );

  if (activeSlide) {
    rotationDegrees += 90;

    activeSlide.style.transform = `rotate(${rotationDegrees}deg)`;
    activeSlide.style.transition = "transform 0.3s ease";
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
}

// Save id & name of the Dream which is going to be renamed
function renameDream(id, name) {
  selectedDreamId = id;
  renameDreamInput.value = name;
}

// Rename dream name and reflect changes on UI
async function updateDreamName() {
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

  modal.hide();
  validateNameInput();
  showAcknowledgeToast("Dream renamed!");
}

// Rename name input fields when rename modal closes
document
  .getElementById("renameModal")
  .addEventListener("hidden.bs.modal", () => {
    renameDreamInput.classList.remove("is-invalid");
    dreamName.classList.remove("is-invalid");
  });

addNewImageInput.addEventListener("change", uploadNewImage);

function uploadNewImage() {
  if (!addNewImageInput.files || addNewImageInput.files.length === 0) {
    return;
  }

  const files = Array.from(addNewImageInput.files);  

  for (let file of files) {
    if (!file.type.startsWith("image/")) {
      document.getElementById("uploadedImg-view").classList.add("is-invalid");
      return;
    } else {
      document
        .getElementById("uploadedImg-view")
        .classList.remove("is-invalid");
    }
  }  

  files.forEach((file) => {
    if (newUploadedImages.length < 5) {
      newUploadedImages.push({ file });
    }
  });

  renderNewImages();
  validateFormInput();
}

const renderNewImages = () => {
  document.getElementById("addedImages").innerHTML = newUploadedImages
    .map(
      (img, i) => `
        <table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row" class="col-1">${i + 1}</th>
                    <td class="col-10">${img.file.name}</td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeNewImg(${i})"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");

  document.getElementById("newDrop-area").classList.toggle("d-none", newUploadedImages.length);
};

function removeNewImg(id) {
  newUploadedImages.splice(id, 1)
  renderNewImages()
}

document.getElementById("newImgUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageFiles = newUploadedImages.map((img) => img.file);

  await db.dreams.add({
    images: imageFiles,
  });

  // const data = await db.dreams.get(selectedDreamId)
  // console.log(data);
  
  document.getElementById("newImgUploadForm").reset();

  bootstrap.Modal.getInstance(document.getElementById("uploadNewImage")).hide();

  getDreamsData();

  showAcknowledgeToast("Image Added.");
});