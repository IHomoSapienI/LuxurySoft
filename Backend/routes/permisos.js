const { Router } = require("express")
const router = Router()
const {
  permisosGet,
  permisosPost,
  permisosPut,
  permisosDelete,
  permisosExportExcel,
} = require("../controllers/permiso")
const { validarJWT } = require("../middlewares/verificartoken")
const verificarPermisos = require("../middlewares/verificarPermisos")
const verificarRolActivo = require("../middlewares/verificarRolActivo")

// Aplicar middleware de autenticación y verificación de rol activo
router.use(validarJWT)
router.use(verificarRolActivo)

// Rutas para permisos con permisos específicos
router.get("/", verificarPermisos(["verPermisos"]), permisosGet)
router.post("/", verificarPermisos(["crearPermisos"]), permisosPost)
router.put("/:id", verificarPermisos(["actualizarPermisos"]), permisosPut)
router.delete("/:id", verificarPermisos(["eliminarPermisos"]), permisosDelete)
router.get("/export-excel", verificarPermisos(["verPermisos"]), permisosExportExcel)


module.exports = router

