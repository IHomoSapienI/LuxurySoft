const { Router } = require('express');
const { productosGet, productosPost, productosPut, productosDelete } = require('../controllers/productos');
const multer = require('multer');
const { validarJWT } = require('../middlewares/verificartoken'); // Asegúrate de que la ruta sea correcta
const verificarPermisos = require('../middlewares/verificarPermisos'); // Asegúrate de que la ruta sea correcta

// Configuración de multer para manejo de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Se guarda la imagen con un nombre único
  }
});

const upload = multer({ storage });

const router = Router();
router.use(validarJWT);
// Ruta para obtener todos los productos
router.get('/', verificarPermisos (['verProducto']), productosGet);

// Ruta para crear un nuevo producto (requiere imagen)
router.post('/', upload.single('imagen'), verificarPermisos (['crearProducto']), productosPost);

// Ruta para actualizar un producto (opcionalmente puede incluir una imagen nueva)
router.put('/:id', upload.single('imagen'), verificarPermisos (['actualizarProducto']), productosPut);

// Ruta para eliminar un producto
router.delete('/:id', verificarPermisos (['eliminarProducto']),productosDelete);

module.exports = router;
