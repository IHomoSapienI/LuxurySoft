"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "../components/Sidebar/Sidebar"

export const useTableLayout = () => {
  const { isCollapsed, isSidebarOpen } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  // Determinar las clases CSS basadas en el estado del sidebar
  const containerClasses = [
    "tabla-container",
    !isMobile && isCollapsed ? "sidebar-collapsed" : "",
    !isMobile && !isCollapsed ? "sidebar-expanded" : "",
    isMobile ? "mobile" : "desktop",
  ]
    .filter(Boolean)
    .join(" ")

  return {
    containerClasses,
    isMobile,
    isCollapsed,
    isSidebarOpen,
  }
}
