import axios from "axios"
import Swal from "sweetalert2"

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})
// Interceptor de solicitudes para agregar el token JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor de respuesta mejorado para manejar diferentes tipos de errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificar si hay una respuesta del servidor
    if (error.response && error.response.data) {
      // Manejar cuenta inactiva
      if (error.response.data.cuentaInactiva) {
        Swal.fire({
          icon: "error",
          title: "Cuenta inactiva",
          text: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para reactivarla.",
          confirmButtonText: "Entendido",
        }).then(() => {
          // Cerrar sesión
          localStorage.removeItem("token")
          localStorage.removeItem("userRole")
          localStorage.removeItem("userId")
          // Redirigir al login
          window.location.href = "/login"
        })
      }
      // Manejar rol desactivado
      else if (error.response.data.rolDesactivado) {
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: "Tu rol ha sido desactivado. Contacta al administrador.",
          confirmButtonText: "Entendido",
        }).then(() => {
          // Cerrar sesión
          localStorage.removeItem("token")
          localStorage.removeItem("userRole")
          localStorage.removeItem("userId")
          // Redirigir al login
          window.location.href = "/login"
        })
      }
      // Manejar permiso desactivado
      else if (error.response.data.permisoDesactivado) {
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: "No tienes permiso para realizar esta acción. El permiso ha sido desactivado.",
          confirmButtonText: "Entendido",
        })
      }
      // Manejar error de autenticación (401)
      else if (error.response.status === 401 || error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text:
            error.response.data.msg ||
            "Tu sesión ha expirado o no tienes autorización. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Entendido",
        }).then(() => {
          // Cerrar sesión
          localStorage.removeItem("token")
          localStorage.removeItem("userRole")
          localStorage.removeItem("userId")
          // Redirigir al login
          window.location.href = "/login"
        })
      }
      // Manejar error de autorización (403)
      else if (error.response.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: error.response.data.msg || "No tienes permiso para realizar esta acción.",
          confirmButtonText: "Entendido",
        })
      }
    }

    return Promise.reject(error)
  },
)

// Servicio para datos del cliente
export const clienteService = {
  // Obtener perfil del cliente actual
  getPerfilCliente: async () => {
    try {
      const response = await axiosInstance.get('/clientes/perfil');
      return response.data.cliente;
    } catch (error) {
      console.error('Error al obtener perfil del cliente:', error);
      throw error;
    }
  },
  
  // Obtener datos de un cliente específico (solo admin/empleado o el propio cliente)
  getClienteById: async (id) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}`);
      return response.data.cliente;
    } catch (error) {
      console.error(`Error al obtener cliente ${id}:`, error);
      throw error;
    }
  },
  
  // Obtener compras del cliente
  getComprasCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/compras?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener compras del cliente:', error);
      throw error;
    }
  },
  
  // Obtener servicios contratados por el cliente
  getServiciosCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/servicios?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios del cliente:', error);
      throw error;
    }
  },
  
  // Obtener facturas del cliente
  getFacturasCliente: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/facturas?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas del cliente:', error);
      throw error;
    }
  },
  
  // Actualizar datos del cliente
  updateCliente: async (id, clienteData) => {
    try {
      const response = await axiosInstance.put(`/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error);
      throw error;
    }
  }
};

export default axiosInstance;