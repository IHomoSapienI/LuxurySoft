const { Schema, model } = require('mongoose');

const ClienteSchema = Schema({
    nombrecliente: {
        type: String,
        required: true
    },
    apellidocliente: {  // Nuevo campo agregado
        type: String,
        required: true
    },
    correocliente: {  // Nuevo campo agregado
        type: String,
        required: true,
        unique: true // Asegura que no haya duplicados de correo de cliente
    },
    celularcliente: {
        type: String,
        required: true,
        unique: true
    },
    estadocliente: {
        type: Boolean,
        default: true,
        required: [true, 'El estado es obligatorio']
    }
});

module.exports = model('Cliente', ClienteSchema);