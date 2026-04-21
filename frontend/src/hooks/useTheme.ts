import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "sportstore-theme";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey);
    return storedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light"))
  };
};
