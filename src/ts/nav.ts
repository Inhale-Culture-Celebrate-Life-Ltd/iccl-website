/* Mobile navigation toggle.
   Active-link highlighting is now done at build time by the Eleventy header
   partial (src/_includes/header.njk uses `currentPage` from the page front
   matter), so this script no longer touches link classes. */

const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const links = document.querySelector<HTMLUListElement>(".nav-links");

if (toggle && links) {
  const closeMenu = (returnFocus = false): void => {
    links.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (target && !target.closest(".nav")) {
      closeMenu();
    }
  });

  links.addEventListener("click", (e) => {
    const target = e.target as Element | null;
    if (target?.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      closeMenu(true);
    }
  });
}
