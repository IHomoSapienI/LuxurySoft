const { Schema, model } = require('mongoose');

// Definición del esquema para productos
const ProductoSchema = Schema({
    nombreProducto: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: String,
        required: true
    },
    categoria: { 
        type: Schema.Types.ObjectId, 
        ref: 'CatProducto', // Referencia al esquema de categorías de productos
        required: true
    },
    estado: {
        type: Boolean,
        default: true
    },
    imagenUrl: { // Campo opcional para la URL de la imagen del producto
        type: String,
        required: false
    }
});

module.exports = model('Producto', ProductoSchema);
