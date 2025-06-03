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

  const getNextTheme = (currentTheme: Theme): Theme => {
    const themeOrder: Theme[] = ["light", "dark", "system"];
    const currentIndex = themeOrder.indexOf(currentTheme);
    return themeOrder[(currentIndex + 1) % themeOrder.length];
  };

  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage?.setItem("theme", nextTheme);
    }

    if (nextTheme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      updateTheme(systemDark);
    } else {
      updateTheme(nextTheme === "dark");
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

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case "dark":
        return <Moon className="h-5 w-5 text-sky-400" />;
      case "system":
        return <Laptop2 className="h-5 w-5 text-foreground" />;
    }
  };

  const getThemeLabel = (currentTheme: Theme) => {
    switch (currentTheme) {
      case "light":
        return "Light mode";
      case "dark":
        return "Dark mode";
      case "system":
        return "System theme";
    }
  };

  if (!mounted)
    return (
      <div className="bg-background transition-colors duration-300">
        {children}
      </div>
    );

  return (
    <div className="bg-background transition-colors duration-300">
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-card/90 dark:bg-card/80 border border-border rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300">
          {/* Desktop - 3 buttons */}
          <div className="hidden md:block p-3">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-3 rounded-xl transition-all duration-300 hover:bg-muted/80 hover:scale-105 transform ${
                  theme === "light"
                    ? "bg-muted shadow-sm ring-2 ring-primary/20 scale-105"
                    : ""
                }`}
                aria-label="Switch to light mode"
                title="Light mode"
              >
                <Sun className="h-5 w-5 text-yellow-500 transition-colors duration-300" />
              </button>

              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-3 rounded-xl transition-all duration-300 hover:bg-muted/80 hover:scale-105 transform ${
                  theme === "dark"
                    ? "bg-muted shadow-sm ring-2 ring-primary/20 scale-105"
                    : ""
                }`}
                aria-label="Switch to dark mode"
                title="Dark mode"
              >
                <Moon className="h-5 w-5 text-sky-400 transition-colors duration-300" />
              </button>

              <button
                onClick={() => handleThemeChange("system")}
                className={`p-3 rounded-xl transition-all duration-300 hover:bg-muted/80 hover:scale-105 transform ${
                  theme === "system"
                    ? "bg-muted shadow-sm ring-2 ring-primary/20 scale-105"
                    : ""
                }`}
                aria-label="Use system theme"
                title="System theme"
              >
                <Laptop2 className="h-5 w-5 text-foreground transition-colors duration-300" />
              </button>
            </div>
          </div>

          {/* Mobile/Tablet - Single toggle button */}
          <div className="block md:hidden p-3">
            <button
              onClick={handleThemeToggle}
              className="p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-all duration-300 hover:scale-110 active:scale-95 transform shadow-sm hover:shadow-md"
              aria-label={`Current: ${getThemeLabel(theme)}, tap to cycle`}
              title={`Current: ${getThemeLabel(theme)}, tap to cycle`}
            >
              <div className="relative">
                <div
                  key={theme}
                  className="animate-in fade-in-0 zoom-in-75 duration-300"
                >
                  {getThemeIcon(theme)}
                </div>
              </div>
            </button>

            {/* Theme indicator */}
            <div className="mt-2 flex justify-center">
              <div className="flex gap-1">
                {(["light", "dark", "system"] as Theme[]).map((t) => (
                  <div
                    key={t}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      t === theme
                        ? "bg-primary scale-125"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
