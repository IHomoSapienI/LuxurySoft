// middlewares/verificarClientePropio.js
const Cliente = require('../modules/cliente');
const Usuario = require('../modules/usuario');

/**
 * Middleware para verificar si el usuario está accediendo a sus propios datos de cliente
 * o si tiene permisos de administrador/empleado para acceder a datos de cualquier cliente
 */
const verificarClientePropio = async (req, res, next) => {
  try {
    // Obtener el ID del usuario desde el token JWT (añadido por el middleware validarJWT)
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
    
    // Si el usuario es Admin o Empleado, permitir acceso a cualquier cliente
    if (usuario.rol.nombreRol === 'Admin' || usuario.rol.nombreRol === 'Empleado') {
      console.log('Usuario con rol Admin/Empleado: acceso permitido a todos los clientes');
      
      // Si se proporciona un ID de cliente en la URL, usarlo
      if (req.params.id) {
        req.clienteId = req.params.id;
      } else {
        // Para rutas como /perfil, buscar si el usuario tiene un cliente asociado
        const clienteAsociado = await Cliente.findOne({ usuario: usuarioId });
        if (clienteAsociado) {
          req.clienteId = clienteAsociado._id;
        }
      }
      
      return next();
    }
    
    // Para usuarios con rol Cliente, verificar que solo accedan a sus propios datos
    if (usuario.rol.nombreRol === 'Cliente') {
      // Buscar el cliente asociado al usuario
      const cliente = await Cliente.findOne({ usuario: usuarioId });
      
      if (!cliente) {
        return res.status(403).json({
          msg: "No tienes un perfil de cliente asociado"
        });
      }
      
      // Si se está accediendo a un cliente específico por ID
      if (req.params.id) {
        // Verificar que el ID solicitado corresponda al cliente del usuario
        if (req.params.id !== cliente._id.toString()) {
          console.log(`Intento de acceso no autorizado: Usuario ${usuarioId} intentó acceder al cliente ${req.params.id}`);
          return res.status(403).json({
            msg: "No tienes permiso para acceder a los datos de este cliente"
          });
        }
      }
      
      // Guardar el ID del cliente en el request para usar en los controladores
      req.clienteId = cliente._id;
      console.log(`Cliente verificado: ${cliente._id} para usuario ${usuarioId}`);
      
      return next();
    }
    
    // Si el rol no es Admin, Empleado ni Cliente, denegar acceso
    return res.status(403).json({
      msg: "Rol no autorizado para esta operación"
    });
    
  } catch (error) {
    console.error("Error en verificarClientePropio:", error);
    res.status(500).json({
      msg: "Error al verificar permisos de cliente",
      error: error.message
    });
  }
};

module.exports = verificarClientePropio;