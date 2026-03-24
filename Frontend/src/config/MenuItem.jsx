"use client"
import { Link } from "react-router-dom"
import { usePermissions } from "../hooks/usePermissions"

const MenuItem = ({ icon: Icon, children, to, isActive, onClick, collapsed, requiredPermission }) => {
  const { hasPermission } = usePermissions()

  if (requiredPermission && !hasPermission(requiredPermission)) return null

  // 🔥 Función para manejar el clic combinando la función existente con la nueva
  const handleClick = (e) => {
    // Ejecutar la función onClick si existe (para cerrar el menú móvil)
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <Link
      to={to}
      className={`menu-item group ${isActive ? "active" : ""}`}
      onClick={handleClick} // 🔥 Usar la nueva función de manejo de clic
      title={collapsed ? children : ""}
    >
      <Icon className="menu-icon" />
      {!collapsed && <span className="menu-text">{children}</span>}
    </Link>
  )
}

export default MenuItem
