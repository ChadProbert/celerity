/*
 * <commands-component>: the shortcut grid.
 *
 * Defines:    Commands custom element (registered on DOMContentLoaded)
 * Depends on: COMMANDS (config.js); #commands-template and
 *             #command-template in index.html. Its DOMContentLoaded
 *             listener must register before modal.js's — ModalManager's
 *             constructor calls this component's render() and relies on the
 *             element already being upgraded (script order in index.html).
 */

const CELL_HEIGHT = 60; // grid cell height in px; see HEIGHT_TWEAKS_PX

/*
 * CSS multi-column layout rounds fractional column heights, so for some
 * command counts the "+" button drifts off the grid edge by a pixel or two.
 * These empirical corrections (keyed by the rendered <li> count — i.e.
 * commands.children.length BEFORE the button is appended) square it up in
 * the 4-column layout. Unlisted counts get no correction. Do not "clean
 * up" the values.
 */
const HEIGHT_TWEAKS_PX = { 6: 2, 9: 2, 11: -1, 13: 2, 15: -1, 17: 1, 19: -1 };

/* Both "+" buttons route to the settings modal to add a shortcut. */
function openShortcutSettings() {
  const openModalBtn = document.getElementById("openModal");
  if (openModalBtn) openModalBtn.click();
}

class Commands extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    // Column count depends on viewport width
    window.addEventListener("resize", () => this.render());
  }

  render() {
    this.shadowRoot.innerHTML = "";
    const template = document.getElementById("commands-template");
    const clone = template.content.cloneNode(true);
    const commands = clone.querySelector(".commands");

    let availableCommands = 0;
    for (const { name, url } of COMMANDS.values()) {
      if (name && url) availableCommands++;
    }

    if (availableCommands === 0) {
      this.renderEmptyState(commands);
    } else {
      this.renderGrid(commands, availableCommands);
    }

    this.shadowRoot.append(clone);
  }

  /* A single large "+" tile inviting the user to add their first shortcut. */
  renderEmptyState(commands) {
    commands.classList.add("commands-empty");
    commands.style.columns = 1;
    commands.style.maxWidth = "100%";

    const emptyButton = document.createElement("button");
    emptyButton.classList.add("dynamic-button", "empty-plus");
    emptyButton.type = "button";
    emptyButton.innerHTML =
      '<span class="empty-plus-icon" aria-hidden="true">+</span>';
    emptyButton.title = "Add a shortcut";
    emptyButton.setAttribute("aria-label", "Add a shortcut");
    emptyButton.addEventListener("click", openShortcutSettings);

    commands.append(emptyButton);
  }

  renderGrid(commands, availableCommands) {
    const columns = this.getColumns(availableCommands);
    commands.style.columns = columns;
    // Inline override of the template's responsive max-width media queries
    commands.style.maxWidth = "45rem";

    const commandTemplate = document.getElementById("command-template");
    let count = 0;
    for (const [key, commandData] of COMMANDS.entries()) {
      const { name, url } = commandData;
      if (!name || !url) continue;

      const commandClone = commandTemplate.content.cloneNode(true);
      commandClone.querySelector(".command").href = url;
      commandClone.querySelector(".key").innerText = key;
      commandClone.querySelector(".name").innerText = this.capitaliseWords(name);
      commands.append(commandClone);
      count++;
    }

    // A "+" button fills the leftover space when the last row isn't full
    if (count % columns !== 0) {
      this.addDynamicButton(commands, count, columns);
    }
  }

  /*
   * 4 columns on wide screens, 2 otherwise — except counts of 1, 2 or 5,
   * which always get 2 columns for a balanced layout.
   */
  getColumns(commandCount) {
    if (commandCount === 5 || commandCount === 2 || commandCount === 1) {
      return 2;
    }
    if (window.innerWidth >= 900) return 4;
    return 2;
  }

  addDynamicButton(commands, count, columns) {
    const lastRowItems = count % columns;
    const remainingCells = columns - lastRowItems;

    const button = document.createElement("button");
    button.classList.add("dynamic-button");
    button.innerHTML = "+";
    button.addEventListener("click", openShortcutSettings);

    if (columns === 4) {
      // Span the remaining cells of the last column
      const tweak = HEIGHT_TWEAKS_PX[commands.children.length] ?? 0;
      button.style.height = `${remainingCells * CELL_HEIGHT + tweak}px`;
    } else {
      // 2-column layout: fixed height matching a single command item
      button.style.height = `${CELL_HEIGHT - 1}px`;
    }

    button.style.width = "99.5%";

    commands.append(button);
  }

  /*
   * Capitalises each word and lowercases the rest ("GitHub" → "Github").
   * Deliberate: full-caps names break the grid layout, so display casing is
   * normalised. Do not "fix".
   */
  capitaliseWords(str) {
    return str.replace(
      /\b\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("commands-component", Commands);
});
