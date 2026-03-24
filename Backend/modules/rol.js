// models/Rol.js
const { Schema, model } = require('mongoose');

const RolSchema = Schema({
    nombreRol: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true // Asegúrate de que cada rol tenga un nombre único
    },

    permisoRol: [{ type: Schema.Types.ObjectId, ref: 'Permiso' }], // Referencia a permisos

    estadoRol: {
        type: Boolean,
        default: true,
        required: [true, 'El estado es obligatorio'],
    },

    esAdmin: { // Nuevo campo para identificar si el rol es administrador
        type: Boolean,
        default: false // Por defecto, un rol no es administrador
    },
});

module.exports = model('Rol', RolSchema);
