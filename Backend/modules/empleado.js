const { Schema, model } = require('mongoose');

const EmpleadoSchema = Schema({
    nombreempleado: {
        type: String,
        required: true
    },
    apellidoempleado: {
        type: String,
        required: true
    },
    correoempleado: {  // Nuevo campo agregado
        type: String,
        required: true,
        unique: true // Asegura que no haya duplicados de correo de empleado
    },
    telefonoempleado: {
        type: String,
        required: true
    },
    estadoempleado: {
        type: Boolean,
        default: true,
        required: [true, 'El estado es obligatorio']
    }
});

module.exports = model('Empleado', EmpleadoSchema);