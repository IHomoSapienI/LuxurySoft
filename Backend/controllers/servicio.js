const { response } = require("express")
const Servicio = require("../modules/servicio")
const TipoServicio = require("../modules/tiposerv")
const TsSchema = require("../modules/tiposervicios")
const {servicioSchema ,servicioUpdateSchema} = require("../validators/servicio.validator")
const mongoose = require("mongoose")
// Obtener todos los servicios
const serviciosGet = async (req, res = response) => {
  
   try {
    const servicios = await Servicio.find()
      .populate('tipoServicio', 'nombreTs descuento esPromocional activo')
      .populate('tipoServicio2', 'nombreTipoServicio activo');

    if (servicios.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron servicios en la base de datos",
      });
    }

    res.json({
      servicios,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Error al obtener los servicios",
    });
  }
  
  // try {
  //   const servicios = await Servicio.find().populate("tipoServicio", "nombreTs") // Poblamos el tipoServicio para obtener más detalles

  //   if (servicios.length === 0) {
  //     return res.status(404).json({
  //       msg: "No se encontraron servicios en la base de datos",
  //     })
  //   }

  //   res.json({
  //     servicios,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({
  //     msg: "Error al obtener los servicios",
  //   })
  // }
}

// Validar que el nombre del servicio no esté duplicado
const validarNombreServicio = async (req, res) => {
  try {
    const { nombre } = req.query;

    if (!nombre) {
      return res.status(400).json({ msg: "El nombre es requerido." });
    }

    const servicioExistente = await Servicio.findOne({ nombreServicio: nombre.trim() });

    if (servicioExistente) {
      return res.status(409).json({
        msg: "El nombre del servicio ya está en uso.",
      });
    }

    // Nombre disponible
    return res.status(200).json({ msg: "Nombre disponible." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al validar el nombre del servicio" });
  }
};




// Crear un nuevo servicio
const serviciosPost = async (req, res = response) => {
  

  if (req.file) {
  req.body.imagenUrl = req.file.filename;
}

  const { error, value } = servicioSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      msg: "Error en validación de datos.",
      errors: error.details.map(e => e.message)
    });
  }

  const { nombreServicio, descripcion, precio, tiempo, tipoServicio, tipoServicio2, estado } = value;
  const imagenUrl = `https://gitbf.onrender.com/uploads/${req.file.filename}`; // nombre del archivo guardado

  try {
    // Verificar que tipoServicio(s) existan en DB
    const tipos = Array.isArray(tipoServicio) ? tipoServicio : [tipoServicio];
    
    for (const tipoId of tipos) {
      const existeTipoServicio = await TipoServicio.findById(tipoId);
      if (!existeTipoServicio) {
        return res.status(400).json({
          msg: `El tipo de servicio con ID ${tipoId} no existe.`,
        });
      }
    }

    // Verificar que tipoServicio2 exista en DB
    if(tipoServicio2){
      const tipos2 = Array.isArray(tipoServicio2) ? tipoServicio2 : [tipoServicio2];
      for (const tipoId2 of tipos2){
        const existeTipoServicio2 = await TsSchema.findById(tipoId2);
        if (!existeTipoServicio2) {
          return res.status(400).json({
            msg: `El tipo de servicio con ID ${tipoId2} no existe.`,
          });
        }
      }
    }

    const servicio = new Servicio({
      nombreServicio,
      descripcion,
      precio,
      tiempo,
      tipoServicio,
      tipoServicio2,
      estado,
      imagenUrl,
    });

    await servicio.save();

    res.status(201).json({
      msg: "Servicio creado correctamente",
      servicio,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Error al crear el servicio",
    });
  }
  
  
  // const { nombreServicio, descripcion, precio, tiempo, tipoServicio, estado } = req.body

  // if (
  //   !nombreServicio ||
  //   !descripcion ||
  //   precio === undefined ||
  //   tiempo === undefined ||
  //   !tipoServicio ||
  //   estado === undefined ||
  //   !req.file
  // ) {
  //   return res.status(400).json({
  //     msg: "Nombre, descripción, precio, tiempo, tipo de servicio, estado e imagen son obligatorios.",
  //   })
  // }

  // const imagenUrl = req.file.filename // Solo guardamos el nombre del archivo

  // try {
  //   const existeTipoServicio = await TipoServicio.findById(tipoServicio)
  //   if (!existeTipoServicio) {
  //     return res.status(400).json({
  //       msg: "El tipo de servicio especificado no existe en la base de datos.",
  //     })
  //   }

  //   const servicio = new Servicio({ nombreServicio, descripcion, precio, tiempo, tipoServicio, estado, imagenUrl })
  //   await servicio.save()
  //   res.status(201).json({
  //     msg: "Servicio creado correctamente",
  //     servicio,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({
  //     msg: "Error al crear el servicio",
  //   })
  // }
}

// Actualizar un servicio
const serviciosPut = async (req, res = response) => {

  const { id } = req.params;

  
  // Validar que id es válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "ID de servicio inválido." });
  }

  // Validar solo los campos recibidos (parciales)
  // Para eso, podemos validar con `servicioSchema` pero con `.fork()` para hacer todo opcional
  const partialSchema = servicioSchema.fork(
    ['nombreServicio', 'descripcion', 'precio', 'tiempo', 'tipoServicio', 'tipoServicio2', 'estado', 'imagenUrl'],
    (schema) => schema.optional()
  );

  // Construimos un objeto para validar, incluyendo imagenUrl solo si hay req.file
  const dataToValidate = { ...req.body };
  if (req.file) {
    dataToValidate.imagenUrl = req.file.filename;
  }

  const { error, value } = partialSchema.validate(dataToValidate, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      msg: "Error en validación de datos.",
      errors: error.details.map(e => e.message)
    });
  }

  try {
    const servicio = await Servicio.findById(id);

    if (!servicio) {
      return res.status(404).json({
        msg: "Servicio no encontrado",
      });
    }

    // Validar tipoServicio si viene en la actualización
    if (value.tipoServicio) {
      const tipos = Array.isArray(value.tipoServicio) ? value.tipoServicio : [value.tipoServicio];
      for (const tipoId of tipos) {
        const existeTipoServicio = await TipoServicio.findById(tipoId);
        if (!existeTipoServicio) {
          return res.status(400).json({
            msg: `El tipo de servicio con ID ${tipoId} no existe.`,
          });
        }
      }
    }


    // Validar tipoServicio2 si viene en la actualización
    if (value.tipoServicio2) {
      const existeTipoServicio = await TsSchema.findById(value.tipoServicio2);
      if (!existeTipoServicio) {
        return res.status(400).json({
          msg: `El tipo de servicio con ID ${value.tipoServicio2} no existe.`,
        });
      }
    }

    // Actualizar solo los campos recibidos y validados
    Object.assign(servicio, value);

    await servicio.save();

    res.json({
      msg: "Servicio actualizado correctamente",
      servicio,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Error al actualizar el servicio",
    });
  }


  // const { id } = req.params
  // const { nombreServicio, descripcion, precio, tiempo, tipoServicio, estado } = req.body
  // const imagenUrl = req.file ? req.file.filename : undefined // Actualizamos si hay nueva imagen

  // try {
  //   const servicio = await Servicio.findById(id)

  //   if (!servicio) {
  //     return res.status(404).json({
  //       msg: "Servicio no encontrado",
  //     })
  //   }

  //   // Actualizamos solo los campos que hayan sido proporcionados
  //   servicio.nombreServicio = nombreServicio || servicio.nombreServicio
  //   servicio.descripcion = descripcion || servicio.descripcion
  //   servicio.precio = precio !== undefined ? precio : servicio.precio
  //   servicio.tiempo = tiempo !== undefined ? tiempo : servicio.tiempo
  //   servicio.tipoServicio = tipoServicio || servicio.tipoServicio
  //   servicio.estado = estado !== undefined ? estado : servicio.estado
  //   if (imagenUrl) servicio.imagenUrl = imagenUrl // Actualizamos la imagen si hay nueva

  //   await servicio.save()
  //   res.json({
  //     msg: "Servicio actualizado correctamente",
  //     servicio,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({
  //     msg: "Error al actualizar el servicio",
  //   })
  // }
}

// Eliminar un servicio
const serviciosDelete = async (req, res = response) => {
  const { id } = req.params

  try {
    const servicio = await Servicio.findByIdAndDelete(id)

    if (!servicio) {
      return res.status(404).json({
        msg: "Servicio no encontrado",
      })
    }

    res.json({
      msg: "Servicio eliminado correctamente",
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al eliminar el servicio",
    })
  }
}

// Exportar servicios a Excel
const serviciosExportExcel = async (req, res = response) => {
  try {
    // Obtener todos los servicios
    const servicios = await Servicio.find().populate("tipoServicio", "nombreTs")
    .populate("tipoServicio2", "nombreTipoServicio");

    if (servicios.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron servicios para exportar",
      })
    }

    // Crear un nuevo libro de Excel
    const ExcelJS = require("exceljs")
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Servicios")

    // Definir las columnas
    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Tipo de Servicio", key: "tipoServicio", width: 20 },
      { header: "Tipo de Servicio 2", key: "tipoServicio2", width: 20 },
      
      { header: "Precio", key: "precio", width: 15 },
      { header: "Tiempo (min)", key: "tiempo", width: 15 },
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
    servicios.forEach((servicio) => {
      worksheet.addRow({
        id: servicio._id.toString(),
        nombre: servicio.nombreServicio,
        descripcion: servicio.descripcion,
        tipoServicio: servicio.tipoServicio ? servicio.tipoServicio.nombreTs : "No definido",
        tipoServicio2: servicio.tipoServicio2 ? servicio.tipoServicio2.nombreTipoServicio : "No definido",
        precio: Number.parseFloat(servicio.precio).toFixed(2),
        tiempo: servicio.tiempo,
        estado: servicio.estado ? "Activo" : "Inactivo",
      })
    })

    // Configurar la respuesta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=servicios.xlsx")

    // Escribir el libro de Excel en la respuesta
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error al exportar servicios a Excel:", error)
    res.status(500).json({
      msg: "Error al exportar servicios a Excel",
      error: error.message,
    })
  }
}

// Cambiar el estado de un servicio (activar/desactivar)
const serviciosToggleEstado = async (req, res = response) => {
  const { id } = req.params

  try {
    const servicio = await Servicio.findById(id)

    if (!servicio) {
      return res.status(404).json({
        msg: "Servicio no encontrado",
      })
    }

    // Cambiar el estado (invertir el valor actual)
    servicio.estado = !servicio.estado

    await servicio.save()

    res.json({
      msg: `Servicio ${servicio.estado ? "activado" : "desactivado"} correctamente`,
      servicio,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al cambiar el estado del servicio",
    })
  }
}

module.exports = {
  serviciosGet,
  serviciosPost,
  serviciosPut,
  serviciosDelete,
  serviciosExportExcel,
  serviciosToggleEstado,
  validarNombreServicio
}

