"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Laptop2 } from "lucide-react";

type Theme = "light" | "dark" | "system";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage?.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme: Theme = stored ?? "system";
    setTheme(initialTheme);
    setMounted(true);

    const shouldUseDark =
      initialTheme === "dark" ||
      (initialTheme === "system" && systemPrefersDark);

    updateTheme(shouldUseDark);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        updateTheme(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const updateTheme = (dark: boolean) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", dark);

      // Update <meta name="theme-color">
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", dark ? "#0a0a0a" : "#ffffff");
      } else {
        const m = document.createElement("meta");
        m.name = "theme-color";
        m.content = dark ? "#0a0a0a" : "#ffffff";
        document.head.appendChild(m);
      }
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);

    if (typeof window !== "undefined") {
      window.localStorage?.setItem("theme", newTheme);
    }

    if (newTheme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      updateTheme(systemDark);
    } else {
      updateTheme(newTheme === "dark");
    }
  };

  if (!mounted)
    return <div className="bg-background transition-colors">{children}</div>;

  return (
    <div className="bg-background transition-colors">
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-card/90 dark:bg-card/80 border border-border rounded-2xl p-3 shadow-xl backdrop-blur-sm transition-colors">
          <div className="flex flex-row md:flex-col gap-2">
            <button
              onClick={() => handleThemeChange("light")}
              className={`p-3 rounded-xl transition-all duration-200 hover:bg-muted/80 ${
                theme === "light"
                  ? "bg-muted shadow-sm ring-2 ring-primary/20"
                  : ""
              }`}
              aria-label="Switch to light mode"
              title="Light mode"
            >
              <Sun className="h-5 w-5 text-yellow-500" />
            </button>

            <button
              onClick={() => handleThemeChange("dark")}
              className={`p-3 rounded-xl transition-all duration-200 hover:bg-muted/80 ${
                theme === "dark"
                  ? "bg-muted shadow-sm ring-2 ring-primary/20"
                  : ""
              }`}
              aria-label="Switch to dark mode"
              title="Dark mode"
            >
              <Moon className="h-5 w-5 text-sky-400" />
            </button>

            <button
              onClick={() => handleThemeChange("system")}
              className={`p-3 rounded-xl transition-all duration-200 hover:bg-muted/80 ${
                theme === "system"
                  ? "bg-muted shadow-sm ring-2 ring-primary/20"
                  : ""
              }`}
              aria-label="Use system theme"
              title="System theme"
            >
              <Laptop2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
