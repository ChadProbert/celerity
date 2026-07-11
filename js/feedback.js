/*
 * Feedback modal: form validation, emotion picker, and email submission
 * via EmailJS (https://www.emailjs.com/docs/sdk/send/).
 *
 * Defines:    nothing global (everything lives in the DOMContentLoaded
 *             closure below)
 * Depends on: emailjs (vendor/email.min.js, loaded in <head>), the
 *             #feedbackModal markup in index.html
 */

emailjs.init({
  publicKey: "YbS029vg8L512hed1",
  // Block headless browsers to prevent automated submissions
  blockHeadless: true,
});

document.addEventListener("DOMContentLoaded", function () {
  const feedbackButton = document.getElementById("feedbackButton");
  const feedbackModal = document.getElementById("feedbackModal");
  const closeModalBtnPage = document.getElementById("closeFeedbackModalPage");
  const cancelFeedback = document.getElementById("cancelFeedback");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackStatus = document.getElementById("feedbackStatus");
  const emotionLabels = document.querySelectorAll(".emotion-label");

  function openFeedbackModal() {
    feedbackModal.style.display = "flex";
    feedbackStatus.className = "feedback-status";
    feedbackStatus.textContent = "";
    feedbackStatus.style.display = "none";
  }

  /* Hides the modal without clearing the form, so a draft can be resumed. */
  function closeFeedbackModal() {
    feedbackModal.style.display = "none";
  }

  function setFeedbackStatus(message, type) {
    feedbackStatus.textContent = message;
    feedbackStatus.className = `feedback-status ${type}`;
    feedbackStatus.style.display = "block";
  }

  function setupEmotionIconEffects() {
    emotionLabels.forEach((label) => {
      const inputId = label.getAttribute("for");
      const input = document.getElementById(inputId);

      input.addEventListener("change", () => {
        // Clear and restore the animation so re-selecting replays it
        label.style.animation = "none";
        setTimeout(() => {
          label.style.animation = "";
        }, 10);
      });
    });
  }

  /*
   * Validates and submits the form. Native `required` constraints run
   * first; this handler re-validates trimmed values (whitespace-only
   * messages pass the native check but not this one).
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const feedbackType = document.getElementById("feedbackType").value;
    const feedbackMessage = document
      .getElementById("feedbackMessage")
      .value.trim();
    const feedbackContact = document.getElementById("feedbackContact").value;
    const selectedEmotionInput = document.querySelector(
      'input[name="emotion"]:checked'
    );
    const selectedEmotion = selectedEmotionInput
      ? selectedEmotionInput.value
      : "";

    if (!feedbackType || !feedbackMessage) {
      setFeedbackStatus(
        "Please select a feedback type and enter your message.",
        "error"
      );
      return;
    }

    try {
      const submitButton = document.querySelector(".feedback-submit");
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;

      const formData = {
        type: feedbackType,
        message: feedbackMessage,
        contact: feedbackContact || "Anonymous",
        emotion: selectedEmotion,
        date: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
      };

      await sendFeedbackEmail(formData);

      setFeedbackStatus(
        "Thank you for your feedback! We've received your message.",
        "success"
      );

      feedbackForm.reset();
    } catch (error) {
      console.error("Error sending feedback:", error);
      setFeedbackStatus(
        "We couldn't send your feedback right now. Please try again or contact us " +
          "directly at ",
        "error"
      );

      const emailLink = document.createElement("a");
      emailLink.href = "mailto:chadcprobert@gmail.com";
      emailLink.textContent = "chadcprobert@gmail.com";
      feedbackStatus.append(emailLink, " if this issue persists.");
    } finally {
      // Historical quirk, preserved: the initial markup label is "Submit",
      // so the label permanently changes after the first attempt.
      const submitButton = document.querySelector(".feedback-submit");
      submitButton.textContent = "Submit Feedback";
      submitButton.disabled = false;
    }
  }

  function sendFeedbackEmail(formData) {
    const templateParams = {
      feedbackType: formData.type,
      feedbackMessage: formData.message,
      feedbackContact: formData.contact,
      feedbackEmotion: formData.emotion,
      feedbackDate: formData.date,
      feedbackUserAgent: formData.userAgent,
    };

    return emailjs
      .send("service_2t29umi", "template_feedback", templateParams)
      .catch(function (error) {
        console.error("Email sending failed:", error);
        throw error;
      });
  }

  if (feedbackButton) {
    feedbackButton.addEventListener("click", openFeedbackModal);
  }

  if (closeModalBtnPage) {
    closeModalBtnPage.addEventListener("click", closeFeedbackModal);
  }

  if (cancelFeedback) {
    cancelFeedback.addEventListener("click", closeFeedbackModal);
  }

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFormSubmit);
  }

  setupEmotionIconEffects();

  // This modal owns its own Escape handling; modal.js's Escape listener
  // deliberately never touches it.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && feedbackModal.style.display === "flex") {
      closeFeedbackModal();
    }
  });
});
