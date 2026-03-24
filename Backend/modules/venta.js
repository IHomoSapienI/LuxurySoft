const { Schema, model } = require("mongoose");

const VentaSchema = Schema(
  {
    codigoVenta: {
      type: String,
      unique: true,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: [true, "El cliente es obligatorio"],
    },
    cita: {
      type: Schema.Types.ObjectId,
      ref: "Cita",
    },
    empleado: {
      type: Schema.Types.ObjectId,
      ref: "Empleado",
      required: [true, "El empleado es obligatorio"],
    },
    productos: [
      {
        producto: {
          type: Schema.Types.ObjectId,
          ref: "Producto",
          required: true,
        },
        nombreProducto: {
          type: String,
          required: true,
          trim: true,
        },
        precio: {
          type: Number,
          required: true,
          min: 0,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    servicios: [
      {
        servicio: {
          type: Schema.Types.ObjectId,
          ref: "Servicio",
          required: true,
        },
        nombreServicio: {
          type: String,
          required: true,
          trim: true,
        },
        precio: { // Precio original
          type: Number,
          required: true,
          min: 0,
        },
        precioFinal: { // Precio después de descuento
          type: Number,
          required: true,
          min: 0,
        },
        tiempo: {
          type: Number,
          required: true,
          min: 0,
        },
        descuentoAplicado: { // Monto descontado
          type: Number,
          default: 0,
        },
        tipoDescuento: { // Tipo de descuento aplicado
          type: String,
          enum: ["promocional", "manual", "tipo-servicio", null],
          default: null,
        },
      },
    ],
    // Descuentos aplicados a la venta
    descuentos: [
      {
        tipo: {
          type: String,
          enum: ["servicio", "global", "promocional"],
          required: true,
        },
        servicioId: { // Solo para descuentos por servicio
          type: Schema.Types.ObjectId,
          ref: "Servicio",
        },
        nombre: {
          type: String,
          required: true,
        },
        valor: { // Puede ser porcentaje o monto fijo
          type: Number,
          required: true,
          min: 0,
        },
        esPorcentaje: {
          type: Boolean,
          default: true,
        },
        montoDescontado: { // Monto real descontado
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    subtotalProductos: {
      type: Number,
      default: 0,
    },
    subtotalServicios: {
      type: Number,
      default: 0,
    },
    precioOriginal: { // Total antes de descuentos
      type: Number,
      default: 0,
    },
    descuentoTotal: { // Suma de todos los descuentos
      type: Number,
      default: 0,
    },
    total: { // Precio final después de descuentos
      type: Number,
      required: true,
      min: 0,
    },
    metodoPago: {
      type: String,
      enum: ["Efectivo", "Tarjeta", "Transferencia", "Otro"],
      default: "Efectivo",
    },
    estado: {
      type: Boolean,
      default: false, // Cambiado a false para que por defecto esté pendiente
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    fechaFinalizacion: {
      type: Date,
    },
    observaciones: {
      type: String,
      trim: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware para calcular subtotales y total antes de guardar
VentaSchema.pre("save", function (next) {
  // Calcular subtotal de productos
  if (this.productos && this.productos.length > 0) {
    this.subtotalProductos = this.productos.reduce((total, item) => {
      return total + (item.subtotal || 0);
    }, 0);
  } else {
    this.subtotalProductos = 0;
  }

  // Calcular subtotal de servicios (usando precioFinal)
  if (this.servicios && this.servicios.length > 0) {
    this.subtotalServicios = this.servicios.reduce((total, item) => {
      return total + (item.precioFinal || item.precio || 0);
    }, 0);
    
    // Calcular descuentos totales en servicios
    const descuentosServicios = this.servicios.reduce((total, item) => {
      return total + (item.descuentoAplicado || 0);
    }, 0);
    
    this.descuentoTotal = descuentosServicios;
  } else {
    this.subtotalServicios = 0;
  }

  // Calcular descuentos globales
  if (this.descuentos && this.descuentos.length > 0) {
    const descuentosGlobales = this.descuentos
      .filter(d => d.tipo === 'global')
      .reduce((total, descuento) => total + (descuento.montoDescontado || 0), 0);
    
    this.descuentoTotal += descuentosGlobales;
  }

  // Calcular precio original (sin descuentos)
  this.precioOriginal = this.subtotalProductos + 
    this.servicios.reduce((total, item) => total + (item.precio || 0), 0);

  // Calcular total general (con descuentos)
  this.total = this.precioOriginal - this.descuentoTotal;

  // Asegurar que el total no sea negativo
  if (this.total < 0) {
    this.total = 0;
  }

  next();
});

// Virtuals para información del cliente
VentaSchema.virtual("clienteNombre").get(function () {
  return this.cliente ? this.cliente.nombrecliente : "Cliente no especificado"
})

VentaSchema.virtual("clienteApellido").get(function () {
  return this.cliente ? this.cliente.apellidocliente : "Apellido no especificado"
})

VentaSchema.virtual("clienteEmail").get(function () {
  return this.cliente ? this.cliente.correocliente : "Correo no especificado"
})

VentaSchema.virtual("clienteCelular").get(function () {
  return this.cliente ? this.cliente.celularcliente : "Celular no especificado"
})

// Virtual para información de la cita
VentaSchema.virtual("citaFecha").get(function () {
  return this.cita ? this.cita.fechacita : "Fecha no especificada"
})

// Virtual para información del empleado
VentaSchema.virtual("empleadoNombre").get(function () {
  return this.empleado ? this.empleado.nombreempleado : "Empleado no especificado"
})

// Virtual para determinar si la venta incluye productos
VentaSchema.virtual("tieneProductos").get(function () {
  return this.productos && this.productos.length > 0
})

// Virtual para determinar si la venta incluye servicios
VentaSchema.virtual("tieneServicios").get(function () {
  return this.servicios && this.servicios.length > 0
})

// Virtual para obtener el tipo de venta (mixta, solo productos, solo servicios)
VentaSchema.virtual("tipoVenta").get(function () {
  const tieneProductos = this.productos && this.productos.length > 0
  const tieneServicios = this.servicios && this.servicios.length > 0

  if (tieneProductos && tieneServicios) {
    return "mixta"
  } else if (tieneProductos) {
    return "productos"
  } else if (tieneServicios) {
    return "servicios"
  } else {
    return "sin items"
  }
})

module.exports = model("Venta", VentaSchema)