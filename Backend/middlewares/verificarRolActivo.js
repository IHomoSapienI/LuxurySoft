// middlewares/verificarRolActivo.js
const Usuario = require('../modules/usuario');

const verificarRolActivo = async (req, res, next) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return next(); // Si no hay userId, deja que otros middlewares manejen esto
        }
        
        const usuario = await Usuario.findById(userId).populate('rol');
        if (!usuario || !usuario.rol) {
            return res.status(403).json({ msg: 'Usuario o rol no encontrado' });
        }
        
        // Verificar si el rol está activo
        if (!usuario.rol.estadoRol) {
            return res.status(403).json({ 
                msg: 'Tu rol ha sido desactivado. Contacta al administrador.',
                rolDesactivado: true
            });
        }
        
        // Si el rol está activo, continuar
        next();
    } catch (error) {
        console.error('Error al verificar estado del rol:', error);
        return res.status(500).json({ msg: 'Error al verificar estado del rol' });
    }
};

module.exports = verificarRolActivo;