"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { FaSpinner, FaInfoCircle, FaTrash, FaEdit, FaPlay, FaTimes, FaExclamationTriangle } from "react-icons/fa"
import "./CitasEnProgreso.css"

const CitasEnProgreso = () => {
  const [citas, setCitas] = useState([])
  const [ventas, setVentas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const API_URL = "https://gitbf.onrender.com/api"

  // Función para obtener los datos de citas y ventas
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No se encontró un token de autenticación")
        setIsLoading(false)
        return
      }

      const headers = { Authorization: `Bearer ${token}` }

      // Obtener citas confirmadas, en progreso, pendientes y canceladas
      try {
        const citasResponse = await axios.get(`${API_URL}/citas`, { headers })
        // console.log("Respuesta completa de citas:", citasResponse.data)

        const citasData = citasResponse.data.citas || []

        // Filtrar citas por estado
        const citasFiltradas = citasData.filter(
          (cita) =>
            cita.estadocita === "Confirmada" ||
            cita.estadocita === "En Progreso" ||
            cita.estadocita === "Pendiente" ||
            cita.estadocita === "Cancelada",
        )

        // Verificar que las citas tengan la información necesaria
        const citasValidas = citasFiltradas.filter((cita) => cita._id && cita.nombrecliente && cita.nombreempleado)

        // Log de citas canceladas para depuración
        const citasCanceladasIniciales = citasValidas.filter((cita) => cita.estadocita === "Cancelada")
        if (citasCanceladasIniciales.length > 0) {
          // console.log("Citas canceladas encontradas:", citasCanceladasIniciales.length)
          citasCanceladasIniciales.forEach((cita, index) => {
            // console.log(`Cita cancelada #${index + 1}:`, {
            //   id: cita._id,
            //   cliente: cita.nombrecliente?.nombrecliente,
            //   motivo: cita.motivo || "No especificado",
            //   fechaCancelacion: cita.fechacancelacion || "No registrada",
            // })
          })
        }

        // SOLUCIÓN CORREGIDA: Procesar las fechas correctamente
        const citasConFechasCorrectas = citasValidas.map((cita) => {
          // Crear una copia de la cita para no modificar la original
          const citaCorregida = { ...cita }

          // Si tenemos horacita como campo separado, calcular la fecha correcta
          if (citaCorregida.horacita) {
            // Extraer solo la parte de fecha de fechacita (YYYY-MM-DD)
            const fechaBase =
              typeof citaCorregida.fechacita === "string"
                ? citaCorregida.fechacita.split("T")[0]
                : new Date(citaCorregida.fechacita).toISOString().split("T")[0]

            // Guardar la fecha original para depuración
            citaCorregida._fechaOriginal = citaCorregida.fechacita

            // Construir fecha combinando fecha base y hora exacta
            citaCorregida._fechaCorrecta = `${fechaBase}T${citaCorregida.horacita}`

            // Crear un objeto Date para mostrar en la interfaz
            citaCorregida._fechaObjeto = new Date(`${fechaBase}T${citaCorregida.horacita}`)

            // console.log(
            //   `Cita ${citaCorregida._id}: Corrigiendo fecha de ${citaCorregida._fechaOriginal} a ${citaCorregida._fechaCorrecta}`,
            // )
          }

          return citaCorregida
        })

        setCitas(citasConFechasCorrectas)
      } catch (citasError) {
        console.error("Error al cargar citas:", citasError)
        setError("No se pudieron cargar las citas")
      }

      // Obtener ventas activas con manejo mejorado para respuestas vacías
      try {
        const ventasResponse = await axios.get(`${API_URL}/ventaservicios`, { headers })
        let ventasData = []

        if (ventasResponse.data) {
          if (Array.isArray(ventasResponse.data)) {
            // Si la respuesta es directamente un array
            ventasData = ventasResponse.data
          } else if (ventasResponse.data.ventaservicios && Array.isArray(ventasResponse.data.ventaservicios)) {
            // Si la respuesta tiene la estructura esperada
            ventasData = ventasResponse.data.ventaservicios
          } else if (typeof ventasResponse.data === "object") {
            // Si la respuesta es un objeto pero no tiene la estructura esperada
            // Intentamos extraer cualquier array que pueda contener
            const posiblesArrays = Object.values(ventasResponse.data).filter((val) => Array.isArray(val))
            if (posiblesArrays.length > 0) {
              ventasData = posiblesArrays[0]
            }
          }
        }

        // Filtrar ventas activas (con estado true)
        const ventasActivas = ventasData.filter((venta) => venta && venta.estado === true)
        setVentas(ventasActivas)

        // console.log("Ventas cargadas correctamente:", ventasActivas.length)
      } catch (ventasError) {
        console.error("Error al cargar ventas:", ventasError)
        setVentas([]) // Establecer un array vacío para evitar errores
      }
    } catch (error) {
      console.error("Error general al cargar datos:", error)
      setError("No se pudieron cargar los datos necesarios")
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos al iniciar y actualizar cada 30 segundos
  useEffect(() => {
    fetchData()
    const intervalId = setInterval(fetchData, 30000)
    return () => clearInterval(intervalId)
  }, [location.pathname])

  // Verificar si una cita ya tiene una venta asociada
  const tieneVentaAsociada = (citaId) => {
    if (!citaId) return false
    return ventas.some((venta) => {
      const ventaCitaId = venta.cita?._id || venta.cita
      return ventaCitaId === citaId
    })
  }

  // Obtener el ID de la venta asociada a una cita
  const getVentaIdPorCita = (citaId) => {
    if (!citaId) return null
    const venta = ventas.find((v) => {
      const ventaCitaId = v.cita?._id || v.cita
      return ventaCitaId === citaId
    })
    return venta ? venta._id : null
  }

  // Continuar con una venta existente
  const continuarVenta = async (ventaId) => {
    if (!ventaId) {
      Swal.fire("Error", "ID de venta no válido", "error")
      return
    }

    Swal.fire({
      title: "Verificando venta...",
      text: "Por favor espere",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }

      try {
        const ventaResponse = await axios.get(`${API_URL}/ventaservicio/${ventaId}`, { headers })

        if (ventaResponse.data) {
          Swal.close()
          navigate(`/gestion-venta/${ventaId}`)
        } else {
          throw new Error("Venta no encontrada")
        }
      } catch (error) {
        console.error("Error al verificar la venta:", error)

        // Si la venta no existe, intentar encontrar la cita asociada
        const citaAsociada = citas.find((cita) => getVentaIdPorCita(cita._id) === ventaId)

        if (citaAsociada) {
          // Si encontramos la cita, ir directamente a crear una nueva venta
          Swal.fire({
            title: "Venta no encontrada",
            text: "La venta que intentas acceder no existe o ha sido eliminada. Se iniciará una nueva venta para esta cita.",
            icon: "warning",
            confirmButtonText: "Continuar",
          }).then(() => {
            iniciarVenta(citaAsociada._id)
          })
        } else {
          Swal.fire({
            title: "Error",
            text: "No se pudo encontrar la venta ni la cita asociada.",
            icon: "error",
            confirmButtonText: "Volver a la lista",
          }).then(() => {
            window.location.reload()
          })
        }
      }
    } catch (error) {
      console.error("Error general:", error)
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al procesar la solicitud.",
        icon: "error",
        confirmButtonText: "Aceptar",
      })
    }
  }

  // Iniciar una nueva venta
  const iniciarVenta = async (citaId) => {
    if (!citaId) {
      Swal.fire("Error", "ID de cita no válido", "error")
      return
    }

    Swal.fire({
      title: "Verificando cita...",
      text: "Por favor espere",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }

      // Verificar si la cita existe
      const citaResponse = await axios.get(`${API_URL}/citas/${citaId}`, { headers })

      if (citaResponse.data && citaResponse.data.cita) {
        // Intentar obtener servicios con descuentos y guardarlos en localStorage
        try {
          // console.log("Importando función obtenerServiciosConDescuento...")
          const { obtenerServiciosConDescuento } = await import("../Servicios/obtenerServicios")
          // console.log("Obteniendo servicios con descuentos...")
          const serviciosConDescuento = await obtenerServiciosConDescuento()
          // console.log("Servicios con descuento obtenidos:", serviciosConDescuento.length)

          // Si la cita tiene servicios, guardarlos con información de descuento
          if (citaResponse.data.cita.servicios && citaResponse.data.cita.servicios.length > 0) {
            // console.log("Servicios en la cita:", citaResponse.data.cita.servicios)

            const serviciosFormateados = await Promise.all(
              citaResponse.data.cita.servicios.map(async (servicio) => {
                // Determinar el ID del servicio
                const servicioId = servicio.servicio || servicio._id
                // console.log(`Procesando servicio ID: ${servicioId}`)

                // Buscar el servicio completo en la lista de servicios con descuento
                const servicioCompleto = serviciosConDescuento.find((s) => s._id === servicioId)

                if (servicioCompleto) {
                  // console.log(`Servicio encontrado en lista con descuentos: ${servicioCompleto.nombreServicio}`)
                  return {
                    servicio: servicioId,
                    nombreServicio: servicioCompleto.nombreServicio,
                    precio: servicioCompleto.precio,
                    tiempo: servicioCompleto.tiempo,
                    tieneDescuento: servicioCompleto.tieneDescuento,
                    precioOriginal: servicioCompleto.precioOriginal,
                    precioConDescuento: servicioCompleto.precioConDescuento,
                    porcentajeDescuento: servicioCompleto.porcentajeDescuento,
                  }
                } else {
                  // Si no lo encontramos en la lista, intentar validar el ID
                  // console.log(`Servicio no encontrado en lista, validando ID: ${servicioId}`)
                  const { validarIdServicio } = await import("../Servicios/obtenerServicios")
                  const idValidado = await validarIdServicio(servicioId)

                  if (idValidado !== servicioId) {
                    // console.log(`ID validado diferente: ${idValidado}, buscando nuevamente`)
                    const servicioValidado = serviciosConDescuento.find((s) => s._id === idValidado)

                    if (servicioValidado) {
                      return {
                        servicio: idValidado,
                        nombreServicio: servicioValidado.nombreServicio,
                        precio: servicioValidado.precio,
                        tiempo: servicioValidado.tiempo,
                        tieneDescuento: servicioValidado.tieneDescuento,
                        precioOriginal: servicioValidado.precioOriginal,
                        precioConDescuento: servicioValidado.precioConDescuento,
                        porcentajeDescuento: servicioValidado.porcentajeDescuento,
                      }
                    }
                  }

                  // Si no encontramos el servicio, usar los datos básicos
                  return {
                    servicio: servicioId,
                    nombreServicio: servicio.nombreServicio || "Servicio",
                    precio: servicio.precio || 0,
                    tiempo: servicio.tiempo || 0,
                    tieneDescuento: false,
                    precioOriginal: Number.parseFloat(servicio.precio || 0),
                    precioConDescuento: Number.parseFloat(servicio.precio || 0),
                    porcentajeDescuento: 0,
                  }
                }
              }),
            )

            // console.log("Servicios formateados con descuentos:", serviciosFormateados)
            localStorage.setItem(`servicios_cita_${citaId}`, JSON.stringify(serviciosFormateados))
            // console.log("Servicios con descuento guardados en localStorage antes de iniciar venta")
          }
        } catch (error) {
          console.error("Error al preparar servicios con descuento:", error)
        }

        // Verificar si ya existe una venta para esta cita
        try {
          const ventasResponse = await axios.get(`${API_URL}/ventaservicios`, { headers })
          const ventasData = ventasResponse.data.ventaservicios || []

          // Buscar si ya existe una venta para esta cita
          const ventaExistente = ventasData.find((v) => {
            const ventaCitaId = v.cita?._id || v.cita
            return ventaCitaId === citaId && v.estado === true
          })

          if (ventaExistente) {
            // Si ya existe una venta, ir a esa venta
            Swal.close()
            navigate(`/gestion-venta/${ventaExistente._id}`)
          } else {
            // Si no existe una venta, ir a crear una nueva
            Swal.close()
            // Actualizar el estado de la cita a "En Progreso" antes de navegar
            try {
              await axios.put(`${API_URL}/citas/${citaId}`, { estadocita: "En Progreso" }, { headers })
              // console.log("Cita marcada como En Progreso")

              // Actualizar la lista de citas en la UI
              setCitas((prevCitas) =>
                prevCitas.map((cita) => (cita._id === citaId ? { ...cita, estadocita: "En Progreso" } : cita)),
              )
            } catch (updateError) {
              console.error("Error al actualizar estado de cita:", updateError)
              // No interrumpir el flujo principal si falla la actualización
            }
            navigate(`/gestion-venta/new/${citaId}`)
          }
        } catch (error) {
          console.error("Error al verificar ventas existentes:", error)
          // Si hay error al verificar ventas, asumimos que no hay y creamos una nueva
          Swal.close()
          navigate(`/gestion-venta/new/${citaId}`)
        }
      } else {
        throw new Error("Cita no encontrada")
      }
    } catch (error) {
      console.error("Error al verificar la cita:", error)
      Swal.fire({
        title: "Cita no encontrada",
        text: "La cita seleccionada no existe o ha sido eliminada",
        icon: "error",
        confirmButtonText: "Actualizar lista",
      }).then(() => {
        window.location.reload()
      })
    }
  }

  // Cancelar una cita
  async function cancelarCita(citaId) {
    if (!citaId) {
      Swal.fire("Error", "ID de cita no válido", "error")
      return
    }
  
    const { value: motivo } = await Swal.fire({
      title: "Cancelar cita",
      input: "textarea",
      inputLabel: "Motivo de cancelación",
      inputPlaceholder: "Ingrese el motivo de cancelación...",
      inputAttributes: {
        "aria-label": "Ingrese el motivo de cancelación",
      },
      showCancelButton: true,
      confirmButtonText: "Confirmar cancelación",
      cancelButtonText: "Volver",
      inputValidator: (value) => {
        if (!value) {
          return "Debe ingresar un motivo de cancelación"
        }
      },
    })
  
    if (motivo) {
      try {
        Swal.fire({
          title: "Cancelando cita...",
          text: "Por favor espere",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })
  
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No se encontró token de autenticación")
        }
  
        const headers = { Authorization: `Bearer ${token}` }
  
        // Obtener los datos actuales de la cita antes de cancelarla
        const citaResponse = await axios.get(`${API_URL}/citas/${citaId}`, { headers})
        const citaActual = citaResponse.data.cita || citaResponse.data
  
        // Crear objeto de datos completo para la cancelación
        const fechaCancelacion = new Date().toISOString()
  
        const datosCancelacion = {
          estadocita: "Cancelada",
          motivo: motivo,
          fechacancelacion: fechaCancelacion,
          horarioLiberado: true // Añadir este campo para indicar que el horario está disponible
        }
  
        // Enviar la solicitud para cancelar la cita
        const response = await axios.put(`${API_URL}/citas/${citaId}`, datosCancelacion, { headers })
  
        // Actualizar la cita en el estado local
        setCitas((prevCitas) =>
          prevCitas.map((cita) =>
            cita._id === citaId
              ? {
                  ...cita,
                  estadocita: "Cancelada",
                  motivo: motivo,
                  fechacancelacion: fechaCancelacion,
                  horarioLiberado: true
                }
              : cita
          )
        )
  
        Swal.fire({
          title: "¡Cita cancelada!",
          text: "La cita ha sido cancelada exitosamente y el horario ha sido liberado",
          icon: "success",
          confirmButtonText: "Aceptar",
        }).then(() => {
          fetchData() // Actualizar la lista de citas
        })
      } catch (error) {
        console.error("Error al cancelar la cita:", error)
        Swal.fire({
          title: "Error",
          text: `No se pudo cancelar la cita: ${error.response?.data?.message || error.message}`,
          icon: "error",
          confirmButtonText: "Aceptar",
        })
      }
    }
  }

  // Mostrar detalles de cancelación de una cita
  async function mostrarDetallesCancelacion(cita) {
    // console.log("Mostrando detalles de cancelación para cita:", cita._id)
    // console.log("Datos iniciales de la cita:", JSON.stringify(cita, null, 2))

    try {
      // Intentar obtener datos de respaldo del localStorage
      let datosRespaldo = null
      try {
        const respaldoStr = localStorage.getItem(`cancelacion_${cita._id}`)
        if (respaldoStr) {
          datosRespaldo = JSON.parse(respaldoStr)
          // console.log("Datos de respaldo encontrados en localStorage:", datosRespaldo)
        }
      } catch (e) {
        console.error("Error al leer datos de respaldo:", e)
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      const headers = { Authorization: `Bearer ${token}` }

      // Obtener datos actualizados de la cita
      let motivoCancelacion = "No especificado"
      let fechaCancelacionFormateada = "No registrada"
      let citaActualizada = null

      try {
        // Intentar obtener datos actualizados del servidor
        // console.log(`Obteniendo datos actualizados para cita ${cita._id}...`)
        const response = await axios.get(`${API_URL}/citas/${cita._id}`, { headers })
        // console.log("Respuesta completa del servidor:", response.data)

        // Extraer la cita de la respuesta según su estructura
        if (response.data && response.data.cita) {
          citaActualizada = response.data.cita
          // console.log("Usando datos de response.data.cita")
        } else if (response.data) {
          citaActualizada = response.data
          // console.log("Usando datos de response.data directamente")
        }

        // Verificar si tenemos datos de cancelación en la respuesta
        if (citaActualizada) {
          // console.log("Datos de cancelación en respuesta:", {
          //   motivo: citaActualizada.motivo,
          //   fechacancelacion: citaActualizada.fechacancelacion,
          // })

          // Usar los datos actualizados si existen
          if (citaActualizada.motivo) {
            motivoCancelacion = citaActualizada.motivo
            // console.log("Usando motivo del servidor:", motivoCancelacion)
          }

          if (citaActualizada.fechacancelacion) {
            try {
              const fechaCancelacion = new Date(citaActualizada.fechacancelacion)
              fechaCancelacionFormateada = fechaCancelacion.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
              // console.log("Usando fecha de cancelación del servidor:", fechaCancelacionFormateada)
            } catch (dateError) {
              console.error("Error al formatear fecha del servidor:", dateError)
              fechaCancelacionFormateada = String(citaActualizada.fechacancelacion)
            }
          }
        }
      } catch (fetchError) {
        console.error("Error al obtener datos actualizados:", fetchError)
        // Si falla la obtención de datos actualizados, continuamos con los siguientes pasos
      }

      // Si no pudimos obtener datos actualizados, usar los datos locales
      if (motivoCancelacion === "No especificado" && cita.motivo) {
        // console.log("Usando motivo de datos locales:", cita.motivo)
        motivoCancelacion = cita.motivo
      }

      if (fechaCancelacionFormateada === "No registrada" && cita.fechacancelacion) {
        // console.log("Usando fecha de cancelación de datos locales:", cita.fechacancelacion)
        try {
          const fechaCancelacion = new Date(cita.fechacancelacion)
          fechaCancelacionFormateada = fechaCancelacion.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        } catch (dateError) {
          console.error("Error al formatear fecha local:", dateError)
          fechaCancelacionFormateada = String(cita.fechacancelacion)
        }
      }

      // Si aún no tenemos datos, usar los datos de respaldo
      if (motivoCancelacion === "No especificado" && datosRespaldo?.motivo) {
        // console.log("Usando motivo de datos de respaldo:", datosRespaldo.motivo)
        motivoCancelacion = datosRespaldo.motivo
      }

      if (fechaCancelacionFormateada === "No registrada" && datosRespaldo?.fechacancelacion) {
        // console.log("Usando fecha de cancelación de datos de respaldo:", datosRespaldo.fechacancelacion)
        try {
          const fechaCancelacion = new Date(datosRespaldo.fechacancelacion)
          fechaCancelacionFormateada = fechaCancelacion.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        } catch (dateError) {
          console.error("Error al formatear fecha de respaldo:", dateError)
          fechaCancelacionFormateada = String(datosRespaldo.fechacancelacion)
        }
      }

      // Usar la fecha corregida si está disponible
      const fechaCita = cita._fechaObjeto || new Date(cita.fechacita)

      // Mostrar el modal con la información
      Swal.fire({
        title: "Detalles de Cancelación",
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Cliente:</strong> ${cita.nombrecliente?.nombrecliente} ${cita.nombrecliente?.apellidocliente || ""}</p>
            <p class="mb-2"><strong>Empleado:</strong> ${cita.nombreempleado?.nombreempleado || "No asignado"}</p>
            <p class="mb-2"><strong>Fecha de cita:</strong> ${fechaCita.toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })} a las ${cita.horacita || fechaCita.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
            <p class="mb-2"><strong>Motivo de cancelación:</strong> ${motivoCancelacion}</p>
            <p class="mb-2"><strong>Fecha de cancelación:</strong> ${fechaCancelacionFormateada}</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "Cerrar",
        customClass: {
          container: "swal-wide",
          popup: "swal-wide-popup",
          content: "swal-wide-content",
        },
      })
    } catch (error) {
      console.error("Error general al mostrar detalles:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los detalles de la cancelación",
        icon: "error",
        confirmButtonText: "Cerrar",
      })
    }
  }

  // Función para eliminar una cita
  async function eliminarCita(citaId) {
    if (!citaId) {
      Swal.fire("Error", "ID de cita no válido", "error")
      return
    }

    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la cita permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Eliminando cita...",
            text: "Por favor espere",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading()
            },
          })

          const token = localStorage.getItem("token")
          if (!token) {
            throw new Error("No se encontró token de autenticación")
          }

          const headers = { Authorization: `Bearer ${token}` }

          // Enviar la solicitud para eliminar la cita
          await axios.delete(`${API_URL}/citas/${citaId}`, { headers })

          // Eliminar datos de respaldo si existen
          try {
            localStorage.removeItem(`cancelacion_${citaId}`)
          } catch (e) {
            console.error("Error al eliminar datos de respaldo:", e)
          }

          // Actualizar la lista de citas
          setCitas((prevCitas) => prevCitas.filter((cita) => cita._id !== citaId))

          Swal.fire({
            title: "¡Cita eliminada!",
            text: "La cita ha sido eliminada exitosamente",
            icon: "success",
            confirmButtonText: "Aceptar",
          })
        } catch (error) {
          console.error("Error al eliminar la cita:", error)
          Swal.fire({
            title: "Error",
            text: `No se pudo eliminar la cita: ${error.message}`,
            icon: "error",
            confirmButtonText: "Aceptar",
          })
        }
      }
    })
  }

  // Mostrar indicador de carga mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh] dark:bg-primary">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando citas en progreso...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje de error si ocurrió algún problema
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => window.location.reload()}
        >
          <FaSpinner className="inline mr-2 text-pink-600" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Citas Activas</h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <FaSpinner className="mr-2" />
          Actualizar lista
        </button>
      </div>

      {citas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citas.map((cita) => {
            const tieneVenta = tieneVentaAsociada(cita._id)
            const ventaId = getVentaIdPorCita(cita._id)

            // Usar la fecha corregida si está disponible
            const fechaMostrar = cita._fechaObjeto || new Date(cita.fechacita)

            return (
              <div key={cita._id} className="dark:card-gradient-4 rounded-lg shadow-md overflow-hidden">
                <div
                  className={`p-4 ${
                    cita.estadocita === "En Progreso"
                    ? "bg-yellow-200 dark:bg-amber-800/80"
                    : cita.estadocita === "Confirmada"
                      ? "bg-green-100"
                      : cita.estadocita === "Cancelada"
                        ? "bg-red-300 dark:bg-rose-800/80"
                        : "bg-blue-200 dark:bg-indigo-800/80"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">
                      {cita.nombrecliente?.nombrecliente} {cita.nombrecliente?.apellidocliente}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        cita.estadocita === "En Progreso"
                        ? "bg-blue-200 text-blue-800"
                        : cita.estadocita === "Confirmada"
                          ? "bg-green-200 text-green-800"
                          : cita.estadocita === "Cancelada"
                            ? "bg-red-200 text-red-800"
                            : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {cita.estadocita}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                <p className="text-sm text-foreground mb-2">
                    <strong>Empleado:</strong> {cita.nombreempleado?.nombreempleado || "No asignado"}
                  </p>
                  <p className="text-sm text-foreground mb-2">
                    <strong>Fecha:</strong>{" "}
                    {fechaMostrar.toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-foreground mb-2">
                    <strong>Hora:</strong>{" "}
                    {cita.horacita ||
                      fechaMostrar.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                  <p className="text-sm text-foreground mb-2">
                    <strong>Monto Total:</strong>{" "}
                    ${Number(cita.montototal).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },) || 0.00
                    }
                    {/* ${cita.montototal?.toFixed(2) || "0.00"} */}
                  </p>

                  <div className="flex justify-end gap-2">
                    {cita.estadocita === "Cancelada" ? (
                      <>
                        <button
                          onClick={() => mostrarDetallesCancelacion(cita)}
                          className="btn-info-2 bg-gray-300 dark:bg-gray-800"
                        >
                          <FaInfoCircle className="inline mr-2" />
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => eliminarCita(cita._id)}
                          className="btn-delete-cp bg-red-300 dark:bg-red-800"
                        >
                          <FaTrash className="inline mr-2" />
                          Eliminar
                        </button>
                      </>
                    ) : tieneVenta ? (
                      <button
                        onClick={() => continuarVenta(ventaId)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        <FaEdit className="inline mr-2" />
                        Continuar Venta
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => iniciarVenta(cita._id)}
                          className="btn-start-1 bg-green-300 dark:bg-green-800"
                        >
                          <FaPlay className="inline mr-2" />
                          Iniciar Venta
                        </button>
                        <button
                          onClick={() => cancelarCita(cita._id)}
                          className="btn-cancel-cp bg-red-300 dark:bg-red-800"
                        >
                          <FaTimes className="inline mr-2" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="dark:bg-primary p-6 rounded-lg text-center">
          <FaExclamationTriangle className="inline-block text-yellow-500 text-4xl mb-2" />
          <p className="text-gray-500">No hay citas activas en este momento</p>
        </div>
      )}
    </div>
  )
}

export default CitasEnProgreso
