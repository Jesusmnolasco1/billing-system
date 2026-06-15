"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Esto evita errores de hidratación (cuando el servidor y el cliente se confunden)
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; 

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-yellow-400 transition"
    >
      {theme === 'dark' ? 'Claro' : 'Oscuro'}
    </button>
  );
}