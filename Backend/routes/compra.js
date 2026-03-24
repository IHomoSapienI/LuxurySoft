const express = require('express');
const {
    crearCompra,
    obtenerCompras,
    obtenerCompraPorId,
    actualizarCompra,
    eliminarCompra
} = require('../controllers/compra'); // Asegúrate de que la ruta sea correcta

const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta

const router = express.Router();

router.use(validarJWT);

// Ruta para crear una nueva compra
router.post('/', verificarPermisos(['crearCompras']), crearCompra);

// Ruta para obtener todas las compras
router.get('/', verificarPermisos(['verCompras']), obtenerCompras);

// Ruta para obtener una compra por ID
router.get('/:id', verificarPermisos(['verCompras']), obtenerCompraPorId);

// Ruta para actualizar una compra
router.put('/:id', verificarPermisos(['actualizarCompras']), actualizarCompra);

// Ruta para eliminar una compra
router.delete('/:id', verificarPermisos(['eliminarCompras']), eliminarCompra);

module.exports = router;
