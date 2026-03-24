const { Schema, model } = require('mongoose');

// Definir el esquema de venta de productos
const VentaProductoSchema = Schema({
    nombreProducto: {
        type: Schema.Types.ObjectId,
        ref: 'Producto',  // Relación con el modelo de Producto
        required: true
    },
    nombreCliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',  // Relación con el modelo de Cliente
        required: true
    },
    descripcion: {
        type: String,
        required: false
    },
    precio: {
        type: Number,
        required: true  // El precio se obtendrá del producto seleccionado
    },
    cantidad: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: Boolean,
        default: true  // Completado o pendiente
    },
    fechaVenta: {
        type: Date,
        default: Date.now
    }
});

// Middleware para calcular el subtotal antes de guardar la venta
VentaProductoSchema.pre('save', async function (next) {
    if (this.isModified('cantidad') || this.isModified('precio')) {
        this.subtotal = this.cantidad * this.precio;  // Cálculo del subtotal
    }
    next();
});

module.exports = model('VentaProducto', VentaProductoSchema);
