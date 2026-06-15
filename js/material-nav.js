(() => {
  const MATERIAL_INDEX_HREF = "index.html";
  const PUBLIC_INDEX_HREF = "../../index.html";
  const MATERIAL_INDEX_PATTERN = /\/materials\/sier-technical-handbook\/(?:index\.html)?$/;

  const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

  const ensureId = (element, index) => {
    if (!element.id) {
      element.id = `material-nav-target-${index + 1}`;
    }
    return element.id;
  };

  const collectLandscapeSections = () => {
    const covers = [...document.querySelectorAll(".a4-landscape-page .section-cover h1")];
    return covers.map((heading, index) => {
      const target = heading.closest(".a4-landscape-page") || heading;
      return {
        target,
        label: normalizeText(heading.textContent) || `Section ${index + 1}`,
      };
    });
  };

  const collectPortraitHeadings = () => {
    const headings = [...document.querySelectorAll(".portrait-page h1, .portrait-page h2")];
    const seen = new Set();

    return headings
      .filter((heading) => {
        const text = normalizeText(heading.textContent);
        if (!text || seen.has(heading)) {
          return false;
        }
        seen.add(heading);
        return true;
      })
      .map((heading, index) => {
        const target = heading.closest("section") || heading;
        const label = normalizeText(heading.textContent);
        return {
          target,
          label: label || `Section ${index + 1}`,
        };
      });
  };

  const collectPortraitPages = () => {
    const pages = [...document.querySelectorAll(".portrait-page")];
    return pages.map((page, index) => {
      return {
        target: page,
        label: `Page ${index + 1}`,
      };
    });
  };

  const collectDefaultSections = () => {
    const headings = [
      ...document.querySelectorAll(
        "main .section h2, main section > h2, main article > h2, main h1"
      ),
    ];
    const seen = new Set();

    return headings
      .filter((heading) => {
        const text = normalizeText(heading.textContent);
        if (!text || seen.has(heading)) {
          return false;
        }
        seen.add(heading);
        return true;
      })
      .map((heading, index) => ({
        target: heading.closest("section") || heading,
        label: normalizeText(heading.textContent) || `Section ${index + 1}`,
      }));
  };

  const collectTocItems = () => {
    const landscapeItems = collectLandscapeSections();
    if (landscapeItems.length > 0) {
      return landscapeItems;
    }

    const portraitHeadingItems = collectPortraitHeadings();
    if (portraitHeadingItems.length > 0) {
      return portraitHeadingItems;
    }

    const portraitPageItems = collectPortraitPages();
    if (portraitPageItems.length > 0) {
      return portraitPageItems;
    }

    return collectDefaultSections();
  };

  const scrollToTarget = (target) => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  };

  const createNav = () => {
    const isMaterialIndex = MATERIAL_INDEX_PATTERN.test(window.location.pathname);
    const materialTopHref = isMaterialIndex ? PUBLIC_INDEX_HREF : MATERIAL_INDEX_HREF;
    const tocItems = collectTocItems();

    const nav = document.createElement("nav");
    nav.className = "material-nav";
    nav.setAttribute("aria-label", "資料ナビゲーション");

    const panelId = "material-nav-toc";
    nav.innerHTML = `
      <div class="material-nav__panel" id="${panelId}" hidden>
        <p class="material-nav__panel-title">ページ内目次</p>
        <ul class="material-nav__toc"></ul>
      </div>
      <div class="material-nav__toolbar">
        <a class="material-nav__button" href="${materialTopHref}">資料トップ</a>
        <button class="material-nav__button" type="button" data-material-nav-top>上へ</button>
        <button class="material-nav__button material-nav__button--primary" type="button" aria-expanded="false" aria-controls="${panelId}" data-material-nav-toc>目次</button>
      </div>
    `;

    const panel = nav.querySelector(".material-nav__panel");
    const tocList = nav.querySelector(".material-nav__toc");
    const tocButton = nav.querySelector("[data-material-nav-toc]");
    const topButton = nav.querySelector("[data-material-nav-top]");

    if (tocItems.length === 0) {
      tocList.remove();
      panel.insertAdjacentHTML("beforeend", '<p class="material-nav__empty">移動先がありません。</p>');
      tocButton.disabled = true;
      tocButton.setAttribute("aria-disabled", "true");
    } else {
      tocItems.forEach((item, index) => {
        const targetId = ensureId(item.target, index);
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.className = "material-nav__toc-link";
        link.href = `#${targetId}`;
        link.textContent = item.label;
        link.addEventListener("click", (event) => {
          event.preventDefault();
          panel.hidden = true;
          tocButton.setAttribute("aria-expanded", "false");
          scrollToTarget(item.target);
        });
        listItem.appendChild(link);
        tocList.appendChild(listItem);
      });
    }

    tocButton.addEventListener("click", () => {
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      tocButton.setAttribute("aria-expanded", String(!isOpen));
    });

    topButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) {
        panel.hidden = true;
        tocButton.setAttribute("aria-expanded", "false");
        tocButton.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!panel.hidden && !nav.contains(event.target)) {
        panel.hidden = true;
        tocButton.setAttribute("aria-expanded", "false");
      }
    });

    document.body.appendChild(nav);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createNav);
  } else {
    createNav();
  }
})();
