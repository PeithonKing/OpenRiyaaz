window.UIUtils = {
  clampValue: function (value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  getStoredNumber: function (key, fallbackValue, min, max) {
    var storedValue = localStorage.getItem(key);
    if (storedValue === null) {
      return fallbackValue;
    }

    var parsedValue = Number(storedValue);
    if (!Number.isFinite(parsedValue)) {
      return fallbackValue;
    }

    return this.clampValue(parsedValue, min, max);
  },

  setStoredNumber: function (key, value) {
    localStorage.setItem(key, String(value));
  },

  updateRangeFill: function (slider) {
    if (!(slider instanceof HTMLInputElement) || slider.type !== "range") {
      return;
    }

    var min = Number(slider.min || 0);
    var max = Number(slider.max || 100);
    var value = Number(slider.value || min);
    var range = max - min;
    var fillPercent = range <= 0 ? 0 : ((value - min) / range) * 100;

    slider.style.setProperty("--slider-fill-percent", fillPercent + "%");
  }
};
