const {Schema, model} = require('mongoose')
 
const CategoriaProductoSchema = Schema({
    nombreCp: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    descripcionCp: {
        type: String,
        required: [true, 'La descripcion es obligatorio']
    },
     activo: {
        type: Boolean, 
        default: true
    },

})

module.exports = model('CatProducto', CategoriaProductoSchema);