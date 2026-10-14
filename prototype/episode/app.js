// Episode resident app — home screen prototype.
// Demo-only interactions: nothing here talks to a server.

const app = document.getElementById("app");
const scroller = document.getElementById("app-scroll");
const header = document.getElementById("app-header");
const toastEl = document.getElementById("toast");
const backdrop = document.getElementById("sheet-backdrop");

/* ---------- Header shadow ---------- */

scroller.addEventListener(
  "scroll",
  () => header.classList.toggle("is-scrolled", scroller.scrollTop > 4),
  { passive: true }
);

/* ---------- Toast ---------- */

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
}

/* ---------- Bottom sheets ---------- */

let openSheetEl = null;

function openSheet(id) {
  closeSheet(true);
  openSheetEl = document.getElementById(id);
  backdrop.hidden = false;
  openSheetEl.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add("is-open");
    openSheetEl.classList.add("is-open");
  });
}

function closeSheet(immediate) {
  if (!openSheetEl) return;
  const sheet = openSheetEl;
  openSheetEl = null;
  sheet.classList.remove("is-open");
  backdrop.classList.remove("is-open");
  const hide = () => {
    sheet.hidden = true;
    if (!openSheetEl) backdrop.hidden = true;
  };
  if (immediate) hide();
  else setTimeout(hide, 300);
  stopQrTimer();
}

backdrop.addEventListener("click", () => closeSheet());

// Single-choice groups inside sheets (residence, date, time).
document.querySelectorAll("[data-group]").forEach((group) => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;
    group.querySelectorAll("button").forEach((b) => b.classList.toggle("is-selected", b === btn));

    if (group.dataset.group === "residence") {
      const [name, unit] = btn.dataset.value.split(/,\s*/);
      document.getElementById("residence-label").innerHTML =
        `${name}, ${unit.replace("호", "")}<span class="ko">호</span>`;
      setTimeout(() => closeSheet(), 180);
    }
  });
});

/* ---------- Actions ---------- */

let reserveTarget = null;
let qrInterval = null;

function stopQrTimer() {
  clearInterval(qrInterval);
  qrInterval = null;
}

function startQrTimer() {
  const label = document.getElementById("qr-timer");
  let left = 30;
  const render = () => {
    label.textContent = `00:${String(left).padStart(2, "0")}`;
  };
  render();
  stopQrTimer();
  qrInterval = setInterval(() => {
    left = left === 0 ? 30 : left - 1;
    render();
  }, 1000);
}

const actions = {
  "out-of-scope"(btn) {
    const name = btn.dataset.name ? `'${btn.dataset.name}' ` : "";
    showToast(`${name}화면은 이번 데모에 없어요`);
  },
  residence() {
    openSheet("sheet-residence");
  },
  reserve(btn) {
    if (btn.classList.contains("is-booked")) {
      showToast("데모 예약이 이미 완료됐어요");
      return;
    }
    reserveTarget = btn;
    document.querySelector("[data-reserve-name]").textContent = btn.dataset.name;
    openSheet("sheet-reserve");
  },
  "confirm-reserve"() {
    const date = document.querySelector('[data-group="date"] .is-selected').textContent;
    const time = document.querySelector('[data-group="time"] .is-selected').textContent;
    if (reserveTarget) {
      reserveTarget.textContent = `${date.replace(/\(.\)/, "")} ${time} 예약됨`;
      reserveTarget.classList.add("is-booked");
    }
    closeSheet();
    showToast("데모 예약이에요. 실제 예약은 진행되지 않아요");
  },
  apply(btn) {
    const count = btn.closest(".svc-card").querySelector("[data-count]");
    const next = Number(count.dataset.count) + 1;
    count.dataset.count = next;
    count.textContent = `${next}/${count.dataset.max}`;
    btn.textContent = "신청완료";
    btn.disabled = true;
    showToast("데모 신청이에요. 실제로 신청되지 않아요");
  },
  qr() {
    openSheet("sheet-qr");
    startQrTimer();
  },
};

app.addEventListener("click", (e) => {
  if (dragState.suppressClick) {
    e.preventDefault();
    e.stopPropagation();
    dragState.suppressClick = false;
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn || btn.disabled) return;
  const run = actions[btn.dataset.action];
  if (run) run(btn);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

/* ---------- Mouse drag to scroll (desktop) ----------
   Touch devices use native scrolling. With a mouse, dragging scrolls the
   home screen vertically, or the carousel under the pointer horizontally,
   depending on the direction of the first movement. */

const dragState = {
  active: false,
  axis: null,
  startX: 0,
  startY: 0,
  lastY: 0,
  lastT: 0,
  velocity: 0,
  startScrollTop: 0,
  startScrollLeft: 0,
  carousel: null,
  suppressClick: false,
};

scroller.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse" || e.button !== 0) return;
  Object.assign(dragState, {
    active: true,
    axis: null,
    startX: e.clientX,
    startY: e.clientY,
    lastY: e.clientY,
    lastT: performance.now(),
    velocity: 0,
    startScrollTop: scroller.scrollTop,
    carousel: e.target.closest(".hscroll"),
    suppressClick: false,
  });
  if (dragState.carousel) dragState.startScrollLeft = dragState.carousel.scrollLeft;
  cancelMomentum();
});

window.addEventListener("pointermove", (e) => {
  if (!dragState.active) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  if (!dragState.axis) {
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    dragState.axis = Math.abs(dx) > Math.abs(dy) && dragState.carousel ? "x" : "y";
    dragState.suppressClick = true;
    if (dragState.axis === "x") dragState.carousel.classList.add("is-dragging");
    app.style.cursor = "grabbing";
  }

  if (dragState.axis === "x") {
    dragState.carousel.scrollLeft = dragState.startScrollLeft - dx;
  } else {
    scroller.scrollTop = dragState.startScrollTop - dy;
    const now = performance.now();
    const dt = now - dragState.lastT || 16;
    dragState.velocity = (e.clientY - dragState.lastY) / dt;
    dragState.lastY = e.clientY;
    dragState.lastT = now;
  }
});

window.addEventListener("pointerup", () => {
  if (!dragState.active) return;
  dragState.active = false;
  app.style.cursor = "";

  if (dragState.axis === "x") {
    settleCarousel(dragState.carousel, dragState.startScrollLeft);
  } else if (dragState.axis === "y") {
    startMomentum(dragState.velocity);
  }
});

// After a mouse drag, move one card in the drag direction (snap carousels)
// or simply let free carousels rest where they are.
function settleCarousel(carousel, startLeft) {
  carousel.classList.remove("is-dragging");
  if (!carousel.hasAttribute("data-snap")) return;
  const items = Array.from(carousel.children).filter((el) => el.offsetWidth > 0);
  const padding = parseFloat(getComputedStyle(carousel).scrollPaddingLeft) || 0;
  const positions = items.map((el) => el.offsetLeft - carousel.offsetLeft - padding);
  const current = carousel.scrollLeft;
  const direction = Math.sign(current - startLeft);
  let target = positions.reduce((best, p) => (Math.abs(p - current) < Math.abs(best - current) ? p : best), 0);
  if (direction > 0) target = positions.find((p) => p > startLeft + 1) ?? target;
  if (direction < 0) target = [...positions].reverse().find((p) => p < startLeft - 1) ?? target;
  carousel.scrollLeft = current;
  carousel.scrollTo({ left: target, behavior: "smooth" });
}

let momentumFrame = null;
function startMomentum(velocity) {
  let v = Math.max(-40, Math.min(40, -velocity * 16));
  const step = () => {
    if (Math.abs(v) < 0.3) return;
    scroller.scrollTop += v;
    v *= 0.94;
    momentumFrame = requestAnimationFrame(step);
  };
  momentumFrame = requestAnimationFrame(step);
}

function cancelMomentum() {
  cancelAnimationFrame(momentumFrame);
}

scroller.addEventListener("wheel", cancelMomentum, { passive: true });

// Images and links shouldn't start native drag-and-drop.
app.addEventListener("dragstart", (e) => e.preventDefault());
