const { Router} = require('express')
const { validarJWT } = require('../middlewares/verificartoken'); // Importar el middleware
const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta

const router = Router()
router.use(validarJWT);

const {ventaserviciosGet, ventaserviciosPost, ventaserviciosPut, ventaserviciosDelete, agregarServiciosVenta, finalizarVenta} = require('../controllers/ventaservicio');

router.get('/', verificarPermisos (['verVentaServicio']), ventaserviciosGet)

router.post('/', verificarPermisos (['crearVentaServicio']),ventaserviciosPost)

router.put('/:id', verificarPermisos (['actualizarVentaServicio']), ventaserviciosPut)

router.delete('/:id', verificarPermisos (['eliminarVentaServicio']), ventaserviciosDelete)

router.put('/:id/agregar-servicios', agregarServiciosVenta);

router.put('/:id/finalizar', finalizarVenta);

module.exports = router