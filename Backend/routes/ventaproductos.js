const { Router } = require('express');
const { validarJWT } = require('../middlewares/verificartoken'); // Importar el middleware
const verificarPermisos = require('../middlewares/verificarPermisos'); 
const { crearVentaProducto, obtenerVentasProductos, obtenerVentaProductoPorId, actualizarVentaProducto, eliminarVentaProducto} = require('../controllers/ventaProducto');



const router = Router();

router.use(validarJWT);

// Ruta para crear una nueva venta de producto
router.post('/', verificarPermisos (['crearVentaProducto']),crearVentaProducto); // Cambiado a '/' para que sea relativo a '/api/ventaproductos'

// Ruta para obtener todas las ventas de productos
router.get('/', verificarPermisos (['verVentaProducto']), obtenerVentasProductos); // Cambiado a '/' para que sea relativo a '/api/ventaproductos'

// Ruta para obtener una venta de producto específica por ID
router.get('/:id', verificarPermisos (['verVentaProducto']), obtenerVentaProductoPorId); // Cambiado a '/:id' para que sea relativo a '/api/ventaproductos'

// Ruta para actualizar una venta de producto por ID
router.put('/:id', verificarPermisos (['actualizarVentaProducto']), actualizarVentaProducto); // Cambiado a '/:id' para que sea relativo a '/api/ventaproductos'

// Ruta para eliminar una venta de producto por ID
router.delete('/:id', verificarPermisos (['eliminarVentaProducto']),eliminarVentaProducto); // Cambiado a '/:id' para que sea relativo a '/api/ventaproductos'

module.exports = router;
