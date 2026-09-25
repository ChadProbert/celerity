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
  [
    "g",
    {
      name: "Gmail",
      url: "https://mail.google.com/mail/u/0/#inbox",
      searchTemplate: "/mail/u/0/#search/{}",
    },
  ],
  [
    "y",
    {
      name: "YouTube",
      searchTemplate: "/results?search_query={}",
      url: "https://youtube.com/",
    },
  ],
  [
    "n",
    {
      name: "Netflix",
      url: "https://www.netflix.com/browse",
      searchTemplate: "/search?q={}",
    },
  ],
  [
    "c",
    {
      name: "ChatGPT",
      url: "https://chatgpt.com/",
      searchTemplate: "/?q={}",
    },
  ],
  [
    "gh",
    {
      name: "GitHub",
      url: "https://github.com/",
      searchTemplate: "/search?q={}",
    },
  ],
  [
    "r",
    {
      name: "Reddit",
      url: "https://reddit.com",
      searchTemplate: "/search/?q={}",
    },
  ],
  ["w", { name: "Whatsapp", url: "https://web.whatsapp.com/" }],
  [
    "f",
    {
      name: "Facebook",
      url: "https://www.facebook.com/",
      searchTemplate: "/search/top/?q={}",
    },
  ],
  ["s", { name: "Spotify", searchTemplate: "/search/{}", url: "https://open.spotify.com" }],
  [
    "t",
    {
      name: "Twitter",
      url: "https://x.com/",
      searchTemplate: "/search?q={}",
    },
  ],
  [
    "l",
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/",
      searchTemplate: "/search/results/all/?keywords={}",
    },
  ],
  [
    "a",
    {
      name: "Amazon",
      url: "https://www.amazon.com/",
      searchTemplate: "/s?k={}",
    },
  ],
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
      // Configs saved before "gh" gained site search lack a
      // searchTemplate; backfill it from the defaults once.
      if (key === "gh" && !value.searchTemplate) {
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
