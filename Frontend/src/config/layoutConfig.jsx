// Configuración que determina qué layout usar basado en permisos
export const layoutConfig = {
  // Permisos que indican que el usuario debe ver el sidebar (layout administrativo)
  sidebarPermissions: [
    "verDashboard",
    "visualizarDashboardMenu",
    "verAgendaEmpleadosMenu",
    "visualizarCitaEnProgresoMenu",
    "verVentasUnificadasMenu",
    "verServiciosMenu",
    "verTipoDescuentoMenu",
    "verTipoServiciosMenu",
    "verEmpleadosMenu",
    "verClientesMenu",
    "verCitasMenu",
    "verComprasMenu",
    "verProductosMenu",
    "verInsumosMenu",
    "verProveedoresMenu",
    "verCategoriaProductosMenu",
    "verBajaProductoMenu",
    "visualizarRolesMenu",
    "verPermisosMenu",
    "verUsuariosMenu",
  ],

  // Roles que siempre usan el layout de cliente (navbar + footer)
  clientRoles: ["cliente"],

  // Función para determinar si un usuario debe ver el sidebar
  shouldShowSidebar: (user, hasPermission) => {
    if (!user) return false

    // Si es cliente, siempre mostrar layout de cliente
    if (layoutConfig.clientRoles.includes(user.role?.toLowerCase())) {
      return false
    }

    // Verificar si tiene algún permiso que requiera sidebar
    return layoutConfig.sidebarPermissions.some((permission) => hasPermission(permission))
  },
}
