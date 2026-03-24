const { response } = require("express")
const Tiposervicio = require("../modules/tiposerv.js")
const {tipoDescuentoSchema, tipoDescuentoUpdateSchema} = require("../validators/tipodescuento.validator.js")
// Obtener todos los descuentos
const tiposerviciosGet = async (req, res = response) => {
  try {
    const tiposervicios = await Tiposervicio.find() // Consultar todos los documentos de la colección

    // Si no hay descuentos en la base de datos
    if (tiposervicios.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron tipos de descuentos en la base de datos",
      })
    }

    // Devolvemos los descuetos obtenidos
    res.json({
      tiposervicios,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al obtener los tipos de descuentos",
    })
  }
}

// Crear un nuevo descuento
const tiposerviciosPost = async (req, res = response) => {
  
  const {error, value} = tipoDescuentoSchema.validate(req.body)
  if (error){
    return res.status(400).json({
      msg: "Error en la validación de los datos",
      errors: error.details.map(err=>err.message)
    });
  }

  const {nombreTs, activo, descuento = 0, esPromocional = false} = value // Extraer datos del cuerpo de la solicitud

  const tiposervicio = new Tiposervicio({ nombreTs, activo, descuento, esPromocional })
  try {
    await tiposervicio.save() // Guardar el nuevo tipo de servicio en la base de datos
    res.status(201).json({
      msg: "Tipo de servicio creado correctamente",
      tiposervicio,});}
      catch(err){
        console.error(err);
        res.status(500).json({
          msg: "Error al crear el tipo de servicio",
        });
      }
  
  
  // const { nombreTs, activo, descuento = 0, esPromocional = false } = req.body // Extraer datos del cuerpo de la solicitud

  // // Validar los datos recibidos
  // if (!nombreTs || activo === undefined) {
  //   return res.status(400).json({
  //     msg: "Nombre y estado activo del tipo de descuenno son obligatorios.",
  //   })
  // }

  // // Validar que el descuento sea un número entre 0 y 100
  // if (descuento < 0 || descuento > 100) {
  //   return res.status(400).json({
  //     msg: "El descuento debe ser un valor entre 0 y 100.",
  //   })
  // }

  // // Crear una nueva instancia del modelo descuento
  // const tiposervicio = new Tiposervicio({ nombreTs, activo, descuento, esPromocional })

  // try {
  //   // Guardar el nuevo permiso en la base de datos
  //   await tiposervicio.save()
  //   res.status(201).json({
  //     msg: "tiposervicio creado correctamente",
  //     tiposervicio,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({
  //     msg: "Error al crear el tipo de servicio",
  //   })
  // }
}

// Actualizar un tipo de servicio
const tiposerviciosPut = async (req, res = response) => {
  
  const {id} = req.params;

  const {error, value} = tipoDescuentoUpdateSchema.validate(req.body,{abortEarly: false});

  if (error){
    return res.status(400).json({
      msg: "Error en la validación de los datos",
      errors: error.details.map(err=>err.message)
    })
  }

  try{
    const tiposervicio = await Tiposervicio.findByIdAndUpdate(id);

    if(!tiposervicio){
      return res.status(404).json({
        msg: "Tipo de servicio no encontrado",
      })
    }

    if (value.nombreTs !== undefined) tiposervicio.nombreTs = value.nombreTs
    if (value.activo !== undefined) tiposervicio.activo = value.activo
    if (value.descuento !== undefined) tiposervicio.descuento = value.descuento
    if (value.esPromocional !== undefined) tiposervicio.esPromocional = value.esPromocional
    // Guardar los cambios
    await tiposervicio.save();
    res.json({
      msg: "Tipo de servicio actualizado correctamente",
      tiposervicio,
    });
  }
  catch (err){
    console.error(err);
    res.status(500).json({
      msg: "Error al actualizar el tipo de servicio",
    });
  }
    


  
  // const { id } = req.params
  // const { nombreTs, activo, descuento, esPromocional } = req.body

  // try {
  //   // Verificar si el tipo de servicio existe
  //   const tiposervicio = await Tiposervicio.findById(id)
  //   if (!tiposervicio) {
  //     return res.status(404).json({
  //       msg: "Tipo de servicio no encontrado",
  //     })
  //   }

  //   // Validar que el descuento sea un número entre 0 y 100
  //   if (descuento !== undefined && (descuento < 0 || descuento > 100)) {
  //     return res.status(400).json({
  //       msg: "El descuento debe ser un valor entre 0 y 100.",
  //     })
  //   }

  //   // Actualizar los campos
  //   if (nombreTs !== undefined) tiposervicio.nombreTs = nombreTs
  //   if (activo !== undefined) tiposervicio.activo = activo
  //   if (descuento !== undefined) tiposervicio.descuento = descuento
  //   if (esPromocional !== undefined) tiposervicio.esPromocional = esPromocional

  //   // Guardar los cambios
  //   await tiposervicio.save()

  //   res.json({
  //     msg: "Tipo de servicio actualizado correctamente",
  //     tiposervicio,
  //   })
  // } catch (error) {
  //   console.log(error)
  //   res.status(500).json({
  //     msg: "Error al actualizar el tipo de servicio",
  //   })
  // }
}

// Eliminar un tipo de servicio
const tiposerviciosDelete = async (req, res = response) => {
  const { id } = req.params

  try {
    const tiposervicio = await Tiposervicio.findByIdAndDelete(id)

    if (!tiposervicio) {
      return res.status(404).json({
        msg: "Tipo de servicio no encontrado",
      })
    }

    res.json({
      msg: "Tipo de servicio eliminado correctamente",
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al eliminar el tipo de servicio",
    })
  }
}

// Cambiar el estado de un tipo de servicio (activar/desactivar)
const tiposerviciosToggleEstado = async (req, res = response) => {
  const { id } = req.params

  try {
    const tiposervicio = await Tiposervicio.findById(id)

    if (!tiposervicio) {
      return res.status(404).json({
        msg: "Tipo de servicio no encontrado",
      })
    }

    // Cambiar el estado (invertir el valor actual)
    tiposervicio.activo = !tiposervicio.activo

    await tiposervicio.save()

    res.json({
      msg: `Tipo de servicio ${tiposervicio.activo ? "activado" : "desactivado"} correctamente`,
      tiposervicio,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al cambiar el estado del tipo de servicio",
    })
  }
}

module.exports = {
  tiposerviciosGet,
  tiposerviciosPost,
  tiposerviciosPut,
  tiposerviciosDelete,
  tiposerviciosToggleEstado,
}

