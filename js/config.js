/**
 * Celerity Configuration System
 *
 * This file defines the core configuration settings and keyboard shortcuts
 * for the new tab page. It handles loading saved settings from localStorage
 * and provides the default configuration when no saved settings exist.
 */

/**
 * Global Configuration Object
 *
 * Contains all user-configurable settings for the application including
 * command delimiters, search templates, and display preferences.
 * Settings are persisted in localStorage and loaded on initialization.
 *
 * @namespace
 */
const CONFIG = {
  /**
   * Path command delimiter character.
   * Used for path-based navigation, e.g., "r/subreddit" for Reddit.
   * @type {string}
   */
  commandPathDelimiter: "/",

  /**
   * Search command delimiter character.
   * Used for search queries, e.g., "g search term" for Google search.
   * @type {string}
   */
  commandSearchDelimiter: " ",

  /**
   * Search engine template URLs.
   * The {} placeholder is replaced with the encoded search query.
   * @type {Object.<string, string>}
   */
  searchEngineTemplates: {
    google: "https://www.google.com/search?q={}",
    duckduckgo: "https://duckduckgo.com/?q={}",
  },

  /**
   * Default search engine key.
   * Must match a key in searchEngineTemplates.
   * @type {string}
   */
  defaultSearchEngine: "google",

  /**
   * Whether links should open in new tabs.
   * True: open in new tab, False: use current tab.
   * @type {boolean}
   */
  openLinksInNewTab: true,

  /**
   * Maximum number of search suggestions to display.
   * @type {number}
   */
  suggestionLimit: 4,

  /**
   * Initializes configuration by loading saved settings from localStorage./
   * Restores tab behavior and search engine preferences if available.
   */
  init: function () {
    // TODO: Remove in future version
    // Remove deprecated notes storage
    localStorage.removeItem("celerity-notes");

    // Load tab behavior setting
    const tabBehavior = localStorage.getItem("tabBehavior");
    if (tabBehavior !== null) {
      this.openLinksInNewTab = tabBehavior === "new";
    }

    // Load search engine setting
    const searchEngine = localStorage.getItem("searchEngine");
    if (searchEngine !== null && this.searchEngineTemplates[searchEngine]) {
      this.defaultSearchEngine = searchEngine;
    }

    // Set the defaultSearchTemplate based on the engine
    this.defaultSearchTemplate =
      this.searchEngineTemplates[this.defaultSearchEngine];
  },
};

// Initialize settings when the script loads
CONFIG.init();

/**
 * Command Definitions
 *
 * A Map containing all keyboard shortcuts and their associated actions.
 * Each entry consists of a key (shortcut) and an object with properties:
 *
 * - name: Display name for the shortcut
 * - url: Target URL for navigation
 * - searchTemplate (optional): Search path template with {} placeholder
 * - suggestions (optional): Array of related shortcut suggestions
 *
 * @type {Map<string, Object>}
 */
const COMMANDS = new Map([
  // Column 1
  ["g", { name: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" }],
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
  // Column 2
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
  // Column 3
  [
    "c",
    {
      name: "Cogrammer",
      suggestions: ["c/reviewer/completed/", "c/reviewer/returned_reviews/"],
      url: "https://hyperiondev.cogrammar.com/",
    },
  ],
  ["l", { name: "Localhost", url: "http://localhost:3000" }],
  [
    "gh",
    {
      name: "GitHub",
      url: "https://github.com/",
      searchTemplate: "/search?q={}",
    },
  ],
  // Column 4
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
]);

/**
 * Saves the current commands to localStorage.
 * Converts the Map to a JSON-serializable object for storage.
 */
function saveCommands() {
  const commandsObj = Object.fromEntries(COMMANDS);
  localStorage.setItem("commands", JSON.stringify(commandsObj));
}

/**
 * Loads saved commands from localStorage.
 * Restores the commands Map from the saved JSON if available.
 */
function loadCommands() {
  const commandsStr = localStorage.getItem("commands");
  if (!commandsStr) return;

  try {
    const commandsObj = JSON.parse(commandsStr);
    let updated = false;

    // Use saved commands as the source of truth, even if empty.
    COMMANDS.clear();

    for (const [key, value] of Object.entries(commandsObj)) {
      // Check and add searchTemplate values for user's running on older localStorage config.
      if (key === "d" && !value.searchTemplate) {
        value.searchTemplate = "/search/work?path=%2F&query={}";
        updated = true;
      }
      if (key === "gh" && !value.searchTemplate) {
        value.searchTemplate = "/search?q={}";
        updated = true;
      }
      COMMANDS.set(key, value);
    }

    // Save back to localStorage if updated
    if (updated) {
      localStorage.setItem("commands", JSON.stringify(commandsObj));
    }
  } catch (e) {
    console.error("Failed to parse commands from localStorage", e);
  }
}
