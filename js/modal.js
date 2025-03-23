/**
 * Modal functionality for the application.
 * Handles all modal-related interactions including settings and help modals.
 */
class ModalManager {
  /**
   * Initializes the ModalManager with all required DOM elements and event bindings.
   * Sets up the modal overlay, settings modal, help modal, and form controls.
   */
  constructor() {
    // Check if this is a first-time visitor - do this first before other initialization
    this.isFirstTimeVisitor = localStorage.getItem("hasVisitedBefore") === null;
    // Check if user has seen help but not settings yet
    this.hasSeenHelpOnly = localStorage.getItem("hasSeenHelpOnly") === "true";

    // DOM elements
    this.openModalBtn = document.getElementById("openModal");
    this.openHelpBtn = document.getElementById("openHelp");
    this.closeModalBtn = document.getElementById("closeModal");
    this.closeHelpModalBtn = document.getElementById("closeHelpModal");
    this.settingsModal = document.getElementById("settingsModal");
    this.helpModal = document.getElementById("helpModal");
    this.modalOverlay = document.getElementById("modalOverlay");
    this.shortcutList = document.getElementById("shortcutList");
    this.themeSelect = document.getElementById("themeSelect");
    this.resetButton = document.getElementById("resetSettings");
    this.addButton = document.getElementById("addShortcut");
    this.modalContent = document.querySelector(".modal-content");
    this.commandsComponent = document.querySelector("commands-component");
    this.scrollBottomHelpBtn = document.getElementById("scrollBottomHelp");

    // Track if we should focus on new shortcut inputs
    this.shouldFocusNewShortcut = false;

    // Store bound event handlers
    this.boundUpdateScrollButtonState = this.updateScrollButtonState.bind(this);

    // Default settings
    this.DEFAULT_SETTINGS = {
      theme: "dark",
      commands: new Map([
        [
          "g",
          { name: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" },
        ],
        [
          "y",
          {
            name: "YouTube",
            searchTemplate: "/results?search_query={}",
            suggestions: ["y/feed/subscriptions"],
            url: "https://youtube.com/",
          },
        ],
        [
          "m",
          {
            name: "Metabase",
            url: "https://metabase.hyperiondev.com/dashboard/157-my-dashboard",
          },
        ],
        ["d", { name: "Dropbox", url: "https://www.dropbox.com/work" }],
        [
          "a",
          {
            name: "Chat",
            searchTemplate: "/?q={}",
            url: "https://chat.openai.com/chat",
          },
        ],
        ["n", { name: "Netflix", url: "https://www.netflix.com/browse" }],
        [
          "c",
          {
            name: "Cogrammer",
            suggestions: [
              "c/reviewer/completed/",
              "c/reviewer/returned_reviews/",
            ],
            url: "https://hyperiondev.cogrammar.com/",
          },
        ],
        ["l", { name: "Localhost", url: "http://localhost:3000" }],
        ["gh", { name: "GitHub", url: "https://github.com/" }],
        [
          "k",
          {
            name: "Knowledge",
            url: "https://sites.google.com/hyperiondev.com/hyperiondev-kb/home?authuser=0",
          },
        ],
        [
          "r",
          {
            name: "Reddit",
            suggestions: [
              "r/r/webdev",
              "r/r/learnprogramming",
              "r/r/gamedev",
              "r/r/LifeProTips/",
            ],
            url: "https://reddit.com",
          },
        ],
        [
          "s",
          {
            name: "Spotify",
            searchTemplate: "/search/{}",
            url: "https://open.spotify.com",
          },
        ],
      ]),
    };

    // Bind methods
    this.handleFocusNewShortcut = this.handleFocusNewShortcut.bind(this);
    this.openSettingsModal = this.openSettingsModal.bind(this);
    this.openHelpModalHandler = this.openHelpModalHandler.bind(this);
    this.closeSettingsModal = this.closeSettingsModal.bind(this);
    this.closeHelpModal = this.closeHelpModal.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.renderShortcuts = this.renderShortcuts.bind(this);
    this.resetSettings = this.resetSettings.bind(this);
    this.addNewShortcutField = this.addNewShortcutField.bind(this);
    this.checkModalScrollability = this.checkModalScrollability.bind(this);
    this.scrollToBottomOfHelp = this.scrollToBottomOfHelp.bind(this);
    this.updateScrollButtonState = this.updateScrollButtonState.bind(this);
    this.forceModalScrollToTop = this.forceModalScrollToTop.bind(this);

    this.initializeEventListeners();
    this.initializeSettings();
  }

  /**
   * Sets up all event listeners for the modal functionality.
   * Includes opening/closing modals, resetting settings, and keyboard shortcuts.
   */
  initializeEventListeners() {
    // Listen for the custom event
    document.addEventListener("focusNewShortcut", this.handleFocusNewShortcut);

    // Add listener for resetting first-time visitor status (for testing)
    document.addEventListener(
      "resetFirstTimeVisitor",
      this.resetFirstTimeVisitor.bind(this)
    );

    // Open Settings Modal
    this.openModalBtn.addEventListener("click", this.openSettingsModal);

    // Open Help Modal
    this.openHelpBtn.addEventListener("click", this.openHelpModalHandler);

    // Close Settings Modal
    this.closeModalBtn.addEventListener("click", this.closeSettingsModal);

    // Close Help Modal
    this.closeHelpModalBtn.addEventListener("click", this.closeHelpModal);

    // Close Modal (clicking outside the modal content)
    window.addEventListener("click", this.handleWindowClick);

    // Close Modal with escape key
    document.addEventListener("keydown", this.handleKeydown);

    // Reset settings button
    this.resetButton.addEventListener("click", this.resetSettings);

    // Scroll to bottom button in help modal
    if (this.scrollBottomHelpBtn) {
      this.scrollBottomHelpBtn.addEventListener(
        "click",
        this.scrollToBottomOfHelp
      );
    }
  }

  /**
   * Initializes the application settings by loading saved commands
   * and rendering shortcuts and the commands component.
   */
  initializeSettings() {
    // Initialize by loading commands
    loadCommands();
    this.renderShortcuts();
    this.commandsComponent.render();

    // Debug first-time visitor status
    console.log("First time visitor:", this.isFirstTimeVisitor);
    console.log("Has seen help only:", this.hasSeenHelpOnly);

    // Add animation for first-time visitors (to compass button)
    if (this.isFirstTimeVisitor && this.openHelpBtn) {
      console.log("Applying animation to help button");

      // Apply animation with a slight delay
      setTimeout(() => {
        this.openHelpBtn.classList.add("pulse-border");
      }, 1000);
    }
    // Add animation for users who have seen help but not settings
    else if (this.hasSeenHelpOnly && this.openModalBtn) {
      console.log("Applying animation to settings button");

      // Apply animation with a slight delay
      setTimeout(() => {
        this.openModalBtn.classList.add("pulse-border");
      }, 1000);
    }
  }

  /**
   * FOR TESTING: Resets the first-time visitor flag
   * This can be called from the console: document.dispatchEvent(new CustomEvent('resetFirstTimeVisitor'))
   */
  resetFirstTimeVisitor() {
    localStorage.removeItem("hasVisitedBefore");
    localStorage.removeItem("hasSeenHelpOnly");
    this.isFirstTimeVisitor = true;
    this.hasSeenHelpOnly = false;

    // Remove animation classes from both buttons
    if (this.openHelpBtn) {
      this.openHelpBtn.classList.remove("pulse-border");
    }
    if (this.openModalBtn) {
      this.openModalBtn.classList.remove("pulse-border");
    }

    console.log(
      "First-time visitor status reset. Reload the page to see the animation."
    );
  }

  /**
   * Event handler for the focusNewShortcut custom event.
   * Sets the flag to focus on the new shortcut input field.
   */
  handleFocusNewShortcut() {
    this.shouldFocusNewShortcut = true;
  }

  /**
   * Opens the settings modal, initializes shortcuts, and handles focus management.
   */
  openSettingsModal() {
    // If user has seen help only, mark as having seen settings too
    if (this.hasSeenHelpOnly) {
      localStorage.removeItem("hasSeenHelpOnly");
      this.hasSeenHelpOnly = false;

      // Remove animation from settings button
      if (this.openModalBtn) {
        this.openModalBtn.classList.remove("pulse-border");
      }
    }

    // Close search dialog if it's open
    const searchComponent = document.querySelector("search-component");
    if (searchComponent) {
      const dialog = searchComponent.shadowRoot.querySelector(".dialog");
      if (dialog && dialog.open) {
        dialog.close();
      }
    }

    // Set focus to the last shortcut element by default
    this.shouldFocusNewShortcut = true;

    this.settingsModal.style.display = "flex";
    this.modalOverlay.classList.add("active"); // Activate background overlay
    this.renderShortcuts(); // Refresh shortcuts when opening modal

    // Focus based on context
    setTimeout(() => {
      if (this.shouldFocusNewShortcut) {
        // Focus the first input of the new shortcut section
        const lastShortcutItem = this.shortcutList.lastElementChild;
        if (lastShortcutItem) {
          const firstInput = lastShortcutItem.querySelector(".key-input");
          if (firstInput) {
            firstInput.focus();
          }
        }
        this.shouldFocusNewShortcut = false; // Reset the flag
      } else {
        // Default focus on theme dropdown
        if (this.themeSelect) {
          this.themeSelect.focus();
        }
      }

      // Initialize scrollability and shadow
      this.checkModalScrollability();

      // Force scroll to top after all other operations
      this.forceModalScrollToTop();
    }, 100); // A short delay to ensure the modal is fully rendered
  }

  /**
   * Opens the help modal and initializes its content.
   */
  openHelpModalHandler() {
    // Just remove the animation class from help button for first-time visitors
    if (this.isFirstTimeVisitor && this.openHelpBtn) {
      this.openHelpBtn.classList.remove("pulse-border");
    }

    // Close search dialog if it's open
    const searchComponent = document.querySelector("search-component");
    if (searchComponent) {
      const dialog = searchComponent.shadowRoot.querySelector(".dialog");
      if (dialog && dialog.open) {
        dialog.close();
      }
    }

    this.helpModal.style.display = "flex";
    this.modalOverlay.classList.add("active");

    // Reset scroll position in help modal
    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (helpModalContent) {
      helpModalContent.scrollTop = 0;

      // Always add scrollable class to get consistent styling
      helpModalContent.classList.add("scrollable");

      // Reset animation by removing and re-adding class
      if (this.scrollBottomHelpBtn) {
        this.scrollBottomHelpBtn.classList.remove("animate-pulse");
        // Force reflow
        void this.scrollBottomHelpBtn.offsetWidth;
        this.scrollBottomHelpBtn.classList.add("animate-pulse");
      }

      // Initialize scroll button state
      this.updateScrollButtonState();

      // Add scroll event listener to monitor position
      helpModalContent.addEventListener(
        "scroll",
        this.boundUpdateScrollButtonState
      );
    }

    // Focus on close button for accessibility
    if (this.closeHelpModalBtn) {
      setTimeout(() => {
        this.closeHelpModalBtn.focus();
      }, 100);
    }
  }

  /**
   * Closes the settings modal and removes the overlay.
   */
  closeSettingsModal() {
    this.settingsModal.style.display = "none";
    this.modalOverlay.classList.remove("active");
  }

  /**
   * Closes the help modal and removes the overlay.
   */
  closeHelpModal() {
    // Remove scroll event listener
    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (helpModalContent) {
      helpModalContent.removeEventListener(
        "scroll",
        this.boundUpdateScrollButtonState
      );
    }

    // If this is a first-time visitor, update the localStorage flags AFTER they've seen the help content
    if (this.isFirstTimeVisitor) {
      localStorage.setItem("hasVisitedBefore", "true");
      localStorage.setItem("hasSeenHelpOnly", "true");
      this.isFirstTimeVisitor = false;
      this.hasSeenHelpOnly = true;

      console.log(
        "First-time visitor has seen help, now showing settings pulse"
      );
    }

    this.helpModal.style.display = "none";
    this.modalOverlay.classList.remove("active");

    // If user has seen help but hasn't seen settings yet, add animation to settings button
    if (this.hasSeenHelpOnly && this.openModalBtn) {
      setTimeout(() => {
        this.openModalBtn.classList.add("pulse-border");
      }, 500);
    }
  }

  /**
   * Handles clicks on the window to close modals when clicking outside modal content.
   * @param {Event} event - The click event
   */
  handleWindowClick(event) {
    // If clicking on help modal or overlay while help modal is open
    if (
      this.helpModal.style.display === "flex" &&
      (event.target === this.helpModal || event.target === this.modalOverlay)
    ) {
      // Update first-time visitor state for help modal exit
      if (this.isFirstTimeVisitor) {
        localStorage.setItem("hasVisitedBefore", "true");
        localStorage.setItem("hasSeenHelpOnly", "true");
        this.isFirstTimeVisitor = false;
        this.hasSeenHelpOnly = true;

        // Add animation to settings button
        setTimeout(() => {
          if (this.openModalBtn) {
            this.openModalBtn.classList.add("pulse-border");
          }
        }, 500);
      }
    }

    // Handle settings modal clicks (no change to this part)
    if (
      event.target === this.settingsModal ||
      event.target === this.modalOverlay
    ) {
      this.settingsModal.style.display = "none";
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active"); // Deactivate background overlay
    }

    // Handle help modal clicks (already managed earlier in the function)
    if (event.target === this.helpModal) {
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }
  }

  /**
   * Handles keyboard events to close modals when pressing Escape.
   * @param {KeyboardEvent} e - The keyboard event
   */
  handleKeydown(e) {
    if (e.key === "Escape") {
      // If help modal is open and we're a first-time visitor
      if (this.helpModal.style.display === "flex" && this.isFirstTimeVisitor) {
        // Update first-time visitor state
        localStorage.setItem("hasVisitedBefore", "true");
        localStorage.setItem("hasSeenHelpOnly", "true");
        this.isFirstTimeVisitor = false;
        this.hasSeenHelpOnly = true;

        // Add animation to settings button
        setTimeout(() => {
          if (this.openModalBtn) {
            this.openModalBtn.classList.add("pulse-border");
          }
        }, 500);
      }

      // Close all modals
      this.settingsModal.style.display = "none";
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }
  }

  /**
   * Renders the list of shortcuts in the modal.
   * Clears the current list, adds all existing shortcuts,
   * and adds a new shortcut field at the end.
   */
  renderShortcuts() {
    this.shortcutList.innerHTML = "";

    // Add each existing shortcut to the list
    for (const [key, value] of COMMANDS.entries()) {
      this.shortcutList.appendChild(this.createShortcutItem(key, value));
    }

    // Add new shortcut field
    this.addNewShortcutField();
  }

  /**
   * Creates a DOM element for a shortcut item with edit/delete functionality.
   * @param {string} key - The shortcut key
   * @param {Object} value - The shortcut value object containing name and URL
   * @returns {HTMLElement} The created shortcut item DOM element
   */
  createShortcutItem(key, value) {
    const shortcutItem = document.createElement("div");
    shortcutItem.classList.add("shortcut-item");

    // Create input for key
    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.classList.add("key-input");
    keyInput.value = key;
    keyInput.readOnly = true;
    shortcutItem.appendChild(keyInput);

    // Create input for name
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.classList.add("name-input");
    nameInput.value = value.name || "";
    nameInput.readOnly = true;
    shortcutItem.appendChild(nameInput);

    // Create input for URL
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.classList.add("value-input");
    valueInput.value = value.url || "";
    valueInput.readOnly = true;
    shortcutItem.appendChild(valueInput);

    // Create edit/save button
    const actionButton = document.createElement("button");
    actionButton.classList.add("edit-button");
    actionButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
    actionButton.title = "Edit shortcut";
    shortcutItem.appendChild(actionButton);

    // Create delete button
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteButton.title = "Delete shortcut";
    shortcutItem.appendChild(deleteButton);

    /**
     * Enables edit mode for this shortcut item.
     * Makes inputs editable, changes the action button to a save button,
     * and focuses the key input.
     */
    const enableEditMode = () => {
      keyInput.readOnly = false;
      nameInput.readOnly = false;
      valueInput.readOnly = false;
      keyInput.focus();
      actionButton.classList.remove("edit-button");
      actionButton.classList.add("save-button");
      actionButton.innerHTML = '<i class="fa-solid fa-check"></i>';
      actionButton.title = "Save changes";
    };

    /**
     * Saves the edited shortcut after validation.
     * Handles key conflicts with confirmation and updates the COMMANDS map.
     * @returns {Promise<boolean>} True if save was successful, false otherwise
     */
    const saveEditedShortcut = async () => {
      const newKey = keyInput.value.trim();
      const newName = nameInput.value.trim();
      const newValue = valueInput.value.trim();

      // Validation
      if (!newKey || !newName || !newValue) {
        return false;
      }

      // URL validation - check if URL starts with http:// or https://
      if (!newValue.startsWith("http://") && !newValue.startsWith("https://")) {
        const shouldProceed = await customConfirm({
          message: `URL should start with "http://" or "https://". Would you like to add "https://" automatically?`,
          confirmText: "Add https://",
          cancelText: "Edit URL",
          confirmClass: "confirm-url-validation",
        });

        if (shouldProceed) {
          // Add https:// prefix automatically
          valueInput.value = `https://${newValue}`;
          return saveEditedShortcut(); // Call function again with updated URL
        } else {
          valueInput.focus();
          return false;
        }
      }

      // Check if key changed and if new key already exists
      if (newKey !== key && COMMANDS.has(newKey)) {
        const shouldOverride = await customConfirm({
          message: `The shortcut key "${newKey}" already exists. Are you sure you want to override it?`,
          confirmText: "Override",
          cancelText: "Cancel",
          confirmClass: "confirm-override",
        });

        if (!shouldOverride) {
          return false;
        }
      }

      // Delete old key if changed
      if (newKey !== key) {
        COMMANDS.delete(key);
      }

      // Update command
      COMMANDS.set(newKey, {
        ...value,
        name: newName,
        url: valueInput.value.trim(), // Use the potentially modified URL
      });

      // Save and refresh
      saveCommands();
      this.renderShortcuts();
      this.commandsComponent.render();
      return true;
    };

    /**
     * Deletes a shortcut after confirmation.
     * Shows a warning dialog and removes the shortcut if confirmed.
     */
    const deleteShortcut = async () => {
      const confirmed = await customConfirm({
        message: `Are you sure you want to delete the "${value.name}" shortcut?`,
        confirmText: "Delete",
        cancelText: "Cancel",
        confirmClass: "confirm-warning",
      });

      if (confirmed) {
        COMMANDS.delete(key);
        saveCommands();
        this.renderShortcuts();
        this.commandsComponent.render();
      }
    };

    // Add event listeners
    actionButton.addEventListener("click", function () {
      if (actionButton.classList.contains("edit-button")) {
        enableEditMode();
      } else {
        saveEditedShortcut();
      }
    });

    deleteButton.addEventListener("click", deleteShortcut);

    // Add Enter key support for saving edits
    [keyInput, nameInput, valueInput].forEach((input) => {
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !input.readOnly) {
          e.preventDefault();
          const success = await saveEditedShortcut();
          if (!success) {
            // Focus the first empty input
            if (!keyInput.value.trim()) keyInput.focus();
            else if (!nameInput.value.trim()) nameInput.focus();
            else if (!valueInput.value.trim()) valueInput.focus();
          }
        }
      });
    });

    return shortcutItem;
  }

  /**
   * Adds a new shortcut field to the shortcut list.
   * Creates a form for adding new shortcuts with key, name, and URL inputs.
   */
  addNewShortcutField() {
    const newShortcutItem = document.createElement("div");
    newShortcutItem.classList.add("shortcut-item");

    // Create input for key
    const newKeyInput = document.createElement("input");
    newKeyInput.type = "text";
    newKeyInput.classList.add("key-input");
    newKeyInput.placeholder = "Key";
    newShortcutItem.appendChild(newKeyInput);

    // Create input for name
    const newNameInput = document.createElement("input");
    newNameInput.type = "text";
    newNameInput.classList.add("name-input");
    newNameInput.placeholder = "Name";
    newShortcutItem.appendChild(newNameInput);

    // Create input for URL
    const newValueInput = document.createElement("input");
    newValueInput.type = "text";
    newValueInput.classList.add("value-input");
    newValueInput.placeholder = "URL";
    newShortcutItem.appendChild(newValueInput);

    // Create add button
    const addButton = document.createElement("button");
    addButton.classList.add("add-button");
    addButton.innerHTML = '<i class="fa-solid fa-plus"></i>';
    addButton.title = "Add shortcut";
    newShortcutItem.appendChild(addButton);

    /**
     * Creates a new shortcut from the input values.
     * Validates inputs and handles key conflicts with confirmation.
     * @returns {Promise<boolean>} True if creation was successful, false otherwise
     */
    const createNewShortcut = async () => {
      const newKey = newKeyInput.value.trim();
      const newName = newNameInput.value.trim();
      const newValue = newValueInput.value.trim();

      // Check all fields
      if (newKeyInput.value && newNameInput.value && newValueInput.value) {
        // URL validation - check if URL starts with http:// or https://
        if (
          !newValue.startsWith("http://") &&
          !newValue.startsWith("https://")
        ) {
          const shouldProceed = await customConfirm({
            message: `URL should start with "http://" or "https://". Would you like to add "https://" automatically?`,
            confirmText: "Add https://",
            cancelText: "Edit URL",
            confirmClass: "confirm-url-validation",
          });

          if (shouldProceed) {
            // Add https:// prefix automatically
            newValueInput.value = `https://${newValue}`;
            return createNewShortcut(); // Call function again with updated URL
          } else {
            newValueInput.focus();
            return false;
          }
        }

        // If the shortcut key already exists, show the custom confirmation modal.
        if (COMMANDS.has(newKeyInput.value)) {
          const shouldOverride = await customConfirm({
            message: `The shortcut key "${newKeyInput.value}" already exists. Are you sure you want to override it?`,
            confirmText: "Override",
            cancelText: "Cancel",
            confirmClass: "confirm-override",
          });
          if (!shouldOverride) {
            return false; // Do not override if the user cancels.
          }
        }
        COMMANDS.set(newKeyInput.value, {
          name: newNameInput.value,
          url: newValueInput.value,
        });
        saveCommands();
        this.renderShortcuts();
        this.commandsComponent.render();
        return true;
      }
      return false;
    };

    // Add button click handler
    addButton.addEventListener("click", async () => {
      const success = await createNewShortcut();
      if (!success) {
        if (!newKeyInput.value) {
          newKeyInput.focus();
        } else if (!newNameInput.value) {
          newNameInput.focus();
        } else {
          newValueInput.focus();
        }
      }
    });

    // Add Enter key support for adding shortcuts
    [newKeyInput, newNameInput, newValueInput].forEach((input) => {
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const success = await createNewShortcut();
          if (!success) {
            if (!newKeyInput.value) {
              newKeyInput.focus();
            } else if (!newNameInput.value) {
              newNameInput.focus();
            } else {
              newValueInput.focus();
            }
          }
        }
      });
    });

    this.shortcutList.appendChild(newShortcutItem);
  }

  /**
   * Resets all settings to default values after confirmation.
   * Resets the theme and all commands to their default values.
   */
  async resetSettings() {
    const confirmed = await customConfirm({
      message:
        "Are you sure you want to reset all settings to default? This cannot be undone.",
      confirmText: "Reset",
      cancelText: "Cancel",
      confirmClass: "confirm-warning",
    });

    if (confirmed) {
      // Reset theme
      localStorage.setItem("selectedTheme", this.DEFAULT_SETTINGS.theme);
      document.documentElement.setAttribute(
        "data-theme",
        this.DEFAULT_SETTINGS.theme
      );
      document.getElementById("themeSelect").value =
        this.DEFAULT_SETTINGS.theme;

      // Reset tab behavior
      localStorage.setItem("tabBehavior", "current"); // Default to current tab
      CONFIG.openLinksInNewTab = false;
      document.getElementById("tabBehaviorCurrent").checked = true;
      document.getElementById("tabBehaviorNew").checked = false;

      // Reset search engine
      localStorage.setItem("searchEngine", "google"); // Default to Google
      CONFIG.defaultSearchEngine = "google";
      CONFIG.defaultSearchTemplate = CONFIG.searchEngineTemplates.google;
      document.getElementById("searchEngineGoogle").checked = true;
      document.getElementById("searchEngineDuckDuckGo").checked = false;

      // Reset commands
      COMMANDS.clear();
      this.DEFAULT_SETTINGS.commands.forEach((value, key) => {
        COMMANDS.set(key, value);
      });
      saveCommands();
      this.renderShortcuts();
      this.commandsComponent.render();
    }
  }

  /**
   * Checks if the modal content needs to be scrollable and adds the scrollable class.
   */
  checkModalScrollability() {
    // Ensure we have the modal content reference
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (modalContent) {
      // Add scrollable class for tall content or many commands
      if (
        modalContent.scrollHeight > window.innerHeight * 0.8 ||
        COMMANDS.size >= 8
      ) {
        modalContent.classList.add("scrollable");
      } else {
        modalContent.classList.remove("scrollable");
      }
    }
  }

  /**
   * Updates the scroll button state based on current scroll position.
   * Changes between scroll-to-bottom and scroll-to-top functionality.
   */
  updateScrollButtonState() {
    if (!this.scrollBottomHelpBtn) return;

    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (!helpModalContent) return;

    const scrollPosition = helpModalContent.scrollTop;
    const scrollHeight = helpModalContent.scrollHeight;
    const clientHeight = helpModalContent.clientHeight;

    // Check if we're near the bottom (within 100px)
    const isNearBottom = scrollPosition + clientHeight >= scrollHeight - 100;

    if (isNearBottom) {
      // Change to scroll-to-top mode
      this.scrollBottomHelpBtn.classList.add("scroll-top-mode");
      this.scrollBottomHelpBtn.setAttribute("data-tooltip", "Scroll to Top");
    } else {
      // Change to scroll-to-bottom mode
      this.scrollBottomHelpBtn.classList.remove("scroll-top-mode");
      this.scrollBottomHelpBtn.setAttribute("data-tooltip", "Scroll to Bottom");
    }
  }

  /**
   * Handles scrolling in the help modal.
   * Scrolls to bottom or top depending on current position.
   */
  scrollToBottomOfHelp() {
    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (!helpModalContent) return;

    // Get current button state
    const isInTopMode =
      this.scrollBottomHelpBtn.classList.contains("scroll-top-mode");

    if (isInTopMode) {
      // Scroll to top
      helpModalContent.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Scroll to bottom
      helpModalContent.scrollTo({
        top: helpModalContent.scrollHeight,
        behavior: "smooth",
      });
    }
  }

  /**
   * Forces the modal to scroll to the top and prevents any automatic scrolling.
   * This is used to ensure the modal always starts at the top when opened.
   * It's applied after focus operations to override browser's automatic scroll behavior.
   */
  forceModalScrollToTop() {
    // Get a direct reference to the modal content for the settings modal
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (!modalContent) return;

    // Apply the scroll reset multiple times with increasing delays
    // This ensures it overrides any automatic scrolling due to focus or rendering
    const applyScrollReset = (delay) => {
      setTimeout(() => {
        modalContent.scrollTop = 0;
      }, delay);
    };

    // Apply multiple times with different delays to ensure it works
    applyScrollReset(10);
    applyScrollReset(50);
    applyScrollReset(100);
    applyScrollReset(200);
  }
}

/**
 * Displays a customizable confirmation dialog with custom text and styling.
 * @param {Object} options - Configuration options for the confirmation dialog
 * @param {string} options.message - The message to display in the dialog
 * @param {string} [options.confirmText="Yes"] - The text for the confirm button
 * @param {string} [options.cancelText="Cancel"] - The text for the cancel button
 * @param {string} [options.confirmClass=""] - CSS class to apply to the confirm button
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise
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
    cancelButton.innerText = cancelText;

    if (confirmClass) {
      okButton.classList.add(confirmClass);
    }

    modal.style.display = "flex";

    /**
     * Cleanup function to hide modal and remove listeners
     */
    function cleanUp() {
      okButton.removeEventListener("click", onOk);
      cancelButton.removeEventListener("click", onCancel);
      modal.style.display = "none";
      if (confirmClass) {
        okButton.classList.remove(confirmClass);
      }
    }

    /**
     * Handler for the OK button click
     */
    function onOk() {
      cleanUp();
      resolve(true);
    }

    /**
     * Handler for the Cancel button click
     */
    function onCancel() {
      cleanUp();
      resolve(false);
    }

    okButton.addEventListener("click", onOk);
    cancelButton.addEventListener("click", onCancel);
  });
}

// Initialize on document load
document.addEventListener("DOMContentLoaded", () => {
  new ModalManager();
});
