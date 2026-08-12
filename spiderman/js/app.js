(function () {
  "use strict";

  function trajeCard(traje) {
    return (
      '<article class="mini-card">' +
        '<div class="mini-frame">' +
          '<img src="' + traje.imagem + '" alt="' + traje.nome + '" loading="lazy">' +
        "</div>" +
        '<div class="mini-body">' +
          '<span class="mini-tag">Traje</span>' +
          "<h4>" + traje.nome + "</h4>" +
          '<p class="mini-note">' + traje.nota + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function vilaoCard(vilao) {
    return (
      '<article class="mini-card">' +
        '<div class="mini-frame">' +
          '<img src="' + vilao.imagem + '" alt="' + vilao.nome + '" loading="lazy">' +
        "</div>" +
        '<div class="mini-body">' +
          '<span class="mini-tag">Vilão</span>' +
          "<h4>" + vilao.nome + "</h4>" +
          '<p class="mini-sub">' + vilao.identidade + " &middot; " + vilao.ator + "</p>" +
          '<p class="mini-note">' + vilao.nota + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function resumoCard(filme) {
    return (
      '<article class="mini-card mini-card-text">' +
        '<div class="mini-body">' +
          '<span class="mini-tag">Sinopse</span>' +
          "<h4>" + filme.titulo + "</h4>" +
          '<p class="mini-note">' + filme.resumo + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function chapterBlock(filme, index) {
    const num = String(index + 1).padStart(2, "0");

    let subBlocks = "";
    const temViloes = filme.viloes.length > 0;
    const temTrajes = filme.trajes.length > 0;

    if (temTrajes) {
      subBlocks +=
        '<div class="chapter-sub">' +
          "<h3>Trajes deste filme</h3>" +
          '<div class="mini-grid">' +
            filme.trajes.map(trajeCard).join("") +
            (temViloes ? "" : resumoCard(filme)) +
          "</div>" +
        "</div>";
    }

    if (temViloes) {
      subBlocks +=
        '<div class="chapter-sub">' +
          "<h3>Vilões deste filme</h3>" +
          '<div class="mini-grid">' +
            filme.viloes.map(vilaoCard).join("") +
            resumoCard(filme) +
          "</div>" +
        "</div>";
    }

    if (!temTrajes && !temViloes) {
      subBlocks +=
        '<div class="chapter-sub">' +
          "<h3>Sobre o filme</h3>" +
          '<div class="mini-grid">' +
            resumoCard(filme) +
          "</div>" +
        "</div>";
    }

    return (
      '<article class="chapter" id="' + filme.id + '">' +
        '<div class="chapter-banner">' +
          '<div class="chapter-banner-bg" style="background-image:url(\'' + filme.poster + '\')"></div>' +
          '<span class="chapter-banner-tag">' + filme.ano + "</span>" +
          '<div class="chapter-banner-fg">' +
            '<img src="' + filme.poster + '" alt="Capa do filme ' + filme.titulo + '" loading="lazy">' +
          "</div>" +
          '<div class="chapter-banner-fade"></div>' +
        "</div>" +
        '<div class="chapter-body">' +
          '<div class="chapter-head">' +
            '<span class="chapter-ghost">' + num + "</span>" +
            '<span class="chapter-num">Capítulo ' + num + "</span>" +
            "<div>" +
              '<p class="chapter-year">' + filme.ano + "</p>" +
              '<h2 class="chapter-title">' + filme.titulo + "</h2>" +
              '<p class="chapter-note">' + filme.nota + "</p>" +
            "</div>" +
          "</div>" +
          subBlocks +
        "</div>" +
      "</article>"
    );
  }

  function renderTimeline() {
    const container = document.querySelector(".timeline");
    container.innerHTML = FILMES.map(chapterBlock).join("");
  }

  function setupScrollReveal() {
    const targets = document.querySelectorAll(
      ".chapter-banner-fg, .chapter-head, .mini-card, .outro"
    );
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("reveal", entry.isIntersecting);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px" }
    );
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function setupParallax() {
    const layers = Array.prototype.slice.call(
      document.querySelectorAll(".chapter-banner-bg")
    );
    let ticking = false;

    function update() {
      const vh = window.innerHeight;
      layers.forEach(function (layer) {
        const rect = layer.parentElement.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const shift = Math.max(-30, Math.min(30, center * -0.08));
        layer.style.transform = "scale(1.1) translateY(" + shift + "px)";
      });
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  function playCover() {
    const cover = document.getElementById("cover");
    const enterBtn = document.getElementById("cover-enter");
    const site = document.getElementById("site");
    let entered = false;

    document.body.classList.add("locked");

    function enter() {
      if (entered) return;
      entered = true;
      cover.classList.add("hide");
      site.classList.add("show");
      site.removeAttribute("aria-hidden");
      document.body.classList.remove("locked");
      window.removeEventListener("wheel", enter);
      window.removeEventListener("touchmove", enter);
      window.removeEventListener("keydown", onKey);
    }

    function onKey(e) {
      if (e.key === "ArrowDown" || e.key === " " || e.key === "Enter") enter();
    }

    enterBtn.addEventListener("click", enter);
    window.addEventListener("wheel", enter, { passive: true });
    window.addEventListener("touchmove", enter, { passive: true });
    window.addEventListener("keydown", onKey);
  }

  function setupOutro() {
    const btn = document.getElementById("btn-reiniciar");
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setupLightbox() {
    const opener = document.getElementById("cronologia-open");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.getElementById("lightbox-close");
    if (!opener || !lightbox) return;

    function open() {
      const fullSrc = opener.querySelector("img").getAttribute("src");
      lightboxImg.setAttribute("src", fullSrc);
      lightbox.classList.add("open");
      lightbox.removeAttribute("aria-hidden");
      document.body.classList.add("locked");
    }

    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("locked");
    }

    opener.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderTimeline();
    setupScrollReveal();
    setupParallax();
    setupOutro();
    setupLightbox();
    playCover();
  });
})();
