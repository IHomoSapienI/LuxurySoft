const { response } = require("express")
const Permiso = require("../modules/permiso")
const Rol = require("../modules/rol")
const Usuario = require("../modules/usuario")

/**
 * Middleware para verificar si el usuario tiene los permisos necesarios
 * @param {Array} permisosRequeridos - Array de strings con los nombres de los permisos requeridos
 * @returns {Function} Middleware
 */
const verificarPermisos = (permisosRequeridos) => {
  return async (req, res = response, next) => {
    try {
      // Obtener el ID del usuario desde el request (establecido por el middleware validarJWT)
      const usuarioId = req.userId // Cambiado de req.usuario.id a req.userId para coincidir con verificartoken.js

      console.log(`ID de usuario en verificarPermisos: ${usuarioId}`)

      if (!usuarioId) {
        return res.status(401).json({
          msg: "Token no válido - usuario no existe en la petición",
        })
      }

      // Buscar el usuario en la base de datos
      const usuario = await Usuario.findById(usuarioId)
      if (!usuario) {
        return res.status(401).json({
          msg: "Token no válido - usuario no existe en DB",
        })
      }

      // Verificar si el usuario está activo
      if (!usuario.estado) {
        return res.status(401).json({
          msg: "Token no válido - usuario con estado: false",
        })
      }

      // Obtener el rol del usuario
      const rol = await Rol.findById(usuario.rol).populate("permisoRol")
      if (!rol) {
        return res.status(403).json({
          msg: "El usuario no tiene un rol asignado",
        })
      }

      // Verificar si el rol está activo
      if (!rol.estadoRol) {
        return res.status(403).json({
          msg: "El rol del usuario está desactivado",
          rolDesactivado: true, // Añadir flag para el interceptor de axios
        })
      }

      // Verificar si el usuario tiene los permisos necesarios
      const permisosUsuario = rol.permisoRol.map((permiso) => permiso.nombrePermiso)

      console.log(`Permisos del usuario: ${permisosUsuario.join(", ")}`)
      console.log(`Permisos requeridos: ${permisosRequeridos.join(", ")}`)

      // Verificar cada permiso requerido individualmente para dar mensajes más específicos
      for (const permisoRequerido of permisosRequeridos) {
        // Buscar el permiso en la base de datos
        const permiso = await Permiso.findOne({ nombrePermiso: permisoRequerido })

        // Si el permiso no existe en la base de datos
        if (!permiso) {
          return res.status(403).json({
            msg: `El permiso "${permisoRequerido}" no existe en el sistema`,
            permisoInexistente: true,
          })
        }

        // Si el permiso existe pero está desactivado
        if (!permiso.activo) {
          return res.status(403).json({
            msg: `El permiso "${permisoRequerido}" está desactivado`,
            permisoDesactivado: true, // Añadir flag para el interceptor de axios
            nombrePermiso: permisoRequerido,
          })
        }

        // Si el permiso existe y está activo, pero el usuario no lo tiene
        if (!permisosUsuario.includes(permisoRequerido)) {
          return res.status(403).json({
            msg: `No tienes el permiso "${permisoRequerido}" necesario para esta acción`,
            permisoNoAsignado: true,
          })
        }
      }

      // Si todo está bien, continuar con la ejecución
      next()
    } catch (error) {
      console.error("Error en verificarPermisos:", error)
      res.status(500).json({
        msg: "Error al verificar permisos",
        error: error.message,
      })
    }
  }
}

module.exports = verificarPermisos

