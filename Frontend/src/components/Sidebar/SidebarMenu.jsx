"use client"

import { useLocation } from "react-router-dom"
import { menuConfig } from "../../config/menuConfig"
import MenuGroup from "../../config/MenuGroup"
import MenuItem from "../../config/MenuItem"
import { useSidebar } from "./Sidebar" // 🔥 Importar el hook del sidebar

const SidebarMenu = ({ collapsed }) => {
  const location = useLocation()
  const { closeMobileSidebar } = useSidebar() // 🔥 Obtener la función del contexto

  // 🔥 Función para manejar el clic en cualquier item del menú
  const handleMenuItemClick = () => {
    closeMobileSidebar()
  }

  // Agrupamos los menús por `group` si existe
  const groupedItems = menuConfig.reduce((acc, item) => {
    const group = item.group || "default"
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {})

  return (
    <>
      {Object.entries(groupedItems).map(([groupName, items]) => {
        // Si no hay grupo, renderizamos los items directamente
        if (groupName === "default") {
          return items.map((item) => (
            <MenuItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              collapsed={collapsed}
              isActive={location.pathname === item.path}
              requiredPermission={item.permission}
              onClick={handleMenuItemClick} // 🔥 Pasar la función de clic
            >
              {item.label}
            </MenuItem>
          ))
        }

        return (
          <MenuGroup key={groupName} title={groupName} collapsed={collapsed} defaultExpanded={false}>
            {items.map((item) => (
              <MenuItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                collapsed={collapsed}
                isActive={location.pathname === item.path}
                requiredPermission={item.permission}
                onClick={handleMenuItemClick} // 🔥 Pasar la función de clic
              >
                {item.label}
              </MenuItem>
            ))}
          </MenuGroup>
        )
      })}
    </>
  )
}

export default SidebarMenu
