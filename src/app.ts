const APP_VERSION = "__APP_VERSION__";

const menuButton = document.querySelector<HTMLButtonElement>("[data-menu-button]");
const menu = document.querySelector<HTMLElement>("[data-menu]");
const menuVersion = document.querySelector<HTMLElement>("[data-menu-version]");

if (!menuButton || !menu || !menuVersion) {
  throw new Error("The application shell is missing its menu elements.");
}

const button = menuButton;
const menuPanel = menu;
menuVersion.textContent = APP_VERSION;

function setMenuOpen(isOpen: boolean) {
  menuPanel.hidden = !isOpen;
  button.setAttribute("aria-expanded", String(isOpen));
}

button.addEventListener("click", () => {
  setMenuOpen(menuPanel.hidden);
});

document.addEventListener("click", (event) => {
  if (!menuPanel.hidden && !menuPanel.contains(event.target as Node) && event.target !== button) {
    setMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js", { scope: "./" });
  });
}
