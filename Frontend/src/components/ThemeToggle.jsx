import { useEffect, useState } from "react";

const storageKey = "travellex_theme";
const themeChangeEvent = "travellex-theme-change";

function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return localStorage.getItem(storageKey) || document.documentElement.dataset.theme || getSystemTheme();
  } catch {
    return document.documentElement.dataset.theme || getSystemTheme();
  }
}

function applyTheme(theme, persist = false) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;

  if (persist) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Theme still works for this page even when storage is blocked.
    }
  }
}

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function syncTheme(event) {
      setTheme(event.detail?.theme || getInitialTheme());
    }

    function syncStorage(event) {
      if (event.key === storageKey) {
        setTheme(event.newValue || getSystemTheme());
      }
    }

    window.addEventListener(themeChangeEvent, syncTheme);
    window.addEventListener("storage", syncStorage);

    return () => {
      window.removeEventListener(themeChangeEvent, syncTheme);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme, true);
    window.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: { theme: nextTheme } }));
  }

  return (
    <button
      className={compact ? "theme-toggle compact" : "theme-toggle"}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        )}
      </span>
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
