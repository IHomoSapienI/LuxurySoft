const { Schema, model } = require('mongoose');

const ContadorSchema = Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    secuencia: {
        type: Number,
        default: 0
    }
});

module.exports = model('Contador', ContadorSchema);
