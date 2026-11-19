/* 52 Saturdays landing page — no dependencies. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const canHover = matchMedia("(hover: hover)").matches;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- Nav: mobile menu, compact-on-scroll, CTA after hero ---------- */
const nav = $(".nav");
const menuBtn = $(".menu-btn", nav);

function setMenu(open) {
  nav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
$$("nav a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------- Scroll-driven bits (one rAF-throttled listener) ---------- */
const parallax = reduceMotion ? [] : $$(".hero [data-depth]");
let ticking = false;
function onScroll() {
  const y = scrollY;
  nav.classList.toggle("scrolled", y > 40);
  const py = Math.min(y, 900);
  parallax.forEach((el) => {
    el.style.transform = `translate3d(0,${py * el.dataset.depth}px,0)`;
  });
  ticking = false;
}
addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
onScroll();

/* ---------- In-view: highlighter reveals + header CTA ---------- */
const reveal = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        reveal.unobserve(e.target);
      }
    });
  },
  { threshold: 0.5, rootMargin: "0px 0px -8% 0px" },
);
$$(".mk, .ul").forEach((el) => reveal.observe(el));

const heroCta = $(".copy .btn-p");
if (heroCta) {
  new IntersectionObserver(([e]) => nav.classList.toggle("show-cta", !e.isIntersecting)).observe(heroCta);
}

/* ---------- Hero book tilt ---------- */
const hero = $(".hero");
const book = $("#book3d");
if (book && canHover && !reduceMotion) {
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    book.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 6}deg) rotateZ(-3deg)`;
  });
  hero.addEventListener("pointerleave", () => {
    book.style.transform = "";
  });
}

/* ---------- Flip cards (.xp): hover on desktop, tap on touch ---------- */
const flipCards = $$(".xp");
function setFlip(card, open) {
  card.classList.toggle("open", open);
  $(".xp-btn", card)?.setAttribute("aria-expanded", open);
}
flipCards.forEach((card) =>
  card.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    // On hover devices, only the button (or keyboard) toggles.
    if (canHover && e.detail !== 0 && !e.target.closest(".xp-btn")) return;
    const open = !card.classList.contains("open");
    flipCards.forEach((c) => c !== card && setFlip(c, false));
    setFlip(card, open);
  }),
);
document.addEventListener("click", (e) => {
  if (!e.target.closest(".xp")) flipCards.forEach((c) => setFlip(c, false));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") flipCards.forEach((c) => setFlip(c, false));
});

/* ---------- Challenge card deck ---------- */
const deck = $$(".deck .mcard");
function layDeck() {
  deck.forEach((c, i) => {
    c.classList.remove("pos-0", "pos-1", "pos-2");
    c.classList.add(`pos-${i}`);
  });
}
deck.forEach((card) => {
  card.addEventListener("click", () => {
    const i = deck.indexOf(card);
    if (i === 0) deck.push(deck.shift());
    else deck.unshift(...deck.splice(i, 1));
    layDeck();
  });
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});
layDeck();

/* ---------- Video player (trailer + vertical clips) ----------
   Put a file path or embed URL in the button's data-video attribute:
   data-video="assets/video/trailer.mp4" or "https://www.youtube.com/embed/ID?autoplay=1" */
const vmodal = $("#vmodal");
const vbox = $("#vbox");
function closeVideo() {
  vbox.innerHTML = "";
  vmodal.close();
}
$$("[data-video]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const src = btn.dataset.video;
    vmodal.classList.toggle("vert", btn.hasAttribute("data-vertical"));
    if (!src) {
      vbox.innerHTML =
        '<div class="vmissing">This video plays here. Add its file or embed link to data-video before launch.</div>';
    } else if (/\.(mp4|webm|mov)$/i.test(src)) {
      vbox.innerHTML = `<video src="${src}" controls autoplay playsinline></video>`;
    } else {
      vbox.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen" allowfullscreen title="52 Saturdays video"></iframe>`;
    }
    vmodal.showModal();
  }),
);
$("#vclose").addEventListener("click", closeVideo);
vmodal.addEventListener("click", (e) => {
  if (e.target === vmodal) closeVideo();
});
vmodal.addEventListener("close", () => {
  vbox.innerHTML = "";
});

/* ---------- Waitlist popup ---------- */
const wl = $("#wl");
const wlForm = $("#wl-form");
const wlDone = $(".wl-done", wl);
const wlErr = $(".wl-err", wl);

function openWaitlist(interest) {
  wlForm.reset();
  wlForm.hidden = false;
  wlDone.hidden = true;
  wlErr.textContent = "";
  wlForm.elements.interest.value = interest || "updates";
  wl.showModal();
  setTimeout(() => wlForm.elements.name.focus(), 60);
}
$$("[data-wl]").forEach((el) =>
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openWaitlist(el.dataset.wl);
  }),
);
$(".wl-x", wl).addEventListener("click", () => wl.close());
wl.addEventListener("click", (e) => {
  if (e.target === wl) wl.close();
});

wlForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const { name, email } = wlForm.elements;
  if (!name.value.trim()) {
    wlErr.textContent = "Add your first name.";
    name.focus();
    return;
  }
  if (!email.value || !email.checkValidity()) {
    wlErr.textContent = "Enter a valid email address.";
    email.focus();
    return;
  }
  // TODO: send Object.fromEntries(new FormData(wlForm)) to your email service.
  wlForm.hidden = true;
  wlDone.hidden = false;
});
