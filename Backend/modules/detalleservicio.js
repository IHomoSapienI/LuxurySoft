const { Schema, model } = require('mongoose');

const DetalleservicioSchema = Schema({
    servicio: {
        type: Schema.Types.ObjectId, ref: 'Servicio' 
    },   
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    precioTotal: {
        type: Number,
        required: true
    }
});

module.exports = model('Detalleservicio', DetalleservicioSchema);
