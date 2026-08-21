/* Yanez partner portal — small enhancements on top of MkDocs Material.
   Loaded at the end of <body>, so the DOM is ready. */

(function () {
  "use strict";

  /* ⌘K / Ctrl+K opens Material's search overlay. Material's own bindings
     (/, s, f) still work — this just adds the shortcut people expect. */
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

  document.addEventListener("keydown", function (event) {
    if (event.key.toLowerCase() !== "k") return;
    if (!(isMac ? event.metaKey : event.ctrlKey)) return;

    const toggle = document.querySelector("[data-md-toggle=search]");
    const input = document.querySelector(".md-search__input");
    if (!toggle || !input) return;

    event.preventDefault();
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    input.focus();
    input.select();
  });

  /* Show the shortcut in the search box so it is discoverable. */
  const form = document.querySelector(".md-search__form");
  if (form) form.setAttribute("data-yz-hint", isMac ? "⌘K" : "Ctrl K");

  /* Download page: ring the store badge matching the visitor's OS. */
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : null;
  if (os) {
    const badge = document.querySelector('.badge[data-os="' + os + '"]');
    if (badge) badge.classList.add("badge--match");
  }
})();
