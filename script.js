/* ============================================================
   Joshua Gorton — Portfolio
   Vanilla JS: mobile nav, footer year, image placeholders,
   and the project gallery lightbox (carousel).
   ============================================================ */
(function () {
  "use strict";

  /* -------------------------------------------- Mobile nav toggle */
  var toggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------- Footer year */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------- Image placeholders
     Any <img> whose file isn't present yet becomes a labelled SVG box,
     so layout stays intact. Drop the real file in /images and it shows. */
  function placeholderURI(label, w, h) {
    w = Math.max(2, Math.round(w) || 800);
    h = Math.max(2, Math.round(h) || 500);
    var fs = Math.max(12, Math.min(w, h) * 0.055);
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h +
      "' viewBox='0 0 " + w + " " + h + "'>" +
        "<rect width='100%' height='100%' fill='#141414'/>" +
        "<rect x='6' y='6' width='" + (w - 12) + "' height='" + (h - 12) +
          "' fill='none' stroke='#f4737a' stroke-opacity='0.4' stroke-width='2' stroke-dasharray='9 7' rx='6'/>" +
        "<text x='50%' y='50%' fill='#f4737a' fill-opacity='0.85' " +
          "font-family='JetBrains Mono, Consolas, monospace' font-size='" + fs +
          "' font-weight='600' letter-spacing='1.5' text-anchor='middle' " +
          "dominant-baseline='middle'>" + label + "</text>" +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function applyPlaceholder(img) {
    if (img.dataset.phDone) return; // guard against error loops
    img.dataset.phDone = "1";
    var rect = img.getBoundingClientRect();
    var label = (img.dataset.ph || img.alt || "Image").toUpperCase();
    img.src = placeholderURI(label, rect.width, rect.height);
    img.classList.add("is-placeholder");
  }

  function watchImage(img) {
    var src = img.getAttribute("src");
    // No src at all → apply placeholder immediately (video cards use this).
    if (!src) {
      applyPlaceholder(img);
      return;
    }
    // Src set but the file failed to load in the initial pass.
    if (img.complete && img.naturalWidth === 0) {
      applyPlaceholder(img);
    }
    img.addEventListener("error", function () { applyPlaceholder(img); });
  }

  document.querySelectorAll("img:not(.lightbox__img)").forEach(watchImage);

  /* =========================================  PROJECT LIGHTBOX  */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg     = lb.querySelector(".lightbox__img");
    var lbVideo   = lb.querySelector(".lightbox__video");
    var lbLoading = lb.querySelector(".lightbox__loading");
    var lbIndex   = lb.querySelector(".lightbox__index");
    var lbTotal   = lb.querySelector(".lightbox__total");
    var lbCounter = lb.querySelector(".lightbox__counter");
    var lbPrev    = lb.querySelector(".lightbox__nav--prev");
    var lbNext    = lb.querySelector(".lightbox__nav--next");
    var lbTag     = lb.querySelector(".lightbox__tag");
    var lbTitle   = lb.querySelector(".lightbox__title");
    var lbDesc    = lb.querySelector(".lightbox__desc");
    var lbInvolve = lb.querySelector(".lightbox__involve");
    var lbDots    = lb.querySelector(".lightbox__dots");
    var lbActions = lb.querySelector(".lightbox__actions");
    var lbExtras  = lb.querySelector(".lightbox__extras");

    var gallery = [];
    var index = 0;
    var lastFocused = null;

    // The single reused <img> falls back to a placeholder if a file is missing.
    lbImg.addEventListener("error", function () { applyPlaceholder(lbImg); });

    function isVideo(src) { return /\.(mp4|webm|ogg|mov)$/i.test(src); }

    function stopVideo() {
      try { lbVideo.pause(); } catch (e) {}
      lbVideo.removeAttribute("src");
      lbVideo.load();
      lbLoading.hidden = true;
      lbVideo.oncanplay = null;
      lbVideo.onplaying = null;
    }

    function startVideo(src) {
      lbLoading.hidden = false;
      lbVideo.setAttribute("preload", "auto");
      lbVideo.muted = true;               // required for autoplay
      lbVideo.setAttribute("src", src);

      // Hide loading + auto-play when the browser can play through the buffer.
      var hide = function () { lbLoading.hidden = true; };
      lbVideo.oncanplay = function () {
        hide();
        var p = lbVideo.play();
        if (p && typeof p.catch === "function") {
          // Autoplay was blocked — leave controls visible, viewer can press play.
          p.catch(function () {});
        }
      };
      lbVideo.onplaying = hide;
      lbVideo.load();
    }

    function renderItem() {
      var item = gallery[index] || { src: "", alt: "" };
      stopVideo();

      if (isVideo(item.src)) {
        lbImg.hidden = true;
        lbImg.removeAttribute("src");
        lbVideo.hidden = false;
        lbVideo.setAttribute("aria-label", item.alt || "Video");
        startVideo(item.src);
      } else {
        lbVideo.hidden = true;
        lbImg.hidden = false;
        lbImg.classList.remove("is-placeholder");
        lbImg.dataset.phDone = "";
        lbImg.dataset.ph = (item.alt || "Image");
        lbImg.alt = item.alt || "";
        lbImg.src = item.src;
      }

      var multi = gallery.length > 1;
      lbCounter.hidden = !multi;
      lbPrev.hidden = !multi;
      lbNext.hidden = !multi;
      lbDots.hidden = !multi;
      if (multi) {
        lbIndex.textContent = String(index + 1);
        lbTotal.textContent = String(gallery.length);
        Array.prototype.forEach.call(lbDots.children, function (dot, i) {
          dot.setAttribute("aria-selected", i === index ? "true" : "false");
        });
      }
    }

    function go(delta) {
      if (!gallery.length) return;
      index = (index + delta + gallery.length) % gallery.length;
      renderItem();
    }

    function buildDots() {
      lbDots.innerHTML = "";
      if (gallery.length <= 1) return;
      gallery.forEach(function (item, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "lightbox__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Image " + (i + 1));
        dot.addEventListener("click", function () { index = i; renderItem(); });
        lbDots.appendChild(dot);
      });
    }

    function openProject(card) {
      var imgs   = (card.dataset.images || "").split("|").filter(Boolean);
      var alts   = (card.dataset.alts || "").split("|");
      gallery = imgs.map(function (src, i) {
        return { src: src.trim(), alt: (alts[i] || "").trim() };
      });
      index = 0;

      var titleEl = card.querySelector(".card__title");
      lbTag.textContent   = card.querySelector(".card__tag").textContent.trim();
      lbTitle.textContent = titleEl ? titleEl.textContent.trim() : "";
      lbDesc.textContent  = card.querySelector(".card__desc").textContent.trim();

      if (card.dataset.involve) {
        lbInvolve.innerHTML = "<b>My involvement</b>";
        lbInvolve.appendChild(document.createTextNode(card.dataset.involve));
        lbInvolve.hidden = false;
      } else {
        lbInvolve.hidden = true;
      }

      var actions = card.querySelector(".card__actions");
      lbActions.innerHTML = actions ? actions.innerHTML : "";

      // Extras: pull the referenced <template>'s content into the info column
      lbExtras.innerHTML = "";
      var extrasId = card.dataset.extrasId;
      var tpl = extrasId ? document.getElementById(extrasId) : null;
      if (tpl && "content" in tpl) {
        lbExtras.appendChild(tpl.content.cloneNode(true));
        lbExtras.hidden = false;
      } else {
        lbExtras.hidden = true;
      }

      buildDots();
      renderItem();

      lastFocused = document.activeElement;
      lb.hidden = false;
      document.body.classList.add("no-scroll");
      lb.querySelector(".lightbox__close").focus();
    }

    function close() {
      stopVideo();
      lb.hidden = true;
      document.body.classList.remove("no-scroll");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    // Open buttons
    document.querySelectorAll(".card__media").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".card");
        if (card) openProject(card);
      });
    });

    // Close controls (X + backdrop)
    lb.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", close);
    });
    lbPrev.addEventListener("click", function () { go(-1); });
    lbNext.addEventListener("click", function () { go(1); });

    // Keyboard: Esc closes, arrows navigate, Tab is trapped
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") { close(); return; }
      // Don't hijack arrow keys while the video has focus (viewer is scrubbing)
      var onVideo = document.activeElement === lbVideo;
      if (e.key === "ArrowLeft" && !onVideo) { go(-1); return; }
      if (e.key === "ArrowRight" && !onVideo) { go(1); return; }
      if (e.key === "Tab") {
        var focusables = lb.querySelectorAll(
          'button:not([hidden]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        focusables = Array.prototype.filter.call(focusables, function (el) {
          return el.offsetParent !== null; // visible only
        });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }
})();
