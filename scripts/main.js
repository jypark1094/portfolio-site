// [NEXTNOW Inc.]

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav a");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  },
  { rootMargin: "-20% 0px -70% 0px" }
);

sections.forEach((section) => observer.observe(section));

const filterButtons = document.querySelectorAll(".filter");
const workCards = document.querySelectorAll(".work-card");

const workGrid = document.querySelector(".work-grid");

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

function showMedia(mediaIndex) {
  const src = currentMedia[mediaIndex];

  if (src === "mockup" && currentMockupSource) {
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
    if (src === "mockup" && currentMockupSource) {
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

function openModal(index) {
  activeIndex = index;
  renderModal(activeIndex);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

cardList.forEach((card, index) => {
  card.addEventListener("click", () => openModal(index));
});

modal.querySelector(".wm-close").addEventListener("click", closeModal);

modal.querySelectorAll(".wm-arrow").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.dir === "next" ? 1 : -1;
    activeIndex = (activeIndex + direction + cardList.length) % cardList.length;
    renderModal(activeIndex);
  });
});

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("is-open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowRight") modal.querySelector('[data-dir="next"]').click();
  if (e.key === "ArrowLeft") modal.querySelector('[data-dir="prev"]').click();
});
