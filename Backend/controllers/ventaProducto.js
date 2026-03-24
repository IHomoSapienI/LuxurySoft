const VentaProducto = require('../modules/ventaproductos');
const Producto = require('../modules/producto'); // Asegúrate de tener el modelo correcto
const Cliente = require('../modules/cliente'); // Asegúrate de tener el modelo correcto

// Crear una nueva venta de producto
const crearVentaProducto = async (req, res) => {
    try {
        const { nombreProducto, nombreCliente, descripcion, precio, cantidad } = req.body;

        // Verificar que el producto y el cliente existan
        const producto = await Producto.findById(nombreProducto);
        const cliente = await Cliente.findById(nombreCliente);

        if (!producto) {
            return res.status(400).json({ msg: 'Producto no encontrado' });
        }

        if (!cliente) {
            return res.status(400).json({ msg: 'Cliente no encontrado' });
        }

        const venta = new VentaProducto({
            nombreProducto,
            nombreCliente,
            descripcion,
            precio,
            cantidad,
            subtotal: cantidad * precio,
            total: cantidad * precio // Asume que el total es igual al subtotal en esta fase
        });

        await venta.save();
        res.status(201).json(venta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al crear la venta de producto' });
    }
};

// Obtener todas las ventas de productos
const obtenerVentasProductos = async (req, res) => {
    try {
        const ventas = await VentaProducto.find()
            .populate('nombreProducto')  // Populate para obtener datos del producto
            .populate('nombreCliente');  // Populate para obtener datos del cliente

        res.status(200).json(ventas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener las ventas de productos' });
    }
};

// Obtener una venta de producto por ID
const obtenerVentaProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await VentaProducto.findById(id)
            .populate('nombreProducto')
            .populate('nombreCliente');

        if (!venta) {
            return res.status(404).json({ msg: 'Venta de producto no encontrada' });
        }

        res.status(200).json(venta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener la venta de producto' });
    }
};

// Actualizar una venta de producto
const actualizarVentaProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreProducto, nombreCliente, descripcion, precio, cantidad } = req.body;

        let venta = await VentaProducto.findById(id);

        if (!venta) {
            return res.status(404).json({ msg: 'Venta de producto no encontrada' });
        }

        // Verificar que el producto y el cliente existan
        const producto = await Producto.findById(nombreProducto);
        const cliente = await Cliente.findById(nombreCliente);

        if (!producto) {
            return res.status(400).json({ msg: 'Producto no encontrado' });
        }

        if (!cliente) {
            return res.status(400).json({ msg: 'Cliente no encontrado' });
        }

        // Actualizar campos
        venta.nombreProducto = nombreProducto || venta.nombreProducto;
        venta.nombreCliente = nombreCliente || venta.nombreCliente;
        venta.descripcion = descripcion || venta.descripcion;
        venta.precio = precio || venta.precio;
        venta.cantidad = cantidad || venta.cantidad;

        venta.subtotal = venta.cantidad * venta.precio;
        venta.total = venta.subtotal; // Actualiza el total también

        await venta.save();
        res.status(200).json(venta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar la venta de producto' });
    }
};

// Eliminar una venta de producto
const eliminarVentaProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const venta = await VentaProducto.findById(id);

        if (!venta) {
            return res.status(404).json({ msg: 'Venta de producto no encontrada' });
        }

        await venta.remove();
        res.status(200).json({ msg: 'Venta de producto eliminada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al eliminar la venta de producto' });
    }
};

module.exports = {
    crearVentaProducto,
    obtenerVentasProductos,
    obtenerVentaProductoPorId,
    actualizarVentaProducto,
    eliminarVentaProducto
};
