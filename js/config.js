/*
 * Celerity configuration and command storage.
 *
 * Defines:    CONFIG, DEFAULT_COMMANDS, defaultCommands(), COMMANDS,
 *             saveCommands(), loadCommands()
 * Depends on: nothing (must be the first script to load — every other file
 *             reads these globals)
 */

const CONFIG = {
  /* Separates a command key from its query, e.g. "y lofi" searches YouTube. */
  commandSearchDelimiter: " ",

  /* Fallback search when input matches no command. {} is the encoded query. */
  defaultSearchTemplate: "https://www.google.com/search?q={}",

  suggestionLimit: 4,
};

/*
 * Factory-default shortcuts. Entry order is grid display order.
 * Optional per-command properties honoured by search.js for imported
 * configs: searchTemplate (site search path, {} placeholder), suggestions
 * (static suggestion list), command (alias redirecting to another query).
 */
const DEFAULT_COMMANDS = [
  ["g", { name: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" }],
  [
    "y",
    {
      name: "YouTube",
      searchTemplate: "/results?search_query={}",
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
  ["c", { name: "Cogrammer", url: "https://hyperiondev.cogrammar.com/" }],
  ["l", { name: "Localhost", url: "http://localhost:3000" }],
  [
    "gh",
    {
      name: "GitHub",
      url: "https://github.com/",
      searchTemplate: "/search?q={}",
    },
  ],
  [
    "k",
    {
      name: "Knowledge",
      url: "https://sites.google.com/hyperiondev.com/hyperiondev-kb/home?authuser=0",
    },
  ],
  ["r", { name: "Reddit", url: "https://reddit.com" }],
  ["s", { name: "Spotify", searchTemplate: "/search/{}", url: "https://open.spotify.com" }],
];

/*
 * Returns a fresh Map of the default commands with cloned value objects,
 * so callers (initial load, settings reset) can never share or mutate the
 * canonical definitions.
 */
function defaultCommands() {
  return new Map(DEFAULT_COMMANDS.map(([key, value]) => [key, { ...value }]));
}

/* Live command map. Saved commands replace this wholesale in loadCommands(). */
const COMMANDS = defaultCommands();

function saveCommands() {
  localStorage.setItem("commands", JSON.stringify(Object.fromEntries(COMMANDS)));
}

/*
 * Restores commands from localStorage. Saved commands are the total source
 * of truth: an empty saved object legitimately yields zero shortcuts (the
 * grid then shows its empty-state "+" tile).
 */
function loadCommands() {
  const commandsStr = localStorage.getItem("commands");
  if (!commandsStr) return;

  try {
    const commandsObj = JSON.parse(commandsStr);
    const defaults = new Map(DEFAULT_COMMANDS);
    let updated = false;

    COMMANDS.clear();

    for (const [key, value] of Object.entries(commandsObj)) {
      // Configs saved before "d"/"gh" gained site search lack a
      // searchTemplate; backfill it from the defaults once.
      if ((key === "d" || key === "gh") && !value.searchTemplate) {
        value.searchTemplate = defaults.get(key).searchTemplate;
        updated = true;
      }
      COMMANDS.set(key, value);
    }

    if (updated) {
      localStorage.setItem("commands", JSON.stringify(commandsObj));
    }
  } catch (e) {
    console.error("Failed to parse commands from localStorage", e);
  }
}
