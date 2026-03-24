const { response } = require("express")
const TiposervicioTs = require("../modules/tiposervicios.js")
const {tipoServicioSchema , tipoServicioUpdateSchema} = require("../validators/tiposervicio.validator.js")
//                         return true;


// Obtener todos los tipos de servicios
const tiposerviciostsGet = async (req, res = response) => {
    // Obtener todos los tipos de servicios
try {
    const tiposerviciosts = await TiposervicioTs.find() // Consultar todos los documentos de la colección
    // Si no hay tipos de servicios en la base de datos 
    if (tiposerviciosts.length === 0) {
        return res.status(404).json({
            msg: "No se encontraron tipos de servicios en la base de datos",
        })
    }


// Devolvemos los tipos de servicios obtenidos
res.json({
    tiposerviciosts,
})
}
    catch (error) {
        console.log(error)
        res.status(500).json({
            msg: "Error al obtener los tipos de servicios",
        })
    
}
}
// Crear un nuevo tipo de servicio

const tiposerviciostsPost = async (req, res = response) => { 
    try{
        const {error, value} = tipoServicioSchema.validate(req.body,{abortEarly:false});

        if (error){
            return res.status(400).json({
                msg: "Error en la validación de los datos",
                error: error.details.map((err) => err.message),
            })
        }
        const { nombreTipoServicio, activo } = value // Extraer datos del cuerpo de la solicitud
        console.log("🔎 Datos recibidos:", { nombreTipoServicio, activo });

        const tiposerviciots = new TiposervicioTs({ nombreTipoServicio, activo })
        // Guardar el nuevo tipo de servicio en la base de datos
        await tiposerviciots.save();

        res.status(201).json({
            msg: "Tipo servicio creado correctamente",
            tiposerviciots,
        })
    }
    catch (error){
        console.log(error)
        res.status(500).json({
            msg: "Error al crear el tipo de servicio",
        })
    }
    
    
    
    // const { nombreTipoServicio, activo } = req.body // Extraer datos del cuerpo de la solicitud
    // console.log("🔎 Datos recibidos:", { nombreTipoServicio, activo });
    // // Validar los datos recibidos
    // if (!nombreTipoServicio || activo === undefined) {
    //     return res.status(400).json({
    //         msg: "Nombre y estado activo del tipo de servicio son obligatorios.",
    //     })
    // }

    // // Crear una nueva instancia del modelo Tiposervicio
    // const tiposerviciots = new TiposervicioTs({ nombreTipoServicio, activo })
    // try {
    //     // Guardar el nuevo tipo de servicio en la base de datos
    //     await tiposerviciots.save()
    //     res.status(201).json({
    //         msg: "Tipo de servicio creado correctamente",
    //         tiposerviciots,
    //     })
    // } catch (error) {
    //     console.log(error)
    //     res.status(500).json({
    //         msg: "Error al crear el tipo de servicio",
    //     })
    // }
}   

// Actualizar un tipo de servicio
const tiposerviciostsPut = async (req, res = response) => {
    
    const {id} = req.params;
    try{
        const {error, value} = tipoServicioUpdateSchema.validate(req.body,{abortEarly:false});

        if (error){
            return res.status(400).json({
                msg: "Error en la validación de los datos",
                error: error.details.map((err) => err.message),
            })
        }
        const { nombreTipoServicio, activo } = value // Extraer datos del cuerpo de la solicitud
        console.log("🔎 Datos recibidos:", { nombreTipoServicio, activo });

        const tiposerviciots = await TiposervicioTs.findByIdAndUpdate(id, { nombreTipoServicio, activo }, { new: true })

        if (!tiposerviciots) {
            return res.status(404).json({
                msg: "Tipo de servicio no encontrado",
            })
        }

        if(value.nombreTipoServicio !== undefined){
            tiposerviciots.nombreTipoServicio = value.nombreTipoServicio;
        }
        if(value.activo !== undefined){
            tiposerviciots.activo = value.activo;
         }   
         await tiposerviciots.save();

        res.json({
            msg: "Tipo de servicio actualizado correctamente",
            tiposerviciots,
        })
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error al actualizar el tipo de servicio",
        });
    }
    
    
    // const {id} = req.params
    // const { nombreTipoServicio, activo } = req.body // Extraer datos del cuerpo de la solicitud

    // try {
    //     // Validar que el tipo de servicio existe
    //     const tiposerviciots = await TiposervicioTs.findById(id)
    //     if (!tiposerviciots) {
    //         return res.status(404).json({
    //             msg: "Tipo de servicio no encontrado",
    //         })
    //     }

    //     // Actualizar el tipo de servicio
    //     tiposerviciots.nombreTipoServicio = nombreTipoServicio
    //     tiposerviciots.activo = activo

    //     // Guardar los cambios en la base de datos
    //     await tiposerviciots.save()
    //     res.json({
    //         msg: "Tipo de servicio actualizado correctamente",
    //         tiposerviciots,
    //     })
    // } catch (error) {
    //     console.log(error)
    //     res.status(500).json({
    //         msg: "Error al actualizar el tipo de servicio",
    //     })
    // }
}

// Eliminar un tipo de servicio
const tiposerviciostsDelete = async (req, res = response) => {
    const { id } = req.params

    try {
        // Verificar si el tipo de servicio existe
        const tiposerviciots = await TiposervicioTs.findById(id)
        if (!tiposerviciots) {
            return res.status(404).json({
                msg: "Tipo de servicio no encontrado",
            })
        }

        // Eliminar el tipo de servicio de la base de datos
        await TiposervicioTs.findByIdAndDelete(id);

        res.json({
            msg: "Tipo de servicio eliminado correctamente",
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: "Error al eliminar el tipo de servicio",
        })
    }}

//cambiar el etado del tipod e servicio 
const tiposerviciostsToggleEstado = async (req, res = response) => {    
        const { id } = req.params
        try {
            const tiposerviciots = await TiposervicioTs.findById(id)

            if (!tiposerviciots) {
                return res.status(404).json({
                    msg: "Tipo de servicio no encontrado",
                })
            }

            // Cambiar el estado (invertir el valor actual)
            tiposerviciots.activo = !tiposerviciots.activo
            await tiposerviciots.save()
            res.json({
            msg: `Tipo de servicio ${tiposerviciots.activo ? "activado" : "desactivado"} correctamente`,
      tiposerviciots,})
        } catch (error) {
            console.log(error)
            res.status(500).json({
                msg: "Error al cambiar el estado del tipo de servicio",
            })
        }}


        module.exports = {
            tiposerviciostsGet,
            tiposerviciostsPost,
            tiposerviciostsPut,
            tiposerviciostsDelete,
            tiposerviciostsToggleEstado,
        }
