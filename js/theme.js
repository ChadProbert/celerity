/*
 * Theme switching and persistence.
 *
 * Defines:    window.CelerityTheme (assigned at parse time, so it exists
 *             before any DOMContentLoaded handler — modal.js relies on that)
 * Depends on: #themeSelect (looked up at call time), localStorage
 */
const CelerityTheme = (() => {
  const THEME_ROOT = document.documentElement;
  const VALID_THEMES = ["system", "dark", "light", "void"];

  /* "system" resolves to light/dark from the OS preference. */
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

  /*
   * Applies a theme preference: sets data-theme on the root element,
   * syncs the settings dropdown, and persists the (normalized) preference.
   */
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
  const themeSelect = document.getElementById("themeSelect");
  const { applyThemePreference, normalizeThemePreference } = window.CelerityTheme;

  // Apply the saved theme (or the system preference) on load
  const savedTheme = localStorage.getItem("selectedTheme") || "system";
  applyThemePreference(savedTheme);

  if (themeSelect) {
    themeSelect.addEventListener("change", (event) => {
      applyThemePreference(event.target.value);
    });
  }

  // Track OS light/dark changes while the "system" preference is active
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: light)");
  colorSchemeQuery.addEventListener("change", () => {
    const preference = localStorage.getItem("selectedTheme") || "system";
    if (normalizeThemePreference(preference) === "system") {
      applyThemePreference("system");
    }
  });

  // Follow theme changes made in OTHER new-tab instances. Without this,
  // already-open tabs (and their settings modal) keep the old theme until
  // reloaded. persist:false — this tab is a follower, not the source.
  window.addEventListener("storage", (event) => {
    if (event.key === "selectedTheme") {
      applyThemePreference(event.newValue || "system", { persist: false });
    }
  });

  // Same staleness guard for back/forward-cache restores: a frozen page
  // misses storage events, so re-apply the stored theme on revival.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      applyThemePreference(localStorage.getItem("selectedTheme") || "system", {
        persist: false,
      });
    }
  });
});
