// src/components/ThemeToggle.js
import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, toggleTheme, setTheme } from '../util/theme-util';

const ThemeToggle = () => {
  const [theme, setThemeState] = useState('light');
  
  useEffect(() => {
    // Inicializar el tema
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    setTheme(currentTheme);
  }, []);
  
  const handleToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };
  
  return (
    <button 
      onClick={handleToggle}
      aria-label="Cambiar tema"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-200/20 transition-colors hover:bg-zinc-300 dark:border-amber-800 dark:hover:bg-amber-500/40"
    >
      {theme === "light" ? (
        <Moon className="h-6 w-6 text-foreground " />
      ) : (
        <Sun className="h-6 w-6 text-gray-600 dark:text-amber-600"/>
      )}
    </button>
  );
};

export default ThemeToggle;