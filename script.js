(function bootstrapTheme() {
  const saved = localStorage.getItem("error404-theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  }
})();

$(function () {
  "use strict";

    const SERVICES = {
    "screen-repair":     { label: "Screen Repair",              price: 49 },
    "battery-swap":      { label: "Battery Replacement",        price: 39 },
    "data-recovery":     { label: "Data Recovery",               price: 89 },
    "malware-removal":   { label: "Virus & Malware Removal",     price: 59 },
    "liquid-damage":     { label: "Liquid Damage Treatment",     price: 69 },
    "diagnostics":       { label: "Software Diagnostics",        price: 29 },
    "hardware-upgrade":  { label: "Hardware Upgrade (RAM/SSD)",  price: 45 },
    "emergency-sameday": { label: "Emergency Same-Day Service",  price: 99 }
  };

    const $root = $(document.documentElement);
  const $themeToggle = $(".theme-toggle");

  function applyThemeIcon(theme) {
    const $icon = $themeToggle.find("i");
    $icon.attr("class", theme === "light" ? "fa-solid fa-moon" : "fa-solid fa-sun");
  }

  applyThemeIcon($root.attr("data-theme") || "dark");

  $themeToggle.on("click", function () {
    const current = $root.attr("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    $root.attr("data-theme", next);
    try {
      localStorage.setItem("error404-theme", next);
    } catch (e) {
      console.error("localStorage save failed:", e);
      alert("Storage error - localStorage may be disabled or full");
    }
    applyThemeIcon(next);
  });

    const $navToggle = $(".nav-toggle");
  const $navLinks = $(".nav-links");

  $navToggle.on("click", function () {
    $(this).toggleClass("is-open");
    $navLinks.toggleClass("is-open");
    const expanded = $navLinks.hasClass("is-open");
    $(this).attr("aria-expanded", expanded);
  });

  $navLinks.on("click", "a", function () {
    $navToggle.removeClass("is-open").attr("aria-expanded", false);
    $navLinks.removeClass("is-open");
  });

    const $estimatorList = $("#estimatorList");
  const $estimatorTotal = $("#estimatorTotal");
  const $estimatorCount = $("#estimatorCount");

  function renderEstimate() {
    if (!$estimatorList.length) return;

    const checked = $(".service-checkbox:checked");
    $estimatorList.empty();

    if (checked.length === 0) {
      $estimatorList.append('<li class="estimator-empty">No services selected yet — tick a box to see live pricing.</li>');
      $estimatorTotal.text("£0");
      $estimatorCount.text("0");
      return;
    }

    let total = 0;
    checked.each(function () {
      const key = $(this).val();
      const service = SERVICES[key];
      if (!service) return;
      total += service.price;
      $estimatorList.append(
        `<li><span>${service.label}</span><span>£${service.price}</span></li>`
      );
    });

    $estimatorTotal.text("£" + total);
    $estimatorCount.text(checked.length);
  }

  $(document).on("change", ".service-checkbox", renderEstimate);
  renderEstimate();

    const $form = $("#bookRepairForm");

  if ($form.length) {

    const validators = {
      fullName: (val) => val.trim().length >= 3,
      email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
      phone: (val) => val.replace(/\D/g, "").length >= 10 && val.replace(/\D/g, "").length <= 15,
      deviceType: (val) => val !== "",
      issueDescription: (val) => val.trim().length >= 20
    };

    const errorMessages = {
      fullName: "Enter your full name (at least 3 characters).",
      email: "Enter a valid email address, e.g. name@example.com.",
      phone: "Enter a valid phone number (10–15 digits).",
      deviceType: "Select the type of device that needs a fix.",
      issueDescription: "Describe the issue in at least 20 characters so we can triage it."
    };

    function validateField(name) {
      const $field = $(`.field[data-field="${name}"]`);
      const $input = $field.find("input, select, textarea");
      const value = $input.val() || "";
      const isValid = validators[name](value);

      $field.toggleClass("is-valid", isValid).toggleClass("is-invalid", !isValid);
      $field.find(".field-error").text(errorMessages[name]);

      return isValid;
    }

    $form.on("blur change", "input, select, textarea", function () {
      const name = $(this).closest(".field").data("field");
      if (name && validators[name]) validateField(name);
    });

    function generateTicketId() {
      const digits = Math.floor(1000 + Math.random() * 9000);
      return `ERR-${digits}`;
    }

    $form.on("submit", function (e) {
      e.preventDefault();

      const fieldNames = Object.keys(validators);
      let allValid = true;

      fieldNames.forEach((name) => {
        const valid = validateField(name);
        if (!valid) allValid = false;
      });

      if (!allValid) {
        const $firstInvalid = $(".field.is-invalid").first();
        if ($firstInvalid.length) {
          $("html, body").animate({ scrollTop: $firstInvalid.offset().top - 120 }, 300);
          $firstInvalid.find("input, select, textarea").trigger("focus");
        }
        return;
      }

      const selectedServices = $(".service-checkbox-form:checked").map(function () {
        return SERVICES[$(this).val()] ? SERVICES[$(this).val()].label : $(this).val();
      }).get();

      const ticket = {
        ticketId: generateTicketId(),
        fullName: $("#fullName").val().trim(),
        email: $("#email").val().trim(),
        phone: $("#phone").val().trim(),
        deviceType: $("#deviceType").val(),
        deviceModel: $("#deviceModel").val().trim(),
        issueDescription: $("#issueDescription").val().trim(),
        urgency: $("input[name='urgency']:checked").val() || "standard",
        services: selectedServices,
        submittedAt: new Date().toISOString(),
        status: "received"
      };

      try {
        localStorage.setItem("error404-latest-ticket", JSON.stringify(ticket));

        const allTickets = JSON.parse(localStorage.getItem("error404-tickets") || "{}");
        allTickets[ticket.ticketId] = ticket;
        localStorage.setItem("error404-tickets", JSON.stringify(allTickets));

        window.location.href = "status.html?ticket=" + encodeURIComponent(ticket.ticketId);
      } catch (e) {
        console.error("localStorage save failed:", e);
        alert("ERROR: Could not save your ticket. Your browser's storage may be disabled or full.\n\nPlease check:\n1. Are you in Private/Incognito mode?\n2. Is localStorage enabled in browser settings?\n3. Do you have storage space available?");
      }
    });
  }

    const $ticketPanel = $("#ticketPanel");
  const $noTicket = $("#noTicket");

  if ($ticketPanel.length) {

    function getTicketById(id) {
      try {
        const allTickets = JSON.parse(localStorage.getItem("error404-tickets") || "{}");
        return allTickets[id] || null;
      } catch (e) {
        console.error("localStorage read failed:", e);
        return null;
      }
    }

    function getLatestTicket() {
      try {
        const raw = localStorage.getItem("error404-latest-ticket");
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error("localStorage read failed:", e);
        return null;
      }
    }

    const STAGES = [
      { key: "received", label: "Received", icon: "fa-inbox" },
      { key: "diagnosing", label: "Diagnosing", icon: "fa-magnifying-glass" },
      { key: "repairing", label: "Repairing", icon: "fa-screwdriver-wrench" },
      { key: "ready", label: "Ready", icon: "fa-circle-check" }
    ];

    function stageIndexFor(ticketId) {
      const digits = parseInt(ticketId.replace(/\D/g, ""), 10) || 0;
      return digits % STAGES.length;
    }

    function renderTicket(ticket) {
      $noTicket.hide();
      $ticketPanel.show();

      $("#ticketIdOut").text(ticket.ticketId);
      $("#ticketNameOut").text(ticket.fullName);
      $("#ticketEmailOut").text(ticket.email);
      $("#ticketPhoneOut").text(ticket.phone);
      $("#ticketDeviceOut").text(
        ticket.deviceModel ? `${ticket.deviceType} — ${ticket.deviceModel}` : ticket.deviceType
      );
      $("#ticketIssueOut").text(ticket.issueDescription);
      $("#ticketUrgencyOut").text(ticket.urgency === "emergency" ? "Emergency (same-day)" : "Standard");
      $("#ticketServicesOut").text(ticket.services && ticket.services.length ? ticket.services.join(", ") : "General diagnostics");

      const submitted = new Date(ticket.submittedAt);
      $("#ticketDateOut").text(submitted.toLocaleString());

      const activeIndex = stageIndexFor(ticket.ticketId);
      const $log = $("#diagnosticLog").empty();

      STAGES.forEach((stage, i) => {
        let stateClass = "";
        if (i < activeIndex) stateClass = "is-complete";
        else if (i === activeIndex) stateClass = "is-active";

        $log.append(`
          <div class="log-step ${stateClass}">
            <div class="icon"><i class="fa-solid ${stage.icon}"></i></div>
            <div class="label">${stage.label}</div>
          </div>
        `);
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get("ticket");
    const ticket = requestedId ? getTicketById(requestedId) : getLatestTicket();

    if (ticket) {
      renderTicket(ticket);
    } else {
      $ticketPanel.hide();
      $noTicket.show();
    }

    $("#lookupForm").on("submit", function (e) {
      e.preventDefault();
      const id = $("#lookupInput").val().trim().toUpperCase();
      const found = getTicketById(id);

      if (found) {
        renderTicket(found);
        $("#lookupError").hide();
        const newUrl = window.location.pathname + "?ticket=" + encodeURIComponent(id);
        window.history.replaceState({}, "", newUrl);
      } else {
        $("#lookupError").text(`No ticket found matching "${id}".`).show();
      }
    });
  }

    const $dataViewerRoot = $("#dataViewerRoot");

  if ($dataViewerRoot.length) {

    const STORAGE_KEYS = [
      { key: "error404-theme", target: "#dataThemeOut", empty: "#dataThemeEmpty" },
      { key: "error404-latest-ticket", target: "#dataLatestOut", empty: "#dataLatestEmpty" },
      { key: "error404-tickets", target: "#dataAllOut", empty: "#dataAllEmpty" }
    ];

    function prettyPrint(raw) {
      try {
        return JSON.stringify(JSON.parse(raw), null, 2);
      } catch (err) {
        return raw;
      }
    }

    function renderStorage() {
      STORAGE_KEYS.forEach(({ key, target, empty }) => {
        try {
          const raw = localStorage.getItem(key);
          const $target = $(target);
          const $empty = $(empty);

          if (raw === null) {
            $target.hide();
            $empty.show();
          } else {
            $target.text(prettyPrint(raw)).show();
            $empty.hide();
          }
        } catch (e) {
          console.error("localStorage access failed:", e);
        }
      });
    }

    renderStorage();

    $(document).on("click", ".copy-data-btn", function () {
      const targetSel = $(this).data("target");
      const text = $(targetSel).text();
      const $btn = $(this);
      const $toast = $btn.siblings(".toast-msg");

      const showCopied = () => {
        $toast.text("Copied!").addClass("is-visible");
        setTimeout(() => $toast.removeClass("is-visible"), 1500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(showCopied);
      } else {
        const $tmp = $("<textarea>").val(text).appendTo("body").select();
        document.execCommand("copy");
        $tmp.remove();
        showCopied();
      }
    });

    $("#clearAllDataBtn").on("click", function () {
      const confirmed = window.confirm(
        "This will permanently delete every stored ticket and the theme preference on this device. Continue?"
      );
      if (!confirmed) return;

      try {
        STORAGE_KEYS.forEach(({ key }) => localStorage.removeItem(key));
        renderStorage();

        const $toast = $("#clearAllToast");
        $toast.text("All stored data cleared.").addClass("is-visible");
        setTimeout(() => $toast.removeClass("is-visible"), 2000);
      } catch (e) {
        console.error("localStorage clear failed:", e);
        alert("Could not clear storage: " + e.message);
      }
    });
  }

});
