const Insumo = require("../modules/insumo")
const BajaProducto = require("../modules/bajaproducto")

// Función para validar nombre de insumo
const validarNombreInsumo = (nombreInsumo) => {
  if (!nombreInsumo || nombreInsumo.trim() === "") {
    return "El nombre del insumo es requerido."
  }

  const nombreTrimmed = nombreInsumo.trim()

  // Validar longitud (3-30 caracteres)
  if (nombreTrimmed.length < 3 || nombreTrimmed.length > 30) {
    return "El nombre del insumo debe tener entre 3 y 30 caracteres."
  }

  // Validar que contenga solo letras, números y espacios (no solo caracteres especiales)
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/
  if (!regex.test(nombreTrimmed)) {
    return "El nombre del insumo solo puede contener letras, números y espacios."
  }

  // Validar que no sea solo números o solo espacios
  const soloNumeros = /^\d+$/
  const soloEspacios = /^\s+$/
  if (soloNumeros.test(nombreTrimmed) || soloEspacios.test(nombreTrimmed)) {
    return "El nombre del insumo debe contener al menos una letra."
  }

  return null
}

// Función para validar stock
const validarStock = (stock) => {
  if (stock === undefined || stock === null || stock === "") {
    return "El stock es requerido."
  }

  const stockNum = Number(stock)

  if (isNaN(stockNum)) {
    return "El stock debe ser un número válido."
  }

  if (!Number.isInteger(stockNum)) {
    return "El stock debe ser un número entero."
  }

  if (stockNum < 1) {
    return "El stock debe ser mayor o igual a 1."
  }

  if (stockNum > 999999) {
    return "El stock no puede exceder 999,999 unidades."
  }

  return null
}

// Función para validar precio
const validarPrecio = (precio) => {
  if (precio === undefined || precio === null || precio === "") {
    return "El precio es requerido."
  }

  const precioNum = Number(precio)

  if (isNaN(precioNum)) {
    return "El precio debe ser un número válido."
  }

  if (precioNum <= 0) {
    return "El precio debe ser mayor que cero."
  }

  if (precioNum > 999999.99) {
    return "El precio no puede exceder $999,999.99."
  }

  // Validar que tenga máximo 2 decimales
  const decimales = (precioNum.toString().split(".")[1] || "").length
  if (decimales > 2) {
    return "El precio puede tener máximo 2 decimales."
  }

  return null
}

// Función para validar estado
const validarEstado = (estado) => {
  if (estado === undefined || estado === null) {
    return "El estado del insumo es requerido."
  }

  if (typeof estado !== "boolean") {
    return "El estado debe ser verdadero o falso."
  }

  return null
}

// Obtener todos los insumos
const obtenerInsumos = async (req, res) => {
  try {
    const insumos = await Insumo.find().lean()
    res.json(insumos)
  } catch (error) {
    console.error("Error al obtener insumos:", error)
    res.status(500).json({ message: "Error al obtener los insumos", error })
  }
}

// Verificar si existe un insumo con el mismo nombre
const verificarInsumoExistente = async (req, res) => {
  const { nombre } = req.params

  try {
    const insumo = await Insumo.findOne({ nombreInsumo: nombre }).lean()

    if (insumo) {
      return res.json({ existe: true, insumo })
    }

    return res.json({ existe: false })
  } catch (error) {
    console.error("Error al verificar insumo:", error)
    res.status(500).json({ message: "Error al verificar el insumo", error })
  }
}

// Incrementar el stock de un insumo existente
const incrementarStockInsumo = async (req, res) => {
  const { id } = req.params
  const { cantidadAIncrementar } = req.body

  try {
    // Validar cantidad a incrementar
    if (!cantidadAIncrementar || cantidadAIncrementar <= 0) {
      return res.status(400).json({ message: "La cantidad a incrementar debe ser mayor que cero." })
    }

    const insumo = await Insumo.findById(id)

    if (!insumo) {
      return res.status(404).json({ message: "Insumo no encontrado" })
    }

    // Incrementar el stock
    insumo.stock += Number(cantidadAIncrementar)

    // Si el insumo estaba inactivo y ahora tiene stock, activarlo
    if (!insumo.estado && insumo.stock > 0) {
      insumo.estado = true
    }

    await insumo.save()

    res.json({
      message: "Stock incrementado con éxito",
      insumo,
    })
  } catch (error) {
    console.error("Error al incrementar stock:", error)
    res.status(500).json({ message: "Error al incrementar el stock", error })
  }
}

// Crear un nuevo insumo
const crearInsumo = async (req, res) => {
  try {
    const { nombreInsumo, stock, precio, estado } = req.body

    // Validaciones de campos
    const errorNombre = validarNombreInsumo(nombreInsumo)
    if (errorNombre) {
      return res.status(400).json({ message: errorNombre })
    }

    const errorStock = validarStock(stock)
    if (errorStock) {
      return res.status(400).json({ message: errorStock })
    }

    const errorPrecio = validarPrecio(precio)
    if (errorPrecio) {
      return res.status(400).json({ message: errorPrecio })
    }

    const errorEstado = validarEstado(estado)
    if (errorEstado) {
      return res.status(400).json({ message: errorEstado })
    }

    // Verificar si ya existe un insumo con el mismo nombre
    const insumoExistente = await Insumo.findOne({
      nombreInsumo: nombreInsumo.trim(),
    })

    if (insumoExistente) {
      return res.status(400).json({
        message: "Ya existe un insumo con este nombre.",
        insumoExistente,
      })
    }

    const nuevoInsumo = new Insumo({
      nombreInsumo: nombreInsumo.trim(),
      stock: Number(stock),
      precio: Number(precio),
      estado: Boolean(estado),
    })

    await nuevoInsumo.save()
    res.status(201).json({ message: "Insumo creado con éxito", insumo: nuevoInsumo })
  } catch (error) {
    console.error("Error al crear insumo:", error)
    res.status(500).json({ message: "Error al crear el insumo", error })
  }
}

// Actualizar un insumo por ID
const actualizarInsumo = async (req, res) => {
  try {
    const { id } = req.params
    const { nombreInsumo, stock, precio, estado } = req.body

    // Validaciones solo si los campos están presentes
    if (nombreInsumo !== undefined) {
      const errorNombre = validarNombreInsumo(nombreInsumo)
      if (errorNombre) {
        return res.status(400).json({ message: errorNombre })
      }

      // Verificar si ya existe otro insumo con el mismo nombre (excepto el actual)
      const insumoExistente = await Insumo.findOne({
        nombreInsumo: nombreInsumo.trim(),
        _id: { $ne: id },
      })

      if (insumoExistente) {
        return res.status(400).json({
          message: "Ya existe otro insumo con este nombre.",
          insumoExistente,
        })
      }
    }

    if (stock !== undefined) {
      const errorStock = validarStock(stock)
      if (errorStock) {
        return res.status(400).json({ message: errorStock })
      }
    }

    if (precio !== undefined) {
      const errorPrecio = validarPrecio(precio)
      if (errorPrecio) {
        return res.status(400).json({ message: errorPrecio })
      }
    }

    if (estado !== undefined) {
      const errorEstado = validarEstado(estado)
      if (errorEstado) {
        return res.status(400).json({ message: errorEstado })
      }
    }

    // Preparar datos para actualizar
    const datosActualizacion = {}
    if (nombreInsumo !== undefined) datosActualizacion.nombreInsumo = nombreInsumo.trim()
    if (stock !== undefined) datosActualizacion.stock = Number(stock)
    if (precio !== undefined) datosActualizacion.precio = Number(precio)
    if (estado !== undefined) datosActualizacion.estado = Boolean(estado)

    const insumoActualizado = await Insumo.findByIdAndUpdate(id, datosActualizacion, { new: true, runValidators: true })

    if (!insumoActualizado) {
      return res.status(404).json({ message: "Insumo no encontrado" })
    }

    res.json({ message: "Insumo actualizado con éxito", insumo: insumoActualizado })
  } catch (error) {
    console.error("Error al actualizar insumo:", error)
    res.status(500).json({ message: "Error al actualizar el insumo", error })
  }
}

// Eliminar un insumo por ID
const eliminarInsumo = async (req, res) => {
  const { id } = req.params

  try {
    const insumoEliminado = await Insumo.findByIdAndDelete(id)

    if (!insumoEliminado) {
      return res.status(404).json({ message: "Insumo no encontrado" })
    }

    res.json({ message: "Insumo eliminado con éxito" })
  } catch (error) {
    console.error("Error al eliminar insumo:", error)
    res.status(500).json({ message: "Error al eliminar el insumo", error })
  }
}

// Cambiar el estado de un insumo por ID
const cambiarEstadoInsumo = async (req, res) => {
  const { id } = req.params
  const { estado } = req.body

  try {
    const errorEstado = validarEstado(estado)
    if (errorEstado) {
      return res.status(400).json({ message: errorEstado })
    }

    const insumo = await Insumo.findByIdAndUpdate(id, { estado: Boolean(estado) }, { new: true })

    if (!insumo) {
      return res.status(404).json({ message: "Insumo no encontrado" })
    }

    res.json({ message: "Estado del insumo actualizado", insumo })
  } catch (error) {
    console.error("Error al cambiar estado:", error)
    res.status(500).json({ message: "Error al cambiar el estado del insumo", error })
  }
}

// Dar de baja un insumo y descontar del stock
const darDeBajaInsumo = async (req, res) => {
  try {
    const { insumoId, fechaBaja, cantidad, observaciones } = req.body

    // Validaciones
    if (!insumoId) {
      return res.status(400).json({ message: "El ID del insumo es requerido." })
    }

    if (!fechaBaja) {
      return res.status(400).json({ message: "La fecha de baja es requerida." })
    }

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ message: "La cantidad debe ser mayor que cero." })
    }

    const insumo = await Insumo.findById(insumoId)
    if (!insumo) {
      return res.status(404).json({ message: "Insumo no encontrado" })
    }

    if (insumo.stock < cantidad) {
      return res.status(400).json({
        message: `Stock insuficiente. Stock actual: ${insumo.stock}, cantidad solicitada: ${cantidad}`,
      })
    }

    const baja = new BajaProducto({
      productoId: insumo._id,
      producto: insumo.nombreInsumo,
      fechaBaja,
      cantidad: Number(cantidad),
      observaciones: observaciones || "",
    })

    await baja.save()

    insumo.stock -= Number(cantidad)
    if (insumo.stock === 0) {
      insumo.estado = false
    }
    await insumo.save()

    res.json({
      message: "Insumo dado de baja correctamente",
      baja,
      stockActual: insumo.stock,
    })
  } catch (error) {
    console.error("Error al dar de baja:", error)
    res.status(500).json({ message: "Error al dar de baja el insumo", error })
  }
}

module.exports = {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo,
  cambiarEstadoInsumo,
  darDeBajaInsumo,
  verificarInsumoExistente,
  incrementarStockInsumo,
}
//prueba