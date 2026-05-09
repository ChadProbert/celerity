/**
 * Theme Management System
 *
 * Handles all aspects of theme switching, persistence, and related settings.
 * This module manages theme selection and stores user preferences in localStorage.
 *
 * Features:
 * - Theme switching with instant visual update
 * - Persistent theme selection using localStorage
 * - Real-time application of settings changes
 */
const CelerityTheme = (() => {
  const THEME_ROOT = document.documentElement;
  const VALID_THEMES = ["system", "dark", "light", "void"];

  const resolveThemePreference = (preference) => {
    if (preference === "system") {
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }
    return preference;
  };

  const normalizeThemePreference = (preference) => {
    if (!VALID_THEMES.includes(preference)) return "system";
    return preference;
  };

  const applyThemePreference = (
    preference,
    { persist = true, updateSelect = true } = {}
  ) => {
    const normalized = normalizeThemePreference(preference);
    const resolved = resolveThemePreference(normalized);

    // Clear the previous theme marker before applying the new one.
    THEME_ROOT.removeAttribute("data-theme");
    THEME_ROOT.setAttribute("data-theme", resolved);

    if (updateSelect) {
      const themeSelect = document.getElementById("themeSelect");
      if (themeSelect) themeSelect.value = normalized;
    }

    if (persist) {
      localStorage.setItem("selectedTheme", normalized);
    }

    return { normalized, resolved };
  };

  return {
    VALID_THEMES,
    applyThemePreference,
    normalizeThemePreference,
    resolveThemePreference,
  };
})();

window.CelerityTheme = CelerityTheme;

document.addEventListener("DOMContentLoaded", () => {
  // Element selectors
  const themeSelect = document.getElementById("themeSelect");
  const { applyThemePreference, normalizeThemePreference } = window.CelerityTheme;

  /**
   * THEME SETTINGS
   *
   * Loads and applies the saved theme from localStorage.
   * If no theme is saved, defaults to system preference.
   */
  const savedTheme = localStorage.getItem("selectedTheme") || "system";
  applyThemePreference(savedTheme);

  /**
   * Theme change handler
   *
   * Updates the theme immediately when selected and saves the preference.
   *
   * @param {Event} event - The change event from the theme select dropdown
   */
  const handleThemeChange = (event) => {
    const selectedTheme = event.target.value;
    applyThemePreference(selectedTheme);
  };

  if (themeSelect) {
    themeSelect.addEventListener("change", handleThemeChange);
  }

  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  colorSchemeQuery.addEventListener("change", () => {
    const preference = localStorage.getItem("selectedTheme") || "system";
    if (normalizeThemePreference(preference) === "system") {
      applyThemePreference("system");
    }
  });
});
