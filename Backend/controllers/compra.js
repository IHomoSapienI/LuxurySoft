const Compra = require("../modules/compra")
const Proveedor = require("../modules/proveedor")
const Insumo = require("../modules/insumo")
const mongoose = require("mongoose")

// Crear una nueva compra
exports.crearCompra = async (req, res) => {
  try {
    const { proveedor, recibo, fechaCompra, estado, insumos } = req.body

    // Validaciones de campos requeridos
    if (!proveedor || proveedor.trim() === "") {
      return res.status(400).json({ mensaje: "Debe seleccionar un proveedor." })
    }

    if (!recibo || recibo.trim() === "") {
      return res.status(400).json({ mensaje: "Debe ingresar el número de recibo." })
    }

    if (!fechaCompra) {
      return res.status(400).json({ mensaje: "La fecha de compra es requerida." })
    }

    const fechaActual = new Date()
    const fechaCompraDate = new Date(fechaCompra)

    if (isNaN(fechaCompraDate.getTime())) {
      return res.status(400).json({ mensaje: "Formato de fecha inválido." })
    }

    if (fechaCompraDate > fechaActual) {
      return res.status(400).json({ mensaje: "La fecha de compra no puede ser futura." })
    }

    if (!insumos || !Array.isArray(insumos) || insumos.length === 0) {
      return res.status(400).json({ mensaje: "Debe agregar al menos un insumo." })
    }

    // Validaciones mejoradas para insumos
    for (const item of insumos) {
      const { insumo, cantidad, precio } = item

      if (!insumo) {
        return res.status(400).json({ mensaje: "Falta seleccionar un insumo." })
      }

      // Validación de cantidad mejorada
      if (cantidad === undefined || cantidad === null) {
        return res.status(400).json({ mensaje: "La cantidad es requerida." })
      }

      if (typeof cantidad !== "number" || isNaN(cantidad)) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un número válido." })
      }

      if (cantidad <= 0) {
        return res.status(400).json({ mensaje: "La cantidad debe ser mayor que cero." })
      }

      if (!Number.isInteger(cantidad)) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un número entero." })
      }

      // Validación de precio agregada (faltaba en tu código original)
      if (precio !== undefined) {
        if (typeof precio !== "number" || isNaN(precio)) {
          return res.status(400).json({ mensaje: "El precio debe ser un número válido." })
        }

        if (precio < 0) {
          return res.status(400).json({ mensaje: "El precio no puede ser negativo." })
        }
      }
    }

    // Verificar si el proveedor existe
    const proveedorExistente = await Proveedor.findById(proveedor)
    if (!proveedorExistente) {
      return res.status(400).json({ mensaje: "Proveedor no encontrado." })
    }

    // Convertir los IDs de los insumos a ObjectId
    const insumoIds = insumos.map((item) => new mongoose.Types.ObjectId(item.insumo))

    // Buscar los insumos en la base de datos
    const insumosExistentes = await Insumo.find({ _id: { $in: insumoIds } })

    // Identificar los insumos faltantes
    const insumosFaltantes = insumos.filter(
      (item) => !insumosExistentes.some((insumo) => insumo._id.equals(item.insumo)),
    )

    if (insumosFaltantes.length > 0) {
      return res.status(400).json({
        mensaje: "Algunos insumos no fueron encontrados.",
        insumosFaltantes,
      })
    }

    // Calcular el monto total basándose en los precios de los insumos
    const montoTotal = insumos.reduce((total, item) => {
      const insumoEncontrado = insumosExistentes.find((insumo) => insumo._id.equals(item.insumo))
      const precioFinal = item.precio !== undefined ? item.precio : insumoEncontrado.precio
      return total + precioFinal * item.cantidad
    }, 0)

    // Crear la nueva compra
    const nuevaCompra = new Compra({
      proveedor,
      recibo,
      fechaCompra,
      fechaRegistro: new Date(),
      monto: montoTotal,
      estado: estado !== undefined ? estado : true,
      insumos,
    })

    await nuevaCompra.save()

    return res.status(201).json(nuevaCompra)
  } catch (error) {
    console.error("Error al crear la compra:", error)
    return res.status(500).json({ mensaje: "Error al crear la compra", error: error.message })
  }
}

// Actualizar una compra (con validaciones mejoradas)
exports.actualizarCompra = async (req, res) => {
  try {
    const { proveedor, recibo, fechaCompra, estado, insumos } = req.body

    // Validaciones similares a crearCompra
    if (proveedor && proveedor.trim() === "") {
      return res.status(400).json({ mensaje: "El proveedor no puede estar vacío." })
    }

    if (recibo && recibo.trim() === "") {
      return res.status(400).json({ mensaje: "El recibo no puede estar vacío." })
    }

    if (fechaCompra) {
      const fechaActual = new Date()
      const fechaCompraDate = new Date(fechaCompra)

      if (isNaN(fechaCompraDate.getTime())) {
        return res.status(400).json({ mensaje: "Formato de fecha inválido." })
      }

      if (fechaCompraDate > fechaActual) {
        return res.status(400).json({ mensaje: "La fecha de compra no puede ser futura." })
      }
    }

    if (!insumos || insumos.length === 0) {
      return res.status(400).json({ mensaje: "Debe agregar al menos un insumo." })
    }

    // Validaciones de insumos mejoradas
    for (const item of insumos) {
      const { insumo, cantidad, precio } = item

      if (!insumo) {
        return res.status(400).json({ mensaje: "Falta seleccionar un insumo." })
      }

      if (typeof cantidad !== "number" || isNaN(cantidad)) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un número válido." })
      }

      if (cantidad <= 0) {
        return res.status(400).json({ mensaje: "La cantidad debe ser mayor que cero." })
      }

      if (!Number.isInteger(cantidad)) {
        return res.status(400).json({ mensaje: "La cantidad debe ser un número entero." })
      }

      if (precio !== undefined) {
        if (typeof precio !== "number" || isNaN(precio)) {
          return res.status(400).json({ mensaje: "El precio debe ser un número válido." })
        }

        if (precio < 0) {
          return res.status(400).json({ mensaje: "El precio no puede ser negativo." })
        }
      }
    }

    if (proveedor) {
      const proveedorExistente = await Proveedor.findById(proveedor)
      if (!proveedorExistente) {
        return res.status(400).json({ mensaje: "Proveedor no encontrado" })
      }
    }

    const insumosExistentes = await Insumo.find({ _id: { $in: insumos.map((item) => item.insumo) } })
    const insumosFaltantes = insumos.filter(
      (item) => !insumosExistentes.some((insumo) => insumo._id.equals(item.insumo)),
    )

    if (insumosFaltantes.length > 0) {
      return res.status(400).json({
        mensaje: "Algunos insumos no fueron encontrados",
        insumosFaltantes,
      })
    }

    const montoTotal = insumos.reduce((total, item) => {
      const insumoEncontrado = insumosExistentes.find((insumo) => insumo._id.equals(item.insumo))
      const precioFinal = item.precio !== undefined ? item.precio : insumoEncontrado.precio
      return total + precioFinal * item.cantidad
    }, 0)

    const compraActualizada = await Compra.findByIdAndUpdate(
      req.params.id,
      { proveedor, recibo, fechaCompra, monto: montoTotal, estado, insumos },
      { new: true, runValidators: true },
    )

    if (!compraActualizada) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    return res.status(200).json(compraActualizada)
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al actualizar la compra", error: error.message })
  }
}

// Resto de métodos sin cambios...
exports.obtenerCompras = async (req, res) => {
  try {
    const compras = await Compra.find()
      .populate("proveedor", "nombreProveedor contacto")
      .populate("insumos.insumo", "nombreInsumo precio")
      .limit(100)

    return res.status(200).json(compras)
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener las compras", error: error.message })
  }
}

exports.obtenerCompraPorId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" })
    }

    const compra = await Compra.findById(req.params.id)
      .populate("proveedor", "nombre contacto")
      .populate("insumos.insumo", "nombreInsumo precio")

    if (!compra) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    return res.status(200).json(compra)
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al obtener la compra", error: error.message })
  }
}

exports.eliminarCompra = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ mensaje: "ID inválido" })
    }

    const compraEliminada = await Compra.findByIdAndDelete(req.params.id)
    if (!compraEliminada) {
      return res.status(404).json({ mensaje: "Compra no encontrada" })
    }

    return res.status(200).json({ mensaje: "Compra eliminada con éxito" })
  } catch (error) {
    return res.status(500).json({ mensaje: "Error al eliminar la compra", error: error.message })
  }
}
