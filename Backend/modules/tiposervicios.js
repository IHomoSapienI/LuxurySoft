const {Schema, model } = require ("mongoose")

const TsSchema = Schema({
    nombreTipoServicio: {
        type: String,
        required: [true, "El nombre es obligatorio"],
    },
    activo: {
        type: Boolean,
        default: true,
    }
    })

    module.exports = model("TipoServicios", TsSchema)