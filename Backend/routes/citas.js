const { Router } = require('express');


const { crearCita, obtenerCitas, obtenerCitaPorId, actualizarCita, cancelarCita, eliminarCita, verificarDisponibilidad, iniciarCita,obtenerCitasPorCliente} = require('../controllers/cita');
//const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
//const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
const router = Router();
//router.use(validarJWT);
// Definir las rutas para citas
// router.post('/', verificarPermisos (['crearCita']), crearCita);
// router.get('/', verificarPermisos (['verCita']),obtenerCitas);
// router.get('/:id', verificarPermisos (['verCita']), obtenerCitaPorId);
// router.put('/:id', verificarPermisos (['actualizarCita']), actualizarCita);
// router.delete('/:id', verificarPermisos (['eliminarCita']),eliminarCita);


router.post('/',   crearCita);
router.get('/', obtenerCitas);
router.get('/cliente', obtenerCitasPorCliente);
router.get('/:id',  obtenerCitaPorId);
router.put('/:id',  actualizarCita);
router.delete('/:id', eliminarCita);
router.post('/verificar-disponibilidad', verificarDisponibilidad);
router.put('/:id/iniciar', iniciarCita);
router.put('/:id/cancelar', cancelarCita);  // Nueva ruta para cancelar citas

module.exports = router;