/*
 * Optional animated page background. Off by default.
 *
 * Defines:    window.CelerityBackground (modal.js calls it for export,
 *             import and reset).
 * Depends on: #backdrop, #backgroundSelect, localStorage, and the theme
 *             colours --color-background and --backdrop-ink.
 *
 * Nothing here costs anything while the option is "none": the shader file
 * (js/vendor/paper-dithering.js) is only loaded once the option is turned on.
 */
const CelerityBackground = (() => {
  const STORAGE_KEY = "selectedBackground";
  const VALID_BACKGROUNDS = ["none", "dithering"];
  const SHADER_FILE = "./vendor/paper-dithering.js";

  // Shader settings, taken from the Paper Shaders dithering page
  const SPEED = 0.14;
  const SCALE = 1.84;
  const PIXEL_SIZE = 1;

  // Kept low on purpose, to keep performance consistent
  const FRAMES_PER_SECOND = 30;
  const MAX_PIXELS = 1920 * 1080 * 2;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let preference = "none";
  let paper = null; // The loaded shader file
  let mount = null; // The running shader, or null
  let loopId = null;
  let lastDraw = 0;
  let frame = 0; // Animation time. Kept across restarts so the pattern carries on
  let startToken = 0;
  let unsupported = false;

  const normalize = (value) =>
    VALID_BACKGROUNDS.includes(value) ? value : "none";

  /* The shader follows the active theme's colours. */
  const themeColors = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      u_colorBack: paper.getShaderColorFromString(
        styles.getPropertyValue("--color-background").trim()
      ),
      u_colorFront: paper.getShaderColorFromString(
        styles.getPropertyValue("--backdrop-ink").trim()
      ),
    };
  };

  /*
   * The frame rate is capped by drawing from our own loop: the shader is
   * mounted with speed 0 and handed a new time value 30 times a second.
   * With "reduce motion" on, the loop does not run and one still frame shows.
   */
  const stopLoop = () => {
    if (loopId !== null) cancelAnimationFrame(loopId);
    loopId = null;
  };

  const startLoop = () => {
    stopLoop();
    if (!mount || reducedMotion.matches) return;
    lastDraw = performance.now();
    const tick = (now) => {
      loopId = requestAnimationFrame(tick);
      const elapsed = now - lastDraw;
      if (elapsed < 1000 / FRAMES_PER_SECOND) return;
      lastDraw = now;
      // A long gap (a stalled tab) must not make the pattern jump
      frame += Math.min(elapsed, 100) * SPEED;
      mount.setFrame(frame);
    };
    loopId = requestAnimationFrame(tick);
  };

  const stop = () => {
    startToken++;
    stopLoop();
    delete document.documentElement.dataset.backdrop;
    if (mount) {
      mount.dispose();
      mount = null;
    }
  };

  /* Some devices cannot run the shader. The option then says so. */
  const markUnsupported = () => {
    unsupported = true;
    const option = document.querySelector(
      '#backgroundSelect option[value="dithering"]'
    );
    if (option) {
      option.disabled = true;
      option.textContent = "Dithering (not supported on this device)";
    }
  };

  const start = async () => {
    const backdrop = document.getElementById("backdrop");
    if (
      mount ||
      unsupported ||
      !backdrop ||
      preference !== "dithering" ||
      document.hidden
    ) {
      return;
    }

    const token = ++startToken;
    try {
      paper ??= await import(SHADER_FILE);
      // Things may have changed while the file was loading
      if (token !== startToken || document.hidden) return;

      const created = new paper.ShaderMount(
        backdrop,
        paper.ditheringFragmentShader,
        {
          ...themeColors(),
          u_shape: paper.DitheringShapes.warp,
          u_type: paper.DitheringTypes["4x4"],
          u_pxSize: PIXEL_SIZE,
          u_fit: paper.ShaderFitOptions.none,
          u_scale: SCALE,
          u_rotation: 0,
          u_offsetX: 0,
          u_offsetY: 0,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
        },
        { powerPreference: "low-power" },
        0, // Speed 0: our own loop drives the animation
        frame,
        1, // Draw at the screen's own resolution, not double
        MAX_PIXELS
      );
      mount = created;
      // Lets the modals show the background too (see .backdrop in style.css)
      document.documentElement.dataset.backdrop = "on";

      // Chrome can take the drawing surface away at any time. Shut down
      // cleanly; the next time the tab is shown, start() runs again.
      created.canvasElement.addEventListener("webglcontextlost", () => {
        if (mount === created) stop();
      });

      startLoop();
    } catch (error) {
      // No WebGL2 here. The library leaves its canvas behind, so remove it.
      backdrop.replaceChildren();
      mount = null;
      markUnsupported();
    }
  };

  /*
   * Chrome only allows about 16 live WebGL canvases across all Celerity
   * tabs. A hidden tab therefore gives its canvas up, and takes a new one
   * when it is shown again.
   */
  const sync = () => {
    if (preference === "dithering" && !document.hidden) {
      start();
    } else {
      stop();
    }
  };

  const apply = (value, { persist = true } = {}) => {
    preference = normalize(value);

    if (persist) localStorage.setItem(STORAGE_KEY, preference);
    const select = document.getElementById("backgroundSelect");
    if (select) select.value = preference;

    sync();
    return preference;
  };

  const stored = () => normalize(localStorage.getItem(STORAGE_KEY));

  /* Re-reads the theme colours, after the theme changed. */
  const refreshColors = () => {
    if (mount) mount.setUniforms(themeColors());
  };

  // Known from the start, so a tab opened in the background still starts
  // the shader when it is first shown.
  preference = stored();

  return {
    VALID_BACKGROUNDS,
    STORAGE_KEY,
    apply,
    stored,
    sync,
    startLoop,
    refreshColors,
  };
})();

window.CelerityBackground = CelerityBackground;

document.addEventListener("DOMContentLoaded", () => {
  const background = window.CelerityBackground;
  const select = document.getElementById("backgroundSelect");

  if (select) {
    select.value = background.stored();
    select.addEventListener("change", (event) => {
      background.apply(event.target.value);
    });
  }

  // Start after the first paint, so the page itself shows up instantly
  requestAnimationFrame(() => {
    requestAnimationFrame(background.sync);
  });

  document.addEventListener("visibilitychange", background.sync);

  // Hold still, or move again, when the "reduce motion" setting changes
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", background.startLoop);

  // Follow the theme: theme.js sets data-theme on the root element
  new MutationObserver(background.refreshColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Follow a change made in another Celerity tab
  window.addEventListener("storage", (event) => {
    if (event.key === background.STORAGE_KEY) {
      background.apply(event.newValue, { persist: false });
    }
  });

  // A page restored from the back/forward cache missed storage events
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      background.apply(background.stored(), { persist: false });
    }
  });
});
