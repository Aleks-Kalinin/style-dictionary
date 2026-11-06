"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/Button";

type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "app:themechange";

/**
 * The current theme lives in the DOM (`<html data-theme>`) and in the OS
 * setting, not in React state. `useSyncExternalStore` is the hook for exactly
 * that situation: it subscribes to an outside source and re-renders when it
 * changes, without the cascading render that a setState-inside-useEffect
 * would cause.
 */
function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  media.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  const explicit = document.documentElement.dataset.theme;

  if (explicit === "dark" || explicit === "light") return explicit;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * There is no theme on the server, and guessing would cause a hydration
 * mismatch. Returning null makes the button render empty for one frame.
 */
function getServerSnapshot(): Theme | null {
  return null;
}

/**
 * Demonstrates the payoff of the two-tier token system: this component only
 * sets `data-theme` on <html>. Every colour in the app changes because the
 * semantic tokens are redefined under that selector in tokens.css, and no
 * component CSS mentions a literal colour.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // Private browsing can block storage; the toggle still works per-page.
    }

    // Tells useSyncExternalStore to re-read, since a dataset write fires
    // no event of its own.
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={
        theme ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Switch theme"
      }
    >
      {theme === "dark" ? "Light" : theme === "light" ? "Dark" : ""}
    </Button>
  );
}
