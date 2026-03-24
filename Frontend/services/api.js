// services/api.js
import axios from 'axios';

// Crear una instancia de axios con la configuración base
const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicio para clientes
export const clienteService = {
  // Obtener datos del perfil del cliente
  getClienteData: async (id) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}`);
      return response.data.cliente;
    } catch (error) {
      console.error('Error al obtener datos del cliente:', error);
      throw error;
    }
  },
  
  // Obtener compras del cliente
  getClienteCompras: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/compras?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener compras del cliente:', error);
      throw error;
    }
  },
  
  // Obtener servicios del cliente
  getClienteServicios: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/servicios?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener servicios del cliente:', error);
      throw error;
    }
  },
  
  // Obtener facturas del cliente
  getClienteFacturas: async (id, page = 1, limit = 10) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/facturas?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas del cliente:', error);
      throw error;
    }
  },
  
  // Obtener estadísticas del cliente
  getClienteStats: async (id) => {
    try {
      const response = await axiosInstance.get(`/clientes/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del cliente:', error);
      throw error;
    }
  },
  
  // Actualizar datos del cliente
  updateClienteData: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/clientes/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error);
      throw error;
    }
  }
};

// Exportar otros servicios según sea necesario
export default {
  clienteService,
  // Otros servicios
};