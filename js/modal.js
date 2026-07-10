/*
 * Settings and help modals: open/close routing, first-visit guidance,
 * shortcut CRUD, and theme/config management.
 *
 * Defines:    ModalManager (constructed on DOMContentLoaded)
 * Depends on: COMMANDS, saveCommands, loadCommands, defaultCommands
 *             (config.js); customConfirm (confirm.js);
 *             window.CelerityTheme at call time — theme.js parses AFTER
 *             this file, so it must only be dereferenced inside methods,
 *             never at the top level. <commands-component> is already
 *             upgraded when the DOMContentLoaded handler below runs because
 *             components/commands.js registers its listener first (script
 *             order in index.html).
 */

/*
 * Adds https:// to a URL typed without a protocol. The shortcut editor
 * recognises only http/https — unlike search.js's hasProtocol, which
 * deliberately accepts any scheme for typed URLs. Keep them separate.
 */
function ensureHttps(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function buildShortcutInput(className, { value, placeholder, readOnly = false } = {}) {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add(className);
  if (value !== undefined) input.value = value;
  if (placeholder !== undefined) input.placeholder = placeholder;
  input.readOnly = readOnly;
  return input;
}

function buildIconButton(className, iconHtml, title) {
  const button = document.createElement("button");
  button.classList.add(className);
  button.innerHTML = iconHtml;
  button.title = title;
  return button;
}

class ModalManager {
  constructor() {
    // First-visit state drives the guided pulse animations; read it before
    // anything else can touch localStorage.
    this.isFirstTimeVisitor = localStorage.getItem("hasVisitedBefore") === null;
    this.hasSeenHelpOnly = localStorage.getItem("hasSeenHelpOnly") === "true";

    this.openModalBtn = document.getElementById("openModal");
    this.openHelpBtn = document.getElementById("openHelp");
    this.closeModalBtn = document.getElementById("closeModal");
    this.closeHelpModalBtn = document.getElementById("closeHelpModal");
    this.settingsModal = document.getElementById("settingsModal");
    this.helpModal = document.getElementById("helpModal");
    this.modalOverlay = document.getElementById("modalOverlay");
    this.shortcutList = document.getElementById("shortcutList");
    this.resetButton = document.getElementById("resetSettings");
    this.exportButton = document.getElementById("exportConfig");
    this.importButton = document.getElementById("importConfigBtn");
    this.importFileInput = document.getElementById("importConfigFile");
    this.commandsComponent = document.querySelector("commands-component");

    // Bind the methods that are registered as event listeners
    this.openSettingsModal = this.openSettingsModal.bind(this);
    this.openHelpModalHandler = this.openHelpModalHandler.bind(this);
    this.closeSettingsModal = this.closeSettingsModal.bind(this);
    this.closeHelpModal = this.closeHelpModal.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.resetSettings = this.resetSettings.bind(this);
    this.exportConfig = this.exportConfig.bind(this);
    this.importConfig = this.importConfig.bind(this);
    this.handleImportFile = this.handleImportFile.bind(this);

    this.initializeEventListeners();
    this.initializeSettings();
  }

  initializeEventListeners() {
    if (this.openModalBtn) {
      this.openModalBtn.addEventListener("click", this.openSettingsModal);
    } else {
      console.error("Settings button element not found!");
    }

    if (this.openHelpBtn) {
      this.openHelpBtn.addEventListener("click", this.openHelpModalHandler);
    } else {
      console.error("Help button element not found!");
    }

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener("click", this.closeSettingsModal);
    }

    if (this.closeHelpModalBtn) {
      this.closeHelpModalBtn.addEventListener("click", this.closeHelpModal);
    }

    // Dismissal paths shared by both modals: outside click and Escape
    window.addEventListener("click", this.handleWindowClick);
    document.addEventListener("keydown", this.handleKeydown);

    this.resetButton.addEventListener("click", this.resetSettings);
    this.exportButton.addEventListener("click", this.exportConfig);
    this.importButton.addEventListener("click", this.importConfig);
    this.importFileInput.addEventListener("change", this.handleImportFile);
  }

  initializeSettings() {
    loadCommands();
    this.renderShortcuts();
    this.commandsComponent.render();

    // Guide new users: pulse the help button first; once help has been
    // seen (but settings hasn't), pulse the settings button instead.
    if (this.isFirstTimeVisitor && this.openHelpBtn) {
      setTimeout(() => {
        this.openHelpBtn.classList.add("pulse-border");
      }, 200);
    } else if (this.hasSeenHelpOnly && this.openModalBtn) {
      setTimeout(() => {
        this.openModalBtn.classList.add("pulse-border");
      }, 200);
    }
  }

  /*
   * Marks the help content as seen (first-visit bookkeeping). The two
   * localStorage writes happen in this order everywhere.
   */
  markHelpSeen() {
    localStorage.setItem("hasVisitedBefore", "true");
    localStorage.setItem("hasSeenHelpOnly", "true");
    this.isFirstTimeVisitor = false;
    this.hasSeenHelpOnly = true;
  }

  pulseSettingsButton(delay) {
    setTimeout(() => {
      if (this.openModalBtn) {
        this.openModalBtn.classList.add("pulse-border");
      }
    }, delay);
  }

  /*
   * The search dialog gives way whenever a modal opens. Raw dialog.close()
   * on purpose: the component's own close() would also clear the input and
   * re-show the top-bar buttons, which is not the behavior here.
   */
  closeSearchDialogIfOpen() {
    const searchComponent = document.querySelector("search-component");
    if (!searchComponent) return;
    const dialog = searchComponent.shadowRoot.querySelector(".dialog");
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  openSettingsModal() {
    // Opening settings completes the first-visit guidance
    if (this.hasSeenHelpOnly) {
      localStorage.removeItem("hasSeenHelpOnly");
      this.hasSeenHelpOnly = false;
      if (this.openModalBtn) {
        this.openModalBtn.classList.remove("pulse-border");
      }
    }

    this.closeSearchDialogIfOpen();

    this.settingsModal.style.display = "flex";
    this.modalOverlay.classList.add("active");
    this.renderShortcuts(); // commands may have changed since last open

    const modalContent = this.settingsModal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.classList.add("scrollable");
      modalContent.scrollTop = 0;
    }
  }

  openHelpModalHandler() {
    if (this.isFirstTimeVisitor && this.openHelpBtn) {
      this.openHelpBtn.classList.remove("pulse-border");
    }

    this.closeSearchDialogIfOpen();

    this.helpModal.style.display = "flex";
    this.modalOverlay.classList.add("active");

    const helpModalContent = this.helpModal.querySelector(
      ".help-modal-content"
    );
    if (helpModalContent) {
      helpModalContent.scrollTop = 0;
      helpModalContent.classList.add("scrollable");
    }

    // Move focus to the close button for keyboard users
    if (this.closeHelpModalBtn) {
      setTimeout(() => {
        this.closeHelpModalBtn.focus();
      }, 100);
    }
  }

  closeSettingsModal() {
    this.settingsModal.style.display = "none";
    this.modalOverlay.classList.remove("active");
  }

  /* Also registered directly as the close button's click listener. */
  closeHelpModal() {
    // First-visit flags update only after the visitor has seen the help
    if (this.isFirstTimeVisitor) {
      this.markHelpSeen();
    }

    this.helpModal.style.display = "none";
    this.modalOverlay.classList.remove("active");

    // Hand the guidance pulse over to the settings button
    if (this.hasSeenHelpOnly) {
      this.pulseSettingsButton(500);
    }
  }

  /*
   * Outside-click dismissal. The modal containers span the full viewport,
   * so event.target is the container itself only when a click misses the
   * content box; the overlay is a separate stacked element.
   */
  handleWindowClick(event) {
    if (
      this.helpModal.style.display === "flex" &&
      (event.target === this.helpModal || event.target === this.modalOverlay)
    ) {
      if (this.isFirstTimeVisitor) {
        this.markHelpSeen();
        this.pulseSettingsButton(500);
      }
    }

    if (
      event.target === this.settingsModal ||
      event.target === this.modalOverlay
    ) {
      this.settingsModal.style.display = "none";
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }

    if (event.target === this.helpModal) {
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }
  }

  /*
   * Escape unconditionally hides the settings and help modals and never
   * touches the confirm or feedback dialogs — each modal family owns its
   * own document-level Escape listener (see confirm.js, feedback.js and
   * components/search.js) with deliberately different open-state rules.
   */
  handleKeydown(e) {
    if (e.key === "Escape") {
      if (this.helpModal.style.display === "flex" && this.isFirstTimeVisitor) {
        this.markHelpSeen();
        this.pulseSettingsButton(500);
      }

      this.settingsModal.style.display = "none";
      this.helpModal.style.display = "none";
      this.modalOverlay.classList.remove("active");
    }
  }

  /* Rebuilds the editable shortcut list: one row per command, plus the
   * always-last "add new" row. */
  renderShortcuts() {
    this.shortcutList.innerHTML = "";

    for (const [key, value] of COMMANDS.entries()) {
      this.shortcutList.appendChild(this.createShortcutItem(key, value));
    }

    this.addNewShortcutField();
  }

  /* Persist COMMANDS and re-render both the settings list and the grid. */
  persistAndRefresh() {
    saveCommands();
    this.renderShortcuts();
    this.commandsComponent.render();
  }

  confirmShortcutOverride(key) {
    const existing = COMMANDS.get(key);
    return customConfirm({
      message: `The shortcut key "${key}" already exists (${existing.name}). Are you sure you want to override it?`,
      confirmText: "Override",
      cancelText: "Cancel",
      confirmClass: "confirm-override",
    });
  }

  /*
   * Builds one editable row of the shortcut list: key/name/URL inputs plus
   * an edit-or-save toggle button and a delete button.
   */
  createShortcutItem(key, value) {
    const shortcutItem = document.createElement("div");
    shortcutItem.classList.add("shortcut-item");

    const keyInput = buildShortcutInput("key-input", { value: key, readOnly: true });
    const nameInput = buildShortcutInput("name-input", { value: value.name || "", readOnly: true });
    const valueInput = buildShortcutInput("value-input", { value: value.url || "", readOnly: true });
    const actionButton = buildIconButton(
      "edit-button",
      '<i class="fa-solid fa-pen-to-square"></i>',
      "Edit shortcut"
    );
    const deleteButton = buildIconButton(
      "delete-button",
      '<i class="fa-solid fa-trash"></i>',
      "Delete shortcut"
    );
    shortcutItem.append(keyInput, nameInput, valueInput, actionButton, deleteButton);

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

    /* Saves after validation; a changed key that collides with an existing
     * one needs override confirmation. Resolves true on success. */
    const saveEditedShortcut = async () => {
      const newKey = keyInput.value.trim();
      const newName = nameInput.value.trim();
      let newValue = valueInput.value.trim();

      if (!newKey || !newName || !newValue) {
        return false;
      }

      const prefixed = ensureHttps(newValue);
      if (prefixed !== newValue) {
        newValue = prefixed;
        valueInput.value = newValue;
      }

      if (newKey !== key && COMMANDS.has(newKey)) {
        const shouldOverride = await this.confirmShortcutOverride(newKey);
        if (!shouldOverride) {
          return false;
        }
      }

      if (newKey !== key) {
        COMMANDS.delete(key);
      }

      COMMANDS.set(newKey, {
        ...value,
        name: newName,
        url: newValue,
      });

      this.persistAndRefresh();
      return true;
    };

    const deleteShortcut = async () => {
      const confirmed = await customConfirm({
        message: `Are you sure you want to delete the "${value.name}" shortcut?`,
        confirmText: "Delete",
        cancelText: "Cancel",
        confirmClass: "confirm-warning",
      });

      if (confirmed) {
        COMMANDS.delete(key);
        this.persistAndRefresh();
      }
    };

    actionButton.addEventListener("click", () => {
      if (actionButton.classList.contains("edit-button")) {
        enableEditMode();
      } else {
        saveEditedShortcut();
      }
    });

    deleteButton.addEventListener("click", deleteShortcut);

    // Enter saves while editing. On failure the offending input is
    // focused — but unlike the add row, nothing is focused when every
    // field is filled (e.g. after a cancelled override).
    [keyInput, nameInput, valueInput].forEach((input) => {
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !input.readOnly) {
          e.preventDefault();
          const success = await saveEditedShortcut();
          if (!success) {
            if (!keyInput.value.trim()) keyInput.focus();
            else if (!nameInput.value.trim()) nameInput.focus();
            else if (!valueInput.value.trim()) valueInput.focus();
          }
        }
      });
    });

    return shortcutItem;
  }

  /*
   * Appends the "add new shortcut" row. Note the validation asymmetry with
   * the edit row, preserved on purpose: this path checks raw input values,
   * so whitespace-only fields count as filled here but not when editing.
   */
  addNewShortcutField() {
    const newShortcutItem = document.createElement("div");
    newShortcutItem.classList.add("shortcut-item");

    const newKeyInput = buildShortcutInput("key-input", { placeholder: "Key" });
    const newNameInput = buildShortcutInput("name-input", { placeholder: "Name" });
    const newValueInput = buildShortcutInput("value-input", { placeholder: "URL" });
    const addButton = buildIconButton(
      "add-button",
      '<i class="fa-solid fa-plus"></i>',
      "Add shortcut"
    );
    newShortcutItem.append(newKeyInput, newNameInput, newValueInput, addButton);

    /* Creates the shortcut after validation and optional override
     * confirmation. Resolves true on success. */
    const createNewShortcut = async () => {
      const newKey = newKeyInput.value.trim();
      const newName = newNameInput.value.trim();
      let newValue = newValueInput.value.trim();

      if (newKeyInput.value && newNameInput.value && newValueInput.value) {
        const prefixed = ensureHttps(newValue);
        if (prefixed !== newValue) {
          newValue = prefixed;
          newValueInput.value = newValue;
        }

        if (COMMANDS.has(newKey)) {
          const shouldOverride = await this.confirmShortcutOverride(newKey);
          if (!shouldOverride) {
            return false;
          }
        }
        COMMANDS.set(newKey, {
          name: newName,
          url: newValue,
        });
        this.persistAndRefresh();
        return true;
      }
      return false;
    };

    // On failure, focus the first empty input — or the URL input when all
    // are filled (e.g. after a cancelled override).
    const focusFirstEmpty = () => {
      if (!newKeyInput.value) {
        newKeyInput.focus();
      } else if (!newNameInput.value) {
        newNameInput.focus();
      } else {
        newValueInput.focus();
      }
    };

    addButton.addEventListener("click", async () => {
      const success = await createNewShortcut();
      if (!success) focusFirstEmpty();
    });

    [newKeyInput, newNameInput, newValueInput].forEach((input) => {
      input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const success = await createNewShortcut();
          if (!success) focusFirstEmpty();
        }
      });
    });

    this.shortcutList.appendChild(newShortcutItem);
  }

  /* Restores the default theme and shortcuts after confirmation. */
  async resetSettings() {
    const confirmed = await customConfirm({
      message: `Are you sure you want to reset all settings to default? This will remove all custom shortcuts.`,
      confirmText: "Reset",
      cancelText: "Cancel",
      confirmClass: "confirm-warning",
    });

    if (confirmed) {
      // Safe dereference: modal.js parses before theme.js, but this runs on
      // user action, long after window.CelerityTheme is assigned.
      window.CelerityTheme.applyThemePreference("system");

      COMMANDS.clear();
      defaultCommands().forEach((value, key) => {
        COMMANDS.set(key, value);
      });
      this.persistAndRefresh();
    }
  }

  /*
   * Downloads the current theme + shortcuts as JSON. The "dark" fallback
   * for a never-set theme is legacy behavior (every other path defaults to
   * "system") — preserved for byte-compatible exports.
   */
  exportConfig() {
    const settings = {
      theme: localStorage.getItem("selectedTheme") || "dark",
      commands: Object.fromEntries(COMMANDS),
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportName = `celerity-config-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);

    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }

  importConfig() {
    this.importFileInput.click();
  }

  /* Parses the selected JSON file, applies theme and commands, and reports
   * the outcome through notification dialogs. */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const confirmImport = await customConfirm({
      message: "This will replace your current configuration. Continue?",
      confirmText: "Import",
      cancelText: "Cancel",
      confirmClass: "confirm-override",
    });

    if (!confirmImport) {
      this.importFileInput.value = "";
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);

          if (!settings || typeof settings !== "object") {
            throw new Error("Invalid configuration format");
          }

          // "dark-abyss" is the legacy name of the void theme
          if (settings.theme) {
            const validThemes = window.CelerityTheme.VALID_THEMES;
            const normalizedTheme =
              settings.theme === "dark-abyss" ? "void" : settings.theme;
            const safeTheme = validThemes.includes(normalizedTheme)
              ? normalizedTheme
              : "system";
            window.CelerityTheme.applyThemePreference(safeTheme);
          }

          if (settings.commands && typeof settings.commands === "object") {
            COMMANDS.clear();
            for (const [key, value] of Object.entries(settings.commands)) {
              COMMANDS.set(key, value);
            }
            saveCommands();
          }

          // Refresh even when the file contained no commands
          this.renderShortcuts();
          this.commandsComponent.render();

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
      this.importFileInput.value = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ModalManager();
});
