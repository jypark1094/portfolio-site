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

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.filter;

    filterButtons.forEach((b) => {
      b.classList.toggle("is-active", b === button);
      b.setAttribute("aria-selected", b === button ? "true" : "false");
    });

    workCards.forEach((card) => {
      const matches = target === "all" || card.dataset.category === target;
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
const modalThumbs = modal.querySelector(".wm-thumbs");

let currentMedia = [];

function showMedia(mediaIndex) {
  const src = currentMedia[mediaIndex];
  modalMediaFrame.classList.remove("is-empty");
  modalMediaFrame.src = src;

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
  modalThumbs.innerHTML = "";

  if (media.length === 0) {
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
    thumb.style.backgroundImage = `url('${src}')`;
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
