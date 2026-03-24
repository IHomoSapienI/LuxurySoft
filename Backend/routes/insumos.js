const { Router } = require('express');

const { 
    obtenerInsumos, 
    crearInsumo, 
    actualizarInsumo, 
    eliminarInsumo, 
    cambiarEstadoInsumo, 
    darDeBajaInsumo,
    verificarInsumoExistente,
    incrementarStockInsumo
} = require('../controllers/insumo');
//const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
//const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
const router = Router();
//router.use(validarJWT);
// // Obtener todos los insumos
// router.get('/', verificarPermisos (['verInsumo']), obtenerInsumos);

// // Crear un nuevo insumo
// router.post('/', verificarPermisos (['crearInsumo']),crearInsumo);

// // Actualizar un insumo por ID
// router.put('/:id', verificarPermisos (['actualizarInsumo']), actualizarInsumo);

// // Eliminar un insumo por ID
// router.delete('/:id', verificarPermisos (['eliminarInsumo']),eliminarInsumo);

// // Cambiar el estado de un insumo por ID
// router.patch('/:id/estado', cambiarEstadoInsumo);

// Obtener todos los insumos
router.get('/',  obtenerInsumos);

// Crear un nuevo insumo
router.post('/', crearInsumo);

// Actualizar un insumo por ID
router.put('/:id',  actualizarInsumo);

// Eliminar un insumo por ID
router.delete('/:id', eliminarInsumo);

// Cambiar el estado de un insumo por ID
router.patch('/:id/estado', cambiarEstadoInsumo);

// Nueva ruta para dar de baja un insumo
router.post('/dar-de-baja', darDeBajaInsumo);

// Verificar si existe un insumo con el mismo nombre
router.get('/verificar/:nombre', verificarInsumoExistente);

// Incrementar el stock de un insumo existente
router.put('/incrementar-stock/:id', incrementarStockInsumo);

module.exports = router;