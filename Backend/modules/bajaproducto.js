const { Schema, model } = require('mongoose'); // ← Agrega esta línea

const BajaProductoSchema = new Schema({ // ← Asegúrate de que tenga "new"
    productoId: {
        type: Schema.Types.ObjectId,
        ref: 'Insumo', // Referencia al modelo Insumo
        required: true
    },
    producto: {
        type: String,
        required: true
    },
    fechaBaja: {
        type: Date,
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 0
    },
    observaciones: {
        type: String,
        default: ''
    }
});

module.exports = model('BajaProducto', BajaProductoSchema); // ← Exporta correctamente
