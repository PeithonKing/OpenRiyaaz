var tablaTaals = [];
var tablaTaalsLoadPromise = null;
var tablaStorageKeys = {
  tablaVolume: "openriyaaz-tabla-volume",
  tablaBpm: "openriyaaz-tabla-bpm",
  tablaTaalId: "openriyaaz-tabla-taal-id"
};
var tablaRootScope = document;

function Taal(config) {
  this.id = config.id;
  this.name = config.name;
  this.beats = config.beats;
  this.audioSrc = config.audioSrc;
  this.bpm = config.bpm;
  this.bols = Array.isArray(config.bols) ? config.bols.slice() : [];
  this.partition = Array.isArray(config.partition) ? config.partition.slice() : [];
}

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
    var selectedOption = taalSelect.options[taalSelect.selectedIndex];
    if (selectedOption && selectedOption.textContent) {
      taalName = selectedOption.textContent.trim();
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
      option.textContent = taal.name;
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
    }

    if (select.dataset.taalInitialized !== "true") {
      select.addEventListener("change", function () {
        localStorage.setItem(tablaStorageKeys.tablaTaalId, select.value);
        updateTablaSummaryDescription();
      });
      select.dataset.taalInitialized = "true";
    }

    updateTablaSummaryDescription();
  });
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
  });

  slider.dataset.tablaVolumeInitialized = "true";
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
    var typedValue = Number(controls.input.value);
    if (Number.isFinite(typedValue)) {
      setTablaBpmValue(controls, typedValue);
    }
  });

  controls.input.addEventListener("blur", function () {
    setTablaBpmValue(controls, Number(controls.input.value || controls.slider.value));
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
  updateTablaSummaryDescription();
}

function getTaals() {
  return tablaTaals.slice();
}

window.TablaModule = {
  init: initTabla,
  loadTaals: loadTaals,
  getTaals: getTaals
};
