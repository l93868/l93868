(function () {
  const tabs = Array.from(document.querySelectorAll("[data-country]"));
  const panels = Array.from(document.querySelectorAll("[data-country-panel]"));

  function activateCountry(country) {
    tabs.forEach((button) => {
      const active = button.dataset.country === country;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.countryPanel === country);
    });
  }

  tabs.forEach((button) => {
    button.addEventListener("click", () => {
      activateCountry(button.dataset.country);
    });
  });

  const detailCards = Array.from(document.querySelectorAll(".detail-card"));
  detailCards.forEach((card, index) => {
    const summary = card.querySelector("summary");
    if (!summary) {
      return;
    }

    const contentId = `detail-card-${index + 1}`;
    summary.setAttribute("role", "button");
    summary.setAttribute("aria-controls", contentId);
    summary.setAttribute("aria-expanded", String(card.open));

    const contentChildren = Array.from(card.children).filter((element) => element !== summary);
    contentChildren.forEach((element) => {
      element.id = contentId;
    });

    card.addEventListener("toggle", () => {
      summary.setAttribute("aria-expanded", String(card.open));
    });
  });

  const navLinks = Array.from(document.querySelectorAll(".top-nav a[href^='#'], .hero-actions a[href^='#'], .timeline-card[href^='#']"));
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") {
        return;
      }
      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  activateCountry("britain");
})();
