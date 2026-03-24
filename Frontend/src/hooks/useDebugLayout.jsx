"use client"

import { useAuth } from "../context/AuthContext"
import { usePermissions } from "./usePermissions"
import { useLayoutType } from "./useLayoutType"

export const useDebugLayout = () => {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { shouldShowSidebar, layoutType } = useLayoutType()

  // Debug info
  const debugInfo = {
    user: {
      role: user?.role,
      nombre: user?.nombre,
      hasUser: !!user,
    },
    permissions: {
      verDashboard: hasPermission("verDashboard"),
      visualizarDashboardMenu: hasPermission("visualizarDashboardMenu"),
      verAgendaEmpleados: hasPermission("verAgendaEmpleadosMenu"),
      verServiciosMenu: hasPermission("verServiciosMenu"),
      verVentasUnificadasMenu: hasPermission("verVentasUnificadasMenu"),
    },
    layout: {
      shouldShowSidebar,
      layoutType,
    },
  }

  // Log para debug
  // console.log("🔍 Debug Layout Info:", debugInfo)

  return debugInfo
}
