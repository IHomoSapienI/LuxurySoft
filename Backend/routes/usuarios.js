const { Router } = require("express")
const { validarJWT } = require("../middlewares/verificartoken") // Importar el middleware
const verificarPermisos = require("../middlewares/verificarPermisos") // Asegúrate de que la ruta sea correcta
const verificarRolActivo = require("../middlewares/verificarRolActivo")
const {
  usuariosGet,
  usuarioGetById,
  usuariosPost,
  usuariosPut,
  usuariosUpdateRol,
  usuariosDelete,
  PromGet,
  usuariosToggleEstado,
} = require("../controllers/usuario")

const router = Router()

// Aplicar middleware de verificación de rol activo
router.use(verificarRolActivo)

// Aplicar middleware de autenticación
router.use(validarJWT)

// Ruta para obtener todos los usuarios
router.get("/", verificarPermisos (['verUsuarios']), usuariosGet)

// NUEVA RUTA: Obtener un usuario específico por ID
router.get("/:id", usuarioGetById)

// Ruta para crear un nuevo usuario
router.post("/", verificarPermisos (['crearUsuarios']), usuariosPost)

// Ruta para actualizar un usuario
router.put("/:id", verificarPermisos (['actualizarUsuarios']), usuariosPut)

// NUEVA RUTA: Actualizar solo el rol de un usuario
router.put("/:id/update-rol", usuariosUpdateRol)

// Ruta para eliminar un usuario
router.delete("/:id", verificarPermisos (['eliminarUsuarios']), usuariosDelete)

// Ruta para consultar usuarios con parámetros
router.get("/buscar/prom", PromGet)

// Ruta para activar/desactivar un usuario
router.patch("/:id/toggle-estado",  usuariosToggleEstado)

module.exports = router









// const { Router } = require('express');
// //const { validarJWT } = require('../middlewares/verificartoken'); // Importar el middleware
// //const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta
// const verificarRolActivo = require('../middlewares/verificarRolActivo');
// const {usuariosGet, usuariosPost, usuariosPut, usuariosDelete } = require('../controllers/usuario');



// const router = Router();
// router.use(verificarRolActivo);
// //router.use(validarJWT);
// // // Ruta pública para registrar un usuario
// // router.post('/', verificarPermisos (['crearUsuarios']), usuariosPost);

// // // Ruta privada para obtener usuarios (requiere autenticación)
// // router.get('/',  verificarPermisos (['verUsuarios']), usuariosGet); 

// // // Ruta privada para actualizar un usuario (requiere autenticación)
// // router.put('/:id',  verificarPermisos (['actualizarUsuarios']), usuariosPut); 

// // // Ruta privada para eliminar un usuario (requiere autenticación)
// // router.delete('/:id',  verificarPermisos (['eliminarUsuarios']), usuariosDelete);


// // Ruta pública para registrar un usuario
// router.post('/',  usuariosPost);

// // Ruta privada para obtener usuarios (requiere autenticación)
// router.get('/',   usuariosGet); 

// // Ruta privada para actualizar un usuario (requiere autenticación)
// router.put('/:id',   usuariosPut); 

// // Ruta privada para eliminar un usuario (requiere autenticación)
// router.delete('/:id',   usuariosDelete);


// module.exports = router;
