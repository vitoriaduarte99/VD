import reviewsData from "./reviews.js";

// Ao recarregar, a página volta sempre para o topo (o navegador não restaura a rolagem).
// Links com âncora vindos de outra página (ex.: /#faq) continuam indo direto para a seção.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
const isReload = performance.getEntriesByType("navigation")[0]?.type === "reload";
if (isReload && location.hash) history.replaceState(null, "", location.pathname + location.search);
if (isReload || !location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });

// Abertura: não espera imagens e vídeo carregarem, dura um tempo fixo e curto
const loader = document.getElementById("loader");
const hasIntro = loader && !document.documentElement.classList.contains("no-intro");
const INTRO_MS = 1900;

if (hasIntro) {
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    loader.classList.add("is-hidden");
    document.body.style.overflow = "";
    // as animações de entrada do hero começam enquanto a cortina sobe
    setTimeout(startReveal, 350);
  }, INTRO_MS);
}

// Header scroll state
const header = document.getElementById("header");
const onScroll = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
};
document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("is-open");
  navToggle.classList.toggle("is-active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    navToggle?.classList.remove("is-active");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

// Scroll reveal
function startReveal() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("is-visible"), index * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  let delay = 0;
  document.querySelectorAll(".reveal").forEach((el) => {
    // o que já está na tela aparece na hora, em sequência; o resto espera a rolagem
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) {
      setTimeout(() => el.classList.add("is-visible"), delay);
      delay += 80;
    } else {
      revealObserver.observe(el);
    }
  });
}

if (!hasIntro) startReveal();

// Accordion (FAQ)
document.querySelectorAll(".accordion").forEach((group) => {
  const items = group.querySelectorAll(".accordion__item");
  items.forEach((item) => {
    const trigger = item.querySelector(".accordion__trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      items.forEach((other) => other.classList.remove("is-open"));
      if (!isOpen) item.classList.add("is-open");
    });
  });
});

// Etapas expansíveis (páginas de serviço): uma aberta por vez
document.querySelectorAll(".stepper").forEach((group) => {
  const items = group.querySelectorAll(".stepper__item");
  items.forEach((item) => {
    const trigger = item.querySelector(".stepper__trigger");
    trigger?.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".stepper__trigger")?.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
});

// Lightbox do portfólio
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxThumbs = document.getElementById("lightboxThumbs");

const lightboxPano = document.getElementById("lightboxPano");

// Cada projeto pode ter mais imagens (data-gallery="/img/a.jpg, /img/b.jpg"), vistas com as setas,
// e uma imagem 360° (data-pano), carregada só quando alguém abre essa miniatura
let gallery = [];
let galleryIndex = 0;
let panoViewer = null;

function destroyPano() {
  panoViewer?.destroy();
  panoViewer = null;
  if (lightboxPano) lightboxPano.hidden = true;
  lightboxImg.hidden = false;
}

async function showPano(item) {
  lightboxImg.hidden = true;
  lightboxPano.hidden = false;
  lightbox.classList.add("is-pano-loading");
  await Promise.all([import("pannellum/build/pannellum.css"), import("pannellum/build/pannellum.js")]);
  // a pessoa pode ter trocado de imagem enquanto a biblioteca carregava
  if (gallery[galleryIndex] !== item || panoViewer) return;
  panoViewer = window.pannellum.viewer(lightboxPano, {
    type: "equirectangular",
    panorama: item.src,
    autoLoad: true,
    // Exibe apenas o controle de orientação nos celulares compatíveis.
    // O toque no botão também permite ao iPhone solicitar acesso ao giroscópio.
    showControls: true,
    showZoomCtrl: false,
    showFullscreenCtrl: false,
    orientationOnByDefault: false,
    compass: false,
    // campo de visão menor em telas estreitas, para não distorcer
    hfov: window.innerWidth < 700 ? 70 : 100,
    autoRotate: -2,
    autoRotateInactivityDelay: 4000,
  });
  panoViewer.on("load", () => lightbox.classList.remove("is-pano-loading"));
}

function showGalleryImage(index) {
  galleryIndex = (index + gallery.length) % gallery.length;
  const item = gallery[galleryIndex];
  destroyPano();
  lightbox.classList.remove("is-pano-loading");
  if (item.pano) showPano(item);
  else lightboxImg.src = item.src;
  lightboxThumbs?.querySelectorAll(".lightbox__thumb").forEach((thumb, i) => {
    thumb.classList.toggle("is-active", i === galleryIndex);
    thumb.setAttribute("aria-current", String(i === galleryIndex));
  });
}

document.querySelectorAll(".projeto-card img").forEach((img) => {
  img.addEventListener("click", () => {
    const extra = img.dataset.gallery?.split(",").map((src) => src.trim()).filter(Boolean) ?? [];
    gallery = [img.getAttribute("src"), ...extra].map((src) => ({ src, thumb: src }));
    if (img.dataset.pano) {
      gallery.push({ src: img.dataset.pano, thumb: img.dataset.panoThumb || img.dataset.pano, pano: true });
    }
    lightboxImg.alt = img.alt;
    const multiple = gallery.length > 1;
    [lightboxPrev, lightboxNext, lightboxThumbs].forEach((el) => el && (el.hidden = !multiple));
    lightbox.classList.toggle("has-thumbs", multiple);
    if (lightboxThumbs) {
      lightboxThumbs.replaceChildren(
        ...gallery.map((item, i) => {
          const thumb = document.createElement("button");
          thumb.type = "button";
          thumb.className = "lightbox__thumb" + (item.pano ? " lightbox__thumb--pano" : "");
          thumb.setAttribute("aria-label", item.pano ? "Ver ambiente em 360°" : `Ver imagem ${i + 1}`);
          thumb.innerHTML = `<img src="${item.thumb}" alt="" />` + (item.pano ? `<span aria-hidden="true">360°</span>` : "");
          thumb.addEventListener("click", () => showGalleryImage(i));
          return thumb;
        })
      );
    }
    showGalleryImage(0);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  if (lightbox) destroyPano();
  lightbox?.classList.remove("is-open");
  document.body.style.overflow = "";
}

const stepGallery = (dir) => gallery.length > 1 && showGalleryImage(galleryIndex + dir);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightboxPrev) return stepGallery(-1);
  if (event.target === lightboxNext) return stepGallery(1);
  if (event.target !== lightboxImg && !event.target.closest(".lightbox__thumbs, .lightbox__pano")) closeLightbox();
});
lightboxClose?.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (event) => {
  if (!lightbox?.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  // no 360°, as setas do teclado giram o ambiente em vez de trocar a imagem
  if (panoViewer) return;
  if (event.key === "ArrowLeft") stepGallery(-1);
  if (event.key === "ArrowRight") stepGallery(1);
});

// No celular, deslizar para os lados troca a imagem (no 360°, deslizar gira o ambiente)
let touchStartX = null;
lightbox?.addEventListener("touchstart", (event) => {
  touchStartX = event.target.closest(".lightbox__pano") ? null : event.touches[0].clientX;
}, { passive: true });
lightbox?.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 50) stepGallery(delta < 0 ? 1 : -1);
  touchStartX = null;
});

// Balão de avaliações do Google (textos copiados do perfil, em src/reviews.js)
function initReviews(root, data) {
  if (!data?.rating || !data.reviews?.length) return;
  // exibe antes de montar os cards, para medir se o texto foi cortado ("Ver mais")
  root.hidden = false;

  const stars = (value) => "★".repeat(Math.round(value)) + "☆".repeat(5 - Math.round(value));
  document.getElementById("reviewsScore").textContent = data.rating.toFixed(1).replace(".", ",");
  document.getElementById("reviewsStars").textContent = stars(data.rating);
  const allLink = document.getElementById("reviewsAll");
  if (data.url) allLink.href = data.url;
  else allLink.hidden = true;

  const list = document.getElementById("reviewsList");
  data.reviews.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review";

    const avatar = document.createElement("span");
    avatar.className = "review__avatar";
    if (review.photo) {
      const img = document.createElement("img");
      img.src = review.photo;
      img.alt = "";
      img.referrerPolicy = "no-referrer";
      img.loading = "lazy";
      avatar.appendChild(img);
    } else {
      avatar.textContent = review.author.trim().charAt(0).toUpperCase();
    }

    const head = document.createElement("div");
    head.className = "review__head";
    const name = document.createElement("strong");
    name.className = "review__name";
    name.textContent = review.author;
    const rating = document.createElement("span");
    rating.className = "review__stars";
    rating.setAttribute("aria-label", `${review.rating} de 5 estrelas`);
    rating.textContent = stars(review.rating);
    head.append(name, rating);

    const text = document.createElement("p");
    text.className = "review__text";
    text.textContent = review.text;

    card.append(avatar, head, text);

    const more = document.createElement("button");
    more.type = "button";
    more.className = "review__more";
    more.textContent = "Ver mais";
    more.addEventListener("click", () => {
      const expanded = text.classList.toggle("is-expanded");
      more.textContent = expanded ? "Ver menos" : "Ver mais";
    });
    card.appendChild(more);

    list.appendChild(card);
    // "Ver mais" só aparece quando o texto realmente foi cortado
    requestAnimationFrame(() => {
      more.hidden = text.scrollHeight <= text.clientHeight + 1;
    });
  });

  const toggle = document.getElementById("reviewsToggle");
  const setOpen = (open) => {
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!root.classList.contains("is-open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

const reviewsFloat = document.getElementById("reviewsFloat");
if (reviewsFloat) initReviews(reviewsFloat, reviewsData);

// Botões flutuantes (WhatsApp e avaliações) aparecem assim que a pessoa começa a rolar a capa
const hero = document.querySelector(".hero");
if (hero) {
  const updateFloats = () => {
    const pastHero = window.scrollY > 80;
    document.documentElement.classList.toggle("floats-on", pastHero);
    if (!pastHero && reviewsFloat?.classList.contains("is-open")) {
      reviewsFloat.classList.remove("is-open");
      document.getElementById("reviewsToggle")?.setAttribute("aria-expanded", "false");
    }
  };
  document.addEventListener("scroll", updateFloats, { passive: true });
  window.addEventListener("resize", updateFloats);
  updateFloats();
}

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
