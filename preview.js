/* The native dialog supplies Escape handling and an inert background. */
const dialog = document.getElementById("phoneModal");
const previewImage = document.getElementById("modalImage");
let previewTrigger;
let previousOverflow;

document.querySelectorAll("[data-preview-src]").forEach((button) => {
  button.addEventListener("click", () => {
    previewTrigger = button;
    previousOverflow = document.body.style.overflow;
    previewImage.src = button.dataset.previewSrc;
    previewImage.alt = button.dataset.previewAlt;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector("button").focus();
  });
});

// Keep Tab and Shift+Tab on the preview's only interactive control.
dialog.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    dialog.querySelector(".close-modal").focus();
  }
});

dialog
  .querySelector(".close-modal")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  document.body.style.overflow = previousOverflow;
  previewTrigger?.focus({ preventScroll: true });
});
