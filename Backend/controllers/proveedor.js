const Proveedor = require('../modules/proveedor');

// Funciones de validación
const validarNombreProveedor = (nombre) => {
    if (!nombre || nombre.trim() === '') {
        return { valido: false, mensaje: "El nombre del proveedor no puede estar vacío" };
    }
    
    if (nombre.length < 3 || nombre.length > 20) {
        return { valido: false, mensaje: "El nombre del proveedor debe tener entre 3 y 20 caracteres" };
    }
    
    // Verificar si contiene caracteres no alfanuméricos
    if (!/^[a-zA-Z0-9\s]+$/.test(nombre)) {
        return { valido: false, mensaje: "El nombre del proveedor solo puede contener letras, números y espacios" };
    }
    
    return { valido: true };
};

const validarContacto = (contacto) => {
    if (!contacto || contacto.trim() === '') {
        return { valido: false, mensaje: "El contacto no puede estar vacío" };
    }
    
    if (contacto.length < 3 || contacto.length > 20) {
        return { valido: false, mensaje: "El contacto debe tener entre 3 y 20 caracteres" };
    }
    
    // Verificar si contiene caracteres no alfabéticos (solo letras)
    if (!/^[a-zA-Z\s]+$/.test(contacto)) {
        return { valido: false, mensaje: "El contacto solo puede contener letras y espacios" };
    }
    
    return { valido: true };
};

const validarNumeroContacto = (numero) => {
    if (!numero || numero.trim() === '') {
        return { valido: false, mensaje: "El número de contacto no puede estar vacío" };
    }
    
    // Verificar si solo contiene números
    if (!/^\d+$/.test(numero)) {
        return { valido: false, mensaje: "El número de contacto solo puede contener dígitos" };
    }
    
    // Verificar longitud
    if (numero.length > 12) {
        return { valido: false, mensaje: "El número de contacto debe tener menos de 12 dígitos" };
    }
    
    if (numero.length <= 7) {
        return { valido: false, mensaje: "El número de contacto debe tener más de 7 dígitos" };
    }
    
    return { valido: true };
};

const validarEstado = (estado) => {
    if (estado === undefined || estado === null) {
        return { valido: false, mensaje: "El estado no puede estar vacío" };
    }
    
    return { valido: true };
};

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find();
        res.json({
            ok: true,
            proveedores
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al obtener los proveedores', 
            error 
        });
    }
};

// Crear un nuevo proveedor
const crearProveedor = async (req, res) => {
    const { nombreProveedor, contacto, numeroContacto, provee } = req.body;

    // Validar nombre del proveedor
    const validacionNombre = validarNombreProveedor(nombreProveedor);
    if (!validacionNombre.valido) {
        return res.status(400).json({
            ok: false,
            mensaje: validacionNombre.mensaje
        });
    }
    
    // Validar contacto
    const validacionContacto = validarContacto(contacto);
    if (!validacionContacto.valido) {
        return res.status(400).json({
            ok: false,
            mensaje: validacionContacto.mensaje
        });
    }
    
    // Validar número de contacto
    const validacionNumero = validarNumeroContacto(numeroContacto);
    if (!validacionNumero.valido) {
        return res.status(400).json({
            ok: false,
            mensaje: validacionNumero.mensaje
        });
    }
    
    // Por defecto, un nuevo proveedor se crea como activo
    const estado = true;

    try {
        const nuevoProveedor = new Proveedor({
            nombreProveedor,
            contacto,
            numeroContacto,
            provee,
            estado
        });

        await nuevoProveedor.save();
        res.status(201).json({ 
            ok: true,
            mensaje: 'Proveedor creado con éxito', 
            proveedor: nuevoProveedor 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al crear el proveedor', 
            error 
        });
    }
};

// Actualizar un proveedor por ID
const actualizarProveedor = async (req, res) => {
    const { id } = req.params;
    const { nombreProveedor, contacto, numeroContacto, provee, estado } = req.body;

    try {
        const proveedor = await Proveedor.findById(id);
        
        if (!proveedor) {
            return res.status(404).json({ 
                ok: false,
                mensaje: 'Proveedor no encontrado' 
            });
        }
        
        // Solo validar el nombre si se proporciona
        if (nombreProveedor !== undefined) {
            const validacionNombre = validarNombreProveedor(nombreProveedor);
            if (!validacionNombre.valido) {
                return res.status(400).json({
                    ok: false,
                    mensaje: validacionNombre.mensaje
                });
            }
            proveedor.nombreProveedor = nombreProveedor;
        }
        
        // Solo validar el contacto si se proporciona
        if (contacto !== undefined) {
            const validacionContacto = validarContacto(contacto);
            if (!validacionContacto.valido) {
                return res.status(400).json({
                    ok: false,
                    mensaje: validacionContacto.mensaje
                });
            }
            proveedor.contacto = contacto;
        }
        
        // Solo validar el número de contacto si se proporciona
        if (numeroContacto !== undefined) {
            const validacionNumero = validarNumeroContacto(numeroContacto);
            if (!validacionNumero.valido) {
                return res.status(400).json({
                    ok: false,
                    mensaje: validacionNumero.mensaje
                });
            }
            proveedor.numeroContacto = numeroContacto;
        }
        
        // Actualizar provee si se proporciona
        if (provee !== undefined) {
            proveedor.provee = provee;
        }
        
        // Validar el estado si se proporciona
        if (estado !== undefined) {
            const validacionEstado = validarEstado(estado);
            if (!validacionEstado.valido) {
                return res.status(400).json({
                    ok: false,
                    mensaje: validacionEstado.mensaje
                });
            }
            proveedor.estado = estado;
        }

        await proveedor.save();
        res.json({ 
            ok: true,
            mensaje: 'Proveedor actualizado con éxito', 
            proveedor 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al actualizar el proveedor', 
            error 
        });
    }
};

// Eliminar un proveedor por ID
const eliminarProveedor = async (req, res) => {
    const { id } = req.params;

    try {
        const proveedorEliminado = await Proveedor.findByIdAndDelete(id);

        if (!proveedorEliminado) {
            return res.status(404).json({ 
                ok: false,
                mensaje: 'Proveedor no encontrado' 
            });
        }

        res.json({ 
            ok: true,
            mensaje: 'Proveedor eliminado con éxito' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al eliminar el proveedor', 
            error 
        });
    }
};

// Cambiar el estado de un proveedor por ID
const cambiarEstadoProveedor = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar el estado
    const validacionEstado = validarEstado(estado);
    if (!validacionEstado.valido) {
        return res.status(400).json({
            ok: false,
            mensaje: validacionEstado.mensaje
        });
    }

    try {
        const proveedor = await Proveedor.findByIdAndUpdate(
            id,
            { estado },
            { new: true }
        );

        if (!proveedor) {
            return res.status(404).json({ 
                ok: false,
                mensaje: 'Proveedor no encontrado' 
            });
        }

        res.json({ 
            ok: true,
            mensaje: 'Estado del proveedor actualizado', 
            proveedor 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false,
            mensaje: 'Error al cambiar el estado del proveedor', 
            error 
        });
    }
};

module.exports = {
    obtenerProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    cambiarEstadoProveedor
};
//R
