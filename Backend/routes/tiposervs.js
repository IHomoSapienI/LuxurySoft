const { Router } = require("express")

const router = Router()

const {
  tiposerviciosGet,
  tiposerviciosPost,
  tiposerviciosPut,
  tiposerviciosDelete,
  tiposerviciosToggleEstado,
} = require("../controllers/tiposerv")

router.get("/", tiposerviciosGet)
router.post("/", tiposerviciosPost)
router.put("/:id", tiposerviciosPut)
router.delete("/:id", tiposerviciosDelete)
router.patch("/:id/toggle-estado", tiposerviciosToggleEstado)

module.exports = router

