// middlewares/filtrarPorCliente.js
const Usuario = require('../models/usuario');
const Cliente = require('../models/cliente');

/**
 * Middleware que filtra automáticamente los datos por cliente
 */
const filtrarPorCliente = async (req, res, next) => {
  try {
    // Obtener el ID del usuario desde el token JWT
    const usuarioId = req.usuario?.id || req.userId;
    
    if (!usuarioId) {
      return res.status(401).json({
        msg: "No autorizado - Se requiere autenticación"
      });
    }
    
    // Obtener el usuario con su rol
    const usuario = await Usuario.findById(usuarioId).populate('rol');
    
    if (!usuario) {
      return res.status(401).json({
        msg: "Usuario no encontrado"
      });
    }
    
    // Si el usuario es Admin o Empleado, no aplicar filtro
    if (usuario.rol.nombreRol === 'Admin' || usuario.rol.nombreRol === 'Empleado') {
      // No aplicar filtro, permitir acceso completo
      req.esAdminOEmpleado = true;
      return next();
    }
    
    // Para clientes, aplicar filtro automático
    if (usuario.rol.nombreRol === 'Cliente') {
      // Obtener el cliente asociado al usuario
      const cliente = await Cliente.findOne({ usuario: usuarioId });
      
      if (!cliente) {
        return res.status(403).json({
          msg: "No tienes un perfil de cliente asociado"
        });
      }
      
      // Guardar el ID del cliente en el request para filtrar datos
      req.clienteId = cliente._id;
      req.esAdminOEmpleado = false;
      
      // Modificar cualquier consulta para incluir el filtro por cliente
      const originalQuery = req.query;
      req.query = { 
        ...originalQuery,
        clienteId: cliente._id 
      };
      
      // Continuar
      next();
    } else {
      // Otros roles no permitidos
      return res.status(403).json({
        msg: "Rol no autorizado para esta operación"
      });
    }
  } catch (error) {
    console.error("Error en filtrarPorCliente:", error);
    res.status(500).json({
      msg: "Error al aplicar filtro por cliente",
      error: error.message
    });
  }
};

module.exports = filtrarPorCliente;