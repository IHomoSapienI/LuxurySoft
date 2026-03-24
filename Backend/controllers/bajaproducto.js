const BajaProducto = require('../modules/bajaproducto');
const Insumo = require('../modules/insumo');

// Funciones de validación
const validarInsumo = (insumoId) => {
    if (!insumoId || insumoId.trim() === '') {
        return { valido: false, mensaje: "Debe seleccionar un insumo" };
    }
    return { valido: true };
};

const validarCantidad = (cantidad, stockActual) => {
    // Verificar que sea un número
    if (isNaN(cantidad)) {
        return { valido: false, mensaje: "La cantidad debe ser un número" };
    }
    
    // Verificar que no sea cero
    if (cantidad <= 0) {
        return { valido: false, mensaje: "La cantidad debe ser mayor a cero" };
    }
    
    // Verificar que no sea mayor al stock actual
    if (cantidad > stockActual) {
        return { valido: false, mensaje: "La cantidad no puede ser mayor al stock disponible" };
    }
    
    return { valido: true };
};

const validarFecha = (fecha) => {
    if (!fecha) {
        return { valido: false, mensaje: "La fecha no puede estar vacía" };
    }
    
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
    
    const fechaBaja = new Date(fecha);
    fechaBaja.setHours(0, 0, 0, 0);
    
    // Verificar que no sea una fecha futura
    if (fechaBaja > fechaActual) {
        return { valido: false, mensaje: "La fecha no puede ser futura" };
    }
    
    return { valido: true };
};

const validarObservaciones = (observaciones) => {
    if (!observaciones || observaciones.trim() === '') {
        return { valido: false, mensaje: "Las observaciones no pueden estar vacías" };
    }
    
    // Verificar longitud máxima
    if (observaciones.length > 300) {
        return { valido: false, mensaje: "Las observaciones no pueden exceder los 300 caracteres" };
    }
    
    // Verificar que solo contenga caracteres alfanuméricos y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,]+$/.test(observaciones)) {
    return { valido: false, mensaje: "Las observaciones solo pueden contener caracteres alfanuméricos, espacios, tildes, puntos y comas" };
}
    
    return { valido: true };
};

// Crear una nueva baja de producto y descontar del stock
const crearBajaProducto = async (req, res) => {
    const { productoId, fechaBaja, cantidad, observaciones } = req.body;

    try {
        // Validar insumo
        const validacionInsumo = validarInsumo(productoId);
        if (!validacionInsumo.valido) {
            return res.status(400).json({ 
                ok: false,
                mensaje: validacionInsumo.mensaje 
            });
        }

        const insumo = await Insumo.findById(productoId);
        if (!insumo) {
            return res.status(404).json({ 
                ok: false,
                mensaje: 'Producto no encontrado en insumos' 
            });
        }

        // Validar cantidad
        const validacionCantidad = validarCantidad(cantidad, insumo.stock);
        if (!validacionCantidad.valido) {
            return res.status(400).json({ 
                ok: false,
                mensaje: validacionCantidad.mensaje 
            });
        }

        // Validar fecha
        const validacionFecha = validarFecha(fechaBaja);
        if (!validacionFecha.valido) {
            return res.status(400).json({ 
                ok: false,
                mensaje: validacionFecha.mensaje 
            });
        }

        // Validar observaciones
        const validacionObservaciones = validarObservaciones(observaciones);
        if (!validacionObservaciones.valido) {
            return res.status(400).json({ 
                ok: false,
                mensaje: validacionObservaciones.mensaje 
            });
        }

        // Crear la baja
        const nuevaBaja = new BajaProducto({
            productoId,
            producto: insumo.nombreInsumo,
            fechaBaja,
            cantidad,
            observaciones
        });

        await nuevaBaja.save();

        // Restar la cantidad del stock del insumo
        insumo.stock -= cantidad;

        // Si el stock es 0, cambiar su estado a inactivo
        if (insumo.stock === 0) {
            insumo.estado = false;
        }

        await insumo.save();

        res.status(201).json({ 
            ok: true,
            mensaje: 'Baja de producto creada y stock actualizado', 
            baja: nuevaBaja, 
            stockActual: insumo.stock 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al crear la baja de producto', 
            error 
        });
    }
};

// Eliminar una baja de producto y restaurar el stock del insumo
const eliminarBajaProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const baja = await BajaProducto.findById(id);
        if (!baja) {
            return res.status(404).json({ 
                ok: false,
                mensaje: 'Baja de producto no encontrada' 
            });
        }

        // Restaurar stock del insumo
        const insumo = await Insumo.findById(baja.productoId);
        if (insumo) {
            insumo.stock += baja.cantidad;
            insumo.estado = true; // Reactivar insumo si se eliminó la baja
            await insumo.save();
        }

        await BajaProducto.findByIdAndDelete(id);
        res.json({ 
            ok: true,
            mensaje: 'Baja de producto eliminada y stock restaurado' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al eliminar la baja de producto', 
            error 
        });
    }
};

const obtenerBajasProductos = async (req, res) => {
    try {
        const bajas = await BajaProducto.find().populate('productoId'); // Cargar datos del insumo
        res.json({
            ok: true,
            bajas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al obtener las bajas de productos', 
            error 
        });
    }
};

module.exports = {
    obtenerBajasProductos,
    crearBajaProducto,
    eliminarBajaProducto
};