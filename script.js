/* =========================================================
   Syed Ukasha Shahid — Portfolio
   Shared JavaScript for every page (vanilla JS, no libraries).

   The site works without this file: every page is a normal HTML
   page and every link is a normal link. This script only adds:
   1. The mobile menu toggle
   2. Active navigation highlighting (a backup for aria-current)
   3. A fallback if the profile photo is missing
   4. The page entrance animation
   5. Contact form validation
   6. Scroll reveals (IntersectionObserver)
   7. Scroll parallax for decorative shapes (requestAnimationFrame)
   8. Pointer parallax in the home hero
   9. 3D tilt on the project cards
   ========================================================= */

/* User and device checks, used by the animation functions */
var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// true only for a mouse or trackpad (not touch screens)
var hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

document.addEventListener("DOMContentLoaded", function () {
  // Tell the <head> failsafe timer that the script loaded correctly
  document.documentElement.classList.add("motion-ready");

  setupMobileMenu();
  highlightCurrentPage();
  setupPhotoFallback();
  playPageEntrance();
  setupContactForm();
  setupScrollReveal();
  setupScrollParallax();
  setupHeroPointer();
  setupCardTilt();
});


/* ---------- 1. Mobile menu ---------- */
function setupMobileMenu() {
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  // Button click opens or closes the menu
  toggle.addEventListener("click", function () {
    var isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when a link inside the menu is chosen
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu();
  });

  // Close with the Escape key and return focus to the button
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });

  // Close when clicking anywhere outside the header
  document.addEventListener("click", function (event) {
    if (!event.target.closest(".site-header")) closeMenu();
  });

  // Reset the menu if the window is resized to desktop width
  window.addEventListener("resize", function () {
    if (window.innerWidth > 880) closeMenu();
  });
}


/* ---------- 2. Active navigation ----------
   Each HTML file already marks its own link with aria-current="page".
   This function checks the current file name and makes sure the
   right link is marked, in case a page is copied or renamed. */
function highlightCurrentPage() {
  var path = window.location.pathname;
  var currentFile = path.substring(path.lastIndexOf("/") + 1) || "index.html";

  var links = document.querySelectorAll(".nav-links a");
  links.forEach(function (link) {
    var linkFile = link.getAttribute("href");
    if (linkFile === currentFile) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}


/* ---------- 3. Profile photo fallback ----------
   If assets/profile.jpg cannot be found, show a "US" placeholder
   instead of a broken image icon. */
function setupPhotoFallback() {
  var frames = document.querySelectorAll("[data-photo-frame]");
  frames.forEach(function (frame) {
    var img = frame.querySelector("img");
    if (!img) return;

    function markMissing() {
      frame.classList.add("is-missing");
    }

    // The image may have already failed before this script ran
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    } else {
      img.addEventListener("error", markMissing);
    }
  });
}


/* ---------- 4. Page entrance ----------
   Elements marked data-enter (headings, hero content) appear one after
   another when the page loads. The CSS does the animation; this function
   gives each element its position in the sequence (--i) and starts it. */
function playPageEntrance() {
  var items = document.querySelectorAll("[data-enter]");
  items.forEach(function (item, index) {
    item.style.setProperty("--i", index);
  });

  // Wait one frame so the starting state is painted first
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      document.documentElement.classList.add("page-ready");
    });
  });
}


/* ---------- 5. Contact form ----------
   There is no server behind this site, so the form does NOT send
   anything by itself. After checking the fields, it opens the
   visitor's own email app with the message already filled in.
   The visitor still presses "Send" in their email app. */
function setupContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var RECIPIENT = "syedukashashahid@gmail.com";

  // Rules for each field: a check function and the message to show
  var rules = {
    name: {
      check: function (value) { return value.length >= 2; },
      message: "Enter your name (at least 2 characters)."
    },
    email: {
      check: function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value); },
      message: "Enter an email address like name@example.com."
    },
    subject: {
      check: function (value) { return value.length >= 3; },
      message: "Add a short subject (at least 3 characters)."
    },
    message: {
      check: function (value) { return value.length >= 10; },
      message: "Write a message of at least 10 characters."
    }
  };

  // Check one field and show or clear its error message
  function validateField(input) {
    var rule = rules[input.name];
    if (!rule) return true;

    var field = input.closest(".field");
    var errorBox = field.querySelector(".field-error");
    var isValid = rule.check(input.value.trim());

    field.classList.toggle("has-error", !isValid);
    input.setAttribute("aria-invalid", String(!isValid));
    errorBox.textContent = isValid ? "" : rule.message;
    return isValid;
  }

  function showStatus(text, type) {
    status.textContent = text;
    status.className = "form-status is-visible " + (type === "ok" ? "is-ok" : "is-error");
  }

  // Re-check a field when the visitor leaves it, and while they fix an error
  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      if (input.closest(".field").classList.contains("has-error")) validateField(input);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      showStatus("Some fields need attention. Fix the highlighted fields and try again.", "error");
      firstInvalid.focus();
      return;
    }

    // Build the email and open the visitor's email app
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var subject = form.elements.subject.value.trim();
    var message = form.elements.message.value.trim();

    var body = message + "\n\n— " + name + " (" + email + ")";
    var mailto = "mailto:" + RECIPIENT +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    window.location.href = mailto;

    showStatus(
      "Your email app should now open with this message ready. Press Send there to deliver it. " +
      "If nothing opened, email " + RECIPIENT + " directly.",
      "ok"
    );
  });
}


/* ---------- 6. Scroll reveals ----------
   Elements marked data-reveal start hidden (see style.css) and get the
   class "is-visible" the first time they scroll into view. Each element
   animates only once, so scrolling up and down never makes it flicker. */
function setupScrollReveal() {
  var elements = document.querySelectorAll("[data-reveal]");
  if (!elements.length) return;

  // Children of a data-stagger parent get increasing delays (--d = 0, 1, 2…)
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var index = 0;
    Array.prototype.forEach.call(group.children, function (child) {
      if (child.hasAttribute("data-reveal")) {
        child.style.setProperty("--d", index);
        index++;
      }
    });
  });

  // Show an element, then hand its styling back to its normal CSS
  function reveal(element) {
    if (element.classList.contains("is-visible")) return;
    element.classList.add("is-visible");

    // After the entrance has finished, remove data-reveal so the element's
    // own hover transitions work normally (without the reveal delay).
    var delay = (parseFloat(element.style.getPropertyValue("--d")) || 0) * 110;
    setTimeout(function () {
      element.removeAttribute("data-reveal");
    }, delay + 1000);
  }

  // Reduced motion or an old browser: show everything straight away
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        reveal(entry.target);
        observer.unobserve(entry.target); // animate only once
      }
    });
  }, {
    threshold: 0.12,                 // 12% of the element must be visible
    rootMargin: "0px 0px -6% 0px"    // …and slightly above the bottom edge
  });

  elements.forEach(function (element) {
    observer.observe(element);
  });

  // Keyboard users: reveal anything that receives focus immediately
  document.addEventListener("focusin", function (event) {
    var hidden = event.target.closest("[data-reveal]");
    if (hidden) {
      reveal(hidden);
      observer.unobserve(hidden);
    }
  });
}


/* ---------- 7. Scroll parallax ----------
   Elements marked data-parallax="0.1" move at a slightly different speed
   from the page while scrolling. The number is the speed: positive moves
   against the scroll, negative moves with it. Only a few decorative
   elements use this, and it is turned off on small screens. */
function setupScrollParallax() {
  if (prefersReducedMotion) return;
  if (!window.matchMedia("(min-width: 881px)").matches) return;

  var elements = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (!elements.length) return;

  var ticking = false;

  function update() {
    var viewportHeight = window.innerHeight;

    // First READ all positions (we measure the parent, which never moves),
    // then WRITE all transforms. Mixing reads and writes is slow.
    var positions = elements.map(function (element) {
      return element.parentElement.getBoundingClientRect();
    });

    elements.forEach(function (element, i) {
      var box = positions[i];
      // Skip elements that are far off screen
      if (box.bottom < -200 || box.top > viewportHeight + 200) return;

      var speed = parseFloat(element.getAttribute("data-parallax")) || 0;
      // Distance between the element's centre and the screen's centre
      var offset = box.top + box.height / 2 - viewportHeight / 2;
      var move = (-offset * speed).toFixed(1);
      element.style.transform = "translate3d(0, " + move + "px, 0)";
    });

    ticking = false;
  }

  // Update at most once per animation frame
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}


/* ---------- 8. Hero pointer parallax (home page, desktop only) ----------
   Moving the mouse over the hero sets two CSS variables, --mx and --my
   (each from -1 to 1). style.css uses them to shift the shapes and the
   portrait by different amounts, which creates a sense of depth. */
function setupHeroPointer() {
  var hero = document.querySelector("[data-pointer-stage]");
  if (!hero) return;

  // Pause the portrait's floating animation when the hero is off screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      hero.classList.toggle("is-offscreen", !entries[0].isIntersecting);
    }).observe(hero);
  }

  if (prefersReducedMotion || !hasFinePointer) return;

  var frame = null;
  var pointerX = 0;
  var pointerY = 0;

  hero.addEventListener("pointermove", function (event) {
    var box = hero.getBoundingClientRect();
    pointerX = ((event.clientX - box.left) / box.width) * 2 - 1;  // -1 to 1
    pointerY = ((event.clientY - box.top) / box.height) * 2 - 1;  // -1 to 1

    if (frame) return;
    frame = requestAnimationFrame(function () {
      hero.style.setProperty("--mx", pointerX.toFixed(3));
      hero.style.setProperty("--my", pointerY.toFixed(3));
      frame = null;
    });
  });

  // Glide back to the centre when the pointer leaves
  hero.addEventListener("pointerleave", function () {
    hero.style.setProperty("--mx", 0);
    hero.style.setProperty("--my", 0);
  });
}


/* ---------- 9. 3D tilt on project cards (desktop only) ----------
   While the pointer is over a card, the card tilts a few degrees toward
   it and its parts (number, title, tags, preview) separate into layers.
   When the pointer leaves, the card eases back flat. */
function setupCardTilt() {
  if (prefersReducedMotion || !hasFinePointer) return;

  var cards = document.querySelectorAll("[data-tilt]");
  if (!cards.length) return;

  document.documentElement.classList.add("tilt-on");

  var MAX_TILT_X = 4;   // degrees, up/down
  var MAX_TILT_Y = 6;   // degrees, left/right

  cards.forEach(function (card) {
    var frame = null;
    var lastEvent = null;

    card.addEventListener("pointerenter", function () {
      card.classList.add("is-tilting");
    });

    card.addEventListener("pointermove", function (event) {
      lastEvent = event;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        // Measured each frame, so the tilt stays correct while scrolling
        var box = card.getBoundingClientRect();
        var x = (lastEvent.clientX - box.left) / box.width - 0.5;  // -0.5 to 0.5
        var y = (lastEvent.clientY - box.top) / box.height - 0.5;

        card.style.setProperty("--ry", (x * 2 * MAX_TILT_Y).toFixed(2) + "deg");
        card.style.setProperty("--rx", (-y * 2 * MAX_TILT_X).toFixed(2) + "deg");
        frame = null;
      });
    });

    card.addEventListener("pointerleave", function () {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
}
