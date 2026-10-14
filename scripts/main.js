const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav a");

// The active section is the last one whose top has passed 30% of the
// viewport. The last section (Contact) is too short to ever reach that
// line, so it also becomes active once the page is scrolled to the bottom.
function updateActiveNav() {
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  let current = sections[0];

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.3) {
      current = section;
    }
  });
  if (atBottom) current = sections[sections.length - 1];

  navLinks.forEach((link) => {
    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === `#${current.id}`
    );
  });
}

let navTicking = false;
window.addEventListener(
  "scroll",
  () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
      updateActiveNav();
      navTicking = false;
    });
  },
  { passive: true }
);
updateActiveNav();

const filterButtons = document.querySelectorAll(".filter");
const workCards = document.querySelectorAll(".work-card");

const workGrid = document.querySelector(".work-grid");

const columnEls = workGrid
  ? Array.from(workGrid.querySelectorAll(":scope > .work-col"))
  : [];
const originalColumnCards = columnEls.map((col) => Array.from(col.children));
const hiddenPool = document.createElement("div");
hiddenPool.style.display = "none";
document.body.appendChild(hiddenPool);

function restoreOriginalLayout() {
  columnEls.forEach((col, i) => {
    originalColumnCards[i].forEach((card) => col.appendChild(card));
  });
}

function reflowFilteredLayout(target) {
  const allCardsInOrder = originalColumnCards.flat();
  let nextColumn = 0;

  allCardsInOrder.forEach((card) => {
    const categories = card.dataset.category.split(/\s+/);
    if (!categories.includes(target)) {
      hiddenPool.appendChild(card);
      return;
    }
    columnEls[nextColumn].appendChild(card);
    nextColumn = (nextColumn + 1) % columnEls.length;
  });
}

workCards.forEach((card, index) => {
  card.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
});

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      workCards.forEach((card) => card.classList.add("is-revealed"));
      obs.disconnect();
    });
  },
  { threshold: 0.01 }
);

if (workGrid) revealObserver.observe(workGrid);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.filter;

    filterButtons.forEach((b) => {
      b.classList.toggle("is-active", b === button);
      b.setAttribute("aria-selected", b === button ? "true" : "false");
    });

    workCards.forEach((card) => {
      const categories = card.dataset.category.split(/\s+/);
      const matches = target === "all" || categories.includes(target);
      card.classList.toggle("is-hidden", !matches);
    });

    if (target === "all") {
      restoreOriginalLayout();
    } else {
      reflowFilteredLayout(target);
    }
  });
});

const CATEGORY_LABELS = { web: "Web", app: "App" };
const cardList = Array.from(workCards);
const modal = document.getElementById("work-modal");
const modalTitle = modal.querySelector(".wm-info-title");
const modalYear = modal.querySelector(".wm-info-year");
const modalCategories = modal.querySelector(".wm-info-categories");
const modalMediaFrame = modal.querySelector(".wm-media-frame");
const modalMediaMockupSlot = modal.querySelector(".wm-media-mockup-slot");
const modalThumbs = modal.querySelector(".wm-thumbs");
const modalDescription = modal.querySelector(".project-description");
const modalCredits = modal.querySelector(".wm-credits");
const modalCreditsRows = modal.querySelector(".wm-credits-rows");

const DEFAULT_DESCRIPTION = "프로젝트 설명이 들어갈 자리입니다.";

let currentMedia = [];
let currentMockupSource = null;

// A media entry of the form "prototype:<url>" embeds an interactive app
// prototype inside a phone frame instead of showing a still image.
const PROTOTYPE_PREFIX = "prototype:";
const PHONE_WIDTH = 380;
const PHONE_HEIGHT = 760;

function isPrototype(src) {
  return src.startsWith(PROTOTYPE_PREFIX);
}

function fitPrototype() {
  const box = modalMediaMockupSlot.querySelector(".proto-box");
  // The modal may still be hidden (zero size) right after rendering.
  if (!box || modalMediaMockupSlot.clientHeight === 0) return;
  const scale = Math.min(
    1,
    (modalMediaMockupSlot.clientWidth - 32) / PHONE_WIDTH,
    (modalMediaMockupSlot.clientHeight - 64) / PHONE_HEIGHT
  );
  box.style.width = `${PHONE_WIDTH * scale}px`;
  box.style.height = `${PHONE_HEIGHT * scale}px`;
  box.firstElementChild.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", fitPrototype);

function showPrototype(src) {
  modalMediaFrame.style.display = "none";
  modalMediaMockupSlot.style.display = "flex";
  modalMediaMockupSlot.innerHTML = `
    <div class="proto-stage">
      <div class="proto-box">
        <div class="proto-phone">
          <iframe class="proto-screen" title="Episode 앱 인터랙티브 프로토타입"></iframe>
        </div>
      </div>
      <p class="proto-caption">Interactive prototype · 데모 데이터 — 화면을 스크롤하고 카드를 좌우로 넘겨 보세요</p>
    </div>`;
  modalMediaMockupSlot.querySelector(".proto-screen").src = src.slice(PROTOTYPE_PREFIX.length);
  requestAnimationFrame(fitPrototype);
}

function showMedia(mediaIndex) {
  const src = currentMedia[mediaIndex];

  if (isPrototype(src)) {
    showPrototype(src);
  } else if (src === "mockup" && currentMockupSource) {
    modalMediaFrame.style.display = "none";
    modalMediaMockupSlot.style.display = "flex";
    modalMediaMockupSlot.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "phone-mockup-stage";
    stage.appendChild(currentMockupSource.cloneNode(true));
    modalMediaMockupSlot.appendChild(stage);
  } else {
    modalMediaMockupSlot.style.display = "none";
    modalMediaMockupSlot.innerHTML = "";
    modalMediaFrame.style.display = "";
    modalMediaFrame.classList.remove("is-empty");
    modalMediaFrame.src = src;
  }

  modalThumbs.querySelectorAll(".wm-thumb").forEach((thumb, i) => {
    thumb.classList.toggle("is-active", i === mediaIndex);
  });
}

function renderGallery(card) {
  let media = [];
  try {
    media = JSON.parse(card.dataset.media || "[]");
  } catch (err) {
    media = [];
  }
  currentMedia = media;
  currentMockupSource = card.querySelector(".phone-mockup");
  modalThumbs.innerHTML = "";

  if (media.length === 0) {
    modalMediaMockupSlot.style.display = "none";
    modalMediaMockupSlot.innerHTML = "";
    modalMediaFrame.style.display = "";
    modalMediaFrame.classList.add("is-empty");
    modalMediaFrame.removeAttribute("src");
    for (let i = 0; i < 5; i += 1) {
      const thumb = document.createElement("div");
      thumb.className = "wm-thumb placeholder" + (i === 0 ? " is-active" : "");
      modalThumbs.appendChild(thumb);
    }
    return;
  }

  media.forEach((src, i) => {
    const thumb = document.createElement("div");
    thumb.className = "wm-thumb" + (i === 0 ? " is-active" : "");
    if (isPrototype(src)) {
      thumb.classList.add("wm-thumb--prototype");
      thumb.title = "Interactive prototype";
    } else if (src === "mockup" && currentMockupSource) {
      thumb.classList.add("wm-thumb--mockup");
      const stage = document.createElement("div");
      stage.className = "phone-mockup-stage";
      stage.appendChild(currentMockupSource.cloneNode(true));
      thumb.appendChild(stage);
    } else {
      thumb.style.backgroundImage = `url('${src}')`;
    }
    thumb.addEventListener("click", () => showMedia(i));
    modalThumbs.appendChild(thumb);
  });

  showMedia(0);
}

function renderModal(index) {
  const card = cardList[index];
  const tags = (card.dataset.tags || CATEGORY_LABELS[card.dataset.category] || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  modalTitle.textContent = card.querySelector(".work-card__title").textContent;
  modalYear.textContent = card.dataset.year || "";
  modalCategories.innerHTML = "";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "wm-info-category";
    span.textContent = tag;
    modalCategories.appendChild(span);
  });

  renderGallery(card);

  modalDescription.textContent = card.dataset.description || DEFAULT_DESCRIPTION;

  let details = [];
  try {
    details = JSON.parse(card.dataset.details || "[]");
  } catch (err) {
    details = [];
  }
  modalCreditsRows.innerHTML = "";
  details.forEach((row) => {
    const p = document.createElement("p");
    p.className = "body-text";
    p.append(`${row.role} `);
    const span = document.createElement("span");
    span.textContent = row.name;
    p.appendChild(span);
    modalCreditsRows.appendChild(p);
  });
  modalCredits.classList.toggle("is-hidden", details.length === 0);

  modal.querySelector(".wm-media").scrollTop = 0;
  modal.querySelector(".wm-info").scrollTop = 0;
}

let activeIndex = 0;

// A card can be opened/navigated to only if it's a real project
// (not a placeholder) and it's visible under the current filter.
function isNavigable(card) {
  return (
    !card.classList.contains("placeholder") &&
    !card.classList.contains("is-hidden")
  );
}

function findNextIndex(fromIndex, direction) {
  for (let step = 1; step <= cardList.length; step += 1) {
    const i = (fromIndex + direction * step + cardList.length * step) % cardList.length;
    if (isNavigable(cardList[i])) return i;
  }
  return fromIndex;
}

function openModal(index) {
  activeIndex = index;
  renderModal(activeIndex);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  // Drop any embedded prototype so it stops running in the background.
  modalMediaMockupSlot.innerHTML = "";
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

cardList.forEach((card, index) => {
  card.addEventListener("click", () => {
    if (!isNavigable(card)) return;
    openModal(index);
  });
});

modal.querySelector(".wm-close").addEventListener("click", closeModal);

modal.querySelectorAll(".wm-arrow").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.dir === "next" ? 1 : -1;
    activeIndex = findNextIndex(activeIndex, direction);
    renderModal(activeIndex);
  });
});

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("is-open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") modal.querySelector('[data-dir="next"]').click();
  if (e.key === "ArrowLeft") modal.querySelector('[data-dir="prev"]').click();
});
