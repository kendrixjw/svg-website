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

    /* --- Duplicate-submission guards (Formspree path only) --- */
    var COOLDOWN_KEY = "svg_contact_last_submit";
    var COOLDOWN_MS = 10 * 60 * 1000;
    var EMAIL = "support@sovereignvalorgroup.com";
    var submitting = false;

    // Storage can be unavailable (private browsing, blocked cookies, full quota).
    // Every access is guarded so the form still works when it throws.
    var readLastSubmit = function () {
      try {
        var raw = window.localStorage.getItem(COOLDOWN_KEY);
        var when = raw ? parseInt(raw, 10) : 0;
        return isNaN(when) ? 0 : when;
      } catch (err) {
        return 0;
      }
    };

    var writeLastSubmit = function () {
      try {
        window.localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch (err) {
        /* Cooldown is a convenience, not a correctness guarantee — carry on. */
      }
    };

    // Swap the form out for a message. Built as DOM nodes rather than innerHTML.
    var replaceForm = function (lead, trailing) {
      if (!form.parentNode) return;
      var panel = document.createElement("div");
      panel.className = "form-replacement";
      panel.setAttribute("role", "status");

      var p = document.createElement("p");
      p.appendChild(document.createTextNode(lead));
      if (trailing) {
        p.appendChild(document.createTextNode(trailing));
        var link = document.createElement("a");
        link.href = "mailto:" + EMAIL;
        link.textContent = EMAIL;
        p.appendChild(link);
        p.appendChild(document.createTextNode("."));
      }
      panel.appendChild(p);
      form.parentNode.replaceChild(panel, form);
      return panel;
    };

    // Someone who just submitted shouldn't be handed an empty form to fill again.
    if (endpoint) {
      var last = readLastSubmit();
      if (last && Date.now() - last < COOLDOWN_MS) {
        replaceForm("We've received your message. ", "Need to add something? Email ");
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return; // second click while a POST is already in flight

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
        var buttonLabel = submitButton.textContent;
        var replyTo = get("email"); // captured before the form leaves the DOM

        submitting = true;
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
        status.textContent = "Sending…";

        fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        })
          .then(function (res) {
            // Covers network-level failures, non-2xx, and Formspree quota errors.
            if (!res.ok) throw new Error("Request failed with status " + res.status);

            // Success: the form goes away entirely, so there is nothing left to
            // resubmit. Deliberately not re-enabling the button here.
            writeLastSubmit();
            replaceForm(
              "Thank you — your project details are on their way. We'll respond to " + replyTo + ".",
              ""
            );
          })
          .catch(function () {
            // Failure is the only path that gives the button back.
            submitting = false;
            submitButton.disabled = false;
            submitButton.textContent = buttonLabel;
            status.textContent = "Something went wrong — reach us directly at " + EMAIL + ".";
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
