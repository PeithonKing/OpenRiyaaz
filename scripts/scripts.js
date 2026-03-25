var themeToggle = document.getElementById("theme-toggle");
var root = document.documentElement;
var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
var themeOrder = ["auto", "light", "dark"];
var lastScrollY = window.scrollY;
var hideThreshold = 96;
var accordionList = document.getElementById("accordion-list");
var accordionItems = [
    {
        title: "First Item",
        description: "This is the first accordion item.",
        contentPath: "./content/content1.html"
    },
    {
        title: "Second Item",
        description: "A different description for the second one.",
        contentPath: "./content/content2.html"
    },
    {
        title: "Third Item",
        description: "And the last one has its own description too.",
        contentPath: "./content/content3.html"
    }
];
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

function createAccordionCard(item, htmlContent) {
    var article = document.createElement("article");
    article.className = "accordion-card";

    var details = document.createElement("details");
    var summary = document.createElement("summary");
    var summaryContent = document.createElement("div");
    summaryContent.className = "summary-content";

    var toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.setAttribute("role", "switch");
    toggle.className = "accordion-switch";
    toggle.setAttribute("aria-label", "Toggle Option");
    toggle.addEventListener("click", function (event) {
        event.stopPropagation();
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
        .then(function (htmlContent) {
            return createAccordionCard(item, htmlContent);
        })
        .catch(function () {
            return createAccordionCard(item, "<p>Content not found.</p>");
        });
}

function renderAccordions() {
    if (!(accordionList instanceof HTMLElement)) {
        return Promise.resolve();
    }

    accordionList.replaceChildren();

    return Promise.all(accordionItems.map(fetchAccordionContent)).then(function (cards) {
        cards.forEach(function (card) {
            accordionList.appendChild(card);
        });
    });
}

var savedTheme = getSavedTheme();
applyTheme(savedTheme);
renderThemeToggle(savedTheme);
syncThemeColor();
renderAccordions();

if (themeToggle instanceof HTMLButtonElement) {
    themeToggle.addEventListener("click", function () {
        handleThemeChange(getNextTheme(getSavedTheme()));
    });
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
