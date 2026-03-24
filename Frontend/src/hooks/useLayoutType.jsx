"use client"

import { useAuth } from "../context/AuthContext"
import { usePermissions } from "./usePermissions"
import { layoutConfig } from "../config/layoutConfig"

export const useLayoutType = () => {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()

  // Determinar si debe mostrar sidebar basado en permisos
  const shouldShowSidebar = layoutConfig.shouldShowSidebar(user, hasPermission)

  // Determinar si es cliente (para mostrar botones de redes sociales, etc.)
  const isClient = user?.role?.toLowerCase() === "cliente"

  // Determinar el tipo de layout
  const layoutType = shouldShowSidebar ? "admin" : "client"

  return {
    shouldShowSidebar,
    isClient,
    layoutType,
    userRole: user?.role?.toLowerCase(),
    user,
  }
}
