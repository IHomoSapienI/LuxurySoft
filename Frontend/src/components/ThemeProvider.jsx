"use client"

import { createContext, useContext, useEffect, useState } from "react"

// Crear el contexto del tema
const ThemeContext = createContext({
  theme: "light",
  setTheme: () => null,
})

// Hook personalizado para usar el contexto del tema
export const useTheme = () => useContext(ThemeContext)

// Componente proveedor del tema
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light")

  // Efecto para inicializar el tema
  useEffect(() => {
    // Verificar si hay una preferencia guardada en localStorage
    const storedTheme = localStorage.getItem("theme")

    // Si hay una preferencia guardada, usarla
    if (storedTheme) {
      setTheme(storedTheme)
    }
    // Si no hay preferencia guardada, usar la preferencia del sistema
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
  }, [])

  // Efecto para aplicar la clase 'dark' al elemento html cuando cambia el tema
  useEffect(() => {
    const root = window.document.documentElement

    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    // Guardar la preferencia en localStorage
    localStorage.setItem("theme", theme)
  }, [theme])

  // Función para cambiar el tema
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
}

