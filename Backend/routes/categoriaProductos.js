const { Router } = require('express');
const { getCategorias, getCategoriaById, crearCategoria, actualizarCategoria, eliminarCategoria } = require('../controllers/categoriaProducto');

const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
const router = Router();
router.use(validarJWT);

// Obtener todas las categorías
router.get('/', verificarPermisos (['verCategoriaProducto']), getCategorias);

// Obtener una categoría por ID
router.get('/:id', verificarPermisos (['verCategoriaProducto']), getCategoriaById);

// Crear una nueva categoría
router.post('/', verificarPermisos (['crearCategoriaProducto']), crearCategoria);

// Actualizar una categoría existente
router.put('/:id', verificarPermisos (['actualizarCategoriaProducto']), actualizarCategoria);

// Eliminar una categoría
router.delete('/:id', verificarPermisos (['eliminarCategoriaProducto']), eliminarCategoria);

module.exports = router;
