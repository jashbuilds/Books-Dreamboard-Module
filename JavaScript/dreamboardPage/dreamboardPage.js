const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("addDreamImage");
const imageView = document.getElementById("imgFile");

const addDreamModal = document.getElementById("addDream");

const submitBtn = document.getElementById("submitBtn");

const availableImages = document.getElementById("availableImages");

const dreamName = document.getElementById("dreamName");

let uploadedImages = [];

inputFile.addEventListener("change", uploadImage);
function uploadImage() {
  if (!inputFile.files || inputFile.files.length === 0) {
    return;
  }

  const fileObj = {
    file: inputFile.files[0].name,
  };

  if (uploadedImages.length >= 4) {
    dropArea.classList.add("d-none");
  }

  uploadedImages.push(fileObj);
  

  availableImages.innerHTML = uploadedImages
    .map(
      (img) => `
        <table class="table table-hover">
            <tbody>
                <tr>
                    <th scope="row" class="col-1">${uploadedImages.indexOf(img) + 1}</th>
                    <td class="col-10">${img.file}</td>
                    <td class="col-1">
                        <button type="button" class="btn-close" aria-label="Close" onclick="removeImg(${uploadedImages.indexOf(img)})"></button>
                    </td>
                </tr>
            </tbody>
        </table>`,
    )
    .join("");
}

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  inputFile.files = e.dataTransfer.files;

  uploadImage();
});

const removeImg = (id) => {
    const abc = uploadedImages.filter(a => a.id === id)
    console.log(abc);
    
    uploadedImages.splice(abc, 1)    
}

const validateFormInput = () => {
  const isFormValid = (dreamName.value.trim() !== "") && (uploadedImages.length !== 0);

  submitBtn.disabled = !isFormValid;
};

addDreamModal.addEventListener("hidden.bs.modal", () => {
  dreamName.value = "";
  uploadedImages = [];
  document.getElementById("dreamForm").reset();
  availableImages.innerHTML = "";
  dropArea.classList.remove("d-none");
  submitBtn.disabled = true;
});
