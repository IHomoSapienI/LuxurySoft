const Cita = require('../modules/cita');
const Cliente = require('../modules/cliente');
const Empleado = require('../modules/empleado');
const Servicio = require('../modules/servicio'); // Importar el modelo de servicio

// Modificar el controlador crearCita en controllers/cita.js

const crearCita = async (req, res) => {
    try {
        const { 
            nombreempleado, 
            nombrecliente, 
            fechacita, 
            horacita, 
            duracionTotal,
            montototal, 
            estadocita, 
            servicios 
        } = req.body;

        // Verificar que el empleado y cliente existen
        const empleado = await Empleado.findById(nombreempleado);
        const cliente = await Cliente.findById(nombrecliente);

        if (!empleado || !cliente) {
            return res.status(400).json({ message: 'Empleado o cliente no encontrados' });
        }

        // Verificar que los servicios existen y son válidos
        if (!servicios || servicios.length === 0) {
            return res.status(400).json({ message: 'Debe proporcionar al menos un servicio' });
        }

        // Crear fecha y hora combinadas
        // const fechaHoraCompleta = new Date(`${fechacita}T${horacita}`);

        // Crear una nueva instancia de Cita
        const nuevaCita = new Cita({
            nombreempleado,
            nombrecliente,
            fechacita,
            horacita,
            duracionTotal,
            montototal,
            estadocita: estadocita || 'Confirmada',
            servicios
        });

        // Guardar la cita en la base de datos
        await nuevaCita.save();
        res.status(201).json({ 
            message: 'Cita creada con éxito', 
            cita: nuevaCita 
        });
    } catch (error) {
        console.error('Error al crear la cita:', error);
        res.status(500).json({ 
            message: 'Error al crear la cita', 
            error: error.message 
        });
    }
};

// Obtener todas las citas
const obtenerCitas = async (req, res) => {
    try {
        const citas = await Cita.find()
            .populate('nombreempleado', 'nombreempleado') // Puedes incluir más campos si es necesario
            .populate('nombrecliente', 'nombrecliente') // Idem
            .populate('servicios', 'nombreServicio precio'); // Asegúrate de que los campos existan en el modelo Servicio
        res.json({ citas });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener citas', error });
    }
};

// Obtener una cita por ID
const obtenerCitaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const cita = await Cita.findById(id)
            .populate('nombreempleado', 'nombreempleado')
            .populate('nombrecliente', 'nombrecliente')
            .populate('servicios', 'nombreServicio precio'); // Asegúrate de hacer populate para los servicios
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.json({ cita });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la cita', error });
    }
};

// Actualizar una cita por ID
const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreempleado, nombrecliente, fechacita, montototal, estadocita, servicios } = req.body;

        const cita = await Cita.findByIdAndUpdate(id, {
            nombreempleado,
            nombrecliente,
            fechacita,
            montototal,
            estadocita,
            servicios // Incluir servicios en la actualización
        }, { new: true })
        .populate('nombreempleado', 'nombreempleado')
        .populate('nombrecliente', 'nombrecliente')
        .populate('servicios', 'nombreServicio precio'); // Asegúrate de hacer populate para los servicios

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.json({ message: 'Cita actualizada con éxito', cita });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar la cita', error });
    }
};

const cancelarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        // Validar que se proporcione un motivo de cancelación
        if (!motivo) {
            return res.status(400).json({ 
                message: 'Debe proporcionar un motivo de cancelación' 
            });
        }

        // Buscar y actualizar la cita, incluyendo motivo y fecha de cancelación
        const cita = await Cita.findByIdAndUpdate(
            id,
            {
                estadocita: 'Cancelada',
                motivo: motivo,
                fechacancelacion: new Date() // Fecha actual automáticamente
            },
            { new: true }
        )
        .populate('nombreempleado', 'nombreempleado')
        .populate('nombrecliente', 'nombrecliente')
        .populate('servicios', 'nombreServicio precio');

        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        // Verificar que la cita no esté ya completada o cancelada
        if (cita.estadocita === 'Completada') {
            return res.status(400).json({ 
                message: 'No se puede cancelar una cita ya completada' 
            });
        }

        res.json({ 
            message: 'Cita cancelada con éxito',
            cita: {
                ...cita._doc,
                motivo: motivo,
                fechacancelacion: new Date()
            }
        });
    } catch (error) {
        console.error('Error al cancelar la cita:', error);
        res.status(500).json({ 
            message: 'Error al cancelar la cita', 
            error: error.message 
        });
    }
};
// Eliminar una cita por ID
const eliminarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const cita = await Cita.findByIdAndDelete(id);
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        res.json({ message: 'Cita eliminada con éxito', cita });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cita', error });
    }
};

// Verificar disponibilidad del empleado
const verificarDisponibilidad = async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body); // Log para depuración
        
        const { nombreempleado, fecha, servicios } = req.body;
        
        // Validar que todos los campos requeridos estén presentes
        if (!nombreempleado || !fecha || !servicios || !Array.isArray(servicios)) {
            return res.status(400).json({ 
                message: 'Datos incompletos o inválidos',
                detalles: 'Se requiere nombreempleado, fecha y un array de servicios' 
            });
        }
        
        // Verificar que el empleado existe
        const empleado = await Empleado.findById(nombreempleado);
        if (!empleado) {
            return res.status(404).json({ 
                message: 'Empleado no encontrado',
                detalles: `No se encontró un empleado con ID: ${nombreempleado}` 
            });
        }
        
        // Obtener la duración total de los servicios
        const serviciosInfo = await Servicio.find({ '_id': { $in: servicios } });
        
        if (serviciosInfo.length === 0) {
            return res.status(404).json({ 
                message: 'Servicios no encontrados',
                detalles: 'No se encontraron los servicios especificados' 
            });
        }
        
        if (serviciosInfo.length !== servicios.length) {
            return res.status(400).json({ 
                message: 'Servicios inválidos',
                detalles: 'Uno o más IDs de servicios no existen en la base de datos' 
            });
        }
        
        const duracionTotal = serviciosInfo.reduce((total, servicio) => total + servicio.tiempo, 0);
        console.log('Duración total calculada:', duracionTotal); // Log para depuración
        
        // Obtener las citas del empleado para esa fecha
        const fechaInicio = new Date(fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(fecha);
        fechaFin.setHours(23, 59, 59, 999);
        
        const citasEmpleado = await Cita.find({
            nombreempleado: nombreempleado,
            fechacita: { $gte: fechaInicio, $lte: fechaFin },
            estadocita: { $in: ['Confirmada', 'En Progreso'] }
        });
        
        console.log('Citas encontradas:', citasEmpleado.length); // Log para depuración
        
        // Generar horarios disponibles (de 9:00 a 19:00 cada 30 minutos)
        const horariosDisponibles = [];
        for (let hora = 9; hora < 19; hora++) {
            for (let minuto of [0, 30]) {
                const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                
                // Verificar si este horario está disponible
                const horaInicio = new Date(fecha);
                horaInicio.setHours(hora, minuto, 0, 0);
                
                const horaFin = new Date(fecha);
                const minutosFin = minuto + Math.floor(duracionTotal);
                const horaAdicional = Math.floor(minutosFin / 60);
                horaFin.setHours(hora + horaAdicional, minutosFin % 60, 0, 0);
                
                // Verificar si hay conflicto con otras citas
                let hayConflicto = false;
                
                for (const cita of citasEmpleado) {
                    const citaInicio = new Date(cita.fechacita);
                    const citaHora = citaInicio.getHours();
                    const citaMinuto = citaInicio.getMinutes();
                    
                    // Calcular la duración de la cita basada en sus servicios
                    let citaDuracion = 0;
                    if (cita.servicios && cita.servicios.length > 0) {
                        // Necesitamos obtener la información de los servicios
                        const citaServiciosInfo = await Servicio.find({ '_id': { $in: cita.servicios } });
                        citaDuracion = citaServiciosInfo.reduce((total, s) => total + s.tiempo, 0);
                    } else {
                        citaDuracion = 60; // 1 hora por defecto si no hay servicios
                    }
                    
                    const citaFin = new Date(citaInicio);
                    const citaMinutosFin = citaMinuto + Math.floor(citaDuracion);
                    const citaHoraAdicional = Math.floor(citaMinutosFin / 60);
                    citaFin.setHours(citaHora + citaHoraAdicional, citaMinutosFin % 60, 0, 0);
                    
                    // Verificar si hay solapamiento
                    if (
                        (horaInicio >= citaInicio && horaInicio < citaFin) ||
                        (horaFin > citaInicio && horaFin <= citaFin) ||
                        (horaInicio <= citaInicio && horaFin >= citaFin)
                    ) {
                        hayConflicto = true;
                        break;
                    }
                }
                
                if (!hayConflicto) {
                    horariosDisponibles.push({
                        hora: horaStr,
                        duracion: duracionTotal,
                        inicio: horaInicio,
                        fin: horaFin
                    });
                }
            }
        }
        
        console.log('Horarios disponibles encontrados:', horariosDisponibles.length); // Log para depuración
        
        res.json({ 
            horariosDisponibles,
            duracionTotal,
            servicios: serviciosInfo.map(s => ({
                id: s._id,
                nombreServicio: s.nombreServicio,
                precio: s.precio,
                tiempo: s.tiempo
            }))
        });
    } catch (error) {
        console.error('Error en verificarDisponibilidad:', error);
        res.status(500).json({ 
            message: 'Error al verificar disponibilidad', 
            error: error.message || 'Error desconocido',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


// Iniciar cita (cambiar a "En Progreso")

const iniciarCita = async (req, res) => {
    try {
        const { id } = req.params;
        
        const cita = await Cita.findById(id)
            .populate('nombreempleado', 'nombreempleado')
            .populate('nombrecliente', 'nombrecliente apellidocliente correocliente celularcliente');
            
        if (!cita) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        
        if (cita.estadocita !== 'Confirmada') {
            return res.status(400).json({ message: 'La cita debe estar confirmada para iniciarla' });
        }
        
        cita.estadocita = 'En Progreso';
        await cita.save();
        
        // Obtener el siguiente código de venta
        const contador = await Contador.findOneAndUpdate(
            { nombre: "venta" },
            { $inc: { secuencia: 1 } },
            { new: true, upsert: true }
        );
        const codigoVenta = `V${contador.secuencia.toString().padStart(4, "0")}`;
        
        // Crear una venta de servicio inicial con los servicios de la cita
        const ventaServicio = new VentaServicio({
            codigoVenta,
            cliente: cita.nombrecliente._id,
            cita: cita._id,
            empleado: cita.nombreempleado._id,
            servicios: cita.servicios,
            precioTotal: cita.montototal,
            estado: true
        });
        
        await ventaServicio.save();
        
        res.json({ 
            message: 'Cita iniciada con éxito', 
            cita,
            ventaServicio
        });
    } catch (error) {
        console.error('Error al iniciar la cita:', error);
        res.status(500).json({ 
            message: 'Error al iniciar la cita', 
            error: error.message 
        });
    }
};

// En controllers/cita.js
const obtenerCitasPorCliente = async (req, res) => {
    try {
      const clienteId = req.query.clienteId || req.usuario?.id;
      
      if (!clienteId) {
        return res.status(400).json({ message: "ID de cliente no proporcionado" });
      }
      
      console.log("Buscando citas para el cliente/usuario ID:", clienteId);
      
      // Buscar citas donde el cliente coincida con el ID proporcionado
      // Primero intentar buscar por nombrecliente (si es un ID de cliente)
      let citas = await Cita.find({ nombrecliente: clienteId })
        .populate("nombreempleado")
        .populate("nombrecliente")
        .populate("servicios.servicio")
        .sort({ fechacita: 1 });
      
      // Si no hay resultados, intentar buscar por usuario (si es un ID de usuario)
      if (citas.length === 0) {
        // Primero intentar encontrar el cliente asociado al usuario
        const cliente = await Cliente.findOne({ usuario: clienteId });
        
        if (cliente) {
          citas = await Cita.find({ nombrecliente: cliente._id })
            .populate("nombreempleado")
            .populate("nombrecliente")
            .populate("servicios.servicio")
            .sort({ fechacita: 1 });
        }
      }
      
      console.log(`Se encontraron ${citas.length} citas para el cliente/usuario ID: ${clienteId}`);
      
      res.status(200).json(citas);
    } catch (error) {
      console.error("Error al obtener citas del cliente:", error);
      res.status(500).json({ message: "Error al obtener las citas", error: error.message });
    }
  };

module.exports = {
    crearCita,
    cancelarCita,
    obtenerCitas,
    obtenerCitaPorId,
    actualizarCita,
    eliminarCita,
    verificarDisponibilidad,
    iniciarCita,
    obtenerCitasPorCliente
};