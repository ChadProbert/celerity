/**
 * Theme Management System
 *
 * Handles all aspects of theme switching, persistence, and related settings.
 * This module manages theme selection, tab behavior preferences, and search
 * engine selection, storing user preferences in localStorage.
 *
 * Features:
 * - Theme switching with instant visual update
 * - Persistent theme selection using localStorage
 * - Tab behavior settings (new tab vs. current tab)
 * - Search engine selection
 * - Real-time application of settings changes
 */
document.addEventListener("DOMContentLoaded", () => {
  // Element selectors
  const themeSelect = document.getElementById("themeSelect");
  const tabBehaviorNew = document.getElementById("tabBehaviorNew");
  const tabBehaviorCurrent = document.getElementById("tabBehaviorCurrent");
  const searchEngineGoogle = document.getElementById("searchEngineGoogle");
  const searchEngineDuckDuckGo = document.getElementById(
    "searchEngineDuckDuckGo"
  );

  /**
   * THEME SETTINGS
   *
   * Loads and applies the saved theme from localStorage.
   * If no theme is saved, defaults to the 'Celerity (dark)' theme.
   */
  const savedTheme = localStorage.getItem("selectedTheme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeSelect.value = savedTheme;

  /**
   * TAB BEHAVIOR SETTINGS
   *
   * Loads and applies the saved tab behavior from localStorage.
   * Controls whether links open in new tabs or the current tab.
   */
  const savedTabBehavior =
    localStorage.getItem("tabBehavior") ||
    (CONFIG.openLinksInNewTab ? "new" : "current");
  if (savedTabBehavior === "new") {
    tabBehaviorNew.checked = true;
  } else {
    tabBehaviorCurrent.checked = true;
  }

  /**
   * SEARCH ENGINE SETTINGS
   *
   * Loads and applies the saved search engine preference from localStorage.
   * Determines which search engine is used for default searches.
   */
  const savedSearchEngine =
    localStorage.getItem("searchEngine") || CONFIG.defaultSearchEngine;
  if (savedSearchEngine === "google") {
    searchEngineGoogle.checked = true;
  } else {
    searchEngineDuckDuckGo.checked = true;
  }

  /**
   * EVENT HANDLERS
   *
   * Sets up event listeners for all theme and preference controls.
   */

  /**
   * Theme change handler
   *
   * Updates the theme immediately when selected and saves the preference.
   *
   * @param {Event} event - The change event from the theme select dropdown
   */
  const handleThemeChange = (event) => {
    const selectedTheme = event.target.value;
    document.documentElement.setAttribute("data-theme", selectedTheme);
    localStorage.setItem("selectedTheme", selectedTheme);
  };

  /**
   * Tab behavior change handler
   *
   * Updates how links open (new tab vs. current tab) and saves the preference.
   * Re-renders the commands component to apply the new behavior.
   *
   * @param {Event} event - The change event from the tab behavior radio buttons
   */
  const handleTabBehaviorChange = (event) => {
    const selectedBehavior = event.target.value;
    localStorage.setItem("tabBehavior", selectedBehavior);
    CONFIG.openLinksInNewTab = selectedBehavior === "new";

    // Reload commands to apply new tab behavior
    document.querySelector("commands-component")?.render();
  };

  /**
   * Search engine change handler
   *
   * Updates the default search engine and saves the preference.
   *
   * @param {Event} event - The change event from the search engine radio buttons
   */
  const handleSearchEngineChange = (event) => {
    const selectedEngine = event.target.value;
    localStorage.setItem("searchEngine", selectedEngine);
    CONFIG.defaultSearchEngine = selectedEngine;
    CONFIG.defaultSearchTemplate = CONFIG.searchEngineTemplates[selectedEngine];
  };

  // Add event listeners
  themeSelect.addEventListener("change", handleThemeChange);

  // Add radio button event listeners
  document.querySelectorAll('input[name="tabBehavior"]').forEach((radio) => {
    radio.addEventListener("change", handleTabBehaviorChange);
  });

  document.querySelectorAll('input[name="searchEngine"]').forEach((radio) => {
    radio.addEventListener("change", handleSearchEngineChange);
  });
});
