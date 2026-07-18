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
 * Listeners are registered per invocation and removed on cleanup. Escape
 * activates the visible Cancel button; notification dialogs without one
 * remain open. There is deliberately no overlay dismissal, so the promise
 * always settles through one of its button handlers.
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
    const previouslyFocusedElement = document.activeElement;

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
    okButton.focus();

    function cleanUp() {
      okButton.removeEventListener("click", onOk);
      if (cancelText) {
        cancelButton.removeEventListener("click", onCancel);
      }
      modal.style.display = "none";
      if (confirmClass) {
        okButton.classList.remove(confirmClass);
      }
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
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
 * Escape cancels the dialog and consumes the event so settings/help cannot
 * close underneath it. Enter confirms only when the event started inside the
 * dialog; this prevents an Enter press that opens a confirmation from also
 * confirming it. Focusing the OK button on open ensures subsequent Enter
 * presses start inside. Registered at parse time so it runs before the
 * DOMContentLoaded-registered keydown listeners in other files.
 */
function addKeyboardListenerToConfirmDialog() {
  const modal = document.getElementById("confirmModal");
  const okButton = modal.querySelector(".confirm-ok");
  const cancelButton = modal.querySelector(".confirm-cancel");

  document.addEventListener("keydown", function (event) {
    if (modal.style.display !== "flex") return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (cancelButton.style.display !== "none") {
        cancelButton.click();
      }
      return;
    }

    if (
      event.key === "Enter" &&
      modal.contains(event.target)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      okButton.click();
    }
  });
}

addKeyboardListenerToConfirmDialog();
