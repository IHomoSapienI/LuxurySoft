const Cliente = require('../modules/cliente');

// Crear un nuevo cliente
const crearCliente = async (req, res) => {
    try {
        const { nombrecliente, apellidocliente, correocliente, celularcliente, estadocliente } = req.body;

        // Validar campos obligatorios
        if (!nombrecliente || !apellidocliente || !correocliente || !celularcliente) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Verificar si el correo o el celular ya existen
        const existeCorreo = await Cliente.findOne({ correocliente });
        if (existeCorreo) {
            return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        const existeCelular = await Cliente.findOne({ celularcliente });
        if (existeCelular) {
            return res.status(400).json({ message: 'El celular ya está en uso' });
        }

        // Crear una nueva instancia de Cliente
        const nuevoCliente = new Cliente({
            nombrecliente,
            apellidocliente,
            correocliente,
            celularcliente,
            estadocliente
        });

        // Guardar el cliente en la base de datos
        await nuevoCliente.save();
        res.status(201).json({ message: 'Cliente creado con éxito', cliente: nuevoCliente });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el cliente', error });
    }
};

// Obtener todos los clientes
const obtenerClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los clientes', error });
    }
};

// Obtener un cliente por ID
const obtenerClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el cliente', error });
    }
};

// Actualizar un cliente
const actualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombrecliente, apellidocliente, correocliente, celularcliente, estadocliente } = req.body;

        // Verificar si el cliente existe
        const clienteExistente = await Cliente.findById(id);
        if (!clienteExistente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Verificar si el correo o el celular ya están en uso por otro cliente
        if (correocliente && correocliente !== clienteExistente.correocliente) {
            const existeCorreo = await Cliente.findOne({ correocliente });
            if (existeCorreo) {
                return res.status(400).json({ message: 'El correo ya está en uso' });
            }
        }

        if (celularcliente && celularcliente !== clienteExistente.celularcliente) {
            const existeCelular = await Cliente.findOne({ celularcliente });
            if (existeCelular) {
                return res.status(400).json({ message: 'El celular ya está en uso' });
            }
        }

        const clienteActualizado = await Cliente.findByIdAndUpdate(
            id,
            { nombrecliente, apellidocliente, correocliente, celularcliente, estadocliente },
            { new: true }
        );

        res.status(200).json({ message: 'Cliente actualizado con éxito', cliente: clienteActualizado });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cliente', error });
    }
};

// Eliminar un cliente
const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const clienteEliminado = await Cliente.findByIdAndDelete(id);
        if (!clienteEliminado) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el cliente', error });
    }
};

// Cambiar estado de un cliente
const cambiarEstadoCliente = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el cliente existe
        const cliente = await Cliente.findById(id);
        if (!cliente) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Cambiar el estado (toggle)
        const nuevoEstado = !cliente.estadocliente;
        
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            id,
            { estadocliente: nuevoEstado },
            { new: true }
        );

        res.status(200).json({ 
            message: `Cliente ${nuevoEstado ? 'activado' : 'desactivado'} con éxito`,
            cliente: clienteActualizado
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al cambiar el estado del cliente', 
            error 
        });
    }
};

// Modificar el exports para incluir la nueva función
module.exports = {
    crearCliente,
    obtenerClientes,
    obtenerClientePorId,
    actualizarCliente,
    eliminarCliente,
    cambiarEstadoCliente
};
