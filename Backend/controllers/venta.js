const { response } = require("express");
const Venta = require("../modules/venta");
const Contador = require("../modules/contador");
const Cita = require("../modules/cita");
const Cliente = require("../modules/cliente");
const Servicio = require("../modules/servicio");
const Producto = require("../modules/producto");
const Empleado = require("../modules/empleado");

// Función para obtener el siguiente código de venta
const obtenerSiguienteCodigoVenta = async () => {
  const contador = await Contador.findOneAndUpdate(
    { nombre: "venta" },
    { $inc: { secuencia: 1 } },
    { new: true, upsert: true }
  );
  return `V${contador.secuencia.toString().padStart(4, "0")}`;
};

// Obtener todas las ventas
const obtenerVentas = async (req, res = response) => {
  try {
    const ventas = await Venta.find()
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita",
      })
      .populate("productos.producto", "nombreProducto precio stock categoria")
      .populate("servicios.servicio", "nombreServicio precio tiempo")
      .populate("descuentos.servicioId", "nombreServicio")
      .sort({ fechaCreacion: -1 })
      .lean();

    if (ventas.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron ventas en la base de datos",
      });
    }

    res.json({ ventas });
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    res.status(500).json({
      msg: "Error al obtener las ventas",
      error: error.message,
    });
  }
};

// Obtener una venta por ID
const obtenerVentaPorId = async (req, res = response) => {
  const { id } = req.params;

  try {
    const venta = await Venta.findById(id)
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio");

    if (!venta) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    res.json({ venta });
  } catch (error) {
    console.error("Error al obtener la venta:", error);
    res.status(500).json({
      msg: "Error al obtener la venta",
      error: error.message,
    });
  }
};

// Crear una nueva venta con soporte para descuentos
const crearVenta = async (req, res = response) => {
  try {
    const { cliente, empleado, cita, productos, servicios, metodoPago, estado, observaciones, descuentos = [] } = req.body;

    // Validación básica
    if ((!productos || productos.length === 0) && (!servicios || servicios.length === 0)) {
      return res.status(400).json({
        msg: "La venta debe incluir al menos un producto o un servicio",
      });
    }

    // Verificar cliente y empleado
    const [existeCliente, existeEmpleado] = await Promise.all([
      Cliente.findById(cliente),
      Empleado.findById(empleado)
    ]);

    if (!existeCliente || !existeEmpleado) {
      return res.status(400).json({
        msg: "El cliente o el empleado especificado no existe en la base de datos",
      });
    }

    // Verificar cita si se proporciona
    let existeCita = null;
    if (cita) {
      existeCita = await Cita.findById(cita);
      if (!existeCita) {
        return res.status(400).json({
          msg: "La cita especificada no existe en la base de datos",
        });
      }
    }

    // Procesar productos
    const productosValidados = [];
    if (productos && productos.length > 0) {
      const productosIds = productos.map((p) => p.producto);
      const productosDB = await Producto.find({ _id: { $in: productosIds } });

      if (productosDB.length !== productosIds.length) {
        return res.status(400).json({
          msg: "Uno o más productos no existen en la base de datos",
        });
      }

      for (const productoItem of productos) {
        const productoDB = productosDB.find((p) => p._id.toString() === productoItem.producto);

        if (productoDB.stock < productoItem.cantidad) {
          return res.status(400).json({
            msg: `Stock insuficiente para el producto ${productoDB.nombreProducto}. Disponible: ${productoDB.stock}`,
          });
        }

        const precio = productoItem.precio || productoDB.precio;
        const subtotal = precio * productoItem.cantidad;

        productosValidados.push({
          producto: productoDB._id,
          nombreProducto: productoDB.nombreProducto,
          precio: precio,
          cantidad: productoItem.cantidad,
          subtotal: subtotal,
        });

        // Actualizar stock
        productoDB.stock -= productoItem.cantidad;
        await productoDB.save();
      }
    }

    // Procesar servicios con descuentos
    const serviciosValidados = [];
    if (servicios && servicios.length > 0) {
      const serviciosIds = servicios.map((s) => s.servicio);
      const serviciosDB = await Servicio.find({ _id: { $in: serviciosIds } })
        .populate('tipoServicio', 'descuento esPromocional');

      if (serviciosDB.length !== serviciosIds.length) {
        return res.status(400).json({
          msg: "Uno o más servicios no existen en la base de datos",
        });
      }

      for (const servicioItem of servicios) {
        const servicioDB = serviciosDB.find((s) => s._id.toString() === servicioItem.servicio);
        const precioOriginal = servicioItem.precio || servicioDB.precio;
        
        // Buscar descuento aplicado a este servicio
        const descuentoServicio = descuentos.find(d => d.tipo === 'servicio' && d.servicioId === servicioItem.servicio);
        
        // Calcular descuento
        let descuentoAplicado = 0;
        let tipoDescuento = null;
        
        if (descuentoServicio) {
          descuentoAplicado = descuentoServicio.esPorcentaje ? 
            (precioOriginal * descuentoServicio.valor / 100) : 
            descuentoServicio.valor;
          tipoDescuento = descuentoServicio.tipo;
        } else if (servicioDB.tipoServicio?.descuento) {
          descuentoAplicado = precioOriginal * servicioDB.tipoServicio.descuento / 100;
          tipoDescuento = servicioDB.tipoServicio.esPromocional ? 'promocional' : 'tipo-servicio';
        }

        const precioFinal = precioOriginal - descuentoAplicado;

        serviciosValidados.push({
          servicio: servicioDB._id,
          nombreServicio: servicioDB.nombreServicio,
          precio: precioOriginal,
          precioFinal: precioFinal,
          tiempo: servicioDB.tiempo,
          descuentoAplicado: descuentoAplicado,
          tipoDescuento: tipoDescuento
        });
      }
    }

    // Procesar descuentos globales
    const descuentosValidados = [];
    let descuentoTotalGlobal = 0;

    if (descuentos && descuentos.length > 0) {
      for (const descuento of descuentos) {
        if (descuento.tipo === 'global') {
          let montoDescontado = 0;
          const subtotalServicios = serviciosValidados.reduce((total, item) => total + item.precio, 0);
          const subtotalProductos = productosValidados.reduce((total, item) => total + item.subtotal, 0);
          const precioOriginal = subtotalServicios + subtotalProductos;

          if (descuento.esPorcentaje) {
            montoDescontado = precioOriginal * descuento.valor / 100;
          } else {
            montoDescontado = Math.min(descuento.valor, precioOriginal);
          }

          descuentoTotalGlobal += montoDescontado;

          descuentosValidados.push({
            ...descuento,
            montoDescontado: montoDescontado
          });
        } else if (descuento.tipo === 'servicio') {
          // Ya procesados en los servicios
          descuentosValidados.push(descuento);
        }
      }
    }

    // Calcular totales
    const subtotalProductos = productosValidados.reduce((total, item) => total + item.subtotal, 0);
    const subtotalServicios = serviciosValidados.reduce((total, item) => total + item.precio, 0);
    const precioOriginal = subtotalProductos + subtotalServicios;
    const descuentoTotalServicios = serviciosValidados.reduce((total, item) => total + item.descuentoAplicado, 0);
    const descuentoTotal = descuentoTotalServicios + descuentoTotalGlobal;
    const total = Math.max(0, precioOriginal - descuentoTotal);

    // Crear la venta
    const venta = new Venta({
      codigoVenta: await obtenerSiguienteCodigoVenta(),
      cliente,
      empleado,
      cita,
      productos: productosValidados,
      servicios: serviciosValidados,
      descuentos: descuentosValidados,
      subtotalProductos,
      subtotalServicios,
      precioOriginal,
      descuentoTotal,
      total,
      metodoPago: metodoPago || 'Efectivo',
      estado: estado !== undefined ? estado : false,
      observaciones,
    });

    // Si la venta está completada, actualizar la cita
    if (estado && cita) {
      await Cita.findByIdAndUpdate(
        cita,
        { estadocita: "Completada" },
        { new: true, runValidators: false }
      );
      venta.fechaFinalizacion = new Date();
    }

    await venta.save();

    // Obtener la venta con los datos populados
    const ventaCompleta = await Venta.findById(venta._id)
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio")
      .exec();
    res.status(201).json({
      msg: "Venta creada correctamente",
      venta: ventaCompleta,
    });
  } catch (error) {
    console.error("Error al crear la venta:", error);
    res.status(500).json({
      msg: "Error al crear la venta",
      error: error.message,
    });
  }
};

// Actualizar una venta con soporte para descuentos
const actualizarVenta = async (req, res = response) => {
  const { id } = req.params;
  const { cliente, empleado, cita, productos, servicios, metodoPago, estado, observaciones, descuentos = [] } = req.body;

  try {
    const ventaExistente = await Venta.findById(id).populate("productos.producto").populate("servicios.servicio");

    if (!ventaExistente) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    // Validación básica
    if ((!productos || productos.length === 0) && (!servicios || servicios.length === 0)) {
      return res.status(400).json({
        msg: "La venta debe incluir al menos un producto o un servicio",
      });
    }

    // Verificar cliente y empleado si se proporcionan
    if (cliente) {
      const existeCliente = await Cliente.findById(cliente);
      if (!existeCliente) {
        return res.status(400).json({
          msg: "El cliente especificado no existe en la base de datos",
        });
      }
    }

    if (empleado) {
      const existeEmpleado = await Empleado.findById(empleado);
      if (!existeEmpleado) {
        return res.status(400).json({
          msg: "El empleado especificado no existe en la base de datos",
        });
      }
    }

    // Verificar cita si se proporciona
    if (cita) {
      const existeCita = await Cita.findById(cita);
      if (!existeCita) {
        return res.status(400).json({
          msg: "La cita especificada no existe en la base de datos",
        });
      }
    }

    // Restaurar stock de productos anteriores
    if (ventaExistente.productos && ventaExistente.productos.length > 0) {
      for (const productoItem of ventaExistente.productos) {
        const producto = await Producto.findById(productoItem.producto._id);
        if (producto) {
          producto.stock += productoItem.cantidad;
          await producto.save();
        }
      }
    }

    // Procesar nuevos productos
    const productosValidados = [];
    if (productos && productos.length > 0) {
      const productosIds = productos.map((p) => p.producto);
      const productosDB = await Producto.find({ _id: { $in: productosIds } });

      if (productosDB.length !== productosIds.length) {
        // Restaurar el estado original en caso de error
        if (ventaExistente.productos && ventaExistente.productos.length > 0) {
          for (const productoItem of ventaExistente.productos) {
            const producto = await Producto.findById(productoItem.producto._id);
            if (producto) {
              producto.stock -= productoItem.cantidad;
              await producto.save();
            }
          }
        }

        return res.status(400).json({
          msg: "Uno o más productos no existen en la base de datos",
        });
      }

      for (const productoItem of productos) {
        const productoDB = productosDB.find((p) => p._id.toString() === productoItem.producto);

        if (productoDB.stock < productoItem.cantidad) {
          // Restaurar el estado original en caso de error
          if (ventaExistente.productos && ventaExistente.productos.length > 0) {
            for (const productoItem of ventaExistente.productos) {
              const producto = await Producto.findById(productoItem.producto._id);
              if (producto) {
                producto.stock -= productoItem.cantidad;
                await producto.save();
              }
            }
          }

          return res.status(400).json({
            msg: `Stock insuficiente para el producto ${productoDB.nombreProducto}. Disponible: ${productoDB.stock}`,
          });
        }

        const precio = productoItem.precio || productoDB.precio;
        const subtotal = precio * productoItem.cantidad;

        productosValidados.push({
          producto: productoDB._id,
          nombreProducto: productoDB.nombreProducto,
          precio: precio,
          cantidad: productoItem.cantidad,
          subtotal: subtotal,
        });

        productoDB.stock -= productoItem.cantidad;
        await productoDB.save();
      }
    }

    // Procesar servicios con descuentos
    const serviciosValidados = [];
    if (servicios && servicios.length > 0) {
      const serviciosIds = servicios.map((s) => s.servicio);
      const serviciosDB = await Servicio.find({ _id: { $in: serviciosIds } })
        .populate('tipoServicio', 'descuento esPromocional');

      if (serviciosDB.length !== serviciosIds.length) {
        // Restaurar el estado original en caso de error
        if (ventaExistente.productos && ventaExistente.productos.length > 0) {
          for (const productoItem of ventaExistente.productos) {
            const producto = await Producto.findById(productoItem.producto._id);
            if (producto) {
              producto.stock -= productoItem.cantidad;
              await producto.save();
            }
          }
        }

        return res.status(400).json({
          msg: "Uno o más servicios no existen en la base de datos",
        });
      }

      for (const servicioItem of servicios) {
        const servicioDB = serviciosDB.find((s) => s._id.toString() === servicioItem.servicio);
        const precioOriginal = servicioItem.precio || servicioDB.precio;
        
        // Buscar descuento aplicado a este servicio
        const descuentoServicio = descuentos.find(d => d.tipo === 'servicio' && d.servicioId === servicioItem.servicio);
        
        // Calcular descuento
        let descuentoAplicado = 0;
        let tipoDescuento = null;
        
        if (descuentoServicio) {
          descuentoAplicado = descuentoServicio.esPorcentaje ? 
            (precioOriginal * descuentoServicio.valor / 100) : 
            descuentoServicio.valor;
          tipoDescuento = descuentoServicio.tipo;
        } else if (servicioDB.tipoServicio?.descuento) {
          descuentoAplicado = precioOriginal * servicioDB.tipoServicio.descuento / 100;
          tipoDescuento = servicioDB.tipoServicio.esPromocional ? 'promocional' : 'tipo-servicio';
        }

        const precioFinal = precioOriginal - descuentoAplicado;

        serviciosValidados.push({
          servicio: servicioDB._id,
          nombreServicio: servicioDB.nombreServicio,
          precio: precioOriginal,
          precioFinal: precioFinal,
          tiempo: servicioDB.tiempo,
          descuentoAplicado: descuentoAplicado,
          tipoDescuento: tipoDescuento
        });
      }
    }

    // Procesar descuentos globales
    const descuentosValidados = [];
    let descuentoTotalGlobal = 0;

    if (descuentos && descuentos.length > 0) {
      for (const descuento of descuentos) {
        if (descuento.tipo === 'global') {
          let montoDescontado = 0;
          const subtotalServicios = serviciosValidados.reduce((total, item) => total + item.precio, 0);
          const subtotalProductos = productosValidados.reduce((total, item) => total + item.subtotal, 0);
          const precioOriginal = subtotalServicios + subtotalProductos;

          if (descuento.esPorcentaje) {
            montoDescontado = precioOriginal * descuento.valor / 100;
          } else {
            montoDescontado = Math.min(descuento.valor, precioOriginal);
          }

          descuentoTotalGlobal += montoDescontado;

          descuentosValidados.push({
            ...descuento,
            montoDescontado: montoDescontado
          });
        } else if (descuento.tipo === 'servicio') {
          // Ya procesados en los servicios
          descuentosValidados.push(descuento);
        }
      }
    }

    // Calcular totales
    const subtotalProductos = productosValidados.reduce((total, item) => total + item.subtotal, 0);
    const subtotalServicios = serviciosValidados.reduce((total, item) => total + item.precio, 0);
    const precioOriginal = subtotalProductos + subtotalServicios;
    const descuentoTotalServicios = serviciosValidados.reduce((total, item) => total + item.descuentoAplicado, 0);
    const descuentoTotal = descuentoTotalServicios + descuentoTotalGlobal;
    const total = Math.max(0, precioOriginal - descuentoTotal);

    // Actualizar la venta
    const datosActualizados = {
      cliente: cliente || ventaExistente.cliente,
      empleado: empleado || ventaExistente.empleado,
      cita: cita || ventaExistente.cita,
      productos: productosValidados,
      servicios: serviciosValidados,
      descuentos: descuentosValidados,
      subtotalProductos,
      subtotalServicios,
      precioOriginal,
      descuentoTotal,
      total,
      metodoPago: metodoPago || ventaExistente.metodoPago,
      observaciones: observaciones !== undefined ? observaciones : ventaExistente.observaciones,
    };

    // Actualizar estado y fecha de finalización si es necesario
    if (estado !== undefined && estado !== ventaExistente.estado) {
      datosActualizados.estado = estado;

      if (estado && datosActualizados.cita) {
        await Cita.findByIdAndUpdate(
          datosActualizados.cita,
          { estadocita: "Completada" },
          { new: true, runValidators: false }
        );
        datosActualizados.fechaFinalizacion = new Date();
      }
    }

    const ventaActualizada = await Venta.findByIdAndUpdate(id, datosActualizados, { new: true })
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio");

    res.json({
      msg: "Venta actualizada correctamente",
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar la venta:", error);
    res.status(500).json({
      msg: "Error al actualizar la venta",
      error: error.message,
    });
  }
};

// Eliminar una venta
const eliminarVenta = async (req, res = response) => {
  const { id } = req.params;

  try {
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    // Restaurar stock de productos
    if (venta.productos && venta.productos.length > 0) {
      for (const productoItem of venta.productos) {
        const producto = await Producto.findById(productoItem.producto);
        if (producto) {
          producto.stock += productoItem.cantidad;
          await producto.save();
        }
      }
    }

    await Venta.findByIdAndDelete(id);

    res.json({
      msg: "Venta eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    res.status(500).json({
      msg: "Error al eliminar la venta",
      error: error.message,
    });
  }
};

// Finalizar una venta con descuentos
const finalizarVenta = async (req, res = response) => {
  const { id } = req.params;
  const { metodoPago, descuentos = [] } = req.body;

  try {
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    // Aplicar nuevos descuentos si se enviaron
    if (descuentos.length > 0) {
      const serviciosConDescuento = await Promise.all(venta.servicios.map(async (servicio) => {
        const servicioDB = await Servicio.findById(servicio.servicio).populate('tipoServicio');
        const descuento = descuentos.find(d => d.tipo === 'servicio' && d.servicioId.equals(servicio.servicio));
        
        const descuentoAplicado = descuento ? 
          (descuento.esPorcentaje ? (servicio.precio * descuento.valor / 100) : descuento.valor) :
          (servicioDB.tipoServicio?.descuento ? (servicio.precio * servicioDB.tipoServicio.descuento / 100) : 0);
        
        return {
          ...servicio.toObject(),
          precioFinal: servicio.precio - descuentoAplicado,
          descuentoAplicado,
          tipoDescuento: servicioDB.tipoServicio?.esPromocional ? 'promocional' : 'tipo-servicio'
        };
      }));

      // Procesar descuentos globales
      let descuentoTotalGlobal = 0;
      const descuentosGlobales = descuentos.filter(d => d.tipo === 'global');
      
      if (descuentosGlobales.length > 0) {
        const subtotalServicios = serviciosConDescuento.reduce((total, item) => total + item.precio, 0);
        const subtotalProductos = venta.productos.reduce((total, item) => total + item.subtotal, 0);
        const precioOriginal = subtotalServicios + subtotalProductos;

        descuentoTotalGlobal = descuentosGlobales.reduce((total, descuento) => {
          return total + (descuento.esPorcentaje ? 
            (precioOriginal * descuento.valor / 100) : 
            descuento.valor);
        }, 0);
      }

      // Actualizar venta con nuevos descuentos
      venta.servicios = serviciosConDescuento;
      venta.descuentos = descuentos;
      venta.subtotalServicios = serviciosConDescuento.reduce((total, item) => total + item.precioFinal, 0);
      venta.descuentoTotal = serviciosConDescuento.reduce((total, item) => total + item.descuentoAplicado, 0) + descuentoTotalGlobal;
      venta.total = venta.subtotalProductos + venta.subtotalServicios - venta.descuentoTotal;
    }

    // Actualizar la cita si existe
    if (venta.cita) {
      await Cita.findByIdAndUpdate(
        venta.cita,
        { estadocita: "Completada" },
        { new: true, runValidators: false }
      );
    }

    // Finalizar la venta
    venta.metodoPago = metodoPago || venta.metodoPago;
    venta.fechaFinalizacion = new Date();
    venta.estado = true;

    await venta.save();

    // Obtener venta actualizada
    const ventaActualizada = await Venta.findById(id)
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio");

    res.json({
      msg: "Venta finalizada correctamente",
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error("Error al finalizar la venta:", error);
    res.status(500).json({
      msg: "Error al finalizar la venta",
      error: error.message,
    });
  }
};

// Agregar productos a una venta existente
const agregarProductosVenta = async (req, res = response) => {
  const { id } = req.params;
  const { productos } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      msg: "Debe proporcionar al menos un producto para añadir",
    });
  }

  try {
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    // Validar los productos nuevos
    const productosIds = productos.map((p) => p.producto);
    const productosDB = await Producto.find({ _id: { $in: productosIds } });

    if (productosDB.length !== productosIds.length) {
      return res.status(400).json({
        msg: "Uno o más productos no existen en la base de datos",
      });
    }

    // Verificar stock y preparar productos validados
    const nuevosProductos = [];
    for (const productoItem of productos) {
      const productoDB = productosDB.find((p) => p._id.toString() === productoItem.producto);

      if (productoDB.stock < productoItem.cantidad) {
        return res.status(400).json({
          msg: `Stock insuficiente para el producto ${productoDB.nombreProducto}. Disponible: ${productoDB.stock}`,
        });
      }

      const precio = productoItem.precio || productoDB.precio;
      const subtotal = precio * productoItem.cantidad;

      nuevosProductos.push({
        producto: productoDB._id,
        nombreProducto: productoDB.nombreProducto,
        precio: precio,
        cantidad: productoItem.cantidad,
        subtotal: subtotal,
      });

      productoDB.stock -= productoItem.cantidad;
      await productoDB.save();
    }

    // Añadir los nuevos productos a la venta
    venta.productos = [...venta.productos, ...nuevosProductos];

    // Recalcular subtotales y total
    venta.subtotalProductos = venta.productos.reduce((total, item) => total + item.subtotal, 0);
    venta.precioOriginal = venta.subtotalProductos + venta.servicios.reduce((total, item) => total + item.precio, 0);
    venta.total = venta.precioOriginal - venta.descuentoTotal;

    await venta.save();

    // Obtener venta actualizada
    const ventaActualizada = await Venta.findById(id)
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio");

    res.json({
      msg: "Productos añadidos correctamente",
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error("Error al añadir productos a la venta:", error);
    res.status(500).json({
      msg: "Error al añadir productos a la venta",
      error: error.message,
    });
  }
};

// Agregar servicios a una venta existente con descuentos
const agregarServiciosVenta = async (req, res = response) => {
  const { id } = req.params;
  const { servicios, descuentos = [] } = req.body;

  if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
    return res.status(400).json({
      msg: "Debe proporcionar al menos un servicio para añadir",
    });
  }

  try {
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({
        msg: "Venta no encontrada",
      });
    }

    // Validar los servicios nuevos
    const serviciosIds = servicios.map((s) => s.servicio);
    const serviciosDB = await Servicio.find({ _id: { $in: serviciosIds } })
      .populate('tipoServicio', 'descuento esPromocional');

    if (serviciosDB.length !== serviciosIds.length) {
      return res.status(400).json({
        msg: "Uno o más servicios no existen en la base de datos",
      });
    }

    // Preparar servicios validados con descuentos
    const nuevosServicios = [];
    for (const servicioItem of servicios) {
      const servicioDB = serviciosDB.find((s) => s._id.toString() === servicioItem.servicio);
      const precioOriginal = servicioItem.precio || servicioDB.precio;
      
      // Buscar descuento aplicado a este servicio
      const descuentoServicio = descuentos.find(d => d.tipo === 'servicio' && d.servicioId === servicioItem.servicio);
      
      // Calcular descuento
      let descuentoAplicado = 0;
      let tipoDescuento = null;
      
      if (descuentoServicio) {
        descuentoAplicado = descuentoServicio.esPorcentaje ? 
          (precioOriginal * descuentoServicio.valor / 100) : 
          descuentoServicio.valor;
        tipoDescuento = descuentoServicio.tipo;
      } else if (servicioDB.tipoServicio?.descuento) {
        descuentoAplicado = precioOriginal * servicioDB.tipoServicio.descuento / 100;
        tipoDescuento = servicioDB.tipoServicio.esPromocional ? 'promocional' : 'tipo-servicio';
      }

      const precioFinal = precioOriginal - descuentoAplicado;

      nuevosServicios.push({
        servicio: servicioDB._id,
        nombreServicio: servicioDB.nombreServicio,
        precio: precioOriginal,
        precioFinal: precioFinal,
        tiempo: servicioDB.tiempo,
        descuentoAplicado: descuentoAplicado,
        tipoDescuento: tipoDescuento
      });
    }

    // Procesar descuentos globales si existen
    let descuentosGlobales = [];
    let descuentoTotalGlobal = 0;
    
    if (descuentos && descuentos.length > 0) {
      descuentosGlobales = descuentos.filter(d => d.tipo === 'global');
      
      if (descuentosGlobales.length > 0) {
        const subtotalServicios = nuevosServicios.reduce((total, item) => total + item.precio, 0);
        const subtotalProductos = venta.productos.reduce((total, item) => total + item.subtotal, 0);
        const precioOriginal = subtotalServicios + subtotalProductos;

        descuentoTotalGlobal = descuentosGlobales.reduce((total, descuento) => {
          return total + (descuento.esPorcentaje ? 
            (precioOriginal * descuento.valor / 100) : 
            descuento.valor);
        }, 0);
      }
    }

    // Añadir los nuevos servicios y descuentos a la venta
    venta.servicios = [...venta.servicios, ...nuevosServicios];
    venta.descuentos = [...venta.descuentos, ...descuentos];

    // Recalcular subtotales y total
    venta.subtotalServicios = venta.servicios.reduce((total, item) => total + item.precioFinal, 0);
    venta.precioOriginal = venta.subtotalProductos + venta.servicios.reduce((total, item) => total + item.precio, 0);
    venta.descuentoTotal = venta.servicios.reduce((total, item) => total + item.descuentoAplicado, 0) + descuentoTotalGlobal;
    venta.total = venta.precioOriginal - venta.descuentoTotal;

    await venta.save();

    // Obtener venta actualizada
    const ventaActualizada = await Venta.findById(id)
      .populate("cliente", "nombrecliente apellidocliente correocliente celularcliente")
      .populate("empleado", "nombreempleado")
      .populate({
        path: "cita",
        select: "fechacita estadocita",
      })
      .populate("productos.producto", "nombreProducto categoria stock")
      .populate("servicios.servicio", "nombreServicio categoria")
      .populate("descuentos.servicioId", "nombreServicio");

    res.json({
      msg: "Servicios añadidos correctamente",
      venta: ventaActualizada,
    });
  } catch (error) {
    console.error("Error al añadir servicios a la venta:", error);
    res.status(500).json({
      msg: "Error al añadir servicios a la venta",
      error: error.message,
    });
  }
};

// Obtener ventas por cliente
const obtenerVentasPorCliente = async (req, res) => {
  try {
    const clienteId = req.query.clienteId || req.usuario?.id;
    
    if (!clienteId) {
      return res.status(400).json({ message: "ID de cliente no proporcionado" });
    }
    
    // Buscar ventas donde el cliente coincida con el ID proporcionado
    let ventas = await Venta.find({ cliente: clienteId })
      .populate("cliente")
      .populate("empleado")
      .populate("cita")
      .populate("productos.producto")
      .populate("servicios.servicio")
      .populate("descuentos.servicioId")
      .sort({ fechaCreacion: -1 });
    
    // Si no hay resultados, intentar buscar por usuario (si es un ID de usuario)
    if (ventas.length === 0) {
      const cliente = await Cliente.findOne({ usuario: clienteId });
      
      if (cliente) {
        ventas = await Venta.find({ cliente: cliente._id })
          .populate("cliente")
          .populate("empleado")
          .populate("cita")
          .populate("productos.producto")
          .populate("servicios.servicio")
          .populate("descuentos.servicioId")
          .sort({ fechaCreacion: -1 });
      }
    }
    
    res.status(200).json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas del cliente:", error);
    res.status(500).json({ message: "Error al obtener las ventas", error: error.message });
  }
};

// En venta.js (controlador)
const obtenerVentasPorCita = async (req, res = response) => {
  const { citaId } = req.params;
  try {
    const ventas = await Venta.find({ cita: citaId })
      .populate("cliente")
      .populate("empleado")
      .populate("cita")
      .populate("productos.producto")
      .populate("servicios.servicio");
    
    res.json(ventas);
  } catch (error) {
    console.error("Error al obtener ventas por cita:", error);
    res.status(500).json({ msg: "Error al obtener ventas por cita" });
  }
};

const validarVenta = (req, res, next) => {
  const { servicios } = req.body;
  if (servicios && servicios.length > 0) {
    // Validar estructura de servicios
    const serviciosValidos = servicios.every(s => 
      s.servicio && s.nombreServicio && 
      typeof s.precio === 'number' && 
      typeof s.precioFinal === 'number'
    );
    if (!serviciosValidos) {
      return res.status(400).json({
        msg: "Estructura de servicios inválida",
        detalles: "Cada servicio debe tener servicio, nombreServicio, precio y precioFinal"
      });
    }
  }
  next();
};

module.exports = {
  obtenerVentas,
  obtenerVentaPorId,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  finalizarVenta,
  agregarProductosVenta,
  agregarServiciosVenta,
  obtenerVentasPorCliente,
  obtenerVentasPorCita,
  validarVenta,
  obtenerSiguienteCodigoVenta
};