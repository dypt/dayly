"use strict";
const APP_VERSION = "v0.1.0-6-g49942eb";
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");
const menuVersion = document.querySelector("[data-menu-version]");
const updateNotice = document.querySelector("[data-update-notice]");
if (!menuButton || !menu || !menuVersion || !updateNotice) {
    throw new Error("The application shell is missing its menu elements.");
}
const button = menuButton;
const menuPanel = menu;
const updatePanel = updateNotice;
menuVersion.textContent = APP_VERSION;
function showUpdateNotice() {
    updatePanel.hidden = false;
}
function setMenuOpen(isOpen) {
    menuPanel.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
}
button.addEventListener("click", () => {
    setMenuOpen(menuPanel.hidden);
});
document.addEventListener("click", (event) => {
    if (!menuPanel.hidden && !menuPanel.contains(event.target) && event.target !== button) {
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
        void navigator.serviceWorker.register("./sw.js", { scope: "./" }).then((registration) => {
            if (registration.waiting) {
                showUpdateNotice();
            }
            registration.addEventListener("updatefound", () => {
                const installing = registration.installing;
                installing?.addEventListener("statechange", () => {
                    if (installing.state === "installed" && navigator.serviceWorker.controller) {
                        showUpdateNotice();
                    }
                });
            });
            void registration.update();
        });
    });
}
//# sourceMappingURL=app.js.map