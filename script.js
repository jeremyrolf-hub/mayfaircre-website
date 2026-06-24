/* Mayfair — minimal interaction layer. No dependencies. */
(function () {
  "use strict";

  /* ----- Apps Script endpoint -----------------------------------------
     Paste the deployed Web App URL here (see DEPLOY.md, Apps Script step).
     Until set, the form falls back to a mailto: so it never silently fails. */
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzSqnMVebK1lFJ73qJGkZkUqhO-kVSUQvM1-klv8n8OLGLxGUU2bwHgGxWnXNjGJhPm/exec";
  /* -------------------------------------------------------------------- */

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Current year in footer */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Sticky-header hairline on scroll */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      if (open) {
        mobileNav.hidden = true;
      } else {
        mobileNav.hidden = false;
      }
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mobileNav.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Reveal-on-scroll */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Contact form */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");

  function setStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove("is-error", "is-success");
    if (kind) status.classList.add("is-" + kind);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot — silently succeed for bots */
      if (form.company_website && form.company_website.value) {
        setStatus("Thank you. We'll be in touch shortly.", "success");
        form.reset();
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector(".btn-submit");
      var data = {
        name: form.name.value.trim(),
        company: form.company.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        role: form.role.value,
        message: form.message.value.trim()
      };

      /* No endpoint configured yet — fall back to mailto so nothing is lost */
      if (!ENDPOINT) {
        var body = encodeURIComponent(
          "Name: " + data.name + "\n" +
          "Company: " + data.company + "\n" +
          "Email: " + data.email + "\n" +
          "Phone: " + data.phone + "\n" +
          "Role: " + data.role + "\n\n" +
          data.message
        );
        window.location.href =
          "mailto:acquisitions@mayfaircre.com?subject=" +
          encodeURIComponent("Mayfair inquiry — " + data.name) +
          "&body=" + body;
        setStatus("Opening your email client…", "success");
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setStatus("");

      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors", /* Apps Script sends no CORS headers; opaque response is expected */
        body: new URLSearchParams(data) /* urlencoded => simple request, no preflight */
      })
        .then(function () {
          form.reset();
          setStatus("Thank you. We'll be in touch shortly.", "success");
        })
        .catch(function () {
          setStatus(
            "Something went wrong. Please email acquisitions@mayfaircre.com directly.",
            "error"
          );
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Send"; }
        });
    });
  }
})();
