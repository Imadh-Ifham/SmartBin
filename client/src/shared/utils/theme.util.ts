// Get initial theme from localStorage or system preference
export const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem("theme") as "light" | "dark" | null;
  if (saved) return saved;

  // If no saved theme, fall back to system
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

// Apply theme by toggling "dark" class on <html>
export const applyTheme = (theme: "light" | "dark") => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem("theme", theme);
};
