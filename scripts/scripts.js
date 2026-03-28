var themeToggle = document.getElementById("theme-toggle");
var root = document.documentElement;
var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
var pwaBanner = document.getElementById("pwa-banner");
var pwaInstallButton = document.getElementById("pwa-install");
var pwaHideButton = document.getElementById("pwa-hide");
var masterPlayToggle = document.getElementById("master-play-toggle");
var masterVolumeSlider = document.getElementById("master-volume");
var masterVolumeValue = document.getElementById("master-volume-value");
var enableTrackPrompt = document.getElementById("enable-track-prompt");
var enableTablaYesButton = document.getElementById("enable-tabla-yes");
var enableTablaNoButton = document.getElementById("enable-tabla-no");
var storageKeys = {
  masterVolume: "openriyaaz-master-volume"
};
var themeOrder = ["auto", "light", "dark"];
var themeIcons = {
  auto: "bi bi-display",
  light: "bi bi-sun-fill",
  dark: "bi bi-moon-stars-fill"
};
var themeLabels = {
  auto: "System",
  light: "Light",
  dark: "Dark"
};
var lastScrollY = window.scrollY;
var hideThreshold = 96;
var accordionList = document.getElementById("accordion-list");
var deferredInstallPrompt = null;
var accordionItems = [
  {
    id: "tabla",
    title: "Tabla",
    description: "",
    contentPath: "./content/content1.html"
  },
  {
    id: "tanpura",
    title: "Tanpura",
    description: "",
    contentPath: "./content/content2.html"
  }
];

function hasAnyEnabledTrack() {
  return document.querySelectorAll(".accordion-switch:checked").length > 0;
}

function setMasterPlayButtonState(isPlaying) {
  if (!(masterPlayToggle instanceof HTMLButtonElement)) {
    return;
  }

  var icon = masterPlayToggle.querySelector("i");
  masterPlayToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
  masterPlayToggle.setAttribute("aria-label", isPlaying ? "Stop" : "Play");
  if (icon) {
    icon.className = isPlaying ? "bi bi-stop-fill" : "bi bi-play-fill";
    icon.setAttribute("aria-hidden", "true");
  }
}

function getTablaToggle() {
  return document.querySelector('.accordion-switch[data-instrument-id="tabla"]');
}

function ensureTablaEnabled() {
  var tablaToggle = getTablaToggle();
  if (!(tablaToggle instanceof HTMLInputElement)) {
    return false;
  }

  if (!tablaToggle.checked) {
    tablaToggle.checked = true;
    tablaToggle.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return true;
}

function promptEnableTablaForPlayback() {
  return new Promise(function (resolve) {
    if (!(enableTrackPrompt instanceof HTMLElement) ||
      !(enableTablaYesButton instanceof HTMLButtonElement) ||
      !(enableTablaNoButton instanceof HTMLButtonElement)) {
      resolve(false);
      return;
    }

    enableTrackPrompt.hidden = false;

    function cleanup(result) {
      enableTrackPrompt.hidden = true;
      enableTablaYesButton.removeEventListener("click", onYes);
      enableTablaNoButton.removeEventListener("click", onNo);
      resolve(result);
    }

    function onYes() {
      cleanup(true);
    }

    function onNo() {
      cleanup(false);
    }

    enableTablaYesButton.addEventListener("click", onYes, { once: true });
    enableTablaNoButton.addEventListener("click", onNo, { once: true });
  });
}

function applyTheme(theme) {
  if (theme === "auto") {
    root.removeAttribute("data-theme");
    return;
  }

  root.setAttribute("data-theme", theme);
}

function getSavedTheme() {
  return localStorage.getItem("theme") || "auto";
}

function syncThemeColor() {
  var metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    return;
  }

  var isDark = root.getAttribute("data-theme") === "dark" ||
    (!root.hasAttribute("data-theme") && mediaQuery.matches);

  metaThemeColor.setAttribute("content", isDark ? "#13171f" : "#ffffff");
}

function handleThemeChange(theme) {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
  renderThemeToggle(theme);
  syncThemeColor();
}

function renderThemeToggle(theme) {
  if (!(themeToggle instanceof HTMLButtonElement)) {
    return;
  }

  var icon = themeToggle.querySelector("i");
  var safeTheme = themeIcons[theme] ? theme : "auto";
  var label = themeLabels[safeTheme];

  themeToggle.setAttribute("data-theme-mode", safeTheme);
  themeToggle.setAttribute("aria-label", "Theme: " + label);
  themeToggle.setAttribute("title", "Theme: " + label);

  if (icon) {
    icon.className = themeIcons[safeTheme];
    icon.setAttribute("aria-hidden", "true");
  }
}

function getNextTheme(theme) {
  var currentIndex = themeOrder.indexOf(theme);
  if (currentIndex === -1) {
    return themeOrder[0];
  }

  return themeOrder[(currentIndex + 1) % themeOrder.length];
}

function syncThemeToggleVisibility() {
  if (!(themeToggle instanceof HTMLButtonElement)) {
    return;
  }

  var currentScrollY = window.scrollY;
  var shouldHide = currentScrollY > hideThreshold && currentScrollY > lastScrollY;
  themeToggle.classList.toggle("is-hidden", shouldHide);
  lastScrollY = currentScrollY;
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function showPwaBanner() {
  if (!(pwaBanner instanceof HTMLElement) || isStandaloneMode()) {
    return;
  }

  pwaBanner.hidden = false;
}

function hidePwaBanner() {
  if (!(pwaBanner instanceof HTMLElement)) {
    return;
  }

  pwaBanner.hidden = true;
}

async function toggleMasterPlaybackState() {
  if (!(masterPlayToggle instanceof HTMLButtonElement)) {
    return;
  }

  var isPlaying = masterPlayToggle.getAttribute("aria-pressed") === "true";

  if (window.TablaModule && window.TablaModule.engine) {
    if (!isPlaying) {
      if (!hasAnyEnabledTrack()) {
        var shouldEnableTabla = await promptEnableTablaForPlayback();
        if (shouldEnableTabla) {
          ensureTablaEnabled();
        }
        if (!hasAnyEnabledTrack()) {
          setMasterPlayButtonState(false);
          return;
        }
      }

      window.TablaModule.engine.play();
      setMasterPlayButtonState(true);
    } else {
      window.TablaModule.engine.stop();
      setMasterPlayButtonState(false);
    }
  }
}

function updateUI() {
  if (window.TablaModule && window.TablaModule.engine) {
    var engine = window.TablaModule.engine;
    var displayCount = document.querySelector(".display-count");
    var displayBolsRow = document.querySelector(".display-bols-row");
    var displayTempoValue = document.querySelector(".display-tempo strong");
    var tablaToggle = getTablaToggle();
    var isTablaEnabled = !(tablaToggle instanceof HTMLInputElement) || tablaToggle.checked;

    if (engine.isPlaying && engine.currentTaal && isTablaEnabled) {
      var beat = engine.getCurrentBeat();
      var i = beat;

      if (displayCount) {
        displayCount.textContent = beat;
      }

      if (displayBolsRow) {
        displayBolsRow.replaceChildren();
        var bols = engine.currentTaal.bols;
        var total = bols.length;
        var leftIndex = (i - 2 + total) % total;
        var centerIndex = (i - 1 + total) % total;
        var rightIndex = i % total;
        var indexes = [leftIndex, centerIndex, rightIndex];

        indexes.forEach(function (index, position) {
          var span = document.createElement("span");
          span.textContent = bols[index];
          if (position === 1) {
            span.style.fontWeight = "bold";
            span.style.color = "var(--h2-color)";
          }
          displayBolsRow.appendChild(span);
        });
      }
    } else {
      if (displayCount) {
        displayCount.textContent = "0";
      }

      if (displayBolsRow) {
        displayBolsRow.replaceChildren();
        ["prev", "bol", "next"].forEach(function (text, position) {
          var span = document.createElement("span");
          span.textContent = text;
          if (position === 1) {
            span.style.fontWeight = "bold";
            span.style.color = "var(--h2-color)";
          }
          displayBolsRow.appendChild(span);
        });
      }
    }

    if (displayTempoValue && engine.targetBpm) {
      displayTempoValue.textContent = engine.targetBpm;
    }
  }
  requestAnimationFrame(updateUI);
}

function initializeMasterVolumeControl() {
  if (!(masterVolumeSlider instanceof HTMLInputElement)) {
    return;
  }

  var min = Number(masterVolumeSlider.min || 0);
  var max = Number(masterVolumeSlider.max || 100);
  var fallbackValue = Number(masterVolumeSlider.value || min);
  var savedValue = window.UIUtils.getStoredNumber(storageKeys.masterVolume, fallbackValue, min, max);

  masterVolumeSlider.value = String(savedValue);
  window.UIUtils.updateRangeFill(masterVolumeSlider);

  if (masterVolumeValue instanceof HTMLElement) {
    masterVolumeValue.textContent = masterVolumeSlider.value;
  }

  if (masterVolumeSlider.dataset.masterVolumeInitialized === "true") {
    return;
  }

  masterVolumeSlider.addEventListener("input", function () {
    window.UIUtils.updateRangeFill(masterVolumeSlider);
    window.UIUtils.setStoredNumber(storageKeys.masterVolume, Number(masterVolumeSlider.value));
    if (masterVolumeValue instanceof HTMLElement) {
      masterVolumeValue.textContent = masterVolumeSlider.value;
    }
    if (window.TablaModule && window.TablaModule.engine) {
      window.TablaModule.engine.updateVolume();
    }
  });

  masterVolumeSlider.dataset.masterVolumeInitialized = "true";
}

function createAccordionCard(item, htmlContent, index) {
  var article = document.createElement("article");
  article.className = "accordion-card";

  var details = document.createElement("details");
  details.open = index === 0;
  var summary = document.createElement("summary");
  var summaryContent = document.createElement("div");
  summaryContent.className = "summary-content";

  var toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.setAttribute("role", "switch");
  toggle.className = "accordion-switch";
  toggle.setAttribute("aria-label", "Toggle Option");
  toggle.dataset.instrumentId = item.id || "";
  toggle.checked = index === 0;
  toggle.addEventListener("click", function (event) {
    event.stopPropagation();
  });
  toggle.addEventListener("change", function () {
    if (!hasAnyEnabledTrack() && window.TablaModule && window.TablaModule.engine) {
      window.TablaModule.engine.stop();
      setMasterPlayButtonState(false);
    } else if (window.TablaModule && window.TablaModule.engine) {
      window.TablaModule.engine.updateVolume();
    }

    if (window.TablaModule && typeof window.TablaModule.syncTablaVolumeControlState === "function") {
      window.TablaModule.syncTablaVolumeControlState(accordionList);
    }
  });

  var headerText = document.createElement("div");
  headerText.className = "accordion-header-text";

  var title = document.createElement("strong");
  title.textContent = item.title;

  var description = document.createElement("small");
  description.className = "accordion-description";
  description.textContent = item.description;

  var content = document.createElement("div");
  content.className = "accordion-content";
  content.innerHTML = htmlContent;

  headerText.appendChild(title);
  headerText.appendChild(description);
  summaryContent.appendChild(toggle);
  summaryContent.appendChild(headerText);
  summary.appendChild(summaryContent);
  details.appendChild(summary);
  details.appendChild(content);
  article.appendChild(details);

  return article;
}

function fetchAccordionContent(item) {
  return fetch(item.contentPath)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load " + item.contentPath);
      }
      return response.text();
    })
    .catch(function () {
      return "<p>Content not found.</p>";
    });
}

function renderAccordions() {
  if (!(accordionList instanceof HTMLElement)) {
    return Promise.resolve();
  }

  accordionList.replaceChildren();

  return Promise.all(accordionItems.map(fetchAccordionContent)).then(function (contents) {
    contents.forEach(function (htmlContent, index) {
      var card = createAccordionCard(accordionItems[index], htmlContent, index);
      accordionList.appendChild(card);
    });

    if (window.TablaModule && typeof window.TablaModule.init === "function") {
      window.TablaModule.init(accordionList);
    }
  });
}

var savedTheme = getSavedTheme();
applyTheme(savedTheme);
renderThemeToggle(savedTheme);
syncThemeColor();
initializeMasterVolumeControl();
renderAccordions().then(function () {
  requestAnimationFrame(updateUI);
});

if (themeToggle instanceof HTMLButtonElement) {
  themeToggle.addEventListener("click", function () {
    handleThemeChange(getNextTheme(getSavedTheme()));
  });
}

if (masterPlayToggle instanceof HTMLButtonElement) {
  masterPlayToggle.addEventListener("click", toggleMasterPlaybackState);
}

window.addEventListener("scroll", syncThemeToggleVisibility, { passive: true });
syncThemeToggleVisibility();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function (error) {
      console.error("Service worker registration failed:", error);
    });
  });
}

if (!isStandaloneMode()) {
  showPwaBanner();
}

window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  showPwaBanner();
});

window.addEventListener("appinstalled", function () {
  deferredInstallPrompt = null;
  hidePwaBanner();
});

if (pwaInstallButton instanceof HTMLButtonElement) {
  pwaInstallButton.addEventListener("click", function () {
    if (!deferredInstallPrompt) {
      window.alert("App can't be installed seamlessly right now. Your browser might require you to use 'Add to Home Screen' from the menu.");
      return;
    }

    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function (choice) {
      if (choice.outcome === "accepted") {
        hidePwaBanner();
      }
      deferredInstallPrompt = null;
    });
  });
}

if (pwaHideButton instanceof HTMLButtonElement) {
  pwaHideButton.addEventListener("click", function () {
    hidePwaBanner();
  });
}

if (typeof mediaQuery.addEventListener === "function") {
  mediaQuery.addEventListener("change", function () {
    if (getSavedTheme() === "auto") {
      syncThemeColor();
    }
  });
} else if (typeof mediaQuery.addListener === "function") {
  mediaQuery.addListener(function () {
    if (getSavedTheme() === "auto") {
      syncThemeColor();
    }
  });
}
