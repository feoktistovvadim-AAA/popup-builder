(function (window) {
  if (window.PB) return;

  var state = {
    siteId: null,
    userContext: {},
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

  function canShowByFrequency(popup, frequency) {
    if (!frequency) return true;
    var key = getFrequencyKey(popup.popupId, popup.versionId, frequency.perCampaign);
    var data = {};
    try {
      data = JSON.parse(localStorage.getItem(key) || "{}");
    } catch {}

    var now = Date.now();
    if (frequency.showOnce && data.shown) return false;

    if (frequency.maxPer24h && data.lastShown) {
      var since = now - data.lastShown;
      if (since < 24 * 60 * 60 * 1000 && data.shown24h >= frequency.maxPer24h) {
        return false;
      }
    }

    if (frequency.cooldownAfterCloseHours && data.lastClosed) {
      var cooldown = frequency.cooldownAfterCloseHours * 60 * 60 * 1000;
      if (now - data.lastClosed < cooldown) return false;
    }

    if (frequency.maxPerSession) {
      var sessionKey = key + "_session";
      var sessionCount = Number(sessionStorage.getItem(sessionKey) || "0");
      if (sessionCount >= frequency.maxPerSession) return false;
    }

    return true;
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

    triggers.forEach(function (trigger) {
      if (trigger.type === "after_seconds") {
        setTimeout(function () {
          renderPopup(popup);
        }, trigger.seconds * 1000);
      }

      if (trigger.type === "scroll_percent") {
        var onScroll = function () {
          var scrolled =
            (window.scrollY /
              (document.documentElement.scrollHeight - window.innerHeight)) *
            100;
          if (scrolled >= trigger.percent) {
            window.removeEventListener("scroll", onScroll);
            renderPopup(popup);
          }
        };
        window.addEventListener("scroll", onScroll);
      }

      if (trigger.type === "exit_intent_desktop") {
        var onMouseOut = function (event) {
          if (event.clientY <= 0) {
            document.removeEventListener("mouseout", onMouseOut);
            renderPopup(popup);
          }
        };
        document.addEventListener("mouseout", onMouseOut);
      }

      if (trigger.type === "custom_event") {
        window.addEventListener(trigger.eventName, function () {
          renderPopup(popup);
        });
      }
    });
  }

  function handleDecision(data) {
    if (!data || !data.popups) return;
    data.popups.forEach(function (popup) {
      var schema = popup.schema || {};
      if (!matchesTargeting(schema.targeting || [])) return;
      if (!canShowByFrequency(popup, schema.frequency || {})) return;
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
  }

  window.PB = {
    init: function (config) {
      if (!config || !config.siteId) {
        console.warn("[PB] Missing siteId. Set window.pbSettings.siteId.");
        return;
      }
      state.siteId = config.siteId;
      state.userContext = config.userContext || {};

      if (bootCache && bootCache.siteId === state.siteId) {
        handleBoot(bootCache);
        return;
      }

      var url = "/api/v1/boot?siteId=" + encodeURIComponent(state.siteId);
      getJson(url)
        .then(handleBoot)
        .catch(function () {
          console.warn("[PB] Failed to load boot config.");
        });
    },
  };

  if (window.pbSettings && window.pbSettings.siteId) {
    window.PB.init(window.pbSettings);
  }
})(window);
