/*
 * Toolbar popup (popup.html): shows the version, opens Chrome's own on/off
 * switch for Celerity, and lets the arrow keys move between menu items.
 *
 * Depends on: #popupVersion, #turnOffButton, .popup-item
 */

document.getElementById("popupVersion").textContent =
  `v${chrome.runtime.getManifest().version}`;

/*
 * Chrome gives extensions no way to switch off only the new tab override, so
 * this opens Celerity's page in Chrome's extension settings, where the real
 * on/off switch is. It can't be a plain link: pages may not open chrome://
 * URLs, but chrome.tabs.create may, and it needs no permission.
 */
document.getElementById("turnOffButton").addEventListener("click", async () => {
  await chrome.tabs.create({
    url: `chrome://extensions/?id=${chrome.runtime.id}`,
  });
  window.close();
});

/* Arrow keys, Home and End move between menu items; Tab works as usual. */
const menuItems = [...document.querySelectorAll(".popup-item")];

document.addEventListener("keydown", (event) => {
  const current = menuItems.indexOf(document.activeElement);
  const last = menuItems.length - 1;
  let next;

  switch (event.key) {
    case "ArrowDown":
      next = current === last ? 0 : current + 1;
      break;
    case "ArrowUp":
      next = current <= 0 ? last : current - 1;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = last;
      break;
    default:
      return;
  }

  event.preventDefault();
  menuItems[next].focus();
});
