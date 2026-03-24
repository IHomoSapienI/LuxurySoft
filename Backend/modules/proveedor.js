const { Schema, model } = require('mongoose');

// Definición del esquema para servicios
const ProveedorSchema = Schema({
    nombreProveedor: {
        type: String,
        required: true
    },
    contacto: {
        type: String,
        required: true
    },
    numeroContacto: {
        type: Number,
        required: true,
        min: 0 
    },
    provee: { 
        type: String,
        required: true
    },
    estado: {
        type: Boolean,
        default: true 
    }
});

module.exports = model('Proveedor', ProveedorSchema);
