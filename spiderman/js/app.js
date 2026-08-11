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

  function chapterBlock(filme, index) {
    const num = String(index + 1).padStart(2, "0");

    let subBlocks = "";

    if (filme.trajes.length) {
      subBlocks +=
        '<div class="chapter-sub">' +
          "<h3>Trajes deste filme</h3>" +
          '<div class="mini-grid">' +
            filme.trajes.map(trajeCard).join("") +
          "</div>" +
        "</div>";
    }

    if (filme.viloes.length) {
      subBlocks +=
        '<div class="chapter-sub">' +
          "<h3>Vilões deste filme</h3>" +
          '<div class="mini-grid">' +
            filme.viloes.map(vilaoCard).join("") +
          "</div>" +
        "</div>";
    }

    return (
      '<article class="chapter" id="' + filme.id + '">' +
        '<div class="chapter-media">' +
          '<span class="chapter-media-tag">' + filme.ano + "</span>" +
          '<img src="' + filme.poster + '" alt="Capa do filme ' + filme.titulo + '" loading="lazy">' +
        "</div>" +
        '<div class="chapter-content">' +
          '<span class="chapter-num">Capítulo ' + num + "</span>" +
          '<p class="chapter-year">' + filme.ano + "</p>" +
          '<h2 class="chapter-title">' + filme.titulo + "</h2>" +
          '<p class="chapter-note">' + filme.nota + "</p>" +
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
      ".chapter-media, .chapter-content, .mini-card, .outro"
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
    const images = Array.prototype.slice.call(
      document.querySelectorAll(".chapter-media img")
    );
    let ticking = false;

    function update() {
      const vh = window.innerHeight;
      images.forEach(function (img) {
        const rect = img.parentElement.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const shift = Math.max(-24, Math.min(24, center * -0.06));
        img.style.transform = "translateY(" + shift + "px)";
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
    const site = document.getElementById("site");

    function enter() {
      cover.classList.add("hide");
      site.classList.add("show");
      site.removeAttribute("aria-hidden");
    }

    window.setTimeout(enter, 2500);
    cover.addEventListener("click", enter);
  }

  function setupOutro() {
    const btn = document.getElementById("btn-reiniciar");
    btn.addEventListener("click", function () {
      document.getElementById("topo").scrollIntoView({ behavior: "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderTimeline();
    setupScrollReveal();
    setupParallax();
    setupOutro();
    playCover();
  });
})();
