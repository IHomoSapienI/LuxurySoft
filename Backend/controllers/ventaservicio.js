const { response } = require("express")
const Ventaservicio = require("../modules/ventaservicio")
const Contador = require("../modules/contador")
const Cita = require("../modules/cita")
const Cliente = require("../modules/cliente")
const Servicio = require("../modules/servicio")
const Empleado = require("../modules/empleado")

// Función para obtener el siguiente código de venta
const obtenerSiguienteCodigoVenta = async () => {
  const contador = await Contador.findOneAndUpdate(
    { nombre: "ventaservicio" },
    { $inc: { secuencia: 1 } },
    { new: true, upsert: true },
  )

  // Formatear el número con ceros a la izquierda (ej: V0001)
  const codigoFormateado = `V${contador.secuencia.toString().padStart(4, "0")}`
  return codigoFormateado
}

// Obtener todas las ventas de servicios
const ventaserviciosGet = async (req, res = response) => {
  try {
    const ventaservicios = await Ventaservicio.find()
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente") // Actualizado para incluir apellido, correo y celular
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita",
      })
      .populate("servicios.servicio", "nombreServicio precio tiempo")
      .lean()

    if (ventaservicios.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron ventas de servicios en la base de datos",
      })
    }

    // Formatear los datos para que se muestren correctamente
    const ventasFormateadas = ventaservicios.map((venta) => ({
      ...venta,
      cliente: venta.cliente
        ? {
            _id: venta.cliente._id,
            nombrecliente: venta.cliente.nombrecliente || "Nombre no disponible",
            apellidocliente: venta.cliente.apellidocliente || "Apellido no disponible",
            correocliente: venta.cliente.correocliente || "Correo no disponible",
            celularcliente: venta.cliente.celularcliente || "Celular no disponible",
          }
        : null,
      cita: venta.cita
        ? {
            _id: venta.cita._id,
            fechacita: venta.cita.fechacita || "Fecha no disponible",
          }
        : null,
      empleado: venta.empleado
        ? {
            _id: venta.empleado._id,
            nombreempleado: venta.empleado.nombreempleado || "Nombre no disponible",
          }
        : null,
      servicios: Array.isArray(venta.servicios)
        ? venta.servicios.map((servicio) => ({
            ...servicio,
            servicio: servicio.servicio
              ? {
                  _id: servicio.servicio._id,
                  nombreServicio: servicio.servicio.nombreServicio || "Servicio no especificado",
                  precio: servicio.precio,
                  tiempo: servicio.tiempo,
                }
              : null,
          }))
        : [],
    }))

    res.json({ ventaservicios: ventasFormateadas })
  } catch (error) {
    console.error("Error al obtener las ventas de los servicios:", error)
    res.status(500).json({
      msg: "Error al obtener las ventas de los servicios",
      error: error.message,
    })
  }
}

// Crear una nueva venta de servicio
const ventaserviciosPost = async (req, res = response) => {
  const { cita, cliente, empleado, servicios, precioTotal, estado } = req.body

  // Verificación de campos obligatorios
  if (!cita || !cliente || !empleado || !servicios || !precioTotal || estado === undefined) {
    return res.status(400).json({
      msg: "Cita, cliente, empleado, servicios, precio total y estado son obligatorios.",
    })
  }

  try {
    const [existeCita, existeCliente, existeEmpleado] = await Promise.all([
      Cita.findById(cita),
      Cliente.findById(cliente),
      Empleado.findById(empleado),
    ])

    if (!existeCita || !existeCliente || !existeEmpleado) {
      return res.status(400).json({
        msg: "La cita, el cliente o el empleado especificado no existe en la base de datos.",
      })
    }

    // Validar los servicios
    const serviciosIds = servicios.map((servicio) => servicio.servicio)
    const serviciosValidos = await Servicio.find({ _id: { $in: serviciosIds } })

    if (serviciosValidos.length !== servicios.length) {
      return res.status(400).json({
        msg: "Uno o más servicios no existen en la base de datos.",
      })
    }

    const serviciosConTiempo = serviciosValidos.map((servicio) => ({
      servicio: servicio._id,
      nombreServicio: servicio.nombreServicio,
      precio: servicio.precio,
      tiempo: servicio.tiempo,
    }))

    // Obtener el siguiente código de venta
    const codigoVenta = await obtenerSiguienteCodigoVenta()

    const ventaservicio = new Ventaservicio({
      codigoVenta,
      cita,
      cliente,
      empleado,
      servicios: serviciosConTiempo,
      precioTotal,
      estado,
    })

    await ventaservicio.save()

    res.status(201).json({
      msg: "Venta de servicio creada correctamente",
      ventaservicio,
    })
  } catch (error) {
    console.error("Error al crear la venta de servicio:", error)
    res.status(500).json({
      msg: "Error al crear la venta de servicio",
      error: error.message,
    })
  }
}

// Actualizar una venta de servicio
const ventaserviciosPut = async (req, res = response) => {
  const { id } = req.params
  const { cita, cliente, empleado, servicios, precioTotal, estado } = req.body

  // Verificación de campos obligatorios
  if (!cita || !cliente || !empleado || !servicios || !precioTotal || estado === undefined) {
    return res.status(400).json({
      msg: "Cita, cliente, empleado, servicios, precio total y estado son obligatorios.",
    })
  }

  try {
    const venta = await Ventaservicio.findById(id)
    if (!venta) {
      return res.status(404).json({
        msg: "Venta de servicio no encontrada",
      })
    }

    const [existeCita, existeCliente, existeEmpleado] = await Promise.all([
      Cita.findById(cita),
      Cliente.findById(cliente),
      Empleado.findById(empleado),
    ])

    if (!existeCita || !existeCliente || !existeEmpleado) {
      return res.status(400).json({
        msg: "La cita, el cliente o el empleado especificado no existe en la base de datos.",
      })
    }

    const serviciosIds = servicios.map((servicio) => servicio.servicio)
    const serviciosValidos = await Servicio.find({ _id: { $in: serviciosIds } })

    if (serviciosValidos.length !== servicios.length) {
      return res.status(400).json({
        msg: "Uno o más servicios no existen en la base de datos.",
      })
    }

    const serviciosConTiempo = serviciosValidos.map((servicio) => ({
      servicio: servicio._id,
      nombreServicio: servicio.nombreServicio,
      precio: servicio.precio,
      tiempo: servicio.tiempo,
    }))

    // Actualizar los campos
    venta.cita = cita
    venta.cliente = cliente
    venta.empleado = empleado
    venta.servicios = serviciosConTiempo
    venta.precioTotal = precioTotal
    venta.estado = estado

    await venta.save()

    res.json({
      msg: "Venta de servicio actualizada correctamente",
      venta,
    })
  } catch (error) {
    console.error("Error al actualizar la venta de servicio:", error)
    res.status(500).json({
      msg: "Error al actualizar la venta de servicio",
    })
  }
}

// Eliminar una venta de servicio
const ventaserviciosDelete = async (req, res = response) => {
  const { id } = req.params

  try {
    const result = await Ventaservicio.findByIdAndDelete(id)
    if (!result) {
      return res.status(404).json({
        msg: "Venta de servicio no encontrada",
      })
    }

    res.json({
      msg: "Venta de servicio eliminada correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar la venta de servicio:", error)
    res.status(500).json({
      msg: "Error al eliminar la venta de servicio",
    })
  }
}

// Añadir servicios a una venta existente
const agregarServiciosVenta = async (req, res = response) => {
  const { id } = req.params;
  const { servicios } = req.body;
  
  if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
      return res.status(400).json({
          msg: "Debe proporcionar al menos un servicio para añadir."
      });
  }
  
  try {
      // Cambiar VentaServicio a Ventaservicio
      const venta = await Ventaservicio.findById(id);
      if (!venta) {
          return res.status(404).json({
              msg: "Venta de servicio no encontrada"
          });
      }
      
      // Validar los servicios nuevos
      const serviciosIds = servicios.map(s => s.servicio);
      const serviciosValidos = await Servicio.find({ _id: { $in: serviciosIds } });
      
      if (serviciosValidos.length !== servicios.length) {
          return res.status(400).json({
              msg: "Uno o más servicios no existen en la base de datos."
          });
      }
      
      // Añadir los nuevos servicios a la venta
      venta.servicios = [...venta.servicios, ...servicios];
      
      // Recalcular el precio total
      venta.precioTotal = venta.servicios.reduce((total, s) => total + s.precio, 0);
      
      await venta.save();
      
      res.json({
          msg: "Servicios añadidos correctamente",
          venta
      });
  } catch (error) {
      console.error("Error al añadir servicios a la venta:", error);
      res.status(500).json({
          msg: "Error al añadir servicios a la venta",
          error: error.message
      });
  }
};

// Finalizar venta (completar la cita y marcar la venta como finalizada)
// Finalizar venta (completar la cita y marcar la venta como finalizada)
const finalizarVenta = async (req, res = response) => {
  const { id } = req.params;
  const { metodoPago } = req.body;
  
  try {
      const venta = await Ventaservicio.findById(id);
      if (!venta) {
          return res.status(404).json({
              msg: "Venta de servicio no encontrada"
          });
      }
      
      // Actualizar la cita a "Completada"
      if (venta.cita) {
          // Usar findByIdAndUpdate con runValidators: false para evitar la validación
          await Cita.findByIdAndUpdate(
              venta.cita,
              { estadocita: 'Completada' },
              { 
                  new: true,
                  runValidators: false // Esto evita la validación del esquema
              }
          );
      }
      
      // Añadir información de pago a la venta
      venta.metodoPago = metodoPago || 'Efectivo';
      venta.fechaFinalizacion = new Date(); // Usar fechaFinalizacion en lugar de fecha
      
      await venta.save();
      
      res.json({
          msg: "Venta finalizada correctamente",
          venta
      });
  } catch (error) {
      console.error("Error al finalizar la venta:", error);
      res.status(500).json({
          msg: "Error al finalizar la venta",
          error: error.message
      });
  }
};

module.exports = {
  ventaserviciosGet,
  ventaserviciosPost,
  ventaserviciosPut,
  ventaserviciosDelete,
  agregarServiciosVenta,
  finalizarVenta
}

