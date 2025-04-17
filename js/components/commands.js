/**
 * Commands Component (Web Component)
 *
 * A custom element that displays and manages keyboard shortcuts in a responsive grid layout.
 * This component renders command shortcuts as clickable links and includes a dynamic
 * "add new shortcut" button that integrates with the settings modal.
 *
 * Usage:
 * <commands-component></commands-component>
 *
 * Features:
 * - Responsive grid layout (2-4 columns based on screen width)
 * - Dynamic shortcut rendering from the COMMANDS map
 * - Interactive "+" button for adding new shortcuts
 * - Automatic layout adjustment based on number of commands
 */
class Commands extends HTMLElement {
  /**
   * Initializes the Commands component with Shadow DOM and event listeners.
   *
   * Creates a shadow DOM for encapsulation and sets up a resize event listener
   * to ensure the layout remains responsive as the viewport size changes.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    // Re-render on resize so column count updates
    window.addEventListener("resize", () => this.render());
  }

  /**
   * Renders the commands grid with all shortcuts and the dynamic "+" button.
   *
   * This method:
   * - Creates a column layout based on screen width and command count
   * - Renders each shortcut as a clickable link with key and name display
   * - Adds a dynamic "+" button in the appropriate position
   * - Adjusts styling based on the layout configuration
   */
  render() {
    this.shadowRoot.innerHTML = "";
    const template = document.getElementById("commands-template");
    const clone = template.content.cloneNode(true);
    const commands = clone.querySelector(".commands");
    const commandTemplate = document.getElementById("command-template");

    // Count available commands first to determine layout
    let availableCommands = 0;
    for (const [key, commandData] of COMMANDS.entries()) {
      let { name, url } = commandData;
      if (name && url) availableCommands++;
    }

    // Get column count based on available commands and screen width
    const columns = this.getColumns(availableCommands);

    // Apply the column count directly to the commands element
    commands.style.columns = columns;
    // Adjust max-width based on column count
    commands.style.maxWidth = "45rem";

    let count = 0;
    // Render each shortcut
    for (const [key, commandData] of COMMANDS.entries()) {
      let { name, url } = commandData;
      if (!name || !url) continue;
      const commandClone = commandTemplate.content.cloneNode(true);
      const command = commandClone.querySelector(".command");
      command.href = url;

      // Open links in new tab if enabled
      if (CONFIG.openLinksInNewTab) command.target = "_blank";
      commandClone.querySelector(".key").innerText = key;

      // Capitalise the first letter of each word in the name
      name = this.capitaliseWords(name);

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
   * Determines the optimal number of columns based on available commands and screen width.
   *
   * Uses special handling for certain command counts (1, 2, 5) to ensure
   * a balanced layout, and falls back to responsive behavior for other counts.
   *
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
   * Determines if the dynamic "+" button should be added to the layout.
   *
   * Only adds the button if the last row has empty space to maintain a balanced grid.
   *
   * @param {number} count - The number of commands
   * @param {number} columns - The number of columns
   * @returns {boolean} True if the button should be added
   */
  shouldAddButton(count, columns) {
    const lastRowItems = count % columns;
    return lastRowItems !== 0; // Only add button if there's space in the last row.
  }

  /**
   * Adds the dynamic "+" button to the commands grid.
   *
   * This method:
   * - Creates a button sized appropriately for the current layout
   * - Positions it in the last row
   * - Adds a click handler to open the settings modal
   * - Applies height adjustments for different grid configurations
   *
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
    });

    // Adjust height based on column layout
    // For 4-column layout, allow the button to fill remaining cells
    // For 2-column layout, keep the height fixed to match command items
    if (columns === 4) {
      // Default height for 4-column layout
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
      // In 2-column layout, keep height fixed to match command items
      button.style.height = `${CELL_HEIGHT - 1}px`;
    }

    button.style.width = "99.5%";

    commands.append(button);
  }

  // Capitalise the first letter of each word in the command name
  // Avoids allowing the user to use full-caps in the command name
  // Using full caps would break the grid layout
  capitaliseWords(str) {
    return str.replace(
      /\b\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
}

// Register the custom element when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
  customElements.define("commands-component", Commands);
});
