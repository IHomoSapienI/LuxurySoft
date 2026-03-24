const { response } = require("express")
const mongoose = require("mongoose")
const Rol = require("../modules/rol") // Importar el modelo de Rol
const Permiso = require("../modules/permiso") // Importar el modelo de Permiso
const ExcelJS = require("exceljs") // Importar ExcelJS para generar archivos Excel
const { rolSchema, rolUpdateSchema } = require("../validators/rol.validator") // Importar los esquemas de validación


// Método GET para obtener los roles
const rolesGet = async (req, res = response) => {
  try {
    const roles = await Rol.find().populate("permisoRol") // Populate para mostrar detalles de permisos

    if (roles.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron roles en la base de datos",
      })
    }

    res.json({ roles })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al obtener los roles",
    })
  }
}

// Método POST para crear un nuevo rol
const rolesPost = async (req, res = response) => {

  const {error, value} = rolSchema.validate(req.body, {abortEarly: false}) // Validar los datos de entrada
  
  if (error) {
    return res.status(400).json({
      msg: error.details.map((err) => err.message),
    });
  }
  const { nombreRol, permisoRol, estadoRol } = value;
  
  const permisoArray = Array.isArray(permisoRol) ? permisoRol : [permisoRol]; // Asegúrate de que permisoRol sea un arreglo
  
  try {
    const permisosExistentes = await Permiso.find({_id: { $in:permisoArray }});
    if (permisosExistentes.length !== permisoArray.length) {
      return res.status(400).json({
        msg: "Uno o más permisos no existen.",
      });
    }
    
    const isAdmin = nombreRol.toLowerCase() === "admin" // Compara con "admin" en minúsculas

    const rol = new Rol({
      nombreRol,
      permisoRol: permisoArray,
      estadoRol,
      esAdmin: isAdmin,
    });
    await rol.save();
    res.status(201).json({
      msg: "Rol creado exitosamente",
      rol,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000){
      return res.status(400).json({
        msg: "Ya existe un rol con ese nombre",
      });
    }
    res.status(500).json({
      msg: "Error al crear el rol",
    });

  }
    
  // Extraer datos del cuerpo de la solicitud
  // const { nombreRol, permisoRol, estadoRol } = req.body // Extraer datos del cuerpo de la solicitud
  // console.log("Datos recibidos en backend:", { nombreRol, permisoRol, estadoRol })

  // //Validación del nombreRol 
  // const regexNombre = /^[a-zA-Z0-9\s]+$/ // Expresión regular para permitir solo letras, números y espacios
  
  // if (!nombreRol || nombreRol.trim()=== ""){
  //   return res.status(400).json({ msg: "El campo nombreRol es obligatorio." });
  // }
  
  // // Verificar que el nombreRol no contenga caracteres especiales
  // if (nombreRol.length < 5 || nombreRol.length > 30) {
  //   return res.status(400).json({ msg: "El campo nombreRol debe tener entre 5 y 30 caracteres." });
  // }

  // if (!regexNombre.test(nombreRol)) {
  //   return res.status(400).json({ msg: "El campo Nombre Rol solo puede contener letras, números y espacios." });
  // }

  // // Asegúrate de que permisoRol sea un arreglo
  // let permisosArray
  // if (typeof permisoRol === "string") {
  //   permisosArray = [permisoRol]
  // } else if (Array.isArray(permisoRol)) {
  //   permisosArray = permisoRol
  // } else {
  //   return res.status(400).json({
  //     msg: "El campo permisoRol debe ser un ID de permiso o un arreglo de IDs de permisos.",
  //   })
  // }

  // // Verificar que los IDs de permisos sean válidos
  // if (!permisosArray.every((id) => mongoose.Types.ObjectId.isValid(id))) {
  //   return res.status(400).json({
  //     msg: "Lista de permisos inválida o IDs de permisos no válidos.",
  //   })
  // }

  // // Verificar que todos los permisos existan
  // try {
  //   const permisosExistentes = await Permiso.find({ _id: { $in: permisosArray } })
  //   if (permisosExistentes.length !== permisosArray.length) {
  //     return res.status(400).json({
  //       msg: "Uno o más permisos no existen.",
  //     })
  //   }
  // } catch (error) {
  //   return res.status(500).json({
  //     msg: "Error al verificar permisos.",
  //   })
  // }

  // // Determinar si es un rol admin
  // const isAdmin = nombreRol.toLowerCase() === "admin" // Compara con "admin" en minúsculas

  // // Crear una nueva instancia del modelo Rol
  // const rol = new Rol({ nombreRol, permisoRol: permisosArray, estadoRol, esAdmin: isAdmin })

  // try {
  //   // Guardar el nuevo rol en la base de datos
  //   await rol.save()
  //   res.status(201).json({ msg: "Rol asignado correctamente", rol })
  // } catch (error) {
  //   console.log(error)
  //   if (error.name === "ValidationError") {
  //     console.error(Object.values(error.errors).map((val) => val.message))
  //     res.status(400).json({
  //       msg: Object.values(error.errors)
  //         .map((val) => val.message)
  //         .join(", "),
  //     })
  //   } else {
  //     res.status(500).json({ msg: "Error al crear el rol, No pueden haber 2 Roles con el mismo nombre" })
  //   }
  // }
}

// Método PUT para actualizar un rol por su id
const rolesPut = async (req, res = response) => {

  const {id} = req.params
  const schemaPut = rolSchema.fork(
    ["nombreRol", "permisoRol", "estadoRol"],
    (field) => field.optional()
  )

  const {error, value} = schemaPut.validate(req.body, {abortEarly: false}) // Validar los datos de entrada
  if (error) {
    return res.status(400).json({
      msg: error.details.map((e)=> e.message).join(", "),
    });
  }

  try{
    const rolExistente = await Rol.findById(id);
    console.log("ID recibido para actualizar:", id)
    if(!rolExistente){
      return res.status(404).json({
        msg: "Rol no encontrado",
      });
    }

    const { nombreRol, permisoRol, estadoRol } = value; // Extraer los valores validados

    if (nombreRol) {
      rolExistente.nombreRol = nombreRol;
      rolExistente.esAdmin = nombreRol.toLowerCase() === "admin"; // Actualizar esAdmin
    }

    if(permisoRol){
      const permisosArray = Array.isArray(permisoRol) ? permisoRol : [permisoRol]; // Asegúrate de que permisoRol sea un arreglo
      const permisosExistentes = await Permiso.find({ _id: { $in: permisosArray } });
      if (permisosExistentes.length !== permisosArray.length) {
        return res.status(400).json({
          msg: "Uno o más permisos no existen.",
        });
      }
      rolExistente.permisoRol = permisosArray;
    }
    
    if (estadoRol !== undefined) {
      rolExistente.estadoRol = estadoRol;
    }
    await rolExistente.save();

    res.json({ msg: "Rol actualizado exitosamente", rol: rolExistente });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al actualizar el rol",
    });
  }

  //   const { id } = req.params
//   const { nombreRol, permisoRol, estadoRol } = req.body // No necesitas esAdmin aquí, ya que se establece automáticamente

//   try {
//     // Verifica que el rol existe antes de actualizar
//     const rolExistente = await Rol.findById(id)
//     if (!rolExistente) {
//       return res.status(404).json({
//         msg: "Rol no encontrado",
//       })
//     }

//     // Actualiza los campos del rol
//     rolExistente.nombreRol = nombreRol || rolExistente.nombreRol
//     rolExistente.permisoRol = permisoRol || rolExistente.permisoRol
//     rolExistente.estadoRol = estadoRol !== undefined ? estadoRol : rolExistente.estadoRol

//     // Determinar si es un rol admin al actualizar
//     rolExistente.esAdmin = rolExistente.nombreRol.toLowerCase() === "admin"

//     await rolExistente.save()

//     res.json({
//       msg: "Rol actualizado exitosamente",
//       rol: rolExistente,
//     })
//   } catch (error) {
//     console.error(error)
//     res.status(500).json({
//       msg: "Error al actualizar el rol",
//     })
//   }
}

// Método para cambiar el estado de un rol (activar/desactivar)
const rolesToggleEstado = async (req, res = response) => {
  const { id } = req.params

  try {
    // Verificar si el rol con el id proporcionado existe
    const rol = await Rol.findById(id)
    if (!rol) {
      return res.status(404).json({
        msg: "Rol no encontrado",
      })
    }

    // Cambiar el estado del rol (de activo a inactivo o viceversa)
    rol.estadoRol = !rol.estadoRol
    await rol.save()

    res.json({
      msg: `Rol ${rol.estadoRol ? "activado" : "desactivado"} exitosamente`,
      rol,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      msg: "Error al cambiar el estado del rol",
      error: error.message,
    })
  }
}

// Método DELETE para eliminar un rol por su id
const rolesDelete = async (req, res = response) => {
  const { id } = req.params

  // Verificar si el rol con el id proporcionado existe
  const rol = await Rol.findById(id)
  if (!rol) {
    return res.status(404).json({
      msg: "Rol no encontrado",
    })
  }

  // Verificar si es un rol de Admin
  if (rol.nombreRol.toLowerCase() === "admin" || rol.esAdmin) {
    return res.status(403).json({
      msg: "No se puede eliminar el rol de Administrador",
      isAdminRole: true,
    })
  }

  await Rol.findByIdAndDelete(id)

  res.json({
    msg: "Rol eliminado",
  })
}

// Método para exportar roles a Excel
const rolesExportExcel = async (req, res = response) => {
  try {
    // Obtener todos los roles con sus permisos
    const roles = await Rol.find().populate("permisoRol")

    if (roles.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron roles para exportar",
      })
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Roles")

    // Definir las columnas
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre del Rol", key: "nombreRol", width: 30 },
      { header: "Estado", key: "estadoRol", width: 15 },
      { header: "Es Admin", key: "esAdmin", width: 15 },
      { header: "Permisos", key: "permisos", width: 50 },
    ]

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }

    // Agregar los datos
    roles.forEach((rol) => {
      // Obtener los nombres de los permisos
      const permisosNombres = rol.permisoRol.map((permiso) => permiso.nombrePermiso || "Permiso sin nombre").join(", ")

      worksheet.addRow({
        id: rol._id.toString(),
        nombreRol: rol.nombreRol,
        estadoRol: rol.estadoRol ? "Activo" : "Inactivo",
        esAdmin: rol.esAdmin ? "Sí" : "No",
        permisos: permisosNombres,
      })
    })

    // Configurar la respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=roles.xlsx")

    // Escribir el libro de Excel en la respuesta
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error al exportar roles a Excel:", error)
    res.status(500).json({
      msg: "Error al exportar roles a Excel",
      error: error.message,
    })
  }
}

module.exports = {
  rolesGet,
  rolesPost,
  rolesPut,
  rolesDelete,
  rolesToggleEstado,
  rolesExportExcel,
}
