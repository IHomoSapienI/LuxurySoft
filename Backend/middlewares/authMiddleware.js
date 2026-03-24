const jwt = require("jsonwebtoken")
const Usuario = require("../models/Usuario")

const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header("Authorization")

    if (!authHeader) {
      return res.status(401).json({
        message: "Acceso denegado. No se proporcionó token.",
      })
    }

    // Verificar formato del token
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader

    if (!token) {
      return res.status(401).json({
        message: "Acceso denegado. Token inválido.",
      })
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_jwt_secret_aqui")

    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.findById(decoded.userId).populate("rol")

    if (!usuario) {
      return res.status(401).json({
        message: "Token inválido. Usuario no encontrado.",
      })
    }

    if (!usuario.estado) {
      return res.status(403).json({
        message: "Cuenta desactivada.",
        cuentaInactiva: true,
      })
    }

    if (!usuario.rol || !usuario.rol.estado) {
      return res.status(403).json({
        message: "Rol desactivado.",
        rolDesactivado: true,
      })
    }

    // Agregar información del usuario a la request
    req.userId = usuario._id
    req.userRole = usuario.rol.nombreRol
    req.user = usuario

    next()
  } catch (error) {
    console.error("Error en middleware de autenticación:", error)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido.",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expirado.",
      })
    }

    res.status(500).json({
      message: "Error interno del servidor.",
    })
  }
}

module.exports = authMiddleware
