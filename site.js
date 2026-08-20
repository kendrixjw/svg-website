/* Sovereign Valor Group — site behavior.
   Two jobs: the mobile menu, and scroll reveal. Nothing else. */

(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  if (toggle && links) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      links.setAttribute("data-open", String(open));
      document.body.style.overflow = open && window.matchMedia("(max-width: 768px)").matches ? "hidden" : "";
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close on Escape, returning focus to the toggle
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Close after following a link, and when leaving mobile widths
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.matchMedia("(max-width: 768px)").addEventListener("change", function (e) {
      if (!e.matches) setOpen(false);
    });

    // Keep focus inside the open menu on mobile
    links.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;
      var focusable = links.querySelectorAll("a[href]");
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); toggle.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealables.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Contact form ----------
     No backend is configured, so nothing is silently swallowed: the form
     validates, then hands a fully composed message to the visitor's own mail
     client. To switch to a hosted form service later, set an action on the
     <form> and this handler steps aside. */
  var form = document.getElementById("contact-form");
  if (form) {
    var endpoint = form.getAttribute("action");
    var status = document.getElementById("form-status");

    var showError = function (input, message) {
      input.setAttribute("aria-invalid", "true");
      var msg = input.parentNode.querySelector(".field-error");
      if (!msg) {
        msg = document.createElement("p");
        msg.className = "field-error";
        input.parentNode.appendChild(msg);
      }
      msg.textContent = message;
    };

    var clearError = function (input) {
      input.removeAttribute("aria-invalid");
      var msg = input.parentNode.querySelector(".field-error");
      if (msg) msg.remove();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var required = [
        { el: form.elements.name, label: "your name" },
        { el: form.elements.email, label: "your email address" },
        { el: form.elements.description, label: "a short project description" },
      ];

      var firstBad = null;
      required.forEach(function (r) {
        var value = r.el.value.trim();
        var bad = !value || (r.el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
        if (bad) {
          showError(r.el, "Please enter " + r.label + ".");
          if (!firstBad) firstBad = r.el;
        } else {
          clearError(r.el);
        }
      });

      if (firstBad) {
        status.textContent = "Please complete the highlighted fields.";
        firstBad.focus();
        return;
      }

      var get = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ""; };

      // A form service is configured — post in the background and keep the
      // visitor on the page. If the request fails, say so plainly and offer
      // email rather than pretending it went through.
      if (endpoint) {
        var submitButton = form.querySelector('button[type="submit"]');
        var replyTo = get("email"); // captured before reset() clears the field
        submitButton.disabled = true;
        status.textContent = "Sending…";

        fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed with status " + res.status);
            form.reset();
            status.textContent =
              "Thank you — your project details are on their way. We'll respond to " + replyTo + ".";
          })
          .catch(function () {
            status.textContent =
              "Something went wrong sending that. Please email support@sovereignvalorgroup.com directly and we'll pick it up from there.";
          })
          .finally(function () {
            submitButton.disabled = false;
          });
        return;
      }

      var lines = [
        "Name: " + get("name"),
        "Company: " + (get("company") || "—"),
        "Email: " + get("email"),
        "Phone: " + (get("phone") || "—"),
        "Project type: " + (get("project_type") || "—"),
        "Timeline: " + (get("timeline") || "—"),
        "Budget: " + (get("budget") || "—"),
        "Heard about us via: " + (get("referral") || "—"),
        "",
        "Project description:",
        get("description"),
      ];

      var subject = "Project inquiry — " + get("name") + (get("company") ? " (" + get("company") + ")" : "");
      var href =
        "mailto:support@sovereignvalorgroup.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));

      status.textContent = "Opening your email client…";
      window.location.href = href;
    });

    // Clear an error as soon as the visitor starts fixing it
    form.addEventListener("input", function (e) {
      if (e.target.getAttribute("aria-invalid") === "true") clearError(e.target);
    });
  }

  /* ---------- Analytics events ----------
     Elements carry data-event / data-venture-name / data-cta-location.
     This dispatches to whichever provider is installed; with none
     installed it is a no-op, so nothing breaks and nothing is faked. */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-event]");
    if (!el) return;
    var payload = {
      venture_name: el.getAttribute("data-venture-name") || undefined,
      venture_url: el.getAttribute("data-venture-url") || undefined,
      service_name: el.getAttribute("data-service-name") || undefined,
      cta_location: el.getAttribute("data-cta-location") || undefined,
      page_location: window.location.href,
    };
    if (typeof window.gtag === "function") {
      window.gtag("event", el.getAttribute("data-event"), payload);
    } else if (window.va) {
      window.va("event", { name: el.getAttribute("data-event"), data: payload });
    }
  });
})();
