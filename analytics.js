/* Optional website pageviews. No tracker is loaded before saved consent. */
(() => {
  const key = "cargpt.umami.consent.v1";
  const blockedKey = "cargpt.umami.blocked.v1";
  const banner = document.getElementById("analytics-banner");
  const status = document.getElementById("analytics-status");
  const preferences = document.querySelector("[data-analytics-preferences]");
  let choice = null;
  let script;
  let ready = false;
  let lastPath;
  let channel;
  try {
    channel = new BroadcastChannel(key);
  } catch {
    /* Storage events still work. */
  }

  function readChoice() {
    try {
      if (sessionStorage.getItem(blockedKey)) return "denied";
      const value = localStorage.getItem(key);
      return ["accepted", "denied"].includes(value) ? value : null;
    } catch {
      return null;
    }
  }

  function permitted() {
    return choice === "accepted" && readChoice() === "accepted";
  }

  function cleanAddress(value) {
    if (!value) return "";
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin
        ? url.pathname
        : url.origin + url.pathname;
    } catch {
      return "";
    }
  }

  // Recheck at send time too: late loads and queued calls cannot bypass withdrawal.
  window.cargptUmamiBeforeSend = (type, payload) => {
    if (
      !permitted() ||
      type !== "event" ||
      payload.name ||
      payload.id ||
      payload.data
    )
      return false;
    return {
      ...payload,
      url: cleanAddress(payload.url),
      referrer: cleanAddress(payload.referrer),
    };
  };

  function pageview() {
    if (!ready || !permitted() || lastPath === location.pathname) return;
    lastPath = location.pathname;
    // Automatic tracking is off, so explicitly supply the current path for SPA navigation.
    Promise.resolve(
      window.umami.track((props) => ({
        ...props,
        url: location.pathname,
        referrer: cleanAddress(document.referrer),
      })),
    ).catch(() => {
      /* Analytics failure must not affect access. */
    });
  }

  function apply(value) {
    const wasAccepted = choice === "accepted";
    choice = value;
    banner.hidden = value !== null;
    if (value !== "accepted") {
      lastPath = undefined;
      return; // Keep the tracker inert; removing its element cannot unload executed code.
    }
    if (ready) {
      if (!wasAccepted) pageview();
      return;
    }
    if (script) return;
    script = document.createElement("script");
    script.defer = true;
    script.src = "https://analytics.ahmeto.com/script.js";
    script.referrerPolicy = "no-referrer";
    script.dataset.websiteId = "a8742fc8-7075-431c-b936-61a4e8616efe";
    script.dataset.autoTrack = "false";
    script.dataset.excludeSearch = "true";
    script.dataset.excludeHash = "true";
    script.dataset.performance = "false";
    script.dataset.errors = "false";
    script.dataset.beforeSend = "cargptUmamiBeforeSend";
    script.onload = () => {
      ready = true;
      pageview();
    };
    script.onerror = () => {
      script.remove();
      script = undefined;
    };
    document.head.append(script);
  }

  function choose(value) {
    // Block immediately, before attempting any storage operations.
    choice = "denied";
    lastPath = undefined;
    let saved = false;
    try {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(blockedKey);
      saved = localStorage.getItem(key) === value;
    } catch {
      /* Fail closed, including when an old acceptance remains stored. */
    }
    if (!saved) {
      try {
        sessionStorage.setItem(blockedKey, "true");
      } catch {
        /* In-memory block remains. */
      }
    }
    apply(saved ? value : "denied");
    status.textContent = saved
      ? ""
      : "Your choice could not be saved. Analytics is blocked on this page. Your browser may ask again on another visit.";
    banner.hidden = saved;
    try {
      channel?.postMessage(saved ? value : "denied");
    } catch {
      /* Optional cross-tab fallback. */
    }
    if (saved && banner.contains(document.activeElement))
      preferences.focus({ preventScroll: true });
  }

  banner
    .querySelector("[data-analytics-allow]")
    .addEventListener("click", () => choose("accepted"));
  banner
    .querySelector("[data-analytics-decline]")
    .addEventListener("click", () => choose("denied"));
  preferences.addEventListener("click", () => {
    banner.hidden = false;
    banner.querySelector("button").focus();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    // A new explicit choice in another tab supersedes this tab's temporary block.
    try {
      sessionStorage.removeItem(blockedKey);
    } catch {
      /* Fail closed in readChoice. */
    }
    apply(readChoice());
  });
  if (channel)
    channel.onmessage = (event) => {
      if (event.data === "denied") apply("denied");
      else apply(readChoice());
    };
  // There is no router today; keep history navigation consent-gated if one is added.
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      pageview();
      return result;
    };
  }
  window.addEventListener("popstate", pageview);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      lastPath = undefined;
      apply(readChoice());
      pageview();
    }
  });
  apply(readChoice());
})();
