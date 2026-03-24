const { Schema, model } = require("mongoose");


const CitaSchema = Schema({
    nombreempleado: {
        type: Schema.Types.ObjectId,
        ref: 'Empleado',
        required: true
    },
    nombrecliente: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        required: true
    },
    fechacita: {
        type: Date,
        required: true
    },
    horacita: {  // Añadir hora específica
        type: String,
        required: true
    },
    duracionTotal: {  // Duración total en minutos
        type: Number,
        required: true
    },
    motivo: { 
        type: String
    },
    fechacancelacion: {  
        type: Date
    },
    montototal: {
        type: Number,
        required: true
    },
    estadocita: {
        type: String,
        enum: ['Pendiente', 'Confirmada', 'En Progreso', 'Completada', 'Cancelada'],
        default: 'Pendiente'
    },
    servicios: [{
        servicio: {
            type: Schema.Types.ObjectId,
            ref: 'Servicio'
        },
        nombreServicio: String,
        precio: Number,
        tiempo: Number
    }],
    horarioLiberado: {
      type: Boolean,
      default: false,
    },

    
},
{ timestamps: true },);

module.exports = model('Cita', CitaSchema);