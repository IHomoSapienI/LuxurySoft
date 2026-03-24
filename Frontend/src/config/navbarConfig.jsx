import {
  FaUsers,
  FaUserShield,
  FaShoppingCart,
  FaCalendarAlt,
  FaTachometerAlt,
  FaCashRegister,
  FaCamera,
  FaUserCircle,
  FaClipboardList,
  FaAsymmetrik,
  FaFileAlt,
  FaCube,
  FaBoxes,
  FaTruck,
  FaTags,
  FaCalendarCheck,
  FaCalendarWeek,
  FaUserCog,
  FaUserLock,
} from "react-icons/fa"
import { MdOutlineSpa, MdOutlineMonetizationOn } from "react-icons/md"
import { BiAlbum, BiSolidDiscount } from "react-icons/bi"

export const navbarMenuConfig = [
  {
    icon: FaTachometerAlt,
    label: "Dashboard",
    requiredPermission: "visualizarDashboardMenu",
    items: [
      {
        icon: FaUserShield,
        label: "Reportes",
        path: "/dashboard",
        requiredPermission: "visualizarDashboardMenu",
      },
    ],
  },
  {
    icon: FaUserShield,
    label: "Configuración",
    requiredPermission: "verConfiguracionMenu",
    items: [
      {
        icon: FaUserShield,
        label: "Gestión de roles",
        path: "/roles",
        requiredPermission: "visualizarRolesMenu",
      },
      {
        icon: FaUsers,
        label: "Gestión de usuarios",
        path: "/usuarios",
        requiredPermission: "verUsuariosMenu",
      },
      {
        icon: FaUserLock,
        label: "Gestión de permisos",
        path: "/permisos",
        requiredPermission: "verPermisosMenu",
      },
    ],
  },
  {
    icon: FaShoppingCart,
    label: "Compras",
    requiredPermission: "verComprasMenu",
    items: [
      {
        icon: FaBoxes,
        label: "Gestión insumos",
        path: "/insumos",
        requiredPermission: "verInsumosMenu",
      },
      {
        icon: FaCube,
        label: "Gestión productos",
        path: "/productos",
        requiredPermission: "verProductosMenu",
      },
      {
        icon: FaTruck,
        label: "Gestión de proveedores",
        path: "/proveedores",
        requiredPermission: "verProveedoresMenu",
      },
      {
        icon: FaShoppingCart,
        label: "Gestión de compra",
        path: "/compras",
        requiredPermission: "verComprasMenu",
      },
      {
        icon: FaTags,
        label: "Categoría Productos",
        path: "/categoriaProductos",
        requiredPermission: "verCategoriaProductosMenu",
      },
      {
        icon: FaClipboardList,
        label: "Baja de Productos",
        path: "/baja-producto",
        requiredPermission: "verBajaProductoMenu",
      },
    ],
  },
  {
    icon: FaCalendarAlt,
    label: "Servicios",
    requiredPermission: "verServiciosMenu",
    items: [
      {
        icon: FaCamera,
        label: "Portafolio de Servicios",
        path: "/articles",
        requiredPermission: "verCatalogoMenu",
      },
      {
        icon: MdOutlineSpa,
        label: "Gestión de servicios",
        path: "/servicios",
        requiredPermission: "verServiciosMenu",
      },
      {
        icon: BiSolidDiscount,
        label: "Tipo de Descuentos",
        path: "/tiposervicios",
        requiredPermission: "verTipoDescuentoMenu",
      },
      {
        icon: BiAlbum,
        label: "Tipo de Servicios",
        path: "/tiposervicioss",
        requiredPermission: "verTipoServiciosMenu",
      },
      {
        icon: FaUserCog,
        label: "Empleados",
        path: "/empleados",
        requiredPermission: "verEmpleadosMenu",
      },
      {
        icon: FaCalendarAlt,
        label: "Citas",
        path: "/citas",
        requiredPermission: "verCitasMenu",
      },
      {
        icon: FaCalendarWeek,
        label: "Agenda de Empleados",
        path: "/agenda-empleado",
        requiredPermission: "verAgendaEmpleadosMenu",
      },
    ],
  },
  {
    icon: FaCashRegister,
    label: "Ventas",
    requiredPermission: "verVentasMenu",
    items: [
      {
        icon: FaClipboardList,
        label: "Gestión de clientes",
        path: "/clientes",
        requiredPermission: "verClientesMenu",
      },
      {
        icon: FaCalendarCheck,
        label: "Citas en Progreso",
        path: "/citas-en-progreso",
        requiredPermission: "visualizarCitaEnProgresoMenu",
      },
      {
        icon: MdOutlineMonetizationOn,
        label: "Ventas Unificadas",
        path: "/ventas-unificadas",
        requiredPermission: "verVentasUnificadasMenu",
      },
    ],
  },
  // Menús específicos para clientes
  {
    icon: FaTachometerAlt,
    label: "Mi Cuenta",
    requiredRole: "cliente",
    items: [
      {
        icon: FaShoppingCart,
        label: "Historial de Compras",
        path: "/mi-cuenta",
        requiredRole: "cliente",
      },
    ],
  },
  {
    icon: FaCalendarAlt,
    label: "Servicios",
    requiredRole: "cliente",
    items: [
      {
        icon: FaAsymmetrik,
        label: "Agendar Cita",
        path: "/seleccionarservicios",
        requiredRole: "cliente",
      },
      {
        icon: FaCamera,
        label: "Portafolio de Servicios",
        path: "/articles",
        requiredRole: "cliente",
      },
    ],
  },
  {
    icon: FaFileAlt,
    label: "Políticas",
    requiredRole: "cliente",
    items: [
      {
        icon: FaFileAlt,
        label: "Políticas del Salón",
        path: "/politicas",
        requiredRole: "cliente",
      },
    ],
  },
  // Menús para perfil (todos los usuarios autenticados)
  // {
  //   icon: FaUserCircle,
  //   label: "Mi Perfil",
  //   requiredAuth: true,
  //   items: [
  //     {
  //       icon: FaUserCircle,
  //       label: "Ver Perfil",
  //       path: "/profile",
  //       requiredAuth: true,
  //     },
  //   ],
  // },
]

// Función para filtrar menús basado en permisos y roles
export const getFilteredNavbarMenus = (hasPermission, userRole) => {
  return navbarMenuConfig
    .filter((menu) => {
      // Si requiere un permiso específico
      if (menu.requiredPermission) {
        return hasPermission(menu.requiredPermission)
      }

      // Si requiere un rol específico
      if (menu.requiredRole) {
        return userRole?.toLowerCase() === menu.requiredRole
      }

      // Si solo requiere autenticación
      if (menu.requiredAuth) {
        return !!userRole
      }

      return false
    })
    .map((menu) => ({
      ...menu,
      items: menu.items.filter((item) => {
        // Filtrar items basado en permisos
        if (item.requiredPermission) {
          return hasPermission(item.requiredPermission)
        }

        // Filtrar items basado en roles
        if (item.requiredRole) {
          return userRole?.toLowerCase() === item.requiredRole
        }

        // Si solo requiere autenticación
        if (item.requiredAuth) {
          return !!userRole
        }

        return true
      }),
    }))
    .filter((menu) => menu.items.length > 0) // Solo mostrar menús que tengan items visibles
}
