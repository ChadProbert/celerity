/**
 * Commands component for displaying and managing keyboard shortcuts.
 * Handles the rendering and layout of command shortcuts in a responsive grid.
 */
class Commands extends HTMLElement {
  /**
   * Initializes the Commands component and sets up event listeners.
   * Creates a shadow DOM and renders the initial commands layout.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    // Re-render on resize so column count updates
    window.addEventListener("resize", () => this.render());
  }

  /**
   * Renders the commands grid with all shortcuts.
   * Creates a column layout based on screen width and populates with command shortcuts.
   * Also adds a dynamic "+" button when appropriate.
   */
  render() {
    this.shadowRoot.innerHTML = "";
    const template = document.getElementById("commands-template");
    const clone = template.content.cloneNode(true);
    const commands = clone.querySelector(".commands");
    const commandTemplate = document.getElementById("command-template");

    // Count available commands first to determine layout
    let availableCommands = 0;
    for (const [key, { name, url }] of COMMANDS.entries()) {
      if (name && url) availableCommands++;
    }

    // Get column count based on available commands and screen width
    const columns = this.getColumns(availableCommands);

    // Apply the column count directly to the commands element
    commands.style.columns = columns;
    // Adjust max-width based on column count
    commands.style.maxWidth = columns === 2 ? "25rem" : "45rem";

    let count = 0;
    // Render each shortcut
    for (const [key, { name, url }] of COMMANDS.entries()) {
      if (!name || !url) continue;
      const commandClone = commandTemplate.content.cloneNode(true);
      const command = commandClone.querySelector(".command");
      command.href = url;
      if (CONFIG.openLinksInNewTab) command.target = "_blank";
      commandClone.querySelector(".key").innerText = key;
      commandClone.querySelector(".name").innerText = name;
      commands.append(commandClone);
      count++;
    }

    // Add the dynamic button if the last row isn't completely full.
    if (this.shouldAddButton(count, columns)) {
      this.addDynamicButton(commands, count, columns);
    }

    this.shadowRoot.append(clone);
  }

  /**
   * Determines the number of columns based on screen width and command count.
   * @param {number} commandCount - The total number of visible commands
   * @returns {number} The number of columns to display (2 or 4)
   */
  getColumns(commandCount) {
    // Uses 2 columns for when there are 5, 2, or 1 commands (2x3 grid)
    if (commandCount === 5 || commandCount === 2 || commandCount === 1) {
      return 2;
    }

    // Use default responsive behavior for other cases
    if (window.innerWidth >= 900) return 4;
    return 2; // Default to 2 columns for all desktop widths below 900px
  }

  /**
   * Checks if the dynamic "+" button should be added.
   * Only adds the button if the last row has space.
   * @param {number} count - The number of commands
   * @param {number} columns - The number of columns
   * @returns {boolean} True if the button should be added
   */
  shouldAddButton(count, columns) {
    const lastRowItems = count % columns;
    return lastRowItems !== 0; // Only add button if there's space in the last row.
  }

  /**
   * Appends the dynamic "+" button to the commands grid.
   * Sizes the button appropriately based on column layout.
   * @param {HTMLElement} commands - The commands container element
   * @param {number} count - The number of commands
   * @param {number} columns - The number of columns
   */
  addDynamicButton(commands, count, columns) {
    const CELL_HEIGHT = 60; // Base height per cell
    const lastRowItems = count % columns;
    const remainingCells = columns - lastRowItems;

    const button = document.createElement("button");
    button.classList.add("dynamic-button");
    button.innerHTML = "+";
    button.addEventListener("click", () => {
      // Open the modal to add a new shortcut
      const openModalBtn = document.getElementById("openModal");
      openModalBtn.click();
      // Dispatch a custom event to indicate we want to focus on the new shortcut inputs
      document.dispatchEvent(new CustomEvent("focusNewShortcut"));
    });

    // Adjust height based on column layout
    // For 4-column layout, allow the button to fill remaining cells
    // For 2-column layout, keep the height fixed to match command items
    if (columns === 4) {
      console.log("4 columns");
      // In 4-column layout, allow the button to fill remaining cells (original behavior)
      button.style.height = `${remainingCells * CELL_HEIGHT}px`;
      let cmdLength = commands.children.length;
      if (cmdLength === 13) {
        button.style.height = `${remainingCells * CELL_HEIGHT + 2}px`;
      }
      if (cmdLength === 15 || cmdLength === 19 || cmdLength === 11) {
        button.style.height = `${remainingCells * CELL_HEIGHT - 1}px`;
      }
      if (cmdLength === 17) {
        button.style.height = `${remainingCells * CELL_HEIGHT + 1}px`;
      }
      if (cmdLength === 9 || cmdLength === 6) {
        button.style.height = `${remainingCells * CELL_HEIGHT + 2}px`;
      }
    } else {
      console.log("2 columns");
      // In 2-column layout, keep height fixed to match command items
      button.style.height = `${CELL_HEIGHT - 1}px`;
    }

    button.style.width = "99.5%";

    commands.append(button);
  }
}

// Register the custom element when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
  customElements.define("commands-component", Commands);
});
