/*!
 * Slotix embed — opens a booking widget in a modal over the host page instead of sending the
 * visitor to slotix.neurin.tech. Plain ES5-era script, no dependencies, no build step.
 *
 *   <script src="https://slotix.neurin.tech/embed.js" defer></script>
 *   <button data-slotix="https://slotix.neurin.tech/danil/<formatId>" data-slotix-cta="hero">
 *     Разобрать гипотезу
 *   </button>
 *
 * Everything else is optional; see EMBED.md.
 */
(function (window, document) {
  "use strict";

  if (window.Slotix && window.Slotix.__loaded) return;

  var MESSAGE_SOURCE = "slotix-embed";
  // How long to wait for the framed page to say hello before deciding it was blocked.
  // Covers a cold Next.js route plus a slow mobile connection; past that a visitor is
  // staring at a spinner, and a new tab is strictly better than a dead box.
  var READY_TIMEOUT_MS = 6000;
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var PREFILL_KEYS = ["name", "email", "comment"];

  var state = { overlay: null, iframe: null, ready: false, timer: null, lastFocus: null };

  // --- helpers -------------------------------------------------------------

  function hostParams() {
    try {
      return new URLSearchParams(window.location.search);
    } catch (e) {
      return new URLSearchParams("");
    }
  }

  /** Accepts the ordinary booking link so nobody has to remember a second URL shape, and
   * rewrites it to its /embed/ twin — that prefix is the only one the app allows to be
   * framed, and the only one rendered without site chrome. */
  function toEmbedUrl(rawUrl, options) {
    var url;
    try {
      url = new URL(rawUrl, window.location.href);
    } catch (e) {
      return null;
    }

    if (url.pathname.indexOf("/embed/") !== 0) {
      url.pathname = "/embed" + (url.pathname.charAt(0) === "/" ? "" : "/") + url.pathname;
    }

    // Campaign tags live on the host page's URL, not on the widget link, so carry them in.
    // A tag already written onto the widget link wins — it was set deliberately.
    var params = hostParams();
    for (var i = 0; i < UTM_KEYS.length; i++) {
      var key = UTM_KEYS[i];
      var value = params.get(key);
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
    }

    if (options.cta && !url.searchParams.has("cta")) url.searchParams.set("cta", options.cta);
    for (var j = 0; j < PREFILL_KEYS.length; j++) {
      var field = PREFILL_KEYS[j];
      if (options[field]) url.searchParams.set(field, options[field]);
    }

    return url.toString();
  }

  function emit(type, detail) {
    try {
      window.dispatchEvent(new CustomEvent("slotix:" + type, { detail: detail }));
    } catch (e) {
      /* very old browser without the CustomEvent constructor — callbacks still run */
    }
    // Convenience for GTM / Yandex Metrica setups that read a data layer.
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      var payload = { event: "slotix_" + type };
      for (var key in detail) {
        if (Object.prototype.hasOwnProperty.call(detail, key)) payload[key] = detail[key];
      }
      window.dataLayer.push(payload);
    }
    var handler = window.Slotix && window.Slotix["on" + type.charAt(0).toUpperCase() + type.slice(1)];
    if (typeof handler === "function") {
      try {
        handler(detail);
      } catch (e) {
        /* a throwing host callback must not take the widget down with it */
      }
    }
  }

  function injectStyles() {
    if (document.getElementById("slotix-embed-styles")) return;
    var style = document.createElement("style");
    style.id = "slotix-embed-styles";
    style.textContent = [
      ".slotix-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;",
      "justify-content:center;padding:16px;background:rgba(16,24,38,.55);opacity:0;transition:opacity .18s ease}",
      ".slotix-overlay[data-open='1']{opacity:1}",
      ".slotix-panel{position:relative;width:100%;max-width:560px;height:min(88vh,760px);",
      "background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 70px rgba(16,24,38,.32);",
      "transform:translateY(8px);transition:transform .18s ease}",
      ".slotix-overlay[data-open='1'] .slotix-panel{transform:none}",
      ".slotix-panel iframe{display:block;width:100%;height:100%;border:0;background:transparent}",
      ".slotix-close{position:absolute;top:10px;right:10px;z-index:2;width:32px;height:32px;",
      "display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;cursor:pointer;",
      "background:rgba(255,255,255,.92);box-shadow:0 2px 10px rgba(16,24,38,.18);font:600 17px/1 system-ui,sans-serif;color:#4a5568}",
      ".slotix-spinner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",
      "font:400 14px/1.4 system-ui,sans-serif;color:#6b7686}",
      "@media (max-width:640px){.slotix-overlay{padding:0}.slotix-panel{max-width:none;height:100%;border-radius:0}}",
      "@media (prefers-reduced-motion:reduce){.slotix-overlay,.slotix-panel{transition:none}}",
    ].join("");
    document.head.appendChild(style);
  }

  // --- modal ---------------------------------------------------------------

  function close() {
    if (!state.overlay) return;
    window.clearTimeout(state.timer);
    var overlay = state.overlay;
    state.overlay = null;
    state.iframe = null;
    state.ready = false;
    overlay.removeAttribute("data-open");
    document.documentElement.style.overflow = "";
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 180);
    if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
    state.lastFocus = null;
    emit("close", {});
  }

  function onKeydown(event) {
    if (event.key === "Escape" || event.keyCode === 27) close();
  }

  function open(rawUrl, options) {
    options = options || {};
    var src = toEmbedUrl(rawUrl, options);
    if (!src) return;

    close();
    injectStyles();
    state.lastFocus = document.activeElement;

    var overlay = document.createElement("div");
    overlay.className = "slotix-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", options.title || "Запись на встречу");

    var panel = document.createElement("div");
    panel.className = "slotix-panel";

    var spinner = document.createElement("div");
    spinner.className = "slotix-spinner";
    spinner.textContent = "Загружаем расписание…";

    var closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "slotix-close";
    closeButton.setAttribute("aria-label", "Закрыть");
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", close);

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = options.title || "Запись на встречу";
    // camera/microphone are never used by the booking form itself; payment is needed because
    // a paid format hands off to the provider's hosted checkout inside this same frame.
    iframe.setAttribute("allow", "payment");
    iframe.setAttribute("loading", "eager");
    if (options.cta) iframe.setAttribute("data-slotix-cta", options.cta);

    panel.appendChild(spinner);
    panel.appendChild(closeButton);
    panel.appendChild(iframe);
    overlay.appendChild(panel);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });

    document.body.appendChild(overlay);
    document.documentElement.style.overflow = "hidden";
    state.overlay = overlay;
    state.iframe = iframe;
    state.ready = false;

    // Force a reflow so the opacity transition has a frame to start from.
    void overlay.offsetHeight;
    overlay.setAttribute("data-open", "1");
    closeButton.focus();

    // The spec's stated fallback: "Если Slotix не умеет встраиваться, открываем его в новой
    // вкладке". A CSP frame-ancestors or X-Frame-Options refusal gives no error event to
    // listen for — silence is the only signal, so silence is what we time.
    state.timer = window.setTimeout(function () {
      if (state.ready) return;
      var href = src;
      close();
      emit("fallback", { url: href });
      window.open(href, "_blank", "noopener");
    }, READY_TIMEOUT_MS);

    emit("open", { url: src, cta: options.cta });
  }

  // --- inline --------------------------------------------------------------

  /** Renders the widget straight into a container instead of a modal, growing with its
   * content. For a page that wants the calendar always visible rather than behind a button. */
  function inline(target, rawUrl, options) {
    options = options || {};
    var container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) return null;
    var src = toEmbedUrl(rawUrl, options);
    if (!src) return null;

    var iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.title = options.title || "Запись на встречу";
    iframe.setAttribute("allow", "payment");
    iframe.style.cssText = "display:block;width:100%;border:0;background:transparent;min-height:" +
      (options.minHeight || 640) + "px";
    iframe.setAttribute("data-slotix-inline", "1");
    if (options.cta) iframe.setAttribute("data-slotix-cta", options.cta);
    container.appendChild(iframe);
    return iframe;
  }

  // --- message bridge ------------------------------------------------------

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== MESSAGE_SOURCE) return;
    // Only trust messages coming from a frame we created: any page can postMessage this shape.
    var fromModal = state.iframe && event.source === state.iframe.contentWindow;
    var inlineFrames = document.querySelectorAll("iframe[data-slotix-inline]");
    var originIframe = null;
    for (var i = 0; i < inlineFrames.length; i++) {
      if (inlineFrames[i].contentWindow === event.source) originIframe = inlineFrames[i];
    }
    if (!fromModal && !originIframe) return;

    if (data.type === "ready") {
      if (fromModal) {
        state.ready = true;
        window.clearTimeout(state.timer);
        var spinner = state.overlay && state.overlay.querySelector(".slotix-spinner");
        if (spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner);
      }
      emit("ready", {});
      return;
    }

    if (data.type === "resize" && originIframe && typeof data.height === "number") {
      originIframe.style.height = data.height + "px";
      return;
    }

    if (data.type === "booked") {
      var frame = fromModal ? state.iframe : originIframe;
      emit("booked", {
        formatId: data.formatId,
        startAt: data.startAt,
        cta: (frame && frame.getAttribute("data-slotix-cta")) || undefined,
      });
    }
  });

  document.addEventListener("keydown", onKeydown);

  // --- auto-binding --------------------------------------------------------

  function optionsFromElement(element) {
    return {
      cta: element.getAttribute("data-slotix-cta") || undefined,
      name: element.getAttribute("data-slotix-name") || undefined,
      email: element.getAttribute("data-slotix-email") || undefined,
      comment: element.getAttribute("data-slotix-comment") || undefined,
      title: element.getAttribute("data-slotix-title") || undefined,
    };
  }

  // Delegated, so buttons rendered after this script (a React app, a lazy section) work too.
  document.addEventListener("click", function (event) {
    var element = event.target && event.target.closest ? event.target.closest("[data-slotix]") : null;
    if (!element) return;
    var url = element.getAttribute("data-slotix");
    if (!url) return;
    event.preventDefault();
    open(url, optionsFromElement(element));
  });

  function mountInlineTargets() {
    var nodes = document.querySelectorAll("[data-slotix-inline-url]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getAttribute("data-slotix-mounted")) continue;
      node.setAttribute("data-slotix-mounted", "1");
      inline(node, node.getAttribute("data-slotix-inline-url"), optionsFromElement(node));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountInlineTargets);
  } else {
    mountInlineTargets();
  }

  window.Slotix = {
    __loaded: true,
    open: open,
    close: close,
    inline: inline,
    mountInlineTargets: mountInlineTargets,
  };
})(window, document);
