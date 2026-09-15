// ÉTUDE Architecture — comportements partagés
(function () {
  "use strict";

  // ---- Page d'accueil : clic n'importe où → page principale -------------
  var accueil = document.querySelector(".accueil");
  if (accueil) {
    accueil.addEventListener("click", function () {
      window.location.href = accueil.getAttribute("data-target") || "principale.html";
    });
    accueil.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        window.location.href = accueil.getAttribute("data-target") || "principale.html";
      }
    });
  }

  // ---- Menu "···" (écran étroit) -----------------------------------------
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".nav-drawer");
  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- Filtrage de la galerie par catégorie ------------------------------
  var filterLinks = document.querySelectorAll("[data-filter]");
  var galleryItems = document.querySelectorAll(".gallery-item");
  if (filterLinks.length && galleryItems.length) {
    function applyFilter(value) {
      filterLinks.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("data-filter") === value);
      });
      galleryItems.forEach(function (item) {
        var cats = (item.getAttribute("data-categories") || "").split(",");
        var show = value === "tous" || cats.indexOf(value) !== -1;
        item.classList.toggle("is-hidden", !show);
      });
    }

    filterLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var value = link.getAttribute("data-filter");
        applyFilter(value);
        history.replaceState(null, "", value === "tous" ? "principale.html" : "#" + value);
      });
    });

    var initial = window.location.hash.replace("#", "");
    if (initial) applyFilter(initial);
  }

  // ---- Visionneuse plein écran (pages projets) ---------------------------
  var galleryTriggers = document.querySelectorAll(
    ".planche-contact img, .projet-image-principale img"
  );
  if (galleryTriggers.length) {
    var images = Array.prototype.map.call(galleryTriggers, function (img) {
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    });

    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Fermer">&times;</button>' +
      '<img src="" alt="">';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector("img");
    var lbClose = lightbox.querySelector(".lightbox-close");
    var currentIndex = 0;
    var hideTimer = null;

    function showCloseIcon() {
      lbClose.classList.remove("is-hidden");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        lbClose.classList.add("is-hidden");
      }, 3000);
    }

    function renderImage() {
      var item = images[currentIndex];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
    }

    function openLightbox(index) {
      currentIndex = index;
      renderImage();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      showCloseIcon();
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      clearTimeout(hideTimer);
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % images.length;
      renderImage();
      showCloseIcon();
    }
    function prevImage() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      renderImage();
      showCloseIcon();
    }

    galleryTriggers.forEach(function (img, i) {
      img.addEventListener("click", function () { openLightbox(i); });
    });

    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    });

    // le curseur réactive l'icône de fermeture
    ["mousemove", "click", "touchstart"].forEach(function (evt) {
      lightbox.addEventListener(evt, function () {
        if (lightbox.classList.contains("is-open")) showCloseIcon();
      });
    });

    // navigation par balayage (mobile)
    var touchStartX = null;
    lightbox.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (touchStartX === null) return;
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) nextImage(); else prevImage();
      }
      touchStartX = null;
    }, { passive: true });
  }

  // ---- Tri du tableau « liste des projets » ------------------------------
  var table = document.querySelector(".liste-table");
  if (table) {
    var tbody = table.querySelector("tbody");
    var headers = table.querySelectorAll("thead th[data-sort]");
    var currentSort = { key: null, dir: 1 };

    headers.forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.getAttribute("data-sort");
        var type = th.getAttribute("data-type") || "text";
        var dir = currentSort.key === key ? -currentSort.dir : 1;
        currentSort = { key: key, dir: dir };

        headers.forEach(function (h) {
          var arrow = h.querySelector(".arrow");
          if (arrow) arrow.textContent = "";
        });
        var arrowSpan = th.querySelector(".arrow");
        if (arrowSpan) arrowSpan.textContent = dir === 1 ? "↑" : "↓";

        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
        rows.sort(function (a, b) {
          var av = a.querySelector('[data-col="' + key + '"]').getAttribute("data-value");
          var bv = b.querySelector('[data-col="' + key + '"]').getAttribute("data-value");
          if (type === "number") {
            return (parseFloat(av) - parseFloat(bv)) * dir;
          }
          if (type === "date") {
            return (new Date(av) - new Date(bv)) * dir;
          }
          return av.localeCompare(bv, "fr") * dir;
        });
        rows.forEach(function (row) { tbody.appendChild(row); });
      });
    });

    // navigation au clic sur une ligne
    tbody.addEventListener("click", function (e) {
      var row = e.target.closest("tr[data-href]");
      if (row) window.location.href = row.getAttribute("data-href");
    });
  }
})();
