(function () {
  "use strict";

  function renderFilmes() {
    const container = document.querySelector(".grid-filmes");
    container.innerHTML = FILMES.map(function (filme) {
      return (
        '<article class="card card-filme">' +
          '<div class="poster-frame">' +
            '<img src="' + filme.poster + '" alt="Capa do filme ' + filme.titulo + '" loading="lazy">' +
          "</div>" +
          '<div class="card-body">' +
            '<p class="card-ano">' + filme.ano + "</p>" +
            "<h3>" + filme.titulo + "</h3>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderTrajes() {
    const container = document.querySelector(".grid-trajes");
    container.innerHTML = TRAJES.map(function (traje) {
      return (
        '<article class="card card-item">' +
          '<div class="item-frame">' +
            '<img src="' + traje.imagem + '" alt="' + traje.nome + '" loading="lazy">' +
          "</div>" +
          '<div class="card-body">' +
            '<span class="item-tag">Traje</span>' +
            "<h3>" + traje.nome + "</h3>" +
            '<div class="item-meta">' +
              '<span class="meta-filme">' + traje.filme + "</span>" +
              '<span class="meta-ano">' + traje.ano + "</span>" +
            "</div>" +
            '<p class="item-nota">' + traje.nota + "</p>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderViloes() {
    const container = document.querySelector(".grid-viloes");
    container.innerHTML = VILOES.map(function (vilao) {
      return (
        '<article class="card card-item">' +
          '<div class="item-frame">' +
            '<img src="' + vilao.imagem + '" alt="' + vilao.nome + '" loading="lazy">' +
          "</div>" +
          '<div class="card-body">' +
            '<span class="item-tag">Vilão</span>' +
            "<h3>" + vilao.nome + "</h3>" +
            '<p class="item-sub">' + vilao.identidade + " &middot; interpretado por " + vilao.ator + "</p>" +
            '<div class="item-meta">' +
              '<span class="meta-filme">' + vilao.filme + "</span>" +
              '<span class="meta-ano">' + vilao.ano + "</span>" +
            "</div>" +
            '<p class="item-nota">' + vilao.nota + "</p>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  function setupScrollReveal() {
    const targets = document.querySelectorAll(".card, .outro");
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function playIntro() {
    const introScreen = document.getElementById("intro-screen");
    const site = document.getElementById("site");

    window.setTimeout(function () {
      introScreen.classList.add("hide");
      site.classList.add("show");
      site.removeAttribute("aria-hidden");
    }, 2200);

    introScreen.addEventListener("click", function () {
      introScreen.classList.add("hide");
      site.classList.add("show");
      site.removeAttribute("aria-hidden");
    });
  }

  function setupOutro() {
    const btn = document.getElementById("btn-reiniciar");
    btn.addEventListener("click", function () {
      document.getElementById("topo").scrollIntoView({ behavior: "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderFilmes();
    renderTrajes();
    renderViloes();
    setupScrollReveal();
    setupOutro();
    playIntro();
  });
})();
