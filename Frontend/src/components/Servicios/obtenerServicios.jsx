// Optimizar la función para obtener servicios con descuento
export const obtenerServiciosConDescuento = async () => {
  try {
    // Obtener el token de autenticación del localStorage
    const token = localStorage.getItem("token")

    if (!token) {
      console.error("No se encontró token de autenticación")
      throw new Error("No se encontró token de autenticación")
    }

    // Realizar la solicitud con el token en los headers
    const response = await fetch("https://gitbf.onrender.com/api/servicios", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    const servicios = data.servicios || []

    // Obtener los tipos de servicio para verificar descuentos
    const tiposResponse = await fetch("https://gitbf.onrender.com/api/tiposervicios", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!tiposResponse.ok) throw new Error(`HTTP error al obtener tipos de servicio! status: ${tiposResponse.status}`)

    const tiposData = await tiposResponse.json()
    const tiposServicio = tiposData.tiposervicios || []

    // Crear un mapa de tipos de servicio para búsqueda rápida
    const tiposMap = {}
    tiposServicio.forEach((tipo) => {
      tiposMap[tipo._id] = tipo
    })

    // console.log("Tipos de servicio disponibles:", tiposServicio)

    // Filtrar servicios activos
    const serviciosActivos = servicios.filter((servicio) => servicio.estado === true)

    // Calcular precios con descuento
    const serviciosConDescuento = servicios.map((servicio) => {
      // Manejar el caso en que tipoServicio sea null o undefined
      if (!servicio.tipoServicio) {
        // Si no hay tipo de servicio, no hay descuento
        const precioOriginal = Number.parseFloat(servicio.precio || 0)

        return {
          ...servicio,
          tieneDescuento: false,
          precioOriginal,
          precioConDescuento: precioOriginal,
          porcentajeDescuento: 0,
          esPromocional: false,
        }
      }

      // Obtener el ID del tipo de servicio
      const tipoServicioId =
        typeof servicio.tipoServicio === "object" ? servicio.tipoServicio._id : servicio.tipoServicio

      // Buscar el tipo de servicio completo en el mapa
      const tipoServicioCompleto = tiposMap[tipoServicioId]

      // Verificar si el tipo de servicio existe y tiene descuento
      const tieneDescuento =
        tipoServicioCompleto && tipoServicioCompleto.descuento && tipoServicioCompleto.descuento > 0

      // Asegurar que el precio es un número
      const precioOriginal = Number.parseFloat(servicio.precio || 0)

      // Calcular el precio con descuento solo si hay descuento
      const precioConDescuento = tieneDescuento
        ? precioOriginal - (precioOriginal * tipoServicioCompleto.descuento) / 100
        : precioOriginal

      // Devolver el objeto con toda la información necesaria
      return {
        ...servicio,
        tieneDescuento,
        precioOriginal,
        precioConDescuento: Number.parseFloat(precioConDescuento.toFixed(2)), // Redondear a 2 decimales
        porcentajeDescuento: tieneDescuento ? tipoServicioCompleto.descuento : 0,
        esPromocional: tipoServicioCompleto ? tipoServicioCompleto.esPromocional : false,
        // Asegurarnos de que tipoServicio tenga toda la información
        tipoServicio: tipoServicioCompleto || servicio.tipoServicio,
      }
    })

    // console.log("Servicios procesados con descuentos:", serviciosConDescuento)

    // Verificar que todos los servicios tengan nombres válidos
    const serviciosValidados = serviciosConDescuento.map((servicio) => {
      if (!servicio.nombreServicio || servicio.nombreServicio === "Servicio") {
        console.warn(`Servicio ${servicio._id} sin nombre válido, asignando nombre por defecto`)
        return {
          ...servicio,
          nombreServicio: servicio.nombreServicio || `Servicio ${servicio._id.substring(0, 5)}`,
        }
      }
      return servicio
    })

    // console.log("Servicios validados con nombres:", serviciosValidados)

    // Verificar que cada servicio tenga la información completa
    serviciosValidados.forEach((servicio, index) => {
      // console.log(`Servicio #${index + 1}:`, {
      //   id: servicio._id,
      //   nombre: servicio.nombreServicio,
      //   precio: servicio.precio,
      //   tieneDescuento: servicio.tieneDescuento,
      //   precioOriginal: servicio.precioOriginal,
      //   precioConDescuento: servicio.precioConDescuento,
      //   porcentajeDescuento: servicio.porcentajeDescuento,
      // })
    })

    return serviciosValidados
  } catch (error) {
    console.error("Error al obtener los servicios:", error)
    // En caso de error, intentar obtener servicios de forma alternativa
    try {
      // Intentar obtener servicios usando axios como alternativa
      const axios = await import("axios").then((module) => module.default)
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const headers = { Authorization: `Bearer ${token}` }
      const serviciosResponse = await axios.get("https://gitbf.onrender.com/api/servicios", { headers })

      // También obtener tipos de servicio para calcular descuentos
      const tiposResponse = await axios.get("https://gitbf.onrender.com/api/tiposervicios", { headers })
      const tiposServicio = tiposResponse.data.tiposervicios || []

      // Crear un mapa de tipos de servicio para búsqueda rápida
      const tiposMap = {}
      tiposServicio.forEach((tipo) => {
        tiposMap[tipo._id] = tipo
      })

      if (serviciosResponse.data && serviciosResponse.data.servicios) {
        const servicios = serviciosResponse.data.servicios.filter((s) => s.estado === true)

        // Procesar servicios con descuentos
        return servicios.map((servicio) => {
          // Si no hay tipo de servicio, no hay descuento
          if (!servicio.tipoServicio) {
            return {
              ...servicio,
              tieneDescuento: false,
              precioOriginal: Number.parseFloat(servicio.precio || 0),
              precioConDescuento: Number.parseFloat(servicio.precio || 0),
              porcentajeDescuento: 0,
              esPromocional: false,
            }
          }

          // Obtener el ID del tipo de servicio
          const tipoServicioId =
            typeof servicio.tipoServicio === "object" ? servicio.tipoServicio._id : servicio.tipoServicio

          // Buscar el tipo de servicio completo en el mapa
          const tipoServicioCompleto = tiposMap[tipoServicioId]

          // Verificar si el tipo de servicio existe y tiene descuento
          const tieneDescuento =
            tipoServicioCompleto && tipoServicioCompleto.descuento && tipoServicioCompleto.descuento > 0

          // Asegurar que el precio es un número
          const precioOriginal = Number.parseFloat(servicio.precio || 0)

          // Calcular el precio con descuento solo si hay descuento
          const precioConDescuento = tieneDescuento
            ? precioOriginal - (precioOriginal * tipoServicioCompleto.descuento) / 100
            : precioOriginal

          return {
            ...servicio,
            tieneDescuento,
            precioOriginal,
            precioConDescuento: Number.parseFloat(precioConDescuento.toFixed(2)),
            porcentajeDescuento: tieneDescuento ? tipoServicioCompleto.descuento : 0,
            esPromocional: tipoServicioCompleto ? tipoServicioCompleto.esPromocional : false,
            tipoServicio: tipoServicioCompleto || servicio.tipoServicio,
          }
        })
      }
    } catch (alternativeError) {
      console.error("Error al obtener servicios de forma alternativa:", alternativeError)
    }

    throw error
  }
}

// Función para calcular el precio con descuento
export const calcularPrecioConDescuento = (precio, tipoServicio) => {
  if (!tipoServicio || !precio) return Number.parseFloat(precio || 0)

  // Verificar si el tipo de servicio tiene descuento
  const tieneDescuento = tipoServicio && tipoServicio.descuento && tipoServicio.descuento > 0

  // Convertir precio a número
  const precioOriginal = Number.parseFloat(precio || 0)

  // Calcular precio con descuento si aplica
  if (tieneDescuento) {
    const descuento = tipoServicio.descuento / 100
    const precioConDescuento = precioOriginal - precioOriginal * descuento
    // console.log(
    //   `Calculando descuento: Precio original ${precioOriginal}, descuento ${tipoServicio.descuento}%, precio final ${precioConDescuento}`,
    // )
    return Number.parseFloat(precioConDescuento.toFixed(2))
  }

  // Si no hay descuento, devolver el precio original
  return precioOriginal
}

// Función para validar y corregir IDs de servicios
export const validarIdServicio = async (servicioId) => {
  try {
    // console.log(`Validando ID de servicio: ${servicioId}`)

    // Obtener el token de autenticación del localStorage
    const token = localStorage.getItem("token")

    if (!token) {
      console.error("No se encontró token de autenticación")
      return servicioId
    }

    // Verificar si el ID es válido consultando directamente
    const response = await fetch(`https://gitbf.onrender.com/api/servicios/${servicioId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      // console.log(
      //   `ID de servicio ${servicioId} validado correctamente. Nombre: ${data.servicio?.nombreServicio || "Desconocido"}`,
      // )
      return servicioId
    } else {
      console.error(`El ID de servicio ${servicioId} no es válido en la base de datos. Código: ${response.status}`)

      // Intentar obtener todos los servicios para buscar uno similar
      const serviciosResponse = await fetch("https://gitbf.onrender.com/api/servicios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (serviciosResponse.ok) {
        const data = await serviciosResponse.json()
        const servicios = data.servicios || []
        // console.log(`Buscando entre ${servicios.length} servicios disponibles...`)

        // Buscar un servicio con ID similar (últimos 5 caracteres)
        if (servicioId && servicioId.length >= 5) {
          const ultimosCaracteres = servicioId.slice(-5)
          const servicioSimilar = servicios.find((s) => s._id.includes(ultimosCaracteres))

          if (servicioSimilar) {
            // console.log(
            //   `Encontrado servicio similar con ID ${servicioSimilar._id} para ${servicioId}. Nombre: ${servicioSimilar.nombreServicio}`,
            // )
            return servicioSimilar._id
          }
        }

        // Si no encontramos por los últimos caracteres, intentar buscar por nombre
        // Esto requiere que tengamos el nombre del servicio en algún lado
        const servicioOriginal = servicios.find((s) => s._id === servicioId)
        if (servicioOriginal && servicioOriginal.nombreServicio) {
          const servicioConMismoNombre = servicios.find(
            (s) => s.nombreServicio === servicioOriginal.nombreServicio && s._id !== servicioId,
          )

          if (servicioConMismoNombre) {
            // console.log(
            //   `Encontrado servicio con mismo nombre "${servicioOriginal.nombreServicio}" con ID ${servicioConMismoNombre._id}`,
            // )
            return servicioConMismoNombre._id
          }
        }

        // Mostrar los primeros 5 servicios para depuración
        // console.log("Primeros 5 servicios disponibles:")
        servicios.slice(0, 5).forEach((s) => {
          // console.log(`- ID: ${s._id}, Nombre: ${s.nombreServicio}, Precio: ${s.precio}`)
        })
      }

      return servicioId
    }
  } catch (error) {
    console.error(`Error al validar ID de servicio ${servicioId}:`, error)
    return servicioId
  }
}
