import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaClipboardList,
  FaUserCog,
  FaCalendarAlt,
  FaCalendarWeek,
  FaMoneyBillWave,
  FaCube,
  FaBoxes,
  FaTruck,
  FaTags,
  FaUserShield,
  FaUserLock,
  FaUsers
} from "react-icons/fa"
import { MdOutlineMonetizationOn, MdOutlineSpa, MdOutlineVrpano } from "react-icons/md"
import { BiSolidDiscount, BiAlbum } from "react-icons/bi"

export const menuConfig = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: FaTachometerAlt,
    permission: "visualizarDashboardMenu"
  },

  // Gestión de Ventas
  {
    label: "Citas en Progreso",
    path: "/citas-en-progreso",
    icon: FaCalendarCheck,
    group: "Gestión de Ventas",
    permission: "visualizarCitaEnProgresoMenu",
  },
  {
    label: "Ventas Unificadas",
    path: "/ventas-unificadas",
    icon: MdOutlineMonetizationOn,
    group: "Gestión de Ventas",
    permission:"verVentasUnificadasMenu"
  },

  // Gestión de Servicios
  {
    label: "Servicios",
    path: "/servicios",
    icon: MdOutlineSpa,
    group: "Gestión de Servicios",
    permission:"verServiciosMenu"
  },
  {
    label: "Tipo de Descuentos",
    path: "/tiposervicios",
    icon: BiSolidDiscount,
    group: "Gestión de Servicios",
    permission:"verTipoDescuentoMenu"
  },
  {
    label: "Tipo de Servicios",
    path: "/tiposervicioss",
    icon: BiAlbum,
    group: "Gestión de Servicios",
    permission:"verTipoServiciosMenu"
  },
  {
    label: "Catálogo de Servicios",
    path: "/articles",
    icon: MdOutlineVrpano,
    group: "Gestión de Servicios",
    permission:"verCatalogoMenu"
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: FaClipboardList,
    group: "Gestión de Servicios",
    permission:"verClientesMenu"
  },
  {
    label: "Empleados",
    path: "/empleados",
    icon: FaUserCog,
    group: "Gestión de Servicios",
    permission:"verEmpleadosMenu"
  },
  {
    label: "Citas",
    path: "/citas",
    icon: FaCalendarAlt,
    group: "Gestión de Servicios",
    permission:"verCitasMenu"
  },
  {
    label: "Agenda de Empleados",
    path: "/agenda-empleado",
    icon: FaCalendarWeek,
    group: "Gestión de Servicios",
    permission:"verAgendaEmpleadosMenu"
  },

  // Gestión de Compras
  {
    label: "Compras",
    path: "/compras",
    icon: FaMoneyBillWave,
    group: "Gestión de Compras",
    permission:"verComprasMenu"
  },
  {
    label: "Productos",
    path: "/productos",
    icon: FaCube,
    group: "Gestión de Compras",
    permission:"verProductosMenu"
  },
  {
    label: "Insumos",
    path: "/insumos",
    icon: FaBoxes,
    group: "Gestión de Compras",
    permission:"verInsumosMenu"
  },
  {
    label: "Proveedores",
    path: "/proveedores",
    icon: FaTruck,
    group: "Gestión de Compras",
    permission:"verProveedoresMenu"
  },
  {
    label: "Categoría Productos",
    path: "/categoriaProductos",
    icon: FaTags,
    group: "Gestión de Compras",
    permission:"verCategoriaProductosMenu"
  },
  {
    label: "Baja de Productos",
    path: "/baja-producto",
    icon: FaClipboardList,
    group: "Gestión de Compras",
    permission:"verBajaProductoMenu"
  },

  // Configuración
  {
    label: "Roles",
    path: "/roles",
    icon: FaUserShield,
    group: "Configuración",
    permission:"visualizarRolesMenu"
  },
  {
    label: "Permisos",
    path: "/permisos",
    icon: FaUserLock,
    group: "Configuración",
    permission:"verPermisosMenu"
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    icon: FaUsers,
    group: "Configuración",
    permission:"verUsuariosMenu"
    
  }
]
