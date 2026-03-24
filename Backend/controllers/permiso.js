const { response } = require("express")
const Permiso = require("../modules/permiso")
const {permisoSchema} = require("../validators/permiso.validator")
const permiso = require("../modules/permiso")

// Obtener todos los permisos
const permisosGet = async (req, res = response) => {
  try {
    const permisos = await Permiso.find()
    if (permisos.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron permisos en la base de datos",
      })
    }
    res.json({ permisos })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Error al obtener los permisos" })
  }
}

// Crear un nuevo permiso
const permisosPost = async (req, res = response) => {
  
  //VAlidación de los datos con Joi
  const { error } = permisoSchema.validate(req.body)

  if (error) {
    return res.status(400).json({ msg:error.details[0].message })
  }
  // Extraer datos del cuerpo de la solicitud
  const { nombrePermiso, descripcion, activo, categoria, nivel } = req.body

  try {
    const permiso = new Permiso({
      nombrePermiso,
      descripcion,
      activo,
      categoria,
      nivel,
    })
    await permiso.save()
    res.status(201).json({
      msg: "Permiso creado correctamente",
      permiso,
    }) 
  } catch (error) {
    console.error("Eror al crear el permiso:", error);
    res.status(500).json({ msg: "Error al crear el permiso" })
  }
  
  // const { nombrePermiso, descripcion, activo, categoria, nivel } = req.body

  // const regexNombre = /^[a-zA-Z0-9\s]+$/ // Expresión regular para permitir solo letras, números y espacios

  // if (!nombrePermiso || nombrePermiso.trim() === "") {
  //   return res.status(400).json({ msg: "El campo nombrePermiso es obligatorio." })
  // }

  // if (nombrePermiso.length < 5 || nombrePermiso.length > 30) {
  //   return res.status(400).json({ msg: "El campo nombrePermiso debe tener entre 5 y 30 caracteres." })
  // }

  // if (!regexNombre.test(nombrePermiso)) {
  //   return res.status(400).json({ msg: "El campo nombrePermiso solo puede contener letras, números y espacios." })
  // }



  // // Validar campos obligatorios
  // if (!nombrePermiso || !descripcion || activo === undefined || !categoria || !nivel) {
  //   return res.status(400).json({
  //     msg: "Nombre, descripción, estado activo, categoría y nivel son obligatorios.",
  //   })
  // }



  // // Verificar que el nivel sea válido
  // const nivelesValidos = ["read", "write", "delete"]
  // if (!nivelesValidos.includes(nivel)) {
  //   return res.status(400).json({
  //     msg: "El nivel debe ser uno de los siguientes: read, write, delete.",
  //   })
  // }

  // const categoriasValidas = [
  //   "usuarios",
  //   "roles",
  //   "permisos",
  //   "configuración",
  //   "reportes",
  //   "compras",
  //   "tipoServicios",
  //   "servicios",
  //   "ventaServicios",
  //   "productos",
  //   "ventaProductos",
  //   "citas",
  //   "empleados",
  //   "clientes",
  //   "insumos",
  //   "proveedores",
  //   "categoriaProductos",
  // ] // Incluye las categorías que deseas permitir
  // if (!categoriasValidas.includes(categoria)) {
  //   return res.status(400).json({
  //     msg: "La categoría debe ser una de las siguientes: usuarios, roles, configuración, reportes, compras, etc.",
  //   })
  // }

  // const permiso = new Permiso({ nombrePermiso, descripcion, activo, categoria, nivel })

  // try {
  //   await permiso.save()
  //   res.status(201).json({
  //     msg: "Permiso creado correctamente",
  //     permiso,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({ msg: "Error al crear el permiso" })
  // }
}

// Actualizar un permiso
const permisosPut = async (req, res = response) => {
  
  const {id} = req.params;
  const { nombrePermiso, descripcion, activo, categoria, nivel } = req.body;

  try {
    const permiso = await Permiso.findById(id);
    if (!permiso) {
      return res.status(404).json({ msg: "Permiso no encontrado" });
    
  }
  if (nombrePermiso) permiso.nombrePermiso = nombrePermiso;
  if (descripcion) permiso.descripcion = descripcion;
  if (activo !== undefined) permiso.activo = activo;
  if (categoria) permiso.categoria = categoria;
  if (nivel) permiso.nivel = nivel;

  await permiso.save();
  res.json({
    msg: "Permiso actualizado correctamente",
    permiso,
  });
} catch (error) {
  console.error("Error al actualizar el permiso:", error);
  res.status(500).json({ msg: "Error al actualizar el permiso" });  
};



  
  // const { id } = req.params
  // const { nombrePermiso, descripcion, activo, categoria, nivel } = req.body

  // try {
  //   const permiso = await Permiso.findById(id)
  //   if (!permiso) {
  //     return res.status(404).json({ ok: false, msg: "Permiso no encontrado" })
  //   }

  //   // Actualizar solo los campos que se proporcionan
  //   if (nombrePermiso) permiso.nombrePermiso = nombrePermiso
  //   if (descripcion) permiso.descripcion = descripcion
  //   if (activo !== undefined) permiso.activo = activo
  //   if (categoria) permiso.categoria = categoria

  //   // Validar el nivel antes de actualizarlo
  //   if (nivel) {
  //     const nivelesValidos = ["read", "write", "delete"]
  //     if (!nivelesValidos.includes(nivel)) {
  //       return res.status(400).json({
  //         msg: "El nivel debe ser uno de los siguientes: read, write, delete.",
  //       })
  //     }
  //     permiso.nivel = nivel
  //   }

  //   await permiso.save()
  //   res.json({
  //     ok: true,
  //     msg: "Permiso actualizado con éxito",
  //     permiso,
  //   })
  // } catch (error) {
  //   console.error(error)
  //   res.status(500).json({ ok: false, msg: "Error al actualizar el permiso" })
  // }
}

// Eliminar un permiso
const permisosDelete = async (req, res = response) => {
  const { id } = req.params
  try {
    const permiso = await Permiso.findByIdAndDelete(id)
    if (!permiso) {
      return res.status(404).json({ ok: false, msg: "Permiso no encontrado" })
    }
    res.json({ ok: true, msg: "Permiso eliminado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ ok: false, msg: "Error al eliminar el permiso" })
  }
}

// Exportar permisos a Excel
const permisosExportExcel = async (req, res = response) => {
  try {
    // Obtener todos los permisos
    const permisos = await Permiso.find()

    if (permisos.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron permisos para exportar",
      })
    }

    // Crear un nuevo libro de Excel
    const ExcelJS = require("exceljs")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Permisos")

    // Definir las columnas
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Nivel", key: "nivel", width: 15 },
      { header: "Estado", key: "estado", width: 15 },
    ]

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }

    // Agregar los datos
    permisos.forEach((permiso) => {
      worksheet.addRow({
        id: permiso._id.toString(),
        nombre: permiso.nombrePermiso,
        descripcion: permiso.descripcion,
        categoria: permiso.categoria,
        nivel: permiso.nivel === "read" ? "Lectura" : permiso.nivel === "write" ? "Escritura" : "Eliminación",
        estado: permiso.activo ? "Activo" : "Inactivo",
      })
    })

    // Configurar la respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=permisos.xlsx")

    // Escribir el libro de Excel en la respuesta
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error al exportar permisos a Excel:", error)
    res.status(500).json({
      msg: "Error al exportar permisos a Excel",
      error: error.message,
    })
  }
}

module.exports = {
  permisosGet,
  permisosPost,
  permisosPut,
  permisosDelete,
  permisosExportExcel,
}

