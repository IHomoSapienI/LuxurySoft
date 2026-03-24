const { response } = require("express")
const Producto = require("../modules/producto")
const CategoriaProducto = require("../modules/categoriaproducto")

// Función para validar nombre de producto
const validarNombreProducto = (nombreProducto) => {
  if (!nombreProducto || nombreProducto.trim() === "") {
    return "El nombre del producto es requerido."
  }

  const nombreTrimmed = nombreProducto.trim()

  // Validar longitud (3-20 caracteres)
  if (nombreTrimmed.length < 3 || nombreTrimmed.length > 20) {
    return "El nombre del producto debe tener entre 3 y 20 caracteres."
  }

  // Validar que solo contenga letras, números y espacios (no caracteres especiales)
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/
  if (!regex.test(nombreTrimmed)) {
    return "El nombre del producto solo puede contener letras, números y espacios."
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

  // Validar que tenga máximo 2 decimales
  const decimales = (precioNum.toString().split(".")[1] || "").length
  if (decimales > 2) {
    return "El precio puede tener máximo 2 decimales."
  }

  return null
}

// Función para validar descripción
const validarDescripcion = (descripcion) => {
  if (descripcion && descripcion.trim() !== "") {
    const descripcionTrimmed = descripcion.trim()

    if (descripcionTrimmed.length > 300) {
      return "La descripción no puede exceder los 300 caracteres."
    }

    // Validar que no contenga solo caracteres especiales
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()¿?¡!-]+$/
    if (!regex.test(descripcionTrimmed)) {
      return "La descripción contiene caracteres no válidos."
    }
  }

  return null
}

// Obtener todos los productos
const productosGet = async (req, res = response) => {
  try {
    const productos = await Producto.find().populate("categoria", "nombreCp")

    if (productos.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron productos en la base de datos",
      })
    }

    res.json({
      productos,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al obtener los productos",
    })
  }
}

// Crear un nuevo producto
const productosPost = async (req, res = response) => {
  try {
    const { nombreProducto, precio, stock, categoria, estado, descripcion } = req.body

    // Validaciones de campos requeridos
    const errorNombre = validarNombreProducto(nombreProducto)
    if (errorNombre) {
      return res.status(400).json({ msg: errorNombre })
    }

    const errorStock = validarStock(stock)
    if (errorStock) {
      return res.status(400).json({ msg: errorStock })
    }

    const errorPrecio = validarPrecio(precio)
    if (errorPrecio) {
      return res.status(400).json({ msg: errorPrecio })
    }

    if (!categoria || categoria.trim() === "") {
      return res.status(400).json({
        msg: "Debe seleccionar una categoría.",
      })
    }

    const errorDescripcion = validarDescripcion(descripcion)
    if (errorDescripcion) {
      return res.status(400).json({ msg: errorDescripcion })
    }

    if (estado === undefined || estado === null) {
      return res.status(400).json({
        msg: "El estado del producto es requerido.",
      })
    }

    if (!req.file) {
      return res.status(400).json({
        msg: "La imagen del producto es requerida.",
      })
    }

    // Verificar que la categoría existe
    const existeCategoria = await CategoriaProducto.findById(categoria)
    if (!existeCategoria) {
      return res.status(400).json({
        msg: "La categoría especificada no existe en la base de datos.",
      })
    }

    // Verificar que no existe un producto con el mismo nombre
    const productoExistente = await Producto.findOne({
      nombreProducto: nombreProducto.trim(),
      _id: { $ne: req.params.id }, // Excluir el producto actual en caso de actualización
    })

    if (productoExistente) {
      return res.status(400).json({
        msg: "Ya existe un producto con ese nombre.",
      })
    }

    const imagenUrl = req.file.filename

    const producto = new Producto({
      nombreProducto: nombreProducto.trim(),
      precio: Number(precio),
      stock: Number(stock),
      categoria,
      estado: Boolean(estado),
      descripcion: descripcion ? descripcion.trim() : "",
      imagenUrl,
    })

    await producto.save()

    res.status(201).json({
      msg: "Producto creado correctamente",
      producto,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al crear el producto",
    })
  }
}

// Actualizar un producto
const productosPut = async (req, res = response) => {
  try {
    const { id } = req.params
    const { nombreProducto, precio, stock, categoria, estado, descripcion } = req.body

    const producto = await Producto.findById(id)
    if (!producto) {
      return res.status(404).json({
        msg: "Producto no encontrado",
      })
    }

    // Validaciones solo si los campos están presentes
    if (nombreProducto !== undefined) {
      const errorNombre = validarNombreProducto(nombreProducto)
      if (errorNombre) {
        return res.status(400).json({ msg: errorNombre })
      }

      // Verificar que no existe otro producto con el mismo nombre
      const productoExistente = await Producto.findOne({
        nombreProducto: nombreProducto.trim(),
        _id: { $ne: id },
      })

      if (productoExistente) {
        return res.status(400).json({
          msg: "Ya existe otro producto con ese nombre.",
        })
      }
    }

    if (stock !== undefined) {
      const errorStock = validarStock(stock)
      if (errorStock) {
        return res.status(400).json({ msg: errorStock })
      }
    }

    if (precio !== undefined) {
      const errorPrecio = validarPrecio(precio)
      if (errorPrecio) {
        return res.status(400).json({ msg: errorPrecio })
      }
    }

    if (categoria !== undefined && categoria !== "") {
      const existeCategoria = await CategoriaProducto.findById(categoria)
      if (!existeCategoria) {
        return res.status(400).json({
          msg: "La categoría especificada no existe en la base de datos.",
        })
      }
    }

    if (descripcion !== undefined) {
      const errorDescripcion = validarDescripcion(descripcion)
      if (errorDescripcion) {
        return res.status(400).json({ msg: errorDescripcion })
      }
    }

    const imagenUrl = req.file ? req.file.filename : undefined

    // Actualizamos solo los campos que hayan sido proporcionados
    if (nombreProducto !== undefined) producto.nombreProducto = nombreProducto.trim()
    if (precio !== undefined) producto.precio = Number(precio)
    if (stock !== undefined) producto.stock = Number(stock)
    if (categoria !== undefined) producto.categoria = categoria
    if (estado !== undefined) producto.estado = Boolean(estado)
    if (descripcion !== undefined) producto.descripcion = descripcion ? descripcion.trim() : ""
    if (imagenUrl) producto.imagenUrl = imagenUrl

    await producto.save()

    res.json({
      msg: "Producto actualizado correctamente",
      producto,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al actualizar el producto",
    })
  }
}

// Eliminar un producto
const productosDelete = async (req, res = response) => {
  const { id } = req.params

  try {
    const producto = await Producto.findByIdAndDelete(id)

    if (!producto) {
      return res.status(404).json({
        msg: "Producto no encontrado",
      })
    }

    res.json({
      msg: "Producto eliminado correctamente",
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al eliminar el producto",
    })
  }
}

module.exports = {
  productosGet,
  productosPost,
  productosPut,
  productosDelete,
}
