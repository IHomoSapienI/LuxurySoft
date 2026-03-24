const CatProducto = require("../modules/categoriaproducto")

// Función de validación para el nombre de categoría
const validarNombreCategoria = (nombre) => {
  if (!nombre || nombre.trim() === '') {
    return { valido: false, mensaje: "El nombre de categoría no puede estar vacío" }
  }
  
  if (nombre.length < 3 || nombre.length > 20) {
    return { valido: false, mensaje: "El nombre de categoría debe tener entre 3 y 20 caracteres" }
  }
  
  // Verificar si solo contiene caracteres especiales
  if (/^[^a-zA-Z0-9]+$/.test(nombre)) {
    return { valido: false, mensaje: "El nombre de categoría no puede contener solo caracteres especiales" }
  }
  
  // Verificar si contiene al menos una letra
  if (!/[a-zA-Z]/.test(nombre)) {
    return { valido: false, mensaje: "El nombre de categoría debe contener al menos una letra" }
  }
  
  return { valido: true }
}

// Función de validación para la descripción
const validarDescripcion = (descripcion) => {
  // La descripción puede estar vacía
  if (descripcion === undefined || descripcion === null) {
    return { valido: true }
  }
  
  if (descripcion.length > 300) {
    return { valido: false, mensaje: "La descripción no puede exceder los 300 caracteres" }
  }
  
  // Verificar si solo contiene números
  if (/^\d+$/.test(descripcion)) {
    return { valido: false, mensaje: "La descripción no puede contener solo números" }
  }
  
  // Verificar si solo contiene caracteres especiales
  if (descripcion.trim() !== '' && /^[^a-zA-Z0-9]+$/.test(descripcion)) {
    return { valido: false, mensaje: "La descripción no puede contener solo caracteres especiales" }
  }
  
  return { valido: true }
}

// Función de validación para el estado
const validarEstado = (activo) => {
  if (activo === undefined || activo === null) {
    return { valido: false, mensaje: "El estado no puede estar vacío" }
  }
  
  return { valido: true }
}

// Obtener todas las categorías
const getCategorias = async (req, res) => {
  try {
    const categorias = await CatProducto.find()
    res.json({
      ok: true,
      categorias,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: "Error al obtener categorías de productos",
    })
  }
}

// Obtener una categoría por ID
const getCategoriaById = async (req, res) => {
  const { id } = req.params
  try {
    const categoria = await CatProducto.findById(id)
    if (!categoria) {
      return res.status(404).json({
        ok: false,
        msg: "Categoría no encontrada",
      })
    }
    res.json({
      ok: true,
      categoria,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: "Error al obtener la categoría",
    })
  }
}

// Crear una nueva categoría
const crearCategoria = async (req, res) => {
  const { nombreCp, descripcionCp } = req.body
  
  // Validar nombre de categoría
  const validacionNombre = validarNombreCategoria(nombreCp)
  if (!validacionNombre.valido) {
    return res.status(400).json({
      ok: false,
      msg: validacionNombre.mensaje
    })
  }
  
  // Validar descripción
  const validacionDescripcion = validarDescripcion(descripcionCp)
  if (!validacionDescripcion.valido) {
    return res.status(400).json({
      ok: false,
      msg: validacionDescripcion.mensaje
    })
  }
  
  // Por defecto, una nueva categoría se crea como activa
  const activo = true
  
  try {
    const nuevaCategoria = new CatProducto({ 
      nombreCp, 
      descripcionCp,
      activo 
    })
    
    await nuevaCategoria.save()
    res.json({
      ok: true,
      msg: "Categoría creada con éxito",
      categoria: nuevaCategoria,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: "Error al crear la categoría",
    })
  }
}

// Actualizar una categoría
const actualizarCategoria = async (req, res) => {
  const { id } = req.params
  const { nombreCp, descripcionCp, activo } = req.body
  
  try {
    const categoria = await CatProducto.findById(id)
    if (!categoria) {
      return res.status(404).json({
        ok: false,
        msg: "Categoría no encontrada",
      })
    }
    
    // Solo validar el nombre si se proporciona
    if (nombreCp !== undefined) {
      const validacionNombre = validarNombreCategoria(nombreCp)
      if (!validacionNombre.valido) {
        return res.status(400).json({
          ok: false,
          msg: validacionNombre.mensaje
        })
      }
      categoria.nombreCp = nombreCp
    }
    
    // Solo validar la descripción si se proporciona
    if (descripcionCp !== undefined) {
      const validacionDescripcion = validarDescripcion(descripcionCp)
      if (!validacionDescripcion.valido) {
        return res.status(400).json({
          ok: false,
          msg: validacionDescripcion.mensaje
        })
      }
      categoria.descripcionCp = descripcionCp
    }
    
    // Validar el estado si se proporciona
    if (activo !== undefined) {
      const validacionEstado = validarEstado(activo)
      if (!validacionEstado.valido) {
        return res.status(400).json({
          ok: false,
          msg: validacionEstado.mensaje
        })
      }
      categoria.activo = activo
    }

    await categoria.save()
    res.json({
      ok: true,
      msg: "Categoría actualizada con éxito",
      categoria,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar la categoría",
    })
  }
}

// Eliminar una categoría
const eliminarCategoria = async (req, res) => {
  const { id } = req.params
  try {
    const categoria = await CatProducto.findById(id)
    if (!categoria) {
      return res.status(404).json({
        ok: false,
        msg: "Categoría no encontrada",
      })
    }

    // Reemplazar el método obsoleto remove() con deleteOne()
    await CatProducto.deleteOne({ _id: id })

    res.json({
      ok: true,
      msg: "Categoría eliminada con éxito",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar la categoría",
    })
  }
}

module.exports = {
  getCategorias,
  getCategoriaById,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
}