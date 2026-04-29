"use client";
import { startTransition, useEffect, useState } from "react";

const themes = [
  { value: "light", icon: "fas fa-sun text-yellow-500" },
  { value: "dark", icon: "fas fa-moon text-gray-300" },
  { value: "system", icon: "fas fa-desktop text-blue-500" },
] as const;

type Theme = (typeof themes)[number]["value"];

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("theme") as Theme;
    if (storedTheme && themes.some((t) => t.value === storedTheme)) {
      return storedTheme;
    }
  }
  return "light";
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    startTransition(() => {
      setTheme(initialTheme as Theme);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const root = document.documentElement;
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const appliedTheme =
        theme === "system" ? (systemDark ? "dark" : "light") : theme;

      // Apply the theme to the root element
      root.setAttribute("data-theme", appliedTheme);
      root.classList.toggle("dark", appliedTheme === "dark");

      // Save the theme to localStorage and cookies
      localStorage.setItem("theme", appliedTheme);
    }
  }, [theme, isLoading]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default ThemeProvider;
