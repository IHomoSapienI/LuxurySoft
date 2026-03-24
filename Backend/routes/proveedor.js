const { Router } = require('express');

const { obtenerProveedores, crearProveedor, actualizarProveedor, eliminarProveedor, cambiarEstadoProveedor } = require('../controllers/proveedor');
const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
const router = Router();
router.use(validarJWT);
// Obtener todos los proveedores
router.get('/', verificarPermisos (['verProveedor']), obtenerProveedores);

// Crear un nuevo proveedor
router.post('/', verificarPermisos (['crearProveedor']), crearProveedor);

// Actualizar un proveedor por ID
router.put('/:id', verificarPermisos (['actualizarProveedor']),actualizarProveedor);

// Eliminar un proveedor por ID
router.delete('/:id', verificarPermisos (['eliminarProveedor']), eliminarProveedor);

// Cambiar el estado de un proveedor por ID
router.patch('/:id/estado', cambiarEstadoProveedor);

module.exports = router;
