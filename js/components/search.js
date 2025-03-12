/**
 * Search component that provides search functionality with suggestions.
 * Handles keyboard shortcuts, text input, and search suggestions.
 */
class Search extends HTMLElement {
  /**
   * Initializes the Search component with DOM elements and event listeners.
   * Sets up the dialog, form, input field, and suggestions container.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Get the search template from the main document and clone it with all its children
    const template = document.getElementById("search-template");
    const clone = template.content.cloneNode(true);

    this.dialog = clone.querySelector(".dialog");
    this.form = clone.querySelector(".form");
    this.input = clone.querySelector(".input");
    this.suggestions = clone.querySelector(".suggestions");

    // Bind methods to maintain 'this' context
    this.onSubmit = this.onSubmit.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onSuggestionClick = this.onSuggestionClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);

    // Add event listeners
    this.form.addEventListener("submit", this.onSubmit, false);
    this.input.addEventListener("input", this.onInput);
    this.suggestions.addEventListener("click", this.onSuggestionClick);
    document.addEventListener("keydown", this.onKeydown);

    // Append the populated template clone to the shadow DOM, making it visible
    this.shadowRoot.append(clone);
  }

  /**
   * Prefixes search suggestions with a key and delimiter.
   * @param {string[]} array - Array of search suggestions
   * @param {Object} options - Options containing key and delimiter
   * @param {string} options.key - The key to prefix with
   * @param {string} options.splitBy - The delimiter between key and suggestion
   * @returns {string[]} Array of prefixed search suggestions
   */
  attachSearchPrefix(array, { key, splitBy }) {
    if (!splitBy) return array;
    return array.map((search) => `${key}${splitBy}${search}`);
  }

  /**
   * Escapes special characters in regex patterns.
   * @param {string} s - The string to escape
   * @returns {string} The escaped string
   */
  escapeRegexCharacters(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  /**
   * Fetches search suggestions from DuckDuckGo's autocomplete API.
   * @param {string} search - The search query
   * @returns {Promise<string[]>} A promise that resolves to an array of search suggestions
   */
  fetchDuckDuckGoSuggestions(search) {
    return new Promise((resolve) => {
      window.autocompleteCallback = (res) => {
        const suggestions = [];

        for (const item of res) {
          if (item.phrase === search.toLowerCase()) continue;
          suggestions.push(item.phrase);
        }

        resolve(suggestions);
      };

      const script = document.createElement("script");
      document.querySelector("head").appendChild(script);
      script.src = `https://duckduckgo.com/ac/?callback=autocompleteCallback&q=${search}`;
      script.onload = script.remove;
    });
  }

  /**
   * Formats a search URL by replacing placeholders with the search query.
   * @param {string} url - The base URL
   * @param {string} searchPath - The search path template with {} placeholder
   * @param {string} search - The search query to insert
   * @returns {string} The formatted search URL
   */
  formatSearchUrl(url, searchPath, search) {
    if (!searchPath) return url;
    const [baseUrl] = this.splitUrl(url);
    const urlQuery = encodeURIComponent(search);
    searchPath = searchPath.replace(/{}/g, urlQuery);
    return baseUrl + searchPath;
  }

  /**
   * Checks if a string has a protocol prefix (http://, https://, etc.).
   * @param {string} s - The string to check
   * @returns {boolean} True if the string has a protocol prefix
   */
  hasProtocol(s) {
    return /^[a-zA-Z]+:\/\//i.test(s);
  }

  /**
   * Checks if a string is a valid URL.
   * @param {string} s - The string to check
   * @returns {boolean} True if the string is a valid URL
   */
  isUrl(s) {
    return /^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)$/i.test(s);
  }

  /**
   * Parses a search query and determines the appropriate action.
   * Handles URLs, command shortcuts, search commands, and path commands.
   * @param {string} raw - The raw search query
   * @returns {Object} An object containing the parsed query and action
   */
  parseQuery(raw) {
    // Trim whitespace from the query
    const query = raw.trim();

    // CASE 1: Direct URL entry
    // Check if the query is a valid URL (e.g., example.com or https://example.com)
    if (this.isUrl(query)) {
      // Add https:// protocol if not present
      const url = this.hasProtocol(query) ? query : `https://${query}`;
      return { query, url };
    }

    // CASE 2: Exact command match
    // Check if the query exactly matches a defined command shortcut
    if (COMMANDS.has(query)) {
      const { command, key, url } = COMMANDS.get(query);
      // If command has a command redirection, recursively parse it
      // Otherwise return the command's URL directly
      return command ? this.parseQuery(command) : { key, query, url };
    }

    // CASE 3: Search command syntax (e.g., "y search terms")
    // Try to parse as a search command using the configured delimiter (typically space)
    let splitBy = CONFIG.commandSearchDelimiter;
    // Split into [commandKey, searchTerm]
    const [searchKey, rawSearch] = query.split(new RegExp(`${splitBy}(.*)`));

    // Check if it's a valid search command and has search terms
    if (COMMANDS.has(searchKey) && rawSearch) {
      // Get the command's search template and base URL
      const { searchTemplate, url: base } = COMMANDS.get(searchKey);
      // Clean up the search terms
      const search = rawSearch.trim();
      // Format the URL with the search terms
      const url = this.formatSearchUrl(base, searchTemplate, search);
      // Return complete search information
      return { key: searchKey, query, search, splitBy, url };
    }

    // CASE 4: Path command syntax (e.g., "r/subreddit")
    // Try to parse as a path command using the configured delimiter (typically /)
    splitBy = CONFIG.commandPathDelimiter;
    // Split into [commandKey, path]
    const [pathKey, path] = query.split(new RegExp(`${splitBy}(.*)`));

    // Check if it's a valid path command and has a path
    if (COMMANDS.has(pathKey) && path) {
      // Get the command's base URL
      const { url: base } = COMMANDS.get(pathKey);
      // Extract just the base URL without path
      const [baseUrl] = this.splitUrl(base);
      // Combine base URL with the specified path
      const url = `${baseUrl}/${path}`;
      // Return complete path command information
      return { key: pathKey, path, query, splitBy, url };
    }

    // CASE 5: Default case - treat as a general search query
    // Use the default search engine (e.g., Google, DuckDuckGo)
    const [baseUrl, rest] = this.splitUrl(CONFIG.defaultSearchTemplate);
    // Format using the default search template
    const url = this.formatSearchUrl(baseUrl, rest, query);
    // Return as a general search
    return { query, search: query, url };
  }

  /**
   * Splits a URL into base URL and the rest (path+query).
   * @param {string} url - The URL to split
   * @returns {string[]} Array containing [baseUrl, rest]
   */
  splitUrl(url) {
    const parser = document.createElement("a");
    parser.href = url;
    const baseUrl = `${parser.protocol}//${parser.hostname}`;
    const rest = `${parser.pathname}${parser.search}`;
    return [baseUrl, rest];
  }

  /**
   * Closes the search dialog and resets the input.
   */
  close() {
    this.input.value = "";
    this.input.blur();
    this.dialog.close();
    this.suggestions.innerHTML = "";
  }

  /**
   * Executes a search query by opening the URL in a new tab or window.
   * @param {string} query - The search query to execute
   */
  execute(query) {
    const { url } = this.parseQuery(query);
    const target = CONFIG.openLinksInNewTab ? "_blank" : "_self";
    window.open(url, target, "noopener noreferrer");
    this.close();
  }

  /**
   * Focuses the next or previous suggestion in the list.
   * @param {boolean} previous - Whether to focus the previous suggestion
   */
  focusNextSuggestion(previous = false) {
    const active = this.shadowRoot.activeElement;
    let nextIndex;

    if (active.dataset.index) {
      const activeIndex = Number(active.dataset.index);
      nextIndex = previous ? activeIndex - 1 : activeIndex + 1;
    } else {
      nextIndex = previous ? this.suggestions.childElementCount - 1 : 0;
    }

    const next = this.suggestions.children[nextIndex];
    if (next) next.querySelector(".suggestion").focus();
    else this.input.focus();
  }

  /**
   * Handles input events by fetching suggestions and rendering them.
   */
  async onInput() {
    const oq = this.parseQuery(this.input.value);

    if (!oq.query) {
      this.close();
      return;
    }

    let suggestions = COMMANDS.get(oq.query)?.suggestions ?? [];

    if (oq.search && suggestions.length < CONFIG.suggestionLimit) {
      const res = await this.fetchDuckDuckGoSuggestions(oq.search);
      const formatted = this.attachSearchPrefix(res, oq);
      suggestions = suggestions.concat(formatted);
    }

    const nq = this.parseQuery(this.input.value);
    if (nq.query !== oq.query) return;
    this.renderSuggestions(suggestions, oq.query);
  }

  /**
   * Handles keyboard events for search interactions.
   * Opens/closes the search dialog, handles navigation keys,
   * and supports keyboard shortcuts.
   * @param {KeyboardEvent} e - The keyboard event
   */
  onKeydown(e) {
    // Modal conflict check
    // Don't process keyboard events if any modal is open
    // This prevents keyboard shortcuts from conflicting with modal interactions
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && settingsModal.style.display === "flex") {
      return;
    }

    const helpModal = document.getElementById("helpModal");
    if (helpModal && helpModal.style.display === "flex") {
      return;
    }

    // Input field check
    // Don't intercept keystrokes if user is typing in an input field
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    // Dialog visibility handling
    // If dialog is not open, show it and focus the input
    if (!this.dialog.open) {
      this.dialog.show();
      this.input.focus();

      requestAnimationFrame(() => {
        // Close the search dialog before the next repaint if a character is
        // not produced (e.g. if you type shift, control, alt etc.)
        if (!this.input.value) this.close();
      });

      return;
    }

    // Escape key handling
    // Close the dialog when Escape is pressed
    if (e.key === "Escape") {
      this.close();
      return;
    }

    // Create a normalized key string with modifiers
    // This allows handling complex keyboard shortcuts with modifiers
    // e.g., "ctrl-n" or "shift-Tab"
    const alt = e.altKey ? "alt-" : "";
    const ctrl = e.ctrlKey ? "ctrl-" : "";
    const meta = e.metaKey ? "meta-" : "";
    const shift = e.shiftKey ? "shift-" : "";
    const modifierPrefixedKey = `${alt}${ctrl}${meta}${shift}${e.key}`;

    // Navigation - next suggestion
    // Handle Down Arrow, Tab, and Emacs-style ctrl-n for moving to next suggestion
    if (/^(ArrowDown|Tab|ctrl-n)$/.test(modifierPrefixedKey)) {
      e.preventDefault(); // Prevent default Tab behavior
      this.focusNextSuggestion();
      return;
    }

    // Navigation - previous suggestion
    // Handle Up Arrow, Shift+Tab, and Emacs-style ctrl-p for moving to previous suggestion
    if (/^(ArrowUp|ctrl-p|shift-Tab)$/.test(modifierPrefixedKey)) {
      e.preventDefault(); // Prevent default Shift+Tab behavior
      this.focusNextSuggestion(true);
    }
  }

  /**
   * Handles form submission by executing the search query.
   */
  onSubmit() {
    this.execute(this.input.value);
  }

  /**
   * Handles clicks on suggestions by executing the clicked suggestion.
   * @param {MouseEvent} e - The mouse event
   */
  onSuggestionClick(e) {
    const ref = e.target.closest(".suggestion");
    if (!ref) return;
    this.execute(ref.dataset.suggestion);
  }

  /**
   * Renders a list of search suggestions with the queried part highlighted.
   * @param {string[]} suggestions - Array of search suggestions
   * @param {string} query - The search query to highlight
   */
  renderSuggestions(suggestions, query) {
    this.suggestions.innerHTML = "";
    const sliced = suggestions.slice(0, CONFIG.suggestionLimit);
    const template = document.getElementById("suggestion-template");

    for (const [index, suggestion] of sliced.entries()) {
      const clone = template.content.cloneNode(true);
      const ref = clone.querySelector(".suggestion");
      ref.dataset.index = index;
      ref.dataset.suggestion = suggestion;
      const escapedQuery = this.escapeRegexCharacters(query);
      const matched = suggestion.match(new RegExp(escapedQuery, "i"));

      if (matched) {
        const template = document.getElementById("match-template");
        const clone = template.content.cloneNode(true);
        const matchRef = clone.querySelector(".match");
        const pre = suggestion.slice(0, matched.index);
        const post = suggestion.slice(matched.index + matched[0].length);
        matchRef.innerText = matched[0];
        matchRef.insertAdjacentHTML("beforebegin", pre);
        matchRef.insertAdjacentHTML("afterend", post);
        ref.append(clone);
      } else {
        ref.innerText = suggestion;
      }

      this.suggestions.append(clone);
    }
  }
}

// Register the custom element when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
  customElements.define("search-component", Search);
});
