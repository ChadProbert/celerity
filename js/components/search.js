/*
 * <search-component>: the keyboard-activated search dialog.
 *
 * Any keypress on the page opens it; input resolves to a direct URL, a
 * command shortcut, a command site-search, or a default web search, with
 * live DuckDuckGo suggestions.
 *
 * Defines:    Search custom element (registered on DOMContentLoaded)
 * Depends on: COMMANDS, CONFIG (config.js); #search-template,
 *             #suggestion-template and #match-template in index.html;
 *             #settingsModal/#helpModal open-state (keydown suppression).
 */
class Search extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const template = document.getElementById("search-template");
    const clone = template.content.cloneNode(true);

    this.dialog = clone.querySelector(".dialog");
    this.form = clone.querySelector(".form");
    this.input = clone.querySelector(".input");
    this.suggestions = clone.querySelector(".suggestions");
    this.isExecutingSearch = false;

    this.onSubmit = this.onSubmit.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onSuggestionClick = this.onSuggestionClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onPageShow = this.onPageShow.bind(this);

    this.form.addEventListener("submit", this.onSubmit, false);
    this.input.addEventListener("input", this.onInput);
    this.suggestions.addEventListener("click", this.onSuggestionClick);
    document.addEventListener("keydown", this.onKeydown);
    window.addEventListener("pageshow", this.onPageShow);

    this.shadowRoot.append(clone);
  }

  /* Prefixes suggestions with the active command key ("y cats" style) so
   * selecting one re-parses as a command search. No-op without a splitBy. */
  attachSearchPrefix(array, { key, splitBy }) {
    if (!splitBy) return array;
    return array.map((search) => `${key}${splitBy}${search}`);
  }

  escapeRegexCharacters(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  /*
   * JSONP request to DuckDuckGo's autocomplete API (their endpoint has no
   * CORS headers, so fetch() is not an option).
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
      // Assigning the method as handler: `this` is the script element when
      // onload fires, so the tag removes itself.
      script.onload = script.remove;
    });
  }

  /* Substitutes the encoded query into a searchTemplate's {} placeholder. */
  formatSearchUrl(url, searchPath, search) {
    if (!searchPath) return url;
    const [baseUrl] = this.splitUrl(url);
    const urlQuery = encodeURIComponent(search);
    searchPath = searchPath.replace(/{}/g, urlQuery);
    return baseUrl + searchPath;
  }

  /* Accepts ANY scheme (ftp://, chrome://…) on purpose — typed URLs are
   * passed through as-is. Unlike the shortcut editor's http/https-only
   * ensureHttps (modal.js). */
  hasProtocol(s) {
    return /^[a-zA-Z]+:\/\//i.test(s);
  }

  isUrl(s) {
    return /^((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)$/i.test(s);
  }

  /*
   * Resolves raw input to a destination URL. In priority order:
   *   1. a URL typed directly (protocol added if missing)
   *   2. an exact command key ("g" → Gmail)
   *   3. command + delimiter + query ("y cats" → YouTube search); commands
   *      without a searchTemplate fall through to their plain URL
   *   4. anything else → default search engine
   *
   * Commands may carry a legacy `command` property (an alias redirecting to
   * another query, resolved recursively) — no default command uses it, but
   * imported user configs can. The `key` destructured in case 2 is always
   * undefined for stored commands; kept for return-shape stability.
   */
  parseQuery(raw) {
    const query = raw.trim();

    if (this.isUrl(query)) {
      const url = this.hasProtocol(query) ? query : `https://${query}`;
      return { query, url };
    }

    if (COMMANDS.has(query)) {
      const { command, key, url } = COMMANDS.get(query);
      return command ? this.parseQuery(command) : { key, query, url };
    }

    let splitBy = CONFIG.commandSearchDelimiter;
    const [searchKey, rawSearch] = query.split(new RegExp(`${splitBy}(.*)`));

    if (COMMANDS.has(searchKey) && rawSearch) {
      const { searchTemplate, url: base } = COMMANDS.get(searchKey);
      const search = rawSearch.trim();
      const url = this.formatSearchUrl(base, searchTemplate, search);
      return { key: searchKey, query, search, splitBy, url };
    }

    const [baseUrl, rest] = this.splitUrl(CONFIG.defaultSearchTemplate);
    const url = this.formatSearchUrl(baseUrl, rest, query);
    return { query, search: query, url };
  }

  /* Splits a URL into [origin, path+query] via an anchor element. */
  splitUrl(url) {
    const parser = document.createElement("a");
    parser.href = url;
    const baseUrl = `${parser.protocol}//${parser.hostname}`;
    const rest = `${parser.pathname}${parser.search}`;
    return [baseUrl, rest];
  }

  close() {
    this.input.value = "";
    this.input.blur();
    if (this.dialog.open) {
      this.dialog.close();
    }
    this.suggestions.innerHTML = "";
    this.toggleNavigationButtons(true);
  }

  execute(query) {
    const { url } = this.parseQuery(query);
    if (!url || this.isExecutingSearch) return;

    // Guards against double navigation (rapid Enter + click). Only reset in
    // onPageShow on back/forward-cache restore — keep the pairing intact.
    this.isExecutingSearch = true;
    this.navigateToUrl(url);
  }

  navigateToUrl(url) {
    window.open(url, "_self", "noopener noreferrer");
  }

  /* Reset execution state when the page is restored from the bfcache. */
  onPageShow(event) {
    if (event.persisted) {
      this.isExecutingSearch = false;
      this.close();
    }
  }

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

  async onInput() {
    const oq = this.parseQuery(this.input.value);

    if (!oq.query) {
      this.close();
      return;
    }

    // Commands may carry a legacy `suggestions` list (imported configs)
    let suggestions = COMMANDS.get(oq.query)?.suggestions ?? [];

    if (oq.search && suggestions.length < CONFIG.suggestionLimit) {
      const res = await this.fetchDuckDuckGoSuggestions(oq.search);
      const formatted = this.attachSearchPrefix(res, oq);
      suggestions = suggestions.concat(formatted);
    }

    // Drop stale async results: if the input changed while the fetch was in
    // flight, a newer onInput owns the render. (Overlapping JSONP requests
    // overwrite the same global callback — this re-parse is the only guard.)
    const nq = this.parseQuery(this.input.value);
    if (nq.query !== oq.query) return;
    this.renderSuggestions(suggestions, oq.query);
  }

  onKeydown(e) {
    // The search dialog stands down while the settings or help modal is
    // open. (Each modal family owns its own Escape handling — see modal.js.)
    const settingsModal = document.getElementById("settingsModal");
    if (settingsModal && settingsModal.style.display === "flex") {
      return;
    }

    const helpModal = document.getElementById("helpModal");
    if (helpModal && helpModal.style.display === "flex") {
      return;
    }

    // Never intercept typing in form fields
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    if (!this.dialog.open) {
      // Open first, focus the input, and let the keystroke land in it.
      // If the key produced no character by the next frame (Shift, Ctrl…),
      // close again. show() (non-modal) is intentional — the template CSS
      // keys off .dialog[open].
      this.dialog.show();
      this.input.focus();

      this.toggleNavigationButtons(false);

      requestAnimationFrame(() => {
        if (!this.input.value) {
          this.close();
          this.toggleNavigationButtons(true);
        }
      });

      return;
    }

    if (e.key === "Escape") {
      this.close();
      this.toggleNavigationButtons(true);
      return;
    }

    // Normalise to a modifier-prefixed key string, e.g. "ctrl-n", "shift-Tab"
    const alt = e.altKey ? "alt-" : "";
    const ctrl = e.ctrlKey ? "ctrl-" : "";
    const meta = e.metaKey ? "meta-" : "";
    const shift = e.shiftKey ? "shift-" : "";
    const modifierPrefixedKey = `${alt}${ctrl}${meta}${shift}${e.key}`;

    if (/^(ArrowDown|Tab|ctrl-n)$/.test(modifierPrefixedKey)) {
      e.preventDefault();
      this.focusNextSuggestion();
      return;
    }

    if (/^(ArrowUp|ctrl-p|shift-Tab)$/.test(modifierPrefixedKey)) {
      e.preventDefault();
      this.focusNextSuggestion(true);
    }
  }

  onSubmit(event) {
    event.preventDefault();
    this.execute(this.input.value);
  }

  onSuggestionClick(e) {
    const ref = e.target.closest(".suggestion");
    if (!ref) return;
    this.execute(ref.dataset.suggestion);
  }

  /* Renders suggestions with the matched part of the query de-emphasised. */
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
        const matchTemplate = document.getElementById("match-template");
        const matchClone = matchTemplate.content.cloneNode(true);
        const matchRef = matchClone.querySelector(".match");
        const pre = suggestion.slice(0, matched.index);
        const post = suggestion.slice(matched.index + matched[0].length);
        matchRef.innerText = matched[0];
        matchRef.insertAdjacentHTML("beforebegin", pre);
        matchRef.insertAdjacentHTML("afterend", post);
        ref.append(matchClone);
      } else {
        ref.innerText = suggestion;
      }

      this.suggestions.append(clone);
    }
  }

  /* The top-bar buttons hide while the search dialog is open. */
  toggleNavigationButtons(show) {
    for (const selector of [".settings-button", ".help-button", ".feedback-button"]) {
      const button = document.querySelector(selector);
      if (button) {
        button.style.display = show ? "flex" : "none";
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  customElements.define("search-component", Search);
});
