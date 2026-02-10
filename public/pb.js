(function (window) {
  if (window.PB) return;

  var state = {
    siteId: null,
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
    var cleanup = function () {};

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
        return { promise: new Promise(function () {}), cleanup: cleanup };
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
      return { promise: new Promise(function () {}), cleanup: cleanup };
    }

    if (trigger.type === "url_match") {
      var pattern = trigger.params.pattern || "";
      var matchType = trigger.params.match || "contains";
      if (!pattern) {
        debugLog("invalid url_match missing pattern", { popupId: popupId });
        return { promise: new Promise(function () {}), cleanup: cleanup };
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
        } catch (error) {
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
      return { promise: new Promise(function () {}), cleanup: cleanup };
    }

    if (trigger.type === "device_is") {
      var device = trigger.params.device || "desktop";
      var isMatch = getDevice() === device;
      debugLog("device_is check", { popupId: popupId, device: device, matched: isMatch });
      if (isMatch) {
        state.debugInfo.lastTrigger = "device_is";
        return { promise: Promise.resolve(), cleanup: cleanup };
      }
      return { promise: new Promise(function () {}), cleanup: cleanup };
    }

    if (trigger.type === "custom_event") {
      var resolveCustom;
      var promiseCustom = new Promise(function (res) {
        resolveCustom = res;
      });
      var name = trigger.params.name;
      if (!name) {
        debugLog("invalid custom_event missing name", { popupId: popupId });
        return { promise: new Promise(function () {}), cleanup: cleanup };
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

    return { promise: new Promise(function () {}), cleanup: cleanup };
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
    } catch {}

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
    } catch {}
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
    } catch {}
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
    postJson("/api/v1/event", {
      siteId: state.siteId,
      popupId: popup.popupId,
      type: type,
      data: data || {},
    });
    pushEventToDataLayer("pb_" + type, data || {});
  }

  function renderPopup(popup) {
    var schema = popup.schema;
    var host = document.createElement("div");
    host.id = "pb-root";
    document.body.appendChild(host);
    var shadow = host.attachShadow({ mode: "open" });

    var layout = schema.template.layout || {};
    var wrapper = document.createElement("div");
    wrapper.innerHTML =
      '<style>' +
      ".pb-overlay{position:fixed;inset:0;background:" +
      (layout.overlayColor || "rgba(0,0,0,0.6)") +
      ";display:flex;align-items:center;justify-content:center;z-index:2147483646;}" +
      ".pb-modal{font-family:Inter,system-ui,sans-serif;max-width:" +
      (layout.maxWidth || 420) +
      "px;padding:" +
      (layout.padding || 24) +
      "px;border-radius:" +
      (layout.borderRadius || 16) +
      "px;background:" +
      (layout.backgroundColor || "#0f172a") +
      ";color:white;box-shadow:0 20px 60px rgba(0,0,0,0.35);}" +
      ".pb-close{position:absolute;right:16px;top:16px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.15);color:white;border:0;cursor:pointer;}" +
      ".pb-stack{display:flex;flex-direction:column;gap:16px;}" +
      ".pb-button{display:block;width:100%;text-align:center;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600;}" +
      "</style>" +
      '<div class="pb-overlay">' +
      '<div class="pb-modal"><div class="pb-stack"></div></div>' +
      "</div>";

    shadow.appendChild(wrapper);
    var modal = shadow.querySelector(".pb-modal");
    if (layout.position === "bottom") {
      wrapper.querySelector(".pb-overlay").style.alignItems = "flex-end";
      modal.style.marginBottom = "32px";
    } else if (layout.position === "side") {
      wrapper.querySelector(".pb-overlay").style.justifyContent = "flex-end";
      modal.style.marginRight = "32px";
    }

    if (layout.showClose !== false) {
      var closeBtn = document.createElement("button");
      closeBtn.className = "pb-close";
      closeBtn.innerText = "×";
      closeBtn.addEventListener("click", function () {
        markClosed(popup, schema.frequency);
        sendEvent(popup, "close");
        host.remove();
      });
      modal.appendChild(closeBtn);
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
        a.addEventListener("click", function () {
          sendEvent(popup, "click", { url: a.href });
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
    sendEvent(popup, "impression");
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

  function handleDecision(data) {
    if (!data || !data.popups) return;
    data.popups.forEach(function (popup) {
      var schema = popup.schema || {};
      if (!matchesTargeting(schema.targeting || [])) return;
      var frequencyCheck = checkFrequency(popup, schema.frequency || {});
      if (!frequencyCheck.allowed) {
        state.debugInfo.blockedReason = frequencyCheck.reason;
        renderDebugHud();
        return;
      }
      setupTriggers(popup);
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
          scriptOrigin = new URL(scriptSrc).origin;
        }

        var apiBase = apiBaseFromSettings || scriptOrigin || "";
        console.log("[pb] apiBase", apiBase, "siteId", siteId);

        var url =
          apiBase +
          "/api/v1/boot?siteId=" +
          encodeURIComponent(state.siteId);

        getJson(url)
          .then(handleBoot)
          .catch(function () {
            console.warn("[PB] Failed to load boot config.");
          });
      } catch (error) {
        console.warn("[PB] Boot failed.", error);
      }
    },
  };

  window.pbTrack = function (eventName, payload) {
    try {
      window.dispatchEvent(
        new CustomEvent("pb:" + eventName, { detail: payload })
      );
    } catch (error) {
      console.warn("[PB] pbTrack failed.", error);
    }
  };

  if (window.pbSettings && window.pbSettings.siteId) {
    window.PB.init(window.pbSettings);
  }
})(window);
