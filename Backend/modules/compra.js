const { Schema, model, Types } = require("mongoose");

// Definición del esquema para compras
const CompraSchema = Schema({
    proveedor: {
        type: Schema.Types.ObjectId,
        ref: "Proveedor",
        required: true
    },
    recibo: {
        type: String,
        required: true
    },
    fechaCompra: {
        type: Date,
        required: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    monto: {
        type: Number,
        required: true
    },
    estado: {
        type: Boolean,
        default: true
    },
    insumos: [{
        insumo: {
            type: Schema.Types.ObjectId,
            ref: "Insumo",
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1
        }
    }]
});

// Middleware para calcular el monto total antes de guardar
CompraSchema.pre("save", async function (next) {
    try {
        await this.populate("insumos.insumo"); // Poblar los insumos con sus datos

        this.monto = this.insumos.reduce((total, item) => {
            return total + (item.cantidad * (item.insumo?.precio || 0));
        }, 0);

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = model("Compra", CompraSchema);
