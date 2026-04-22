"use client";

// import { motion } from "framer-motion";
import { useEffect, useState, useMemo, startTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

type Theme = (typeof themes)[number]["value"];

const ThemeSwitch = () => {
  // IMPORTANT: keep initial value deterministic for SSR/CSR to match.
  const [theme, setTheme] = useState<Theme>("system");

  // On mount, read the stored theme preference and update state.
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | undefined;
    if (storedTheme && themes.some((t) => t.value === storedTheme)) {
      startTransition(() => {
        setTheme(storedTheme);
      });
    }
  }, []);

  // Whenever the theme changes, apply it to the document and persist it.
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const appliedTheme =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;

    root.setAttribute("data-theme", appliedTheme);
    root.classList.toggle("dark", appliedTheme === "dark");

    localStorage.setItem("theme", appliedTheme);
  }, [theme]);

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
  };

  const currentTheme = useMemo(
    () => themes.find((t) => t.value === theme),
    [theme]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center gap-2 border p-2 rounded-lg cursor-pointer w-10"
          aria-label="Toggle Theme Menu"
        >
          <div key={theme}>
            {currentTheme && <currentTheme.icon className="w-4 h-4" />}
          </div>
          {/* <motion.div
            key={theme}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {currentTheme && <currentTheme.icon className="w-4 h-4" />}
          </motion.div> */}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-40">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className={`cursor-pointer ${
              theme === themeOption.value
                ? "text-blue-500 font-semibold"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            <themeOption.icon className="w-4 h-4 mr-2" />
            {themeOption.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitch;
