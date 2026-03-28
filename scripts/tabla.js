var tablaTaals = [];
var tablaTaalsLoadPromise = null;
var tablaStorageKeys = {
  tablaVolume: "openriyaaz-tabla-volume",
  tablaBpm: "openriyaaz-tabla-bpm",
  tablaTaalId: "openriyaaz-tabla-taal-id"
};
var tablaRootScope = document;

class Taal {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.beats = config.beats;
    this.audioSrc = config.audioSrc;
    this.originalBpm = config.bpm;
    this.bols = Array.isArray(config.bols) ? config.bols.slice() : [];
    this.partition = Array.isArray(config.partition) ? config.partition.slice() : [];
  }

  getCycleDuration(targetBpm) {
    if (!targetBpm || targetBpm <= 0) return 0;
    return (this.beats * 60) / targetBpm;
  }

  getPlaybackRate(targetBpm) {
    if (!this.originalBpm || !targetBpm) return 1;
    return targetBpm / this.originalBpm;
  }
}

var TablaEngine = {
  audio: new Audio(),
  isPlaying: false,
  currentTaal: null,
  targetBpm: 60,
  loopTimeout: null,
  startTime: 0,

  init: function() {
    this.audio.preload = "auto";
    this.audio.preservesPitch = true;
    
    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.stop();
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("stop", () => this.stop());
    }
  },

  setTaal: function(taalId) {
    const taal = tablaTaals.find(t => t.id === taalId);
    if (!taal) return;
    
    const wasPlaying = this.isPlaying;
    this.stop();
    
    this.currentTaal = taal;
    this.audio.src = taal.audioSrc;
    this.audio.load();
    
    if (wasPlaying) this.play();
    this.updateMediaMetadata();
  },

  setBpm: function(bpm) {
    var nextBpm = Number(bpm);
    if (!Number.isFinite(nextBpm) || nextBpm <= 0) {
      return;
    }

    if (this.isPlaying && this.currentTaal) {
      var now = performance.now();
      var previousCycleDuration = this.currentTaal.getCycleDuration(this.targetBpm);
      var cycleProgress = 0;

      if (previousCycleDuration > 0) {
        var elapsedSeconds = (now - this.startTime) / 1000;
        cycleProgress = (elapsedSeconds % previousCycleDuration) / previousCycleDuration;
      }

      this.targetBpm = nextBpm;

      var nextCycleDuration = this.currentTaal.getCycleDuration(this.targetBpm);
      if (nextCycleDuration > 0) {
        this.startTime = now - (cycleProgress * nextCycleDuration * 1000);
      } else {
        this.startTime = now;
      }

      this.audio.playbackRate = this.currentTaal.getPlaybackRate(this.targetBpm);
      this.scheduleNextLoop();
    } else {
      this.targetBpm = nextBpm;
    }

    this.updateMediaMetadata();
  },

  updateVolume: function() {
    const masterVol = window.UIUtils.getStoredNumber("openriyaaz-master-volume", 100, 0, 100);
    const tablaVol = window.UIUtils.getStoredNumber(tablaStorageKeys.tablaVolume, 100, 0, 100);
    var tablaToggle = document.querySelector('.accordion-switch[data-instrument-id="tabla"]');
    var isTablaEnabled = !(tablaToggle instanceof HTMLInputElement) || tablaToggle.checked;
    var enabledFactor = isTablaEnabled ? 1 : 0;
    this.audio.volume = (masterVol / 100) * (tablaVol / 100) * enabledFactor;
  },

  play: function() {
    if (!this.currentTaal) return;
    this.isPlaying = true;
    this.updateVolume();
    this.startLoop();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  },

  pause: function() {
    this.isPlaying = false;
    this.audio.pause();
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  },

  stop: function() {
    this.pause();
    this.audio.currentTime = 0;
  },

  startLoop: function() {
    if (!this.isPlaying || !this.currentTaal) return;

    const playbackRate = this.currentTaal.getPlaybackRate(this.targetBpm);
    this.audio.playbackRate = playbackRate;
    this.audio.currentTime = 0;
    
    this.startTime = performance.now();
    
    this.audio.play().catch(err => {
      console.error("Playback failed:", err);
      this.isPlaying = false;
    });

    this.scheduleNextLoop();
  },

  scheduleNextLoop: function() {
    if (this.loopTimeout) clearTimeout(this.loopTimeout);
    
    const cycleDurationMs = this.currentTaal.getCycleDuration(this.targetBpm) * 1000;
    const elapsed = performance.now() - this.startTime;
    const remaining = Math.max(0, cycleDurationMs - elapsed);

    this.loopTimeout = setTimeout(() => {
      this.startLoop();
    }, remaining);
  },

  updateMediaMetadata: function() {
    if (!("mediaSession" in navigator) || !this.currentTaal) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentTaal.name,
      artist: "OpenRiyaaz",
      album: "Tabla Practice",
      artwork: [
        { src: "./assets/icons/icons/manifest-icon-192.maskable.png", sizes: "192x192", type: "image/png" },
        { src: "./assets/icons/icons/manifest-icon-512.maskable.png", sizes: "512x512", type: "image/png" }
      ]
    });
  },

  getCurrentBeat: function() {
    if (!this.isPlaying || !this.currentTaal) return 1;
    
    const cycleDuration = this.currentTaal.getCycleDuration(this.targetBpm);
    const elapsedSeconds = (performance.now() - this.startTime) / 1000;
    const progress = (elapsedSeconds % cycleDuration) / cycleDuration;
    
    return Math.floor(progress * this.currentTaal.beats) + 1;
  }
};

TablaEngine.init();

function validateTaalConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid taal config: expected an object.");
  }

  if (!config.id || !config.name || !config.audioSrc) {
    throw new Error("Invalid taal config: id, name, and audioSrc are required.");
  }

  if (!Array.isArray(config.bols) || !Array.isArray(config.partition)) {
    throw new Error("Invalid taal config: bols and partition must be arrays.");
  }

  var partitionSum = config.partition.reduce(function (sum, part) {
    return sum + Number(part || 0);
  }, 0);

  if (partitionSum !== config.bols.length) {
    throw new Error("Invalid taal config for " + config.id + ": partition sum must match bols length.");
  }

  if (Number(config.beats) !== config.bols.length) {
    throw new Error("Invalid taal config for " + config.id + ": beats must match bols length.");
  }
}

function createTaalInstances(configs) {
  return configs.map(function (config) {
    validateTaalConfig(config);
    return new Taal(config);
  });
}

function loadTaals() {
  if (tablaTaalsLoadPromise) {
    return tablaTaalsLoadPromise;
  }

  tablaTaalsLoadPromise = fetch("./assets/tracks/data.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load taal data.");
      }

      return response.json();
    })
    .then(function (configs) {
      tablaTaals = createTaalInstances(configs);
      return tablaTaals;
    })
    .catch(function (error) {
      console.error("Unable to initialize taals:", error);
      tablaTaals = [];
      return tablaTaals;
    });

  return tablaTaalsLoadPromise;
}

function updateTablaSummaryDescription() {
  var summaryDescription = tablaRootScope.querySelector(".accordion-card .accordion-description");
  var taalSelect = tablaRootScope.querySelector("#tabla-taal");
  var bpmSlider = tablaRootScope.querySelector("#tabla-bpm");
  var volumeSlider = tablaRootScope.querySelector("#tabla-volume");

  if (!(summaryDescription instanceof HTMLElement)) {
    return;
  }

  var taalName = "Tabla";
  if (taalSelect instanceof HTMLSelectElement) {
    var selectedTaalId = taalSelect.value;
    var selectedTaal = tablaTaals.find(function (taal) {
      return taal.id === selectedTaalId;
    });
    if (selectedTaal && selectedTaal.name) {
      taalName = selectedTaal.name;
    }
  }

  var bpm = bpmSlider instanceof HTMLInputElement ? Number(bpmSlider.value || 0) : 0;
  var volume = volumeSlider instanceof HTMLInputElement ? Number(volumeSlider.value || 0) : 0;

  summaryDescription.textContent = taalName + " | " + bpm + " BPM | volume " + volume + "%";
}

function initializeTaalSelect(scope) {
  var rootScope = scope instanceof HTMLElement ? scope : document;
  var select = rootScope.querySelector("#tabla-taal");

  if (!(select instanceof HTMLSelectElement)) {
    return;
  }

  loadTaals().then(function (taals) {
    var storedTaalId = localStorage.getItem(tablaStorageKeys.tablaTaalId);

    select.replaceChildren();

    taals.forEach(function (taal, index) {
      var option = document.createElement("option");
      option.value = taal.id;
      option.textContent = taal.name + " (" + formatPartitionedBols(taal.bols, taal.partition) + ")";
      if (storedTaalId && taal.id === storedTaalId) {
        option.selected = true;
      } else if (!storedTaalId && index === 0) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    if (taals.length === 0) {
      var emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "No taals available";
      select.appendChild(emptyOption);
    }

    if (select.options.length > 0 && select.selectedIndex === -1) {
      select.selectedIndex = 0;
    }

    if (select.value) {
      localStorage.setItem(tablaStorageKeys.tablaTaalId, select.value);
      TablaEngine.setTaal(select.value);
    }

    if (select.dataset.taalInitialized !== "true") {
      select.addEventListener("change", function () {
        localStorage.setItem(tablaStorageKeys.tablaTaalId, select.value);
        TablaEngine.setTaal(select.value);
        updateTablaSummaryDescription();
      });
      select.dataset.taalInitialized = "true";
    }

    updateTablaSummaryDescription();
  });
}

function formatPartitionedBols(bols, partition) {
  if (!Array.isArray(bols) || bols.length === 0) {
    return "";
  }

  if (!Array.isArray(partition) || partition.length === 0) {
    return bols.join("-");
  }

  var normalizedPartition = partition.map(function (part) {
    return Number(part);
  });

  var isValidPartition = normalizedPartition.every(function (part) {
    return Number.isFinite(part) && part > 0;
  });

  if (!isValidPartition) {
    return bols.join("-");
  }

  var partitionSum = normalizedPartition.reduce(function (sum, part) {
    return sum + part;
  }, 0);

  if (partitionSum !== bols.length) {
    return bols.join("-");
  }

  var groups = [];
  var cursor = 0;

  normalizedPartition.forEach(function (size) {
    var nextCursor = cursor + size;
    groups.push(bols.slice(cursor, nextCursor).join("-"));
    cursor = nextCursor;
  });

  return groups.join("/");
}

function initializeTablaVolumeControl(scope) {
  var rootScope = scope instanceof HTMLElement ? scope : document;
  var slider = rootScope.querySelector("#tabla-volume");
  var label = rootScope.querySelector("#tabla-volume-value");

  if (!(slider instanceof HTMLInputElement)) {
    return;
  }

  var min = Number(slider.min || 0);
  var max = Number(slider.max || 100);
  var fallbackValue = Number(slider.value || min);
  var savedValue = window.UIUtils.getStoredNumber(tablaStorageKeys.tablaVolume, fallbackValue, min, max);

  slider.value = String(savedValue);
  window.UIUtils.updateRangeFill(slider);
  if (label instanceof HTMLElement) {
    label.textContent = slider.value;
  }
  updateTablaSummaryDescription();
  TablaEngine.updateVolume();

  if (slider.dataset.tablaVolumeInitialized === "true") {
    return;
  }

  slider.addEventListener("input", function () {
    window.UIUtils.updateRangeFill(slider);
    if (label instanceof HTMLElement) {
      label.textContent = slider.value;
    }
    window.UIUtils.setStoredNumber(tablaStorageKeys.tablaVolume, Number(slider.value));
    updateTablaSummaryDescription();
    TablaEngine.updateVolume();
  });

  slider.dataset.tablaVolumeInitialized = "true";
}

function syncTablaVolumeControlState(scope) {
  var rootScope = scope instanceof HTMLElement ? scope : tablaRootScope;
  var slider = rootScope.querySelector("#tabla-volume");
  var tablaToggle = document.querySelector('.accordion-switch[data-instrument-id="tabla"]');

  if (!(slider instanceof HTMLInputElement)) {
    return;
  }

  var isTablaEnabled = !(tablaToggle instanceof HTMLInputElement) || tablaToggle.checked;
  slider.disabled = !isTablaEnabled;
}

function getTablaBpmElements(scope) {
  var rootScope = scope instanceof HTMLElement ? scope : document;
  var slider = rootScope.querySelector("#tabla-bpm");
  var input = rootScope.querySelector("#tabla-bpm-input");
  var buttons = rootScope.querySelectorAll("[data-bpm-action]");

  if (!(slider instanceof HTMLInputElement) || !(input instanceof HTMLInputElement)) {
    return null;
  }

  return {
    slider: slider,
    input: input,
    buttons: buttons
  };
}

function setTablaBpmValue(controls, nextValue) {
  if (!controls) {
    return;
  }

  var min = Number(controls.slider.min || 30);
  var max = Number(controls.slider.max || 240);
  var clampedValue = window.UIUtils.clampValue(Math.round(nextValue), min, max);

  controls.slider.value = String(clampedValue);
  controls.input.value = String(clampedValue);
  window.UIUtils.updateRangeFill(controls.slider);
  window.UIUtils.setStoredNumber(tablaStorageKeys.tablaBpm, clampedValue);
  updateTablaSummaryDescription();
  TablaEngine.setBpm(clampedValue);
}

function initializeTablaBpmControls(scope) {
  var controls = getTablaBpmElements(scope);
  if (!controls) {
    return;
  }

  var min = Number(controls.slider.min || 30);
  var max = Number(controls.slider.max || 240);
  var fallbackValue = Number(controls.slider.value || min);
  var savedBpm = window.UIUtils.getStoredNumber(tablaStorageKeys.tablaBpm, fallbackValue, min, max);

  setTablaBpmValue(controls, savedBpm);

  if (controls.slider.dataset.bpmInitialized === "true") {
    return;
  }

  controls.slider.addEventListener("input", function () {
    setTablaBpmValue(controls, Number(controls.slider.value));
  });

  controls.input.addEventListener("input", function () {
    updateTablaSummaryDescription();
  });

  function commitBpmInputValue() {
    var rawValue = controls.input.value.trim();
    var parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      parsedValue = Number(controls.slider.value);
    }
    setTablaBpmValue(controls, parsedValue);
  }

  controls.input.addEventListener("blur", commitBpmInputValue);

  controls.input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitBpmInputValue();
      controls.input.blur();
    }
  });

  controls.buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var action = button.dataset.bpmAction || "";
      var currentValue = Number(controls.slider.value);
      var nextValue = currentValue;

      if (action === "+1") {
        nextValue = currentValue + 1;
      } else if (action === "+5") {
        nextValue = currentValue + 5;
      } else if (action === "-1") {
        nextValue = currentValue - 1;
      } else if (action === "-5") {
        nextValue = currentValue - 5;
      } else if (action === "x2") {
        nextValue = currentValue * 2;
      } else if (action === "/2") {
        nextValue = currentValue / 2;
      }

      setTablaBpmValue(controls, nextValue);
    });
  });

  controls.slider.dataset.bpmInitialized = "true";
}

function initTabla(scope) {
  tablaRootScope = scope instanceof HTMLElement ? scope : document;
  initializeTaalSelect(scope);
  initializeTablaVolumeControl(scope);
  initializeTablaBpmControls(scope);
  syncTablaVolumeControlState(scope);
  updateTablaSummaryDescription();
}

function getTaals() {
  return tablaTaals.slice();
}

window.TablaModule = {
  init: initTabla,
  loadTaals: loadTaals,
  getTaals: getTaals,
  engine: TablaEngine,
  syncTablaVolumeControlState: syncTablaVolumeControlState
};
