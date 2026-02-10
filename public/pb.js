(function (window) {
  if (window.PB) return;

  var state = {
    siteId: null,
    apiBase: "https://popup-builder-blue.vercel.app",
    userContext: {},
    debug: false,
    pageviewCount: null,
    debugInfo: {
      popupsCount: 0,
      popupId: null,
      versionId: null,
      lastTrigger: null,
      blockedReason: null,
    },
  };
  var bootCache = null;

  function buildApiUrl(path) {
    var base = state.apiBase || "https://popup-builder-blue.vercel.app";
    return base.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function getJson(url) {
    return fetch(url, { method: "GET" }).then(function (res) {
      return res.ok ? res.json() : null;
    });
  }

  function getDevice() {
    return window.innerWidth <= 768 ? "mobile" : "desktop";
  }

  function debugLog() {
    if (!state.debug) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[PB][trigger]");
    console.log.apply(console, args);
  }

  function renderDebugHud() {
    if (!state.debug) return;
    var existing = document.getElementById("pb-debug-hud");
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "pb-debug-hud";
      existing.style.position = "fixed";
      existing.style.bottom = "12px";
      existing.style.right = "12px";
      existing.style.zIndex = "2147483647";
      existing.style.background = "rgba(0,0,0,0.8)";
      existing.style.color = "#fff";
      existing.style.padding = "10px 12px";
      existing.style.borderRadius = "8px";
      existing.style.fontSize = "12px";
      existing.style.fontFamily = "Inter, system-ui, sans-serif";
      existing.style.maxWidth = "260px";
      document.body.appendChild(existing);
    }

    existing.textContent =
      "PB Debug\n" +
      "popups: " +
      state.debugInfo.popupsCount +
      "\n" +
      "popupId: " +
      (state.debugInfo.popupId || "-") +
      "\n" +
      "versionId: " +
      (state.debugInfo.versionId || "-") +
      "\n" +
      "lastTrigger: " +
      (state.debugInfo.lastTrigger || "-") +
      "\n" +
      "blocked: " +
      (state.debugInfo.blockedReason || "-");
  }

  function normalizeTrigger(trigger) {
    if (!trigger || !trigger.type) return null;
    var enabled = trigger.enabled !== false;
    if (!enabled) return null;
    var params = trigger.params || {};
    var isValidNumber = function (value) {
      return typeof value === "number" && !isNaN(value);
    };

    if (trigger.type === "after_seconds") {
      var seconds = Number(params.seconds || trigger.seconds || 5);
      if (!isValidNumber(seconds) || seconds <= 0) {
        debugLog("invalid after_seconds", { seconds: seconds });
        return null;
      }
      return {
        type: "after_seconds",
        params: { seconds: seconds },
      };
    }
    if (trigger.type === "scroll_percent") {
      var percent = Number(params.percent || trigger.percent || 10);
      if (!isValidNumber(percent) || percent <= 0) {
        debugLog("invalid scroll_percent", { percent: percent });
        return null;
      }
      return {
        type: "scroll_percent",
        params: { percent: percent },
      };
    }
    if (trigger.type === "exit_intent_desktop") {
      var sensitivity = Number(params.sensitivity || trigger.sensitivity || 10);
      return {
        type: "exit_intent_desktop",
        params: { sensitivity: isValidNumber(sensitivity) ? sensitivity : 10 },
      };
    }
    if (trigger.type === "inactivity") {
      var idleSeconds = Number(params.seconds || trigger.seconds || 10);
      if (!isValidNumber(idleSeconds) || idleSeconds <= 0) {
        debugLog("invalid inactivity", { seconds: idleSeconds });
        return null;
      }
      return {
        type: "inactivity",
        params: { seconds: idleSeconds },
      };
    }
    if (trigger.type === "pageview_count") {
      var count = Number(params.count || trigger.count || 1);
      if (!isValidNumber(count) || count <= 0) {
        debugLog("invalid pageview_count", { count: count });
        return null;
      }
      return {
        type: "pageview_count",
        params: { count: count },
      };
    }
    if (trigger.type === "url_match") {
      return {
        type: "url_match",
        params: {
          pattern: String(params.pattern || trigger.pattern || ""),
          match: params.match || trigger.match || "contains",
        },
      };
    }
    if (trigger.type === "device_is") {
      return {
        type: "device_is",
        params: { device: params.device || trigger.device || "desktop" },
      };
    }
    if (trigger.type === "custom_event") {
      var name = String(params.name || trigger.eventName || "");
      if (!name) {
        debugLog("invalid custom_event missing name");
        return null;
      }
      return {
        type: "custom_event",
        params: { name: name },
      };
    }
    if (trigger.type === "smart_exit_intent") {
      var sensitivity = Number(params.sensitivity || trigger.sensitivity || 10);
      var scrollVelocityThreshold = Number(
        params.scrollVelocityThreshold || trigger.scrollVelocityThreshold || 800
      );
      var topScrollThreshold = Number(
        params.topScrollThreshold || trigger.topScrollThreshold || 120
      );
      return {
        type: "smart_exit_intent",
        params: {
          sensitivity: isValidNumber(sensitivity) ? sensitivity : 10,
          scrollVelocityThreshold: isValidNumber(scrollVelocityThreshold)
            ? scrollVelocityThreshold
            : 800,
          topScrollThreshold: isValidNumber(topScrollThreshold)
            ? topScrollThreshold
            : 120,
        },
      };
    }

    return null;
  }

  function getPageviewCount() {
    if (!state.siteId) return 0;
    if (typeof state.pageviewCount === "number") {
      return state.pageviewCount;
    }
    var key = "pb_pageviews_" + state.siteId;
    var count = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(count));
    state.pageviewCount = count;
    return count;
  }

  function createTriggerPromise(trigger, popupId) {
    var cleanup = function () { };

    if (trigger.type === "after_seconds") {
      var timeout = setTimeout(function () {
        state.debugInfo.lastTrigger = "after_seconds";
        debugLog("fired after_seconds", { popupId: popupId, seconds: trigger.params.seconds });
        resolve();
      }, trigger.params.seconds * 1000);
      cleanup = function () {
        clearTimeout(timeout);
      };
      var resolve;
      var promise = new Promise(function (res) {
        resolve = res;
      });
      debugLog("armed after_seconds", { popupId: popupId, seconds: trigger.params.seconds });
      return { promise: promise, cleanup: cleanup };
    }

    if (trigger.type === "scroll_percent") {
      var resolveScroll;
      var promiseScroll = new Promise(function (res) {
        resolveScroll = res;
      });
      var onScroll = function () {
        var scrolled =
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100;
        if (scrolled >= trigger.params.percent) {
          window.removeEventListener("scroll", onScroll);
          state.debugInfo.lastTrigger = "scroll_percent";
          debugLog("fired scroll_percent", { popupId: popupId, percent: scrolled });
          resolveScroll();
        }
      };
      window.addEventListener("scroll", onScroll);
      cleanup = function () {
        window.removeEventListener("scroll", onScroll);
      };
      debugLog("armed scroll_percent", { popupId: popupId, percent: trigger.params.percent });
      return { promise: promiseScroll, cleanup: cleanup };
    }

    if (trigger.type === "exit_intent_desktop") {
      var resolveExit;
      var promiseExit = new Promise(function (res) {
        resolveExit = res;
      });
      if (getDevice() !== "desktop") {
        debugLog("skip exit_intent_desktop on mobile", { popupId: popupId });
        return { promise: new Promise(function () { }), cleanup: cleanup };
      }
      var sensitivity = trigger.params.sensitivity;
      var onMouseOut = function (event) {
        if (event.clientY <= sensitivity) {
          document.removeEventListener("mouseout", onMouseOut);
          state.debugInfo.lastTrigger = "exit_intent_desktop";
          debugLog("fired exit_intent_desktop", { popupId: popupId, sensitivity: sensitivity });
          resolveExit();
        }
      };
      document.addEventListener("mouseout", onMouseOut);
      cleanup = function () {
        document.removeEventListener("mouseout", onMouseOut);
      };
      debugLog("armed exit_intent_desktop", { popupId: popupId, sensitivity: sensitivity });
      return { promise: promiseExit, cleanup: cleanup };
    }

    if (trigger.type === "inactivity") {
      var resolveInactivity;
      var promiseInactivity = new Promise(function (res) {
        resolveInactivity = res;
      });
      var timeoutId;
      var delay = trigger.params.seconds * 1000;
      var reset = function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function () {
          state.debugInfo.lastTrigger = "inactivity";
          debugLog("fired inactivity", { popupId: popupId, seconds: trigger.params.seconds });
          resolveInactivity();
          cleanup();
        }, delay);
      };
      var events = ["mousemove", "keydown", "scroll", "touchstart"];
      events.forEach(function (eventName) {
        window.addEventListener(eventName, reset, { passive: true });
      });
      reset();
      cleanup = function () {
        clearTimeout(timeoutId);
        events.forEach(function (eventName) {
          window.removeEventListener(eventName, reset);
        });
      };
      debugLog("armed inactivity", { popupId: popupId, seconds: trigger.params.seconds });
      return { promise: promiseInactivity, cleanup: cleanup };
    }

    if (trigger.type === "pageview_count") {
      var required = trigger.params.count;
      var count = getPageviewCount();
      debugLog("pageview_count check", { popupId: popupId, count: count, required: required });
      if (count >= required) {
        state.debugInfo.lastTrigger = "pageview_count";
        return {
          promise: Promise.resolve(),
          cleanup: cleanup,
        };
      }
      return { promise: new Promise(function () { }), cleanup: cleanup };
    }

    if (trigger.type === "url_match") {
      var pattern = trigger.params.pattern || "";
      var matchType = trigger.params.match || "contains";
      if (!pattern) {
        debugLog("invalid url_match missing pattern", { popupId: popupId });
        return { promise: new Promise(function () { }), cleanup: cleanup };
      }
      var href = window.location.href;
      var haystack = href.toLowerCase();
      var needle = pattern.toLowerCase();
      var matched = false;
      if (matchType === "equals") {
        matched = haystack === needle;
      } else if (matchType === "regex") {
        try {
          matched = new RegExp(pattern, "i").test(href);
        } catch {
          debugLog("invalid url_match regex", { popupId: popupId, pattern: pattern });
          matched = false;
        }
      } else {
        matched = haystack.indexOf(needle) !== -1;
      }
      debugLog("url_match check", {
        popupId: popupId,
        match: matchType,
        pattern: pattern,
        matched: matched,
      });
      if (matched) {
        state.debugInfo.lastTrigger = "url_match";
        return { promise: Promise.resolve(), cleanup: cleanup };
      }
      return { promise: new Promise(function () { }), cleanup: cleanup };
    }

    if (trigger.type === "device_is") {
      var device = trigger.params.device || "desktop";
      var isMatch = getDevice() === device;
      debugLog("device_is check", { popupId: popupId, device: device, matched: isMatch });
      if (isMatch) {
        state.debugInfo.lastTrigger = "device_is";
        return { promise: Promise.resolve(), cleanup: cleanup };
      }
      return { promise: new Promise(function () { }), cleanup: cleanup };
    }

    if (trigger.type === "custom_event") {
      var resolveCustom;
      var promiseCustom = new Promise(function (res) {
        resolveCustom = res;
      });
      var name = trigger.params.name;
      if (!name) {
        debugLog("invalid custom_event missing name", { popupId: popupId });
        return { promise: new Promise(function () { }), cleanup: cleanup };
      }
      var handler = function (event) {
        state.debugInfo.lastTrigger = "custom_event";
        debugLog("fired custom_event", { popupId: popupId, name: name, detail: event.detail });
        resolveCustom();
      };
      window.addEventListener(name, handler);
      window.addEventListener("pb:" + name, handler);
      cleanup = function () {
        window.removeEventListener(name, handler);
        window.removeEventListener("pb:" + name, handler);
      };
      debugLog("armed custom_event", { popupId: popupId, name: name });
      return { promise: promiseCustom, cleanup: cleanup };
    }

    if (trigger.type === "smart_exit_intent") {
      var resolveSmart;
      var promiseSmart = new Promise(function (res) {
        resolveSmart = res;
      });
      var sensitivity = trigger.params.sensitivity;
      var scrollVelocityThreshold = trigger.params.scrollVelocityThreshold;
      var topScrollThreshold = trigger.params.topScrollThreshold;
      var device = getDevice();
      var fired = false;

      // Initialize debug state
      state.debugInfo.smartExitIntentState = {
        armed: true,
        lastScrollVelocity: 0,
        scrollDirection: null,
        reason: null,
      };

      var fireTrigger = function (reason) {
        if (fired) return;
        fired = true;
        state.debugInfo.lastTrigger = "smart_exit_intent";
        state.debugInfo.smartExitIntentState.reason = reason;
        debugLog("fired smart_exit_intent", { popupId: popupId, reason: reason, device: device });
        resolveSmart();
      };

      if (device === "desktop") {
        // Desktop: mouseout detection
        var onMouseOut = function (event) {
          if (event.clientY <= sensitivity) {
            fireTrigger("desktop_mouseout");
          }
        };
        document.addEventListener("mouseout", onMouseOut);
        cleanup = function () {
          document.removeEventListener("mouseout", onMouseOut);
        };
        debugLog("armed smart_exit_intent (desktop)", { popupId: popupId, sensitivity: sensitivity });
      } else {
        // Mobile: scroll velocity + visibilitychange detection
        var lastScrollY = window.scrollY;
        var lastScrollTime = Date.now();
        var debounceTimeout = null;

        var onScroll = function () {
          var now = Date.now();
          var currentScrollY = window.scrollY;
          var timeDelta = now - lastScrollTime;
          var scrollDelta = currentScrollY - lastScrollY;

          if (timeDelta > 0) {
            var velocity = Math.abs(scrollDelta / timeDelta) * 1000; // px/sec
            var direction = scrollDelta < 0 ? "up" : "down";

            state.debugInfo.smartExitIntentState.lastScrollVelocity = Math.round(velocity);
            state.debugInfo.smartExitIntentState.scrollDirection = direction;

            // Check for fast upward scroll near top
            if (
              direction === "up" &&
              velocity >= scrollVelocityThreshold &&
              currentScrollY <= topScrollThreshold
            ) {
              clearTimeout(debounceTimeout);
              debounceTimeout = setTimeout(function () {
                fireTrigger("mobile_fast_scroll_up");
              }, 300);
            }
          }

          lastScrollY = currentScrollY;
          lastScrollTime = now;
        };

        var onVisibilityChange = function () {
          if (document.hidden && window.scrollY <= topScrollThreshold) {
            var activeElement = document.activeElement;
            var isFormField =
              activeElement &&
              (activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.tagName === "SELECT");

            if (!isFormField) {
              clearTimeout(debounceTimeout);
              debounceTimeout = setTimeout(function () {
                fireTrigger("mobile_visibility_change");
              }, 300);
            }
          }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        document.addEventListener("visibilitychange", onVisibilityChange);

        cleanup = function () {
          clearTimeout(debounceTimeout);
          window.removeEventListener("scroll", onScroll);
          document.removeEventListener("visibilitychange", onVisibilityChange);
        };

        debugLog("armed smart_exit_intent (mobile)", {
          popupId: popupId,
          scrollVelocityThreshold: scrollVelocityThreshold,
          topScrollThreshold: topScrollThreshold,
        });
      }

      return { promise: promiseSmart, cleanup: cleanup };
    }

    return { promise: new Promise(function () { }), cleanup: cleanup };
  }

  function runTriggers(triggers, mode, popupId) {
    if (!triggers || !triggers.length) {
      debugLog("no triggers configured", { popupId: popupId });
      return Promise.resolve();
    }

    var normalized = triggers
      .map(normalizeTrigger)
      .filter(function (trigger) {
        return trigger;
      });

    if (!normalized.length) {
      debugLog("no valid triggers", { popupId: popupId });
      return Promise.resolve();
    }

    debugLog("trigger config", { popupId: popupId, mode: mode, triggers: normalized });

    if (mode === "all") {
      var allHandlers = normalized.map(function (trigger) {
        return createTriggerPromise(trigger, popupId);
      });
      return Promise.all(
        allHandlers.map(function (handler) {
          return handler.promise;
        })
      ).then(function () {
        allHandlers.forEach(function (handler) {
          handler.cleanup();
        });
      });
    }

    return new Promise(function (resolve) {
      var fired = false;
      var handlers = normalized.map(function (trigger) {
        return createTriggerPromise(trigger, popupId);
      });
      handlers.forEach(function (handler) {
        handler.promise.then(function () {
          if (fired) return;
          fired = true;
          handlers.forEach(function (item) {
            item.cleanup();
          });
          resolve();
        });
      });
    });
  }

  function matchesTargeting(targeting) {
    if (!targeting || !targeting.length) return true;
    return targeting.every(function (rule) {
      switch (rule.type) {
        case "device_is":
          return rule.device === getDevice();
        case "url_contains":
          return window.location.href.indexOf(rule.value) !== -1;
        case "referrer_contains":
          return document.referrer.indexOf(rule.value) !== -1;
        case "vip_level_is":
          return state.userContext.vipLevel === rule.value;
        case "balance_lt":
          return Number(state.userContext.balance || 0) < Number(rule.amount);
        case "new_vs_returning":
          return (state.userContext.userType || "new") === rule.value;
        case "sessions_count":
          return Number(state.userContext.sessionsCount || 0) >= Number(rule.count);
        default:
          return true;
      }
    });
  }

  function getFrequencyKey(popupId, versionId, perCampaign) {
    return perCampaign ? "pb_freq_" + popupId + "_" + versionId : "pb_freq_" + popupId;
  }

  function checkFrequency(popup, frequency) {
    if (!frequency) return { allowed: true, reason: null };
    var key = getFrequencyKey(popup.popupId, popup.versionId, frequency.perCampaign);
    var data = {};
    try {
      data = JSON.parse(localStorage.getItem(key) || "{}");
    } catch { }

    var now = Date.now();
    if (frequency.showOnce && data.shown) {
      return { allowed: false, reason: "showOnce" };
    }

    if (frequency.maxPer24h && data.lastShown) {
      var since = now - data.lastShown;
      if (since < 24 * 60 * 60 * 1000 && data.shown24h >= frequency.maxPer24h) {
        return { allowed: false, reason: "maxPer24h" };
      }
    }

    if (frequency.cooldownAfterCloseHours && data.lastClosed) {
      var cooldown = frequency.cooldownAfterCloseHours * 60 * 60 * 1000;
      if (now - data.lastClosed < cooldown) {
        return { allowed: false, reason: "cooldown" };
      }
    }

    if (frequency.maxPerSession) {
      var sessionKey = key + "_session";
      var sessionCount = Number(sessionStorage.getItem(sessionKey) || "0");
      if (sessionCount >= frequency.maxPerSession) {
        return { allowed: false, reason: "maxPerSession" };
      }
    }

    return { allowed: true, reason: null };
  }

  function markShown(popup, frequency) {
    if (!frequency) return;
    var key = getFrequencyKey(popup.popupId, popup.versionId, frequency.perCampaign);
    var now = Date.now();
    var data = {};
    try {
      data = JSON.parse(localStorage.getItem(key) || "{}");
    } catch { }
    data.shown = (data.shown || 0) + 1;
    data.lastShown = now;
    var dayKey = new Date().toISOString().slice(0, 10);
    if (data.lastDay !== dayKey) {
      data.lastDay = dayKey;
      data.shown24h = 1;
    } else {
      data.shown24h = (data.shown24h || 0) + 1;
    }
    localStorage.setItem(key, JSON.stringify(data));

    if (frequency.maxPerSession) {
      var sessionKey = key + "_session";
      var sessionCount = Number(sessionStorage.getItem(sessionKey) || "0");
      sessionStorage.setItem(sessionKey, String(sessionCount + 1));
    }
  }

  function markClosed(popup, frequency) {
    if (!frequency) return;
    var key = getFrequencyKey(popup.popupId, popup.versionId, frequency.perCampaign);
    var data = {};
    try {
      data = JSON.parse(localStorage.getItem(key) || "{}");
    } catch { }
    data.lastClosed = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
  }

  function pushEventToDataLayer(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(
      Object.assign({ event: eventName, popupId: payload.popupId }, payload)
    );
  }

  function sendEvent(popup, type, data) {
    var payload = {
      siteId: state.siteId,
      popupId: popup.popupId,
      popupVersion: popup.versionId || popup.version || 1,
      eventType: type,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      deviceType: getDevice(),
      triggerType: state.debugInfo.lastTrigger || "unknown",
    };
    // Merge additional data
    Object.assign(payload, data || {});

    postJson(buildApiUrl("/api/v1/event"), payload);
    pushEventToDataLayer("pb_" + type, payload);
  }

  function renderPopup(popup) {
    if (document.getElementById("pb-root")) {
      debugLog("block renderPopup: already exists", { popupId: popup.popupId });
      return;
    }
    var schema = popup.schema;
    var host = document.createElement("div");
    host.id = "pb-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var layout = schema.template.layout || {};
    var device = getDevice();
    var maxWidth = device === "mobile" ? (layout.maxWidthMobile || 340) : (layout.maxWidthDesktop || 420);
    var padding = device === "mobile" ? (layout.paddingMobile || 16) : (layout.paddingDesktop || 24);

    var shadowStyle = "0 20px 60px rgba(0,0,0,0.35)";
    if (layout.shadow === "none") shadowStyle = "none";
    else if (layout.shadow === "soft") shadowStyle = "0 4px 12px rgba(0,0,0,0.1)";
    else if (layout.shadow === "strong") shadowStyle = "0 25px 80px rgba(0,0,0,0.5)";

    var borderStyle = "none";
    if (layout.borderEnabled) {
      borderStyle = (layout.borderWidth || 1) + "px solid " + (layout.borderColor || "#ffffff");
    }

    var wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<style>' +
      "* { box-sizing: border-box; }" +
      ".pb-overlay{position:fixed;inset:0;background:" +
      (layout.overlayColor || "rgba(0,0,0,0.6)") +
      ";" +
      (layout.overlayBlur ? "backdrop-filter:blur(" + layout.overlayBlur + "px);" : "") +
      "display:flex;align-items:center;justify-content:center;z-index:2147483647;}" +
      ".pb-modal{font-family:Inter,system-ui,sans-serif;max-width:" +
      maxWidth +
      "px;padding:" +
      padding +
      "px;border-radius:" +
      (layout.borderRadius || 16) +
      "px;background:" +
      (layout.backgroundColor || "#0f172a") +
      ";color:white;box-shadow:" +
      shadowStyle +
      ";border:" +
      borderStyle +
      ";}" +
      ".pb-close{position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);color:white;border:0;cursor:pointer;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;}" +
      ".pb-close-card{right:12px;top:12px;}" +
      ".pb-close-screen{right:16px;top:max(16px,env(safe-area-inset-top));}" +
      ".pb-stack{display:flex;flex-direction:column;gap:16px;}" +
      ".pb-button{display:block;text-align:center;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600;border:none;}" +
      "</style>" +
      '<div class="pb-overlay">' +
      '<div class="pb-modal"><div class="pb-stack"></div></div>' +
      "</div>";

    shadow.appendChild(wrapper);
    var overlay = wrapper.querySelector(".pb-overlay");
    var modal = shadow.querySelector(".pb-modal");

    var position = layout.position || "center";
    if (position === "top-left") {
      overlay.style.alignItems = "flex-start";
      overlay.style.justifyContent = "flex-start";
      modal.style.margin = "32px";
    } else if (position === "top-center") {
      overlay.style.alignItems = "flex-start";
      overlay.style.justifyContent = "center";
      modal.style.marginTop = "32px";
    } else if (position === "top-right") {
      overlay.style.alignItems = "flex-start";
      overlay.style.justifyContent = "flex-end";
      modal.style.margin = "32px";
    } else if (position === "bottom-left") {
      overlay.style.alignItems = "flex-end";
      overlay.style.justifyContent = "flex-start";
      modal.style.margin = "32px";
    } else if (position === "bottom-center" || position === "bottom") {
      overlay.style.alignItems = "flex-end";
      overlay.style.justifyContent = "center";
      modal.style.marginBottom = "32px";
    } else if (position === "bottom-right") {
      overlay.style.alignItems = "flex-end";
      overlay.style.justifyContent = "flex-end";
      modal.style.margin = "32px";
    } else if (position === "side") {
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "flex-end";
      modal.style.marginRight = "32px";
    }

    // Close button
    if (layout.showClose !== false) {
      var closeBtn = document.createElement("button");
      var placement = layout.closeButtonPlacement || "card";
      closeBtn.className = "pb-close pb-close-" + placement;
      closeBtn.innerText = "×";
      closeBtn.setAttribute("aria-label", "Close popup");
      closeBtn.addEventListener("click", function () {
        markClosed(popup, schema.frequency);
        sendEvent(popup, "close", { closeMethod: "button" });
        host.remove();
      });

      if (placement === "card") {
        modal.appendChild(closeBtn);
      } else {
        overlay.appendChild(closeBtn);
      }
    }

    // Overlay click to close
    var overlayClickToClose = layout.overlayClickToClose !== false;
    if (overlayClickToClose) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          markClosed(popup, schema.frequency);
          sendEvent(popup, "close", { closeMethod: "overlay" });
          host.remove();
        }
      });
    }

    var stack = shadow.querySelector(".pb-stack");
    schema.blocks.forEach(function (block) {
      if (block.type === "headline") {
        var h = document.createElement("h2");
        h.textContent = block.props.text || "Headline";
        h.style.margin = "0";
        h.style.fontSize = "24px";
        h.style.fontWeight = "600";
        h.style.textAlign = block.props.align || "left";
        h.style.color = block.props.color || "#ffffff";
        stack.appendChild(h);
      }
      if (block.type === "text") {
        var p = document.createElement("p");
        p.textContent = block.props.text || "";
        p.style.margin = "0";
        p.style.fontSize = "14px";
        p.style.lineHeight = "20px";
        p.style.textAlign = block.props.align || "left";
        p.style.color = block.props.color || "#d1d5db";
        stack.appendChild(p);
      }
      if (block.type === "button") {
        var a = document.createElement("a");
        a.className = "pb-button";
        a.textContent = block.props.label || "Button";
        a.href = block.props.url || "#";
        a.style.background = block.props.backgroundColor || "#7c3aed";
        a.style.color = block.props.textColor || "#ffffff";
        a.style.borderRadius = (block.props.borderRadius || 10) + "px";
        a.style.fontSize = (block.props.fontSize || 16) + "px";
        a.style.width = block.props.fullWidth ? "100%" : "auto";
        a.style.display = block.props.fullWidth ? "block" : "inline-block";
        if (block.props.borderEnabled) {
          a.style.border = (block.props.borderWidth || 1) + "px solid " + (block.props.borderColor || "#ffffff");
        }
        a.addEventListener("click", function () {
          sendEvent(popup, "click", {
            buttonLabel: block.props.label || "Button",
            buttonUrl: a.href
          });
        });
        stack.appendChild(a);
      }
      if (block.type === "image") {
        if (block.props.src) {
          var img = document.createElement("img");
          img.src = block.props.src;
          img.alt = block.props.alt || "Popup image";
          img.style.width = (block.props.width || 100) + "%";
          img.style.borderRadius = (block.props.borderRadius || 12) + "px";
          stack.appendChild(img);
        }
      }
      if (block.type === "spacer") {
        var spacer = document.createElement("div");
        spacer.style.height = (block.props.height || 16) + "px";
        stack.appendChild(spacer);
      }
    });

    markShown(popup, schema.frequency);

    // Send impression event (once per render)
    sendEvent(popup, "impression", {});
  }

  function setupTriggers(popup) {
    var schema = popup.schema;
    var triggers = schema.triggers || [];
    if (!triggers.length) {
      renderPopup(popup);
      return;
    }
    var mode = schema.triggersMode || schema.triggerMode || "any";
    runTriggers(triggers, mode === "all" ? "all" : "any", popup.popupId).then(function () {
      renderDebugHud();
      renderPopup(popup);
    });
  }

  function handleBoot(data) {
    if (!data) return;
    bootCache = data;
    var popups = data.popups || [];
    var ids = popups.map(function (popup) {
      return popup.id;
    });
    console.log(
      "[PB] boot loaded",
      "siteId:",
      data.siteId,
      "popups:",
      popups.length,
      "ids:",
      ids
    );
    state.debugInfo.popupsCount = popups.length;
    renderDebugHud();

    popups.forEach(function (popup) {
      var schema = popup.rules || popup.schema || {};
      var resolvedPopup = {
        popupId: popup.id,
        versionId: popup.versionId,
        schema: schema,
      };
      if (!matchesTargeting(schema.targeting || [])) return;
      var frequencyCheck = checkFrequency(resolvedPopup, schema.frequency || {});
      if (!frequencyCheck.allowed) {
        state.debugInfo.popupId = resolvedPopup.popupId;
        state.debugInfo.versionId = resolvedPopup.versionId;
        state.debugInfo.blockedReason = frequencyCheck.reason;
        renderDebugHud();
        return;
      }
      state.debugInfo.popupId = resolvedPopup.popupId;
      state.debugInfo.versionId = resolvedPopup.versionId;
      state.debugInfo.blockedReason = null;
      renderDebugHud();
      setupTriggers(resolvedPopup);
    });
  }

  window.PB = {
    init: function (config) {
      try {
        var siteId = config && config.siteId;
        var apiBaseFromSettings = config && config.apiBase;

        if (!siteId) {
          console.warn("[PB] Missing siteId. Set window.pbSettings.siteId.");
          return;
        }

        state.siteId = siteId;
        state.userContext = (config && config.userContext) || {};
        state.debug = Boolean(config && config.debug);
        state.debugInfo.popupsCount = 0;
        state.debugInfo.popupId = null;
        state.debugInfo.versionId = null;
        state.debugInfo.lastTrigger = null;
        state.debugInfo.blockedReason = null;

        if (bootCache && bootCache.siteId === state.siteId) {
          handleBoot(bootCache);
          return;
        }

        var scriptSrc = "";
        if (document.currentScript && document.currentScript.src) {
          scriptSrc = document.currentScript.src;
        } else {
          var scripts = document.getElementsByTagName("script");
          for (var i = 0; i < scripts.length; i += 1) {
            var src = scripts[i].src || "";
            if (src.indexOf("pb.js") !== -1) {
              scriptSrc = src;
              break;
            }
          }
        }

        var scriptOrigin = "";
        if (scriptSrc) {
          try {
            scriptOrigin = new URL(scriptSrc).origin;
          } catch (e) { }
        }

        // Priority: config.apiBase -> scriptOrigin -> default
        state.apiBase = apiBaseFromSettings || scriptOrigin || "https://popup-builder-blue.vercel.app";
        console.log("[pb] apiBase", state.apiBase, "siteId", siteId);

        var url = buildApiUrl("/api/v1/boot") + "?siteId=" + encodeURIComponent(state.siteId);

        if (state.debug) {
          url += "&_t=" + new Date().getTime();
        }

        getJson(url)
          .then(handleBoot)
          .catch(function () {
            console.warn("[PB] Failed to load boot config.");
          });
      } catch {
        console.warn("[PB] Boot failed.");
      }
    },
    getDebugInfo: function () {
      return state.debugInfo;
    },
    reset: function () {
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log("[PB] Storage cleared. Reloading...");
        window.location.reload();
      } catch (e) {
        console.error("[PB] Failed to clear storage", e);
      }
    },
  };

  window.pbTrack = function (eventName, payload) {
    try {
      window.dispatchEvent(
        new CustomEvent("pb:" + eventName, { detail: payload })
      );
    } catch {
      console.warn("[PB] pbTrack failed.");
    }
  };

  if (window.pbSettings && window.pbSettings.siteId) {
    window.PB.init(window.pbSettings);
  }
})(window);
