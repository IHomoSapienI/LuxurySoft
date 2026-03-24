const { response } = require('express');
const mongoose = require('mongoose');
const Detalleservicio = require('../modules/detalleservicio');
const Servicio = require('../modules/servicio'); // Importar el modelo TipoServicio

// Obtener todos los servicios
const detserviciosGet = async (req, res = response) => {
    try {
        const detalleservicios = await Detalleservicio.find(); // Consultar todos los documentos de la colección y poblar tipoServicio

        // Si no hay servicios en la base de datos
        if (detalleservicios.length === 0) {
            return res.status(404).json({
                msg: 'No se encontraron detalles de servicios en la base de datos'
            });
        }

        res.json({
            detalleservicios
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al obtener los servicios'
        });
    }
};

// Crear un nuevo servicio
const detserviciosPost = async (req, res = response) => {
    const { servicio, precioTotal } = req.body; // Extraer datos del cuerpo de la solicitud

    // Validar los datos recibidos
    if (!servicio || !precioTotal) {
        return res.status(400).json({
            msg: 'Servicio y precio total son obligatorios.'
        });
    }

    try {
        // Verificar si el servicio especificado existe
        const existeServicio = await Servicio.findById(servicio);
        if (!existeServicio) {
            return res.status(400).json({
                msg: 'El servicio especificado no existe en la base de datos.'
            });
        }

        // Crear una nueva instancia del modelo Detalleservicio
        const detalleservicio = new Detalleservicio({ servicio, precioTotal });

        // Guardar el nuevo detalle de servicio en la base de datos
        await detalleservicio.save();
        res.status(201).json({
            msg: 'Detalle de servicio creado correctamente',
            detalleservicio
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Error al crear el detalle de servicio'
        });
    }
};

module.exports = {
    detserviciosGet,
    detserviciosPost
};
