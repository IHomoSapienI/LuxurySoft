const { Router } = require("express")
const { validarJWT } = require("../middlewares/verificartoken")
const verificarPermisos = require("../middlewares/verificarPermisos")
const {
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  finalizarVenta,
  agregarProductosVenta,
  agregarServiciosVenta,
  obtenerVentasPorCliente,
  obtenerVentasPorCita,
  validarVenta
} = require("../controllers/venta")

const router = Router()

// Aplicar middleware de autenticación a todas las rutas
// router.use(validarJWT)

// Ruta para obtener todas las ventas
router.get("/", obtenerVentas)

//Obtener ventas por clientes
router.get("/cliente", obtenerVentasPorCliente)

// Ruta para obtener una venta específica por ID
router.get("/:id",  obtenerVentaPorId)


router.get("/cita/:citaId", obtenerVentasPorCita);

router.post("/", validarVenta, crearVenta);

// Ruta para crear una nueva venta
router.post("/", crearVenta)

// Ruta para actualizar una venta existente
router.put(
  "/:id",
  actualizarVenta,
)

// Ruta para eliminar una venta
router.delete(
  "/:id",
  eliminarVenta,
)

// Ruta para finalizar una venta
router.put(
  "/:id/finalizar",
  finalizarVenta,
)

// Ruta para agregar productos a una venta existente
router.put(
  "/:id/agregar-productos",
  agregarProductosVenta,
)

// Ruta para agregar servicios a una venta existente
router.put(
  "/:id/agregar-servicios",
  agregarServiciosVenta,
)

module.exports = router