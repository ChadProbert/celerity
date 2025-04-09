/**
 * Feedback System
 *
 * Provides a complete user feedback collection system with emotion selection,
 * categorized feedback, and email submission functionality.
 *
 * This module:
 * - Manages the feedback modal UI
 * - Handles form submission and validation
 * - Submits feedback via EmailJS
 * - Provides visual feedback on submission status
 * - Supports different feedback types and emotion selection
 *
 * @requires EmailJS Service - https://www.emailjs.com/
 */

// Initialize EmailJS with the public key when the script loads
emailjs.init({
  publicKey: "YbS029vg8L512hed1",
  // Block headless browsers to prevent automated submissions
  blockHeadless: true,
});

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const feedbackButton = document.getElementById("feedbackButton");
  const feedbackModal = document.getElementById("feedbackModal");
  const closeModalBtn = document.getElementById("closeFeedbackModal");
  const cancelFeedback = document.getElementById("cancelFeedback");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackStatus = document.getElementById("feedbackStatus");
  const emotionLabels = document.querySelectorAll(".emotion-label");

  /**
   * Opens the feedback modal and resets form state.
   *
   * Displays the modal, clears any previous status messages,
   * and prepares the form for a new submission.
   */
  function openFeedbackModal() {
    feedbackModal.style.display = "flex";
    feedbackStatus.className = "feedback-status";
    feedbackStatus.textContent = "";
    feedbackStatus.style.display = "none";
  }

  /**
   * Closes the feedback modal.
   *
   * Hides the modal without affecting form data,
   * allowing users to resume later if desired.
   */
  function closeFeedbackModal() {
    feedbackModal.style.display = "none";
  }

  /**
   * Sets a status message on the feedback form.
   *
   * Displays a success or error message to provide
   * user feedback on form submission status.
   *
   * @param {string} message - The message to display
   * @param {string} type - The message type ('success' or 'error')
   */
  function setFeedbackStatus(message, type) {
    feedbackStatus.textContent = message;
    feedbackStatus.className = `feedback-status ${type}`;
    feedbackStatus.style.display = "block";
  }

  /**
   * Sets up emotion icon interactions and animations.
   *
   * Adds event listeners for emotion selection and handles
   * visual effects when emotions are selected.
   */
  function setupEmotionIconEffects() {
    // Handle checked state changes
    emotionLabels.forEach((label) => {
      const inputId = label.getAttribute("for");
      const input = document.getElementById(inputId);

      input.addEventListener("change", () => {
        // No need to do anything - CSS will handle the selected state
        // Just trigger the animation for a nice effect
        label.style.animation = "none";
        setTimeout(() => {
          label.style.animation = "";
        }, 10);
      });
    });

    // Initialize the selected state for any pre-checked emotion
    const checkedInput = document.querySelector(".emotion-input:checked");
    if (checkedInput) {
      // CSS will handle the selected state appearance
    }
  }

  /**
   * Handles feedback form submission.
   *
   * Validates form inputs, sends the feedback via email,
   * and provides appropriate user feedback on submission status.
   * On success, shows a confirmation message and closes the modal.
   *
   * @param {Event} e - The form submission event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const feedbackType = document.getElementById("feedbackType").value;
    const feedbackMessage = document.getElementById("feedbackMessage").value;
    const feedbackContact = document.getElementById("feedbackContact").value;
    const selectedEmotion = document.querySelector(
      'input[name="emotion"]:checked'
    ).value;

    // Validate required fields
    if (!feedbackType || !feedbackMessage) {
      setFeedbackStatus("Please fill in all required fields.", "error");
      return;
    }

    try {
      // Disable submit button and show loading state
      const submitButton = document.querySelector(".feedback-submit");
      submitButton.textContent = "Sending...";
      submitButton.disabled = true;

      // Prepare data for email service
      const formData = {
        type: feedbackType,
        message: feedbackMessage,
        contact: feedbackContact || "Anonymous",
        emotion: selectedEmotion,
        date: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
      };

      // Send using Email.js service
      await sendFeedbackEmail(formData);

      // Show success message
      setFeedbackStatus(
        "Thank you for your feedback! We've received your message.",
        "success"
      );

      // Reset form after successful submission
      feedbackForm.reset();

      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        closeFeedbackModal();
      }, 3000);
    } catch (error) {
      console.error("Error sending feedback:", error);
      setFeedbackStatus(
        "We couldn't send your feedback right now. This might be due to a temporary \
        connection issue or our email service has used up its monthly request limit. \
        However, your thoughts are important to us. You can contact us directly at \
        chadcprobert@gmail.com",
        "error"
      );
    } finally {
      // Re-enable submit button
      const submitButton = document.querySelector(".feedback-submit");
      submitButton.textContent = "Submit Feedback";
      submitButton.disabled = false;
    }
  }

  /**
   * Sends feedback via EmailJS service.
   *
   * Prepares the submission data and sends it to the configured
   * EmailJS service and template.
   *
   * @param {Object} formData - The form data to send
   * @param {string} formData.type - Feedback type/category
   * @param {string} formData.message - Feedback message content
   * @param {string} formData.contact - User contact information (optional)
   * @param {string} formData.emotion - Selected emotion
   * @param {string} formData.date - Submission date/time
   * @param {string} formData.userAgent - Browser user agent
   * @returns {Promise} - Promise that resolves when email is sent
   */
  function sendFeedbackEmail(formData) {
    // Prepare template parameters
    const templateParams = {
      feedbackType: formData.type,
      feedbackMessage: formData.message,
      feedbackContact: formData.contact,
      feedbackEmotion: formData.emotion,
      feedbackDate: formData.date,
      feedbackUserAgent: formData.userAgent,
    };

    // Send the email using EmailJS
    return emailjs
      .send("service_2t29umi", "template_feedback", templateParams)
      .then(function (response) {
        return response;
      })
      .catch(function (error) {
        console.error("Email sending failed:", error);
        throw error;
      });
  }

  // Event Listeners
  if (feedbackButton) {
    feedbackButton.addEventListener("click", openFeedbackModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeFeedbackModal);
  }

  if (cancelFeedback) {
    cancelFeedback.addEventListener("click", closeFeedbackModal);
  }

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", handleFormSubmit);
  }

  // Initialize the emotion icons
  setupEmotionIconEffects();

  /**
   * Modal Accessibility Features
   */

  // Close modal when clicking outside of it
  window.addEventListener("click", function (event) {
    if (event.target === feedbackModal) {
      closeFeedbackModal();
    }
  });

  // Close modal on escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && feedbackModal.style.display === "flex") {
      closeFeedbackModal();
    }
  });
});

/* References:
https://www.youtube.com/watch?v=BgVjild0C9A
https://www.emailjs.com/docs/sdk/installation/
https://www.emailjs.com/docs/sdk/send/
*/
