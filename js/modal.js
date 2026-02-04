/**
 * Modal Manager
 *
 * Responsible for handling all modal-related interactions throughout the application.
 * This class manages the settings modal, help guide modal, confirmation dialogs,
 * and all related event listeners and interactions.
 *
 * Features:
 * - Opening and closing settings modal
 * - Opening and closing help documentation modal
 * - Handling keyboard shortcuts for modal interaction (Escape to close)
 * - Managing modal scroll functionality
 * - First-time visitor detection and guidance
 * - Settings reset functionality
 * - Shortcut management (add, edit, delete)
 */
class ModalManager {
  /**
   * Initializes the ModalManager with all required DOM elements and event bindings.
   *
   * The constructor:
   * 1. Detects if this is a first-time visitor
   * 2. Fetches all required DOM elements
   * 3. Binds all methods to maintain 'this' context
   * 4. Sets up default settings
   * 5. Initializes event listeners and settings
   *
   * @throws {Error} If critical DOM elements cannot be found
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
    this.exportButton = document.getElementById("exportConfig");
    this.importButton = document.getElementById("importConfigBtn");
    this.importFileInput = document.getElementById("importConfigFile");
    this.addButton = document.getElementById("addShortcut");
    this.modalContent = document.querySelector(".modal-content");
    this.commandsComponent = document.querySelector("commands-component");
    this.scrollTopBtn = document.getElementById("scrollTopHelp");
    this.scrollBottomBtn = document.getElementById("scrollBottomHelp");
    this.helpScrollButtonsContainer =
      document.getElementById("helpScrollButtons");
    this.scrollTopSettingsBtn = document.getElementById("scrollTopSettings");
    this.scrollBottomSettingsBtn = document.getElementById(
      "scrollBottomSettings"
    );
    this.settingsScrollButtonsContainer = document.getElementById(
      "settingsScrollButtons"
    );

    // Bind all methods to this instance
    this.openSettingsModal = this.openSettingsModal.bind(this);
    this.openHelpModalHandler = this.openHelpModalHandler.bind(this);
    this.closeSettingsModal = this.closeSettingsModal.bind(this);
    this.closeHelpModal = this.closeHelpModal.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.renderShortcuts = this.renderShortcuts.bind(this);
    this.resetSettings = this.resetSettings.bind(this);
    this.exportConfig = this.exportConfig.bind(this);
    this.importConfig = this.importConfig.bind(this);
    this.handleImportFile = this.handleImportFile.bind(this);
    this.addNewShortcutField = this.addNewShortcutField.bind(this);
    this.checkModalScrollability = this.checkModalScrollability.bind(this);
    this.updateScrollButtonState = this.updateScrollButtonState.bind(this);
    this.boundUpdateScrollButtonState = this.updateScrollButtonState.bind(this);
    this.scrollHelpModal = this.scrollHelpModal.bind(this);
    this.forceModalScrollToTop = this.forceModalScrollToTop.bind(this);
    this.boundUpdateSettingsScrollButtonState =
      this.updateSettingsScrollButtonState.bind(this);

    // Default settings
    this.DEFAULT_SETTINGS = {
      theme: "system",
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
        [
          "d",
          {
            name: "Dropbox",
            url: "https://www.dropbox.com/work",
            searchTemplate: "/search/work?path=%2F&query={}",
          },
        ],
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
        [
          "gh",
          {
            name: "GitHub",
            url: "https://github.com/",
            searchTemplate: "/hyperiondev-bootcamps/{}",
          },
        ],
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

    this.initializeEventListeners();
    this.initializeSettings();
  }

  /**
   * Sets up all event listeners for the modal functionality.
   * Includes opening/closing modals, resetting settings, and keyboard shortcuts.
   */
  initializeEventListeners() {
    // Open Settings Modal
    if (this.openModalBtn) {
      this.openModalBtn.addEventListener("click", this.openSettingsModal);
    } else {
      console.error("Settings button element not found!");
    }

    // Open Help Modal
    if (this.openHelpBtn) {
      this.openHelpBtn.addEventListener("click", this.openHelpModalHandler);
    } else {
      console.error("Help button element not found!");
    }

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

    // Export/Import config buttons
    this.exportButton.addEventListener("click", this.exportConfig);
    this.importButton.addEventListener("click", this.importConfig);
    this.importFileInput.addEventListener("change", this.handleImportFile);

    // Scroll buttons in help modal
    if (this.scrollTopBtn && this.scrollBottomBtn) {
      this.scrollTopBtn.addEventListener("click", () =>
        this.scrollHelpModal("top")
      );
      this.scrollBottomBtn.addEventListener("click", () =>
        this.scrollHelpModal("bottom")
      );
    }

    // Scroll buttons in settings modal
    if (this.scrollTopSettingsBtn && this.scrollBottomSettingsBtn) {
      this.scrollTopSettingsBtn.addEventListener("click", () =>
        this.scrollSettingsModal("top")
      );
      this.scrollBottomSettingsBtn.addEventListener("click", () =>
        this.scrollSettingsModal("bottom")
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

    // If this is a first-time visitor, add animation to help button
    if (this.isFirstTimeVisitor && this.openHelpBtn) {
      // Apply animation with a slight delay
      setTimeout(() => {
        this.openHelpBtn.classList.add("pulse-border");
      }, 200);
    }
    // Add animation for users who have seen help but not settings
    else if (this.hasSeenHelpOnly && this.openModalBtn) {
      // Apply animation with a slight delay
      setTimeout(() => {
        this.openModalBtn.classList.add("pulse-border");
      }, 200);
    }
  }

  /**
   * Opens the settings modal and initializes its content.
   *
   * This method:
   * - Updates first-time visitor state if needed
   * - Closes the search dialog if open
   * - Displays the settings modal and overlay
   * - Refreshes the shortcuts list
   * - Sets up scrolling functionality
   * - Positions the modal at the top
   * - Adds scroll event listeners
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

    this.settingsModal.style.display = "flex";
    this.modalOverlay.classList.add("active");
    this.renderShortcuts(); // Refresh shortcuts when opening modal

    // Add scroll buttons to settings modal
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.classList.add("scrollable");

      // Reset scroll position to top when opening the modal
      modalContent.scrollTop = 0;

      if (this.settingsScrollButtonsContainer) {
        this.settingsScrollButtonsContainer.classList.remove("animate-pulse");
        void this.settingsScrollButtonsContainer.offsetWidth; // Force reflow
        this.settingsScrollButtonsContainer.classList.add("animate-pulse");
      }

      this.updateSettingsScrollButtonState();
      modalContent.addEventListener(
        "scroll",
        this.boundUpdateSettingsScrollButtonState
      );
    }
  }

  /**
   * Opens the help modal and initializes its content.
   *
   * This method:
   * - Updates UI for first-time visitors
   * - Closes the search dialog if open
   * - Displays the help modal and overlay
   * - Resets the scroll position to the top
   * - Sets up scroll button indicators
   * - Adds scroll event listeners
   * - Sets focus on the close button for accessibility
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
      if (this.helpScrollButtonsContainer) {
        this.helpScrollButtonsContainer.classList.remove("animate-pulse");
        // Force reflow
        void this.helpScrollButtonsContainer.offsetWidth;
        this.helpScrollButtonsContainer.classList.add("animate-pulse");
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
   *
   * This method:
   * - Removes scroll event listeners to prevent memory leaks
   * - Hides the settings modal
   * - Removes the modal overlay
   */
  closeSettingsModal() {
    // Remove scroll event listener
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.removeEventListener(
        "scroll",
        this.boundUpdateSettingsScrollButtonState
      );
    }

    this.settingsModal.style.display = "none";
    this.modalOverlay.classList.remove("active");
  }

  /**
   * Closes the help modal and removes the overlay.
   *
   * This method:
   * - Updates the visit history for first-time visitors
   * - Removes scroll event listeners to prevent memory leaks
   * - Hides the help modal
   * - Removes the modal overlay
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

    // If this is a first-time visitor, update the localStorage flags AFTER
    // they've seen the help content
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

    // If user has seen help but hasn't seen settings yet, add animation
    // to settings button
    if (this.hasSeenHelpOnly && this.openModalBtn) {
      setTimeout(() => {
        this.openModalBtn.classList.add("pulse-border");
      }, 500);
    }
  }

  /**
   * Handles clicks on the window to close modals when clicking outside of modal content.
   *
   * This implements the common UI pattern where clicking outside a modal
   * dismisses it. The method checks if the click occurred outside the modal content
   * area but within the modal container or overlay.
   *
   * @param {MouseEvent} event - The mouse click event
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

    // Handle settings modal clicks
    if (
      event.target === this.settingsModal ||
      event.target === this.modalOverlay
    ) {
      this.settingsModal.style.display = "none";
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }

    // Handle help modal clicks
    if (event.target === this.helpModal) {
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }
  }

  /**
   * Handles keyboard events for modal navigation and accessibility.
   *
   * Currently handles:
   * - Escape key to close open modals
   *
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
   * Renders the list of keyboard shortcuts in the settings modal.
   *
   * This method:
   * - Clears the existing shortcuts list
   * - Iterates through all defined commands
   * - Creates editable input fields for each shortcut
   * - Adds event listeners for editing, saving, and deleting shortcuts
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
      let newValue = valueInput.value.trim();

      // Validation
      if (!newKey || !newName || !newValue) {
        return false;
      }

      // Automatically add https:// prefix to URLs without a protocol
      if (!newValue.startsWith("http://") && !newValue.startsWith("https://")) {
        newValue = `https://${newValue}`;
        valueInput.value = newValue;
      }

      // Check if key changed and if new key already exists
      if (newKey !== key && COMMANDS.has(newKey)) {
        const existingShortcut = COMMANDS.get(newKey);
        const shouldOverride = await customConfirm({
          message: `The shortcut key "${newKey}" already exists (${existingShortcut.name}). Are you sure you want to override it?`,
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
        url: newValue,
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
      let newValue = newValueInput.value.trim();

      // Check all fields
      if (newKeyInput.value && newNameInput.value && newValueInput.value) {
        // Automatically add https:// prefix to URLs without a protocol
        if (
          !newValue.startsWith("http://") &&
          !newValue.startsWith("https://")
        ) {
          newValue = `https://${newValue}`;
          newValueInput.value = newValue;
        }

        // If the shortcut key already exists, show the custom confirmation modal.
        if (COMMANDS.has(newKeyInput.value)) {
          const existingShortcut = COMMANDS.get(newKeyInput.value);
          const shouldOverride = await customConfirm({
            message: `The shortcut key "${newKeyInput.value}" already exists (${existingShortcut.name}). Are you sure you want to override it?`,
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
          url: newValue,
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
      message: `Are you sure you want to reset all settings to default? This will remove all custom shortcuts.`,
      confirmText: "Reset",
      cancelText: "Cancel",
      confirmClass: "confirm-warning",
    });

    if (confirmed) {
      const applyThemePreference = (preference) => {
        const normalized = preference === "dark-abyss" ? "void" : preference;
        const resolved =
          normalized === "system"
            ? window.matchMedia("(prefers-color-scheme: light)").matches
              ? "light"
              : "dark"
            : normalized;
        localStorage.setItem("selectedTheme", normalized);
        document.documentElement.setAttribute("data-theme", resolved);
        document.getElementById("themeSelect").value = normalized;
      };

      // Reset theme
      applyThemePreference(this.DEFAULT_SETTINGS.theme);

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
   * Checks if the modal content is scrollable and updates UI accordingly.
   *
   * This determines whether scroll buttons should be displayed based on
   * the content height compared to the viewport height.
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
   * Updates the visibility state of scroll buttons in the help modal.
   *
   * Shows/hides the top and bottom scroll buttons based on the current
   * scroll position relative to the content.
   */
  updateScrollButtonState() {
    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (!helpModalContent) return;

    const scrollPosition = helpModalContent.scrollTop;
    const scrollHeight = helpModalContent.scrollHeight;
    const clientHeight = helpModalContent.clientHeight;

    // Show/hide scroll buttons based on position
    if (this.scrollTopBtn) {
      this.scrollTopBtn.style.opacity = scrollPosition > 100 ? "1" : "0.5";
    }
    if (this.scrollBottomBtn) {
      this.scrollBottomBtn.style.opacity =
        scrollPosition + clientHeight < scrollHeight - 100 ? "1" : "0.5";
    }
  }

  /**
   * Scrolls the help modal content in the specified direction.
   *
   * @param {string} direction - The direction to scroll ('top' or 'bottom')
   */
  scrollHelpModal(direction) {
    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (!helpModalContent) return;

    helpModalContent.scrollTo({
      top: direction === "top" ? 0 : helpModalContent.scrollHeight,
      behavior: "smooth",
    });
  }

  /**
   * Forces the modal content to scroll to the top.
   *
   * Uses a small delay to ensure the scroll reset occurs after
   * the modal is fully visible for better user experience.
   *
   * @param {number} [delay=100] - Optional delay in milliseconds before scrolling
   */
  forceModalScrollToTop(delay = 100) {
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

  /**
   * Updates the settings scroll button state based on current scroll position
   */
  updateSettingsScrollButtonState() {
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (!modalContent) return;

    const scrollPosition = modalContent.scrollTop;
    const scrollHeight = modalContent.scrollHeight;
    const clientHeight = modalContent.clientHeight;

    // Show/hide scroll buttons based on position
    if (this.scrollTopSettingsBtn) {
      this.scrollTopSettingsBtn.style.opacity =
        scrollPosition > 100 ? "1" : "0.5";
    }
    if (this.scrollBottomSettingsBtn) {
      this.scrollBottomSettingsBtn.style.opacity =
        scrollPosition + clientHeight < scrollHeight - 100 ? "1" : "0.5";
    }
  }

  /**
   * Handles scrolling in the settings modal
   * @param {"top" | "bottom"} direction - The direction to scroll
   */
  scrollSettingsModal(direction) {
    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (!modalContent) return;

    if (direction === "top") {
      // Scroll to top behavior remains the same
      modalContent.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // For scrolling down, find the next heading
      const headings = Array.from(modalContent.querySelectorAll('h2'));
      const currentScroll = modalContent.scrollTop; // Add small buffer
      let nextHeading = null;

      // Find the first heading that's below the current scroll position
      for (const heading of headings) {
        const headingTop = heading.getBoundingClientRect().top + modalContent.scrollTop;
        if (headingTop > currentScroll) {
          nextHeading = heading;
          break;
        }
      }

      if (nextHeading) {
        // Calculate position with offset
        const offset = -240; // Controls how much content shows below the heading
        const elementPosition = nextHeading.getBoundingClientRect().top + modalContent.scrollTop;
        const offsetPosition = elementPosition - offset;
        
        // Scroll to the position with offset
        modalContent.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else {
        // If no next heading, scroll to bottom as fallback
        modalContent.scrollTo({
          top: modalContent.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }

  /**
   * Exports user configuration to a JSON file.
   * This includes the theme, shortcuts, tab behavior and search preferences.
   */
  exportConfig() {
    // Collect all settings from localStorage
    const settings = {
      theme: localStorage.getItem("selectedTheme") || "dark",
      tabBehavior: localStorage.getItem("tabBehavior") || "current",
      searchEngine: localStorage.getItem("searchEngine") || "google",
      commands: Object.fromEntries(COMMANDS),
    };

    // Convert to JSON and prepare for download
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    // Create download link
    const exportName = `celerity-config-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);

    // Trigger download
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }

  /**
   * Triggers the file input to import configuration.
   */
  importConfig() {
    this.importFileInput.click();
  }

  /**
   * Handles the file import process after a file is selected.
   * Parses the JSON, validates it, and applies the settings.
   */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Confirm with the user
    const confirmImport = await customConfirm({
      message: "This will replace your current configuration. Continue?",
      confirmText: "Import",
      cancelText: "Cancel",
      confirmClass: "confirm-override",
    });

    if (!confirmImport) {
      this.importFileInput.value = ""; // Clear the file input
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          const applyThemePreference = (preference) => {
            const normalized = preference === "dark-abyss" ? "void" : preference;
            const resolved =
              normalized === "system"
                ? window.matchMedia("(prefers-color-scheme: light)").matches
                  ? "light"
                  : "dark"
                : normalized;
            localStorage.setItem("selectedTheme", normalized);
            document.documentElement.setAttribute("data-theme", resolved);
            document.getElementById("themeSelect").value = normalized;
          };

          // Validate the imported data has required elements
          if (!settings || typeof settings !== "object") {
            throw new Error("Invalid configuration format");
          }

          // Apply theme
          if (settings.theme) {
            const validThemes = ["system", "dark", "light", "void", "dark-abyss"];
            const safeTheme = validThemes.includes(settings.theme)
              ? settings.theme
              : "system";
            applyThemePreference(safeTheme);
          }

          // Apply tab behavior
          if (settings.tabBehavior) {
            localStorage.setItem("tabBehavior", settings.tabBehavior);
            CONFIG.openLinksInNewTab = settings.tabBehavior === "new";
            document.getElementById("tabBehaviorNew").checked =
              settings.tabBehavior === "new";
            document.getElementById("tabBehaviorCurrent").checked =
              settings.tabBehavior === "current";
          }

          // Apply search engine
          if (settings.searchEngine) {
            localStorage.setItem("searchEngine", settings.searchEngine);
            CONFIG.defaultSearchEngine = settings.searchEngine;
            CONFIG.defaultSearchTemplate =
              CONFIG.searchEngineTemplates[settings.searchEngine];
            document.getElementById("searchEngineGoogle").checked =
              settings.searchEngine === "google";
            document.getElementById("searchEngineDuckDuckGo").checked =
              settings.searchEngine === "duckduckgo";
          }

          // Apply commands
          if (settings.commands && typeof settings.commands === "object") {
            COMMANDS.clear();
            for (const [key, value] of Object.entries(settings.commands)) {
              COMMANDS.set(key, value);
            }
            saveCommands();
          }

          // Refresh UI
          this.renderShortcuts();
          this.commandsComponent.render();

          // Show success message
          customConfirm({
            message: "Configuration imported successfully! 🚀",
            confirmText: "OK",
            cancelText: "",
            confirmClass: "",
          });
        } catch (error) {
          console.error("Import error:", error);
          customConfirm({
            message: "Error importing configuration: " + error.message,
            confirmText: "OK",
            cancelText: "",
            confirmClass: "confirm-warning",
          });
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("File reading error:", error);
      customConfirm({
        message: "Error reading file: " + error.message,
        confirmText: "OK",
        cancelText: "",
        confirmClass: "confirm-warning",
      });
    } finally {
      this.importFileInput.value = ""; // Clear the file input
    }
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

    // Only show and set up the cancel button if cancelText is provided
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

    /**
     * Cleanup function to hide modal and remove listeners
     */
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
  });
}

// Add event listener for Enter key to confirm dialog
function addEnterKeyListenerToConfirmDialog() {
  const modal = document.getElementById("confirmModal");
  const okButton = modal.querySelector(".confirm-ok");

  // Listen for keydown events on the document
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && modal.style.display === "flex") {
      event.preventDefault(); // Prevent default Enter behavior
      okButton.click(); // Trigger the OK button click
    }
  });
}

// Call this function when initializing the modal manager
addEnterKeyListenerToConfirmDialog();

// Initialize on document load
document.addEventListener("DOMContentLoaded", () => {
  new ModalManager();
});
