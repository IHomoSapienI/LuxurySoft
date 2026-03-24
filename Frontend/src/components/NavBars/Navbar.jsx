"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { usePermissions } from "../../hooks/usePermissions"
import { useLayoutType } from "../../hooks/useLayoutType"
import { getFilteredNavbarMenus } from "../../config/navbarConfig"
import {
  Navbar,
  NavbarLogo,
  NavbarDropdownMenu,
  AvatarMenu,
  MobileSidebar,
  SidebarDropdownMenu,
  SidebarAvatarMenu,
} from "../ui/navbar"

export default function MainNavbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { hasPermission } = usePermissions()
  const { shouldShowSidebar } = useLayoutType()
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const role = user?.role
    setUserRole(role ? role.toLowerCase() : null)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Solo mostrar este navbar si NO debe mostrar sidebar (es decir, para clientes)
  if (shouldShowSidebar) {
    return null
  }

  const renderMenuItems = () => {
    if (!userRole) return null

    const filteredMenus = getFilteredNavbarMenus(hasPermission, userRole)

    return filteredMenus.map((menu, index) => <NavbarDropdownMenu key={index} {...menu} />)
  }

  const renderSidebarMenuItems = () => {
    if (!userRole) return null

    const filteredMenus = getFilteredNavbarMenus(hasPermission, userRole)

    return filteredMenus.map((menu, index) => <SidebarDropdownMenu key={index} {...menu} />)
  }

  return (
    <>
      {/* Navbar para desktop - SIN CAMBIOS */}
      <Navbar variant="main" logo={<NavbarLogo />}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">{renderMenuItems()}</div>
          <AvatarMenu userName={user?.nombre || localStorage.getItem("userName") || ""} onLogout={handleLogout} />
        </div>
      </Navbar>

      {/* Sidebar para móvil */}
      <MobileSidebar logo={<NavbarLogo />}>
        {/* Menús de navegación */}
        <div className="space-y-2">{renderSidebarMenuItems()}</div>

        {/* Avatar del usuario */}
        <SidebarAvatarMenu userName={user?.nombre || localStorage.getItem("userName") || ""} onLogout={handleLogout} />
      </MobileSidebar>
    </>
  )
}
