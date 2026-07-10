/*
 * Promise-based confirmation dialog over the #confirmModal markup.
 *
 * Defines:    customConfirm()
 * Depends on: #confirmModal existing in the DOM (this file's parse-time
 *             initialisation reads it, so its <script> tag must come after
 *             the markup and before modal.js, which calls customConfirm).
 */

/*
 * Shows the confirmation dialog and resolves true/false for OK/Cancel.
 * Passing an empty cancelText hides the Cancel button (used for pure
 * notification dialogs, e.g. import success/error).
 *
 * Listeners are registered per invocation and removed on cleanup; there is
 * deliberately NO Escape/overlay dismissal for this dialog, so the promise
 * can only settle through the buttons. Do not add other close paths — the
 * caller would hang otherwise.
 */
function customConfirm({
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
  confirmClass = "",
}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const confirmMessage = modal.querySelector(".confirm-message");
    const okButton = modal.querySelector(".confirm-ok");
    const cancelButton = modal.querySelector(".confirm-cancel");

    confirmMessage.innerText = message;
    okButton.innerText = confirmText;

    if (cancelText) {
      cancelButton.style.display = "block";
      cancelButton.innerText = cancelText;
      cancelButton.addEventListener("click", onCancel);
    } else {
      cancelButton.style.display = "none";
    }

    if (confirmClass) {
      okButton.classList.add(confirmClass);
    }

    modal.style.display = "flex";

    function cleanUp() {
      okButton.removeEventListener("click", onOk);
      if (cancelText) {
        cancelButton.removeEventListener("click", onCancel);
      }
      modal.style.display = "none";
      if (confirmClass) {
        okButton.classList.remove(confirmClass);
      }
    }

    function onOk() {
      cleanUp();
      resolve(true);
    }

    function onCancel() {
      cleanUp();
      resolve(false);
    }

    okButton.addEventListener("click", onOk);
  });
}

/*
 * Enter confirms the dialog — but only when focus is INSIDE the confirm
 * modal (the contains() gate). Loosening it would make Enter presses in the
 * shortcut-editor inputs immediately re-confirm freshly opened dialogs.
 * Registered at parse time so it runs before the DOMContentLoaded-registered
 * keydown listeners in other files.
 */
function addEnterKeyListenerToConfirmDialog() {
  const modal = document.getElementById("confirmModal");
  const okButton = modal.querySelector(".confirm-ok");

  document.addEventListener("keydown", function (event) {
    if (
      event.key === "Enter" &&
      modal.style.display === "flex" &&
      modal.contains(event.target)
    ) {
      event.preventDefault();
      okButton.click();
    }
  });
}

addEnterKeyListenerToConfirmDialog();
