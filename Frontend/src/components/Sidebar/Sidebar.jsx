"use client"

import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import { FaSignOutAlt, FaBars, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { useAuth } from "../../context/AuthContext"
import { useLayoutType } from "../../hooks/useLayoutType"
import SidebarMenu from "./SidebarMenu"
import "./sidebar.css"

// Contexto del sidebar optimizado
export const SidebarContext = createContext({
  isCollapsed: false,
  isSidebarOpen: true,
  toggleCollapse: () => {},
  toggleOpen: () => {},
  closeMobileSidebar: () => {}, // 🔥 Nueva función para cerrar en móvil
})

export const useSidebar = () => useContext(SidebarContext)

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const sidebarRef = useRef(null)
  const timeoutRef = useRef(null)
  const { user, logout } = useAuth()
  const { shouldShowSidebar } = useLayoutType()

  // Detectar si es móvil de forma optimizada
  const checkIsMobile = useCallback(() => {
    return window.innerWidth < 768
  }, [])

  // Inicializar estado del sidebar
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed")
    const mobile = checkIsMobile()

    setIsMobile(mobile)
    setIsOpen(!mobile)

    if (savedCollapsed !== null && !mobile) {
      setIsCollapsed(savedCollapsed === "true")
    }
  }, [checkIsMobile])

  // Optimizar el listener de resize con debounce
  useEffect(() => {
    let resizeTimeout

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const mobile = checkIsMobile()
        setIsMobile(mobile)
        setIsOpen(!mobile)
      }, 100) // Debounce de 100ms
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [checkIsMobile])

  // Optimizar click outside con mejor detección
  useEffect(() => {
    if (!isMobile) return

    const handleClickOutside = (e) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest(".mobile-toggle, .sidebar-toggle")
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside, { passive: true })
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isOpen])

  // Función optimizada para toggle collapse
  const toggleCollapse = useCallback(() => {
    if (isTransitioning) return

    setIsTransitioning(true)
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", newState.toString())

    // Emitir evento optimizado
    window.dispatchEvent(
      new CustomEvent("sidebarStateChanged", {
        detail: { isCollapsed: newState, isOpen },
      }),
    )

    // Limpiar estado de transición
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false)
    }, 300) // Duración de la transición CSS
  }, [isCollapsed, isOpen, isTransitioning])

  // Función optimizada para toggle open
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // 🔥 Nueva función para cerrar el sidebar en móvil cuando se selecciona una opción
  const closeMobileSidebar = useCallback(() => {
    if (isMobile && isOpen) {
      setIsOpen(false)
    }
  }, [isMobile, isOpen])

  // Función optimizada para logout
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Memoizar el valor del contexto
  const contextValue = useMemo(
    () => ({
      isCollapsed,
      isSidebarOpen: isOpen,
      toggleCollapse,
      toggleOpen,
      closeMobileSidebar, // 🔥 Incluir la nueva función en el contexto
    }),
    [isCollapsed, isOpen, toggleCollapse, toggleOpen, closeMobileSidebar],
  )

  // Solo mostrar sidebar si el usuario tiene permisos
  if (!shouldShowSidebar) return null

  return (
    <SidebarContext.Provider value={contextValue}>
      {/* Overlay para móvil */}
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}

      {/* Toggle móvil */}
      {isMobile && (
        <button className="mobile-toggle" onClick={toggleOpen} aria-label="Toggle sidebar">
          <FaBars />
        </button>
      )}

      {/* Toggle desktop */}
      {!isMobile && (
        <button
          className={`sidebar-toggle ${isCollapsed ? "collapsed" : "expanded"}`}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
        </button>
      )}

      {/* Sidebar principal */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${isCollapsed ? "collapsed" : "expanded"} ${isOpen ? "open" : "closed"} ${isMobile ? "mobile" : "desktop"}`}
        data-testid="sidebar"
      >
        <div className="sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <Link
              to="/dashboard"
              className="logo-container"
              onClick={closeMobileSidebar} // 🔥 Cerrar en móvil al hacer clic en el logo
            >
              <div className="logo-wrapper">
                <img
                  src="https://luxurysoftbackendapi.onrender.com/uploads/logo1Navbar.webp"
                  alt="NailsSoft Logo"
                  className="logo-image"
                  loading="lazy"
                />
              </div>
              <div className={`logo-text ${isCollapsed ? "hidden" : "visible"}`}>NailsSoft</div>
            </Link>
          </div>

          {/* Menu */}
          <div className="menu-container">
            <SidebarMenu collapsed={isCollapsed} />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`logout-button ${isCollapsed ? "collapsed" : "expanded"}`}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            aria-label="Cerrar sesión"
          >
            <FaSignOutAlt className="logout-icon" />
            <span className={`logout-text ${isCollapsed ? "hidden" : "visible"}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}

export default Sidebar
