const { Schema, model } = require("mongoose")

const TipoServicioSchema = Schema({
  nombreTs: {
    type: String,
    required: [true, "El nombre es obligatorio"],
  },
  activo: {
    type: Boolean,
    default: true,
  },
  descuento: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  esPromocional: {
    type: Boolean,
    default: false,
  },
})

module.exports = model("TipoServ", TipoServicioSchema)

