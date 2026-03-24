const { Schema, model } = require('mongoose');

// Definición del esquema para servicios
const ServicioSchema = Schema({
    nombreServicio: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: false 
    },
    precio: {
        type: Number,
        required: true,
        min: 0 
    },
    tiempo: {
        type: Number,
        required: true,
        min: 0 
    },
    tipoServicio: { 
        type: Schema.Types.ObjectId, ref: 'TipoServ'
    },
    tipoServicio2: {
        type: Schema.Types.ObjectId, ref: 'TipoServicios'
    },
    estado: {
        type: Boolean,
        default: true 
    },
    imagenUrl: { // Nuevo campo para la URL de la imagen
        type: String,
        required: true // Hacemos que sea requerido, puedes cambiarlo según tus necesidades
    }
});

module.exports = model('Servicio', ServicioSchema);
