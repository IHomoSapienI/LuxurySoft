const { Router } = require("express")
const router = Router()
const {
  serviciosGet,
  serviciosPost,
  serviciosPut,
  serviciosDelete,
  serviciosExportExcel,
  serviciosToggleEstado,
  validarNombreServicio,
} = require("../controllers/servicio")
const multer = require("multer")
const path = require("path")
const express = require("express")
const { validarJWT } = require("../middlewares/verificartoken") // Importar el middleware

const verificarPermisos = require("../middlewares/verificarPermisos") // Asegúrate de que la ruta sea correcta
router.use(validarJWT)

// Configuración de multer para la subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/") // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // Renombra el archivo con extensión
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/ // Tipos permitidos
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb("Error: Archivo no permitido.") // Error si no es un archivo permitido
  },
})

// Servir la carpeta de uploads de manera estática
router.use("/uploads", express.static("uploads"))

// Rutas
router.get("/", verificarPermisos(["verServicios"]), serviciosGet)
router.get("/validar-nombre", verificarPermisos(["verServicios"]), validarNombreServicio);


router.post("/", upload.single("imagen"), verificarPermisos(["crearServicios"]), serviciosPost)
router.put("/:id", upload.single("imagen"), verificarPermisos(["actualizarServicios"]), serviciosPut) // Actualizar un servicio
router.delete("/:id", verificarPermisos(["eliminarServicios"]), serviciosDelete)

router.get("/export-excel", serviciosExportExcel)

// Ruta para cambiar el estado de un servicio
router.patch("/:id/toggle-estado", verificarPermisos(["actualizarServicios"]), serviciosToggleEstado)

module.exports = router

