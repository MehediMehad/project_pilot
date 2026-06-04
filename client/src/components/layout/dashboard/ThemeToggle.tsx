"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder to prevent hydration layout shift
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground cursor-pointer transition-all duration-200"
      aria-label="Toggle Theme"
    >
      {theme === "light" ? (
        <Moon className="h-[18px] w-[18px] transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="h-[18px] w-[18px] transition-transform duration-300 hover:rotate-45" />
      )}
    </Button>
  );
}
