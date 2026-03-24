"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPlus,
  faTrash,
  faSave,
  faArrowLeft,
  faCheck,
  faShoppingBag,
  faCompassDrafting,
} from "@fortawesome/free-solid-svg-icons"
import "./gestionVentaServicio.css"

const GestionVentaServicio = () => {
  const { id, citaId } = useParams()
  const navigate = useNavigate()
  const [venta, setVenta] = useState(null)
  const [cita, setCita] = useState(null)
  const [servicios, setServicios] = useState([])
  const [productos, setProductos] = useState([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [nuevoServicio, setNuevoServicio] = useState({ id: "", nombre: "" })
  const [nuevoProducto, setNuevoProducto] = useState({ id: "", nombre: "", cantidad: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [error, setError] = useState(null)
  const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false)
  const [activeTab, setActiveTab] = useState("servicios") // servicios, productos
  const API_URL = "https://gitbf.onrender.com/api"
  const [duracionTotal, setDuracionTotal] = useState(0)
  const [tiempoTotal, setTiempoTotal] = useState(0)

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }

        // Cargar todos los servicios y productos disponibles primero
        try {
          // Cargar servicios con descuentos directamente usando la función importada
          const { obtenerServiciosConDescuento } = await import("../Servicios/obtenerServicios")
          // console.log("Importando función obtenerServiciosConDescuento...")

          // Obtener servicios con información de descuento
          const serviciosConDescuento = await obtenerServiciosConDescuento()
          // console.log("Servicios obtenidos con descuentos:", serviciosConDescuento)

          // Guardar los servicios en el estado
          setServicios(serviciosConDescuento || [])

          // Cargar productos normalmente
          const productosResponse = await axios.get(`${API_URL}/productos`, { headers })
          setProductos(productosResponse.data.productos || [])
        } catch (error) {
          console.error("Error al cargar servicios o productos:", error)
          // Intentar cargar de forma tradicional si falla el método con descuentos
          try {
            const [serviciosResponse, productosResponse] = await Promise.all([
              axios.get(`${API_URL}/servicios`, { headers }),
              axios.get(`${API_URL}/productos`, { headers }),
            ])

            // Intentar procesar los servicios para añadir información de descuento manualmente
            const serviciosData = serviciosResponse.data.servicios || []

            // Obtener tipos de servicio para calcular descuentos
            const tiposResponse = await axios.get(`${API_URL}/tiposervicios`, { headers })
            const tiposServicio = tiposResponse.data.tiposervicios || []

            // Crear un mapa de tipos de servicio para búsqueda rápida
            const tiposMap = {}
            tiposServicio.forEach((tipo) => {
              tiposMap[tipo._id] = tipo
            })

            // Procesar servicios para añadir información de descuento
            const serviciosProcesados = serviciosData.map((servicio) => {
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

              // Buscar el tipo de servicio completo
              const tipoServicioCompleto = tiposMap[tipoServicioId]

              // Verificar si tiene descuento
              const tieneDescuento =
                tipoServicioCompleto && tipoServicioCompleto.descuento && tipoServicioCompleto.descuento > 0

              // Calcular precio con descuento
              const precioOriginal = Number.parseFloat(servicio.precio || 0)
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

            // console.log("Servicios procesados manualmente con descuentos:", serviciosProcesados)
            setServicios(serviciosProcesados)
            setProductos(productosResponse.data.productos || [])
          } catch (fallbackError) {
            console.error("Error al cargar servicios o productos (fallback):", fallbackError)
          }
        }

        // Intentar cargar servicios y productos guardados en localStorage primero
        let serviciosGuardados = null
        let productosGuardados = null
        if (citaId) {
          try {
            const serviciosLocalStorage = localStorage.getItem(`servicios_cita_${citaId}`)
            const productosLocalStorage = localStorage.getItem(`productos_cita_${citaId}`)

            if (serviciosLocalStorage) {
              serviciosGuardados = JSON.parse(serviciosLocalStorage)
              // console.log("Servicios recuperados de localStorage (sin procesar):", serviciosGuardados)

              // Asegurar que los servicios recuperados tengan la estructura correcta
              if (Array.isArray(serviciosGuardados)) {
                // Intentar obtener información de descuentos para los servicios guardados
                try {
                  // Importar la función para obtener servicios con descuentos
                  const { obtenerServiciosConDescuento } = await import("../Servicios/obtenerServicios")
                  // console.log("Importando función obtenerServiciosConDescuento para procesar localStorage...")

                  // Obtener todos los servicios con información de descuento
                  const serviciosConDescuento = await obtenerServiciosConDescuento()
                  // console.log("Servicios con descuento obtenidos:", serviciosConDescuento.length)

                  // Procesar cada servicio guardado para asegurar que tenga información de descuento
                  serviciosGuardados = serviciosGuardados.map((servicio) => {
                    // Obtener el ID del servicio
                    const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio

                    // Buscar el servicio completo en la lista de servicios con descuento
                    const servicioCompleto = serviciosConDescuento.find((s) => s._id === servicioId)

                    if (servicioCompleto) {
                      // console.log(
                      //   `Servicio ${servicioId} encontrado con descuentos. Nombre: ${servicioCompleto.nombreServicio}, Tiene descuento: ${servicioCompleto.tieneDescuento}`,
                      // )

                      return {
                        ...servicio,
                        nombreServicio: servicio.nombreServicio || servicioCompleto.nombreServicio,
                        tieneDescuento: servicioCompleto.tieneDescuento || false,
                        precioOriginal: servicioCompleto.precioOriginal || Number.parseFloat(servicio.precio || 0),
                        precioConDescuento:
                          servicioCompleto.precioConDescuento || Number.parseFloat(servicio.precio || 0),
                        porcentajeDescuento: servicioCompleto.porcentajeDescuento || 0,
                        tiempo: servicio.tiempo || servicioCompleto.tiempo || 0,
                      }
                    }

                    // console.log(`Servicio ${servicioId} no encontrado en la lista de servicios con descuento`)
                    return servicio
                  })

                  // console.log("Servicios procesados con información de descuento:", serviciosGuardados)
                } catch (error) {
                  console.error("Error al procesar servicios con descuentos desde localStorage:", error)
                }
              }

              if (Array.isArray(serviciosGuardados) && serviciosGuardados.length > 0) {
                setServiciosSeleccionados(serviciosGuardados)
              }
            }

            if (productosLocalStorage) {
              productosGuardados = JSON.parse(productosLocalStorage)
              // console.log("Productos recuperados de localStorage:", productosGuardados)

              if (Array.isArray(productosGuardados) && productosGuardados.length > 0) {
                setProductosSeleccionados(productosGuardados)
              }
            }

            if (
              (serviciosGuardados && serviciosGuardados.length > 0) ||
              (productosGuardados && productosGuardados.length > 0)
            ) {
              setCambiosSinGuardar(false)
            }
          } catch (storageError) {
            console.error("Error al recuperar datos de localStorage:", storageError)
          }
        }

        // Si tenemos un ID de venta, cargamos la venta existente
        if (id && id !== "new") {
          try {
            // console.log(`Intentando cargar venta con ID: ${id}`)

            // Intentar obtener la venta directamente
            const ventaResponse = await axios.get(`${API_URL}/ventas/${id}`, { headers })

            // Verificar la estructura de la respuesta
            if (!ventaResponse.data) {
              throw new Error("Respuesta vacía del servidor")
            }

            // console.log("Respuesta de venta:", ventaResponse.data)

            // Determinar la estructura correcta de la venta
            let ventaData = null
            if (ventaResponse.data.venta) {
              ventaData = ventaResponse.data.venta
            } else if (ventaResponse.data.ventaservicio) {
              ventaData = ventaResponse.data.ventaservicio
            } else if (ventaResponse.data._id) {
              ventaData = ventaResponse.data
            }

            if (!ventaData) {
              throw new Error("No se pudo determinar la estructura de la venta")
            }

            setVenta(ventaData)

            // Verificar si la venta tiene una cita asociada
            const citaId = ventaData.cita?._id || ventaData.cita
            if (citaId) {
              try {
                const citaResponse = await axios.get(`${API_URL}/citas/${citaId}`, { headers })
                if (citaResponse.data && citaResponse.data.cita) {
                  setCita(citaResponse.data.cita)
                }
              } catch (citaError) {
                console.error("Error al cargar la cita asociada:", citaError)
                // No interrumpimos el flujo si no se puede cargar la cita
              }
            }

            // Si no tenemos servicios guardados en localStorage, usamos los de la venta
            if (!serviciosGuardados && ventaData.servicios && Array.isArray(ventaData.servicios)) {
              // Asegurarse de que cada servicio tenga la estructura correcta
              const serviciosFormateados = ventaData.servicios.map((servicio) => {
                // Obtener el ID del servicio
                const servicioId = servicio.servicio?._id || servicio.servicio || servicio._id

                // Buscar el servicio completo en la lista de servicios disponibles
                const servicioCompleto = servicios.find((s) => s._id === servicioId)

                return {
                  servicio: servicioId,
                  nombreServicio:
                    servicio.nombreServicio ||
                    servicio.servicio?.nombreServicio ||
                    (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
                  precio:
                    servicio.precio || servicio.servicio?.precio || (servicioCompleto ? servicioCompleto.precio : 0),
                  tiempo:
                    servicio.tiempo || servicio.servicio?.tiempo || (servicioCompleto ? servicioCompleto.tiempo : 0),
                }
              })

              // console.log("Servicios formateados de la venta:", serviciosFormateados)
              setServiciosSeleccionados(serviciosFormateados)

              // Guardar estos servicios en localStorage para futuras visitas
              try {
                localStorage.setItem(`servicios_cita_${citaId}`, JSON.stringify(serviciosFormateados))
                // console.log("Servicios de la venta guardados en localStorage")
              } catch (storageError) {
                console.error("Error al guardar servicios en localStorage:", storageError)
              }
            }

            // Si no tenemos productos guardados en localStorage, usamos los de la venta
            if (!productosGuardados && ventaData.productos && Array.isArray(ventaData.productos)) {
              // Asegurarse de que cada producto tenga la estructura correcta
              const productosFormateados = ventaData.productos.map((producto) => {
                // Obtener el ID del producto
                const productoId = producto.producto?._id || producto.producto || producto._id

                // Buscar el producto completo en la lista de productos disponibles
                const productoCompleto = productos.find((p) => p._id === productoId)

                return {
                  producto: productoId,
                  nombreProducto:
                    producto.nombreProducto ||
                    producto.producto?.nombreProducto ||
                    (productoCompleto ? productoCompleto.nombreProducto : "Producto"),
                  precio:
                    producto.precio || producto.producto?.precio || (productoCompleto ? productoCompleto.precio : 0),
                  cantidad: producto.cantidad || 1,
                  subtotal: (producto.precio || productoCompleto?.precio || 0) * (producto.cantidad || 1),
                }
              })

              // console.log("Productos formateados de la venta:", productosFormateados)
              setProductosSeleccionados(productosFormateados)

              // Guardar estos productos en localStorage para futuras visitas
              try {
                localStorage.setItem(`productos_cita_${citaId}`, JSON.stringify(productosFormateados))
                // console.log("Productos de la venta guardados en localStorage")
              } catch (storageError) {
                console.error("Error al guardar productos en localStorage:", storageError)
              }
            }

            setCambiosSinGuardar(false)
          } catch (ventaError) {
            console.error("Error al cargar la venta:", ventaError)
            setError("La venta solicitada no existe o ha sido eliminada")

            // Si la venta no existe, redirigir a la lista de citas en progreso después de un tiempo
            if (ventaError.response && ventaError.response.status === 404) {
              Swal.fire({
                title: "Venta no encontrada",
                text: "La venta que intentas acceder no existe o ha sido eliminada",
                icon: "error",
                confirmButtonText: "Volver a citas",
              }).then(() => {
                navigate("/citas-en-progreso")
              })
            }
          }
        }
        // Si tenemos un ID de cita pero no de venta, estamos creando una nueva venta desde una cita
        else if (citaId) {
          try {
            // console.log(`Intentando cargar cita con ID: ${citaId}`)
            const citaResponse = await axios.get(`${API_URL}/citas/${citaId}`, { headers })

            if (!citaResponse.data || !citaResponse.data.cita) {
              throw new Error("Respuesta de cita inválida")
            }

            // console.log("Respuesta de cita:", citaResponse.data)

            const citaData = citaResponse.data.cita
            setCita(citaData)

            // Verificar si ya existe una venta para esta cita
            // Esto es importante para citas en estado "En Progreso"
            let ventaExistente = null
            try {
              // console.log(`Buscando ventas existentes para la cita: ${citaId}`)
              // Intentar obtener todas las ventas y filtrar por cita
              const ventasResponse = await axios.get(`${API_URL}/ventas`, { headers })
              const todasLasVentas = ventasResponse.data.ventas || []
              // Filtrar las ventas que corresponden a esta cita
              const ventasDeCita = todasLasVentas.filter((venta) => {
                const ventaCitaId = venta.cita?._id || venta.cita
                return ventaCitaId === citaId
              })
              // console.log(`Encontradas ${ventasDeCita.length} ventas para la cita ${citaId}`)

              if (ventasDeCita.length > 0) {
                // Encontramos una venta existente para esta cita
                ventaExistente = ventasDeCita[0]
                // console.log("Venta existente encontrada:", ventaExistente)

                // Establecer la venta existente
                setVenta(ventaExistente)
              }
            } catch (ventasError) {
              console.error("Error al buscar ventas existentes para la cita:", ventasError)
              // No interrumpimos el flujo si no se pueden encontrar ventas
            }

            // Si no tenemos servicios guardados en localStorage, intentamos usar los de la venta o la cita
            if (!serviciosGuardados) {
              // Si encontramos una venta existente y tiene servicios, usamos esos
              if (
                ventaExistente &&
                ventaExistente.servicios &&
                Array.isArray(ventaExistente.servicios) &&
                ventaExistente.servicios.length > 0
              ) {
                const serviciosVenta = ventaExistente.servicios.map((servicio) => {
                  // Asegurarnos de obtener el ID correcto del servicio, no el ID del registro
                  const servicioId = servicio.servicio?._id || servicio.servicio

                  // Buscar el servicio completo en la lista de servicios disponibles
                  const servicioCompleto = servicios.find((s) => s._id === servicioId)

                  // console.log(
                  //   `Procesando servicio de venta existente: ID=${servicioId}, Nombre=${servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio")}`,
                  // )

                  return {
                    servicio: servicioId, // Usar el ID real del servicio
                    nombreServicio:
                      servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
                    precio: servicio.precio || (servicioCompleto ? servicioCompleto.precio : 0),
                    tiempo: servicio.tiempo || (servicioCompleto ? servicioCompleto.tiempo : 0),
                  }
                })

                // console.log("Servicios formateados de la venta existente:", serviciosVenta)
                setServiciosSeleccionados(serviciosVenta)

                // Guardar estos servicios en localStorage para futuras visitas
                try {
                  localStorage.setItem(`servicios_cita_${citaId}`, JSON.stringify(serviciosVenta))
                  // console.log("Servicios de la venta existente guardados en localStorage")
                } catch (storageError) {
                  console.error("Error al guardar servicios en localStorage:", storageError)
                }
              }
              // Si no hay venta o no tiene servicios, usamos los de la cita
              else if (citaData && citaData.servicios && Array.isArray(citaData.servicios)) {
                // Asegurarse de que cada servicio tenga la estructura correcta
                try {
                  // Primero, obtener información completa de todos los servicios
                  const serviciosIds = citaData.servicios.map((servicio) => {
                    // Verificar si el servicio tiene un campo 'servicio' que contiene el ID real
                    if (servicio.servicio) {
                      return typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio
                    }
                    // Si no tiene campo 'servicio', puede ser que el ID del servicio esté directamente en el objeto
                    return servicio._id
                  })

                  // console.log("IDs de servicios extraídos de la cita:", serviciosIds)

                  // Obtener información completa de los servicios
                  const serviciosCompletos = await Promise.all(
                    serviciosIds.map(async (servicioId) => {
                      try {
                        // Primero buscar en la lista de servicios ya cargados
                        const servicioEnLista = servicios.find((s) => s._id === servicioId)
                        if (servicioEnLista) {
                          // console.log(`Servicio ${servicioId} encontrado en la lista local`)
                          return servicioEnLista
                        }

                        // Si no está en la lista, buscarlo en la API
                        const response = await axios.get(`${API_URL}/servicios/${servicioId}`, { headers })
                        // console.log(`Servicio ${servicioId} obtenido de la API:`, response.data)
                        return response.data.servicio
                      } catch (error) {
                        console.error(`Error al obtener información del servicio ${servicioId}:`, error)
                        return null
                      }
                    }),
                  )

                  // Filtrar servicios nulos
                  const serviciosValidos = serviciosCompletos.filter((servicio) => servicio !== null)
                  // console.log("Servicios válidos obtenidos:", serviciosValidos)

                  // Mapear los servicios con información completa
                  const serviciosFormateados = citaData.servicios.map((servicio) => {
                    // Determinar el ID del servicio
                    const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio

                    // Buscar el servicio completo en los servicios obtenidos
                    const servicioCompleto = serviciosValidos.find((s) => s._id === servicioId)

                    if (!servicioCompleto) {
                      console.warn(`No se encontró información completa para el servicio ${servicioId}`)
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

                    // Verificar si el servicio tiene tipo de servicio con descuento
                    const tieneDescuento =
                      servicioCompleto.tipoServicio &&
                      servicioCompleto.tipoServicio.descuento &&
                      servicioCompleto.tipoServicio.descuento > 0

                    const precioOriginal = Number.parseFloat(servicio.precio || servicioCompleto.precio || 0)

                    // Calcular precio con descuento si aplica
                    const precioConDescuento = tieneDescuento
                      ? precioOriginal - (precioOriginal * servicioCompleto.tipoServicio.descuento) / 100
                      : precioOriginal

                    // console.log(
                    //   `Servicio formateado: ${servicioCompleto.nombreServicio}, Precio: ${precioOriginal}, Descuento: ${tieneDescuento ? servicioCompleto.tipoServicio.descuento : 0}%, Final: ${precioConDescuento}`,
                    // )

                    return {
                      servicio: servicioId,
                      nombreServicio: servicioCompleto.nombreServicio || "Servicio",
                      precio: precioOriginal,
                      tiempo: servicio.tiempo || servicioCompleto.tiempo || 0,
                      tieneDescuento,
                      precioOriginal,
                      precioConDescuento: Number.parseFloat(precioConDescuento.toFixed(2)),
                      porcentajeDescuento: tieneDescuento ? servicioCompleto.tipoServicio.descuento : 0,
                    }
                  })

                  // console.log("Servicios formateados de la cita con información completa:", serviciosFormateados)
                  setServiciosSeleccionados(serviciosFormateados)

                  // Guardar estos servicios en localStorage para futuras visitas
                  try {
                    localStorage.setItem(`servicios_cita_${citaId}`, JSON.stringify(serviciosFormateados))
                    // console.log("Servicios de la cita guardados en localStorage con información completa")
                  } catch (storageError) {
                    console.error("Error al guardar servicios en localStorage:", storageError)
                  }
                } catch (error) {
                  console.error("Error al procesar servicios de la cita:", error)

                  // Fallback al método anterior si hay un error
                  const serviciosFormateados = citaData.servicios.map((servicio) => {
                    const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio
                    const servicioCompleto = servicios.find((s) => s._id === servicioId)

                    return {
                      servicio: servicioId,
                      nombreServicio:
                        servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
                      precio: servicio.precio || (servicioCompleto ? servicioCompleto.precio : 0),
                      tiempo: servicio.tiempo || (servicioCompleto ? servicioCompleto.tiempo : 0),
                    }
                  })

                  setServiciosSeleccionados(serviciosFormateados)

                  try {
                    localStorage.setItem(`servicios_cita_${citaId}`, JSON.stringify(serviciosFormateados))
                  } catch (storageError) {
                    console.error("Error al guardar servicios en localStorage:", storageError)
                  }
                }
              }
            }

            // Si no tenemos productos guardados en localStorage, intentamos usar los de la venta existente
            if (!productosGuardados) {
              // Si encontramos una venta existente y tiene productos, usamos esos
              if (
                ventaExistente &&
                ventaExistente.productos &&
                Array.isArray(ventaExistente.productos) &&
                ventaExistente.productos.length > 0
              ) {
                const productosVenta = ventaExistente.productos.map((producto) => {
                  const productoId = producto.producto?._id || producto.producto

                  // Buscar el producto completo en la lista de productos disponibles
                  const productoCompleto = productos.find((p) => p._id === productoId)

                  return {
                    producto: productoId,
                    nombreProducto:
                      producto.nombreProducto || (productoCompleto ? productoCompleto.nombreProducto : "Producto"),
                    precio: producto.precio || (productoCompleto ? productoCompleto.precio : 0),
                    cantidad: producto.cantidad || 1,
                    subtotal: (producto.precio || productoCompleto?.precio || 0) * (producto.cantidad || 1),
                  }
                })

                // console.log("Productos formateados de la venta existente:", productosVenta)
                setProductosSeleccionados(productosVenta)

                // Guardar estos productos en localStorage para futuras visitas
                try {
                  localStorage.setItem(`productos_cita_${citaId}`, JSON.stringify(productosVenta))
                  // console.log("Productos de la venta existente guardados en localStorage")
                } catch (storageError) {
                  console.error("Error al guardar productos en localStorage:", storageError)
                }
              }
            }

            setCambiosSinGuardar(false)
          } catch (citaError) {
            console.error("Error al cargar la cita:", citaError)
            setError("La cita solicitada no existe o ha sido eliminada")

            // Si la cita no existe, redirigir a la lista de citas en progreso
            if (citaError.response && citaError.response.status === 404) {
              Swal.fire({
                title: "Cita no encontrada",
                text: "La cita que intentas acceder no existe o ha sido eliminada",
                icon: "error",
                confirmButtonText: "Volver a citas",
              }).then(() => {
                navigate("/citas-en-progreso")
              })
            }
          }
        }
      } catch (error) {
        console.error("Error general al cargar datos:", error)
        setError("Error al cargar los datos necesarios")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, citaId, navigate])

  // Calcular el precio total de servicios
  const precioTotalServicios = serviciosSeleccionados.reduce((total, servicio) => {
    // Usar el precio con descuento si está disponible
    if (servicio.tieneDescuento) {
      return total + (Number.parseFloat(servicio.precioConDescuento) || 0)
    } else {
      return total + (Number.parseFloat(servicio.precio) || 0)
    }
  }, 0)

  // Calcular el precio total de productos
  const precioTotalProductos = productosSeleccionados.reduce(
    (total, producto) => total + (Number.parseFloat(producto.subtotal) || 0),
    0,
  )

  // Calcular el precio total general
  const precioTotal = precioTotalServicios + precioTotalProductos

  // Calcular el tiempo total
  useEffect(() => {
    const calcularTiempoTotal = () => {
      const total = serviciosSeleccionados.reduce(
        (total, servicio) => total + (Number.parseInt(servicio.tiempo) || 0),
        0,
      )
      setDuracionTotal(total)
      setTiempoTotal(total)
    }

    calcularTiempoTotal()
  }, [serviciosSeleccionados])

  // Determinar el tipo de venta
  const getTipoVenta = () => {
    if (serviciosSeleccionados.length > 0 && productosSeleccionados.length > 0) {
      return "mixta"
    } else if (serviciosSeleccionados.length > 0) {
      return "servicios"
    } else if (productosSeleccionados.length > 0) {
      return "productos"
    }
    return "servicios" // Por defecto
  }

  // Mejorar la función agregarServicio para asegurar que los descuentos se apliquen correctamente
  // Reemplazar la función agregarServicio completa

  // Agregar un nuevo servicio
  const agregarServicio = async () => {
    if (nuevoServicio.id) {
      const servicioSeleccionado = servicios.find((s) => s._id === nuevoServicio.id)

      if (!servicioSeleccionado) {
        return Swal.fire("Error", "No se encontró el servicio seleccionado", "error")
      }

      if (serviciosSeleccionados.some((s) => s.servicio === servicioSeleccionado._id)) {
        return Swal.fire("Advertencia", "Este servicio ya ha sido agregado", "warning")
      }

      // console.log("Servicio seleccionado para agregar:", servicioSeleccionado)

      // Verificar si el servicio tiene descuento
      const tieneDescuento =
        servicioSeleccionado.tieneDescuento ||
        (servicioSeleccionado.tipoServicio &&
          servicioSeleccionado.tipoServicio.descuento &&
          servicioSeleccionado.tipoServicio.descuento > 0)

      const precioOriginal = Number.parseFloat(servicioSeleccionado.precio || 0)

      // Calcular precio con descuento si aplica
      let precioConDescuento = precioOriginal
      let porcentajeDescuento = 0

      if (tieneDescuento) {
        // Si ya tiene precioConDescuento calculado, usarlo
        if (servicioSeleccionado.precioConDescuento) {
          precioConDescuento = servicioSeleccionado.precioConDescuento
          porcentajeDescuento =
            servicioSeleccionado.porcentajeDescuento ||
            (servicioSeleccionado.tipoServicio ? servicioSeleccionado.tipoServicio.descuento : 0)
        }
        // Si no, calcularlo basado en el tipo de servicio
        else if (servicioSeleccionado.tipoServicio && servicioSeleccionado.tipoServicio.descuento) {
          porcentajeDescuento = servicioSeleccionado.tipoServicio.descuento
          precioConDescuento = precioOriginal - (precioOriginal * porcentajeDescuento) / 100
        }
      }

      // console.log(
      //   `Agregando servicio ${servicioSeleccionado.nombreServicio}: ` +
      //     `Precio original: ${precioOriginal}, ` +
      //     `Tiene descuento: ${tieneDescuento}, ` +
      //     `Descuento: ${porcentajeDescuento}%, ` +
      //     `Precio con descuento: ${precioConDescuento}`,
      // )

      // Si llegamos aquí, agregamos el servicio con información de descuento
      const nuevoServicioItem = {
        servicio: servicioSeleccionado._id,
        nombreServicio: servicioSeleccionado.nombreServicio,
        precio: precioOriginal,
        tiempo: servicioSeleccionado.tiempo || 0,
        tieneDescuento,
        precioOriginal,
        precioConDescuento: Number.parseFloat(precioConDescuento.toFixed(2)),
        porcentajeDescuento,
      }

      const nuevosServicios = [...serviciosSeleccionados, nuevoServicioItem]
      setServiciosSeleccionados(nuevosServicios)
      setNuevoServicio({ id: "", nombre: "" })
      setCambiosSinGuardar(true) // Marcar que hay cambios sin guardar

      // Guardar en localStorage
      if (cita && cita._id) {
        try {
          localStorage.setItem(`servicios_cita_${cita._id}`, JSON.stringify(nuevosServicios))
          // Verificar que se guardó correctamente
          const serviciosGuardados = JSON.parse(localStorage.getItem(`servicios_cita_${cita._id}`))
          // console.log("Servicios guardados en localStorage:", serviciosGuardados)
        } catch (storageError) {
          console.error("Error al guardar servicios en localStorage:", storageError)
        }
      }
    } else {
      Swal.fire("Advertencia", "Por favor selecciona un servicio", "warning")
    }
  }

  // Agregar un nuevo producto
  const agregarProducto = async () => {
    if (nuevoProducto.id && nuevoProducto.cantidad > 0) {
      const productoSeleccionado = productos.find((p) => p._id === nuevoProducto.id)

      if (productoSeleccionado) {
        // Verificar si hay suficiente stock
        if (productoSeleccionado.stock < nuevoProducto.cantidad) {
          return Swal.fire("Advertencia", `Stock insuficiente. Disponible: ${productoSeleccionado.stock}`, "warning")
        }

        // Verificar si el producto ya está en la lista
        const productoExistente = productosSeleccionados.find((p) => p.producto === productoSeleccionado._id)

        if (productoExistente) {
          // Si ya existe, actualizar la cantidad
          const nuevaCantidad = productoExistente.cantidad + nuevoProducto.cantidad

          // Verificar stock nuevamente
          if (productoSeleccionado.stock < nuevaCantidad) {
            return Swal.fire(
              "Advertencia",
              `Stock insuficiente para agregar ${nuevoProducto.cantidad} más. Disponible: ${productoSeleccionado.stock}`,
              "warning",
            )
          }

          const nuevosProductos = productosSeleccionados.map((p) =>
            p.producto === productoSeleccionado._id
              ? {
                  ...p,
                  cantidad: nuevaCantidad,
                  subtotal: productoSeleccionado.precio * nuevaCantidad,
                }
              : p,
          )

          setProductosSeleccionados(nuevosProductos)
        } else {
          // Si no existe, agregar nuevo
          const nuevoProductoItem = {
            producto: productoSeleccionado._id,
            nombreProducto: productoSeleccionado.nombreProducto,
            precio: productoSeleccionado.precio || 0,
            cantidad: nuevoProducto.cantidad,
            subtotal: productoSeleccionado.precio * nuevoProducto.cantidad,
          }

          const nuevosProductos = [...productosSeleccionados, nuevoProductoItem]
          setProductosSeleccionados(nuevosProductos)
        }

        setNuevoProducto({ id: "", nombre: "", cantidad: 1 })
        setCambiosSinGuardar(true) // Marcar que hay cambios sin guardar

        // Guardar en localStorage
        if (cita && cita._id) {
          try {
            localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(productosSeleccionados))
            // console.log("Productos actualizados guardados en localStorage después de agregar")
          } catch (storageError) {
            console.error("Error al guardar productos en localStorage:", storageError)
          }
        }
      } else {
        Swal.fire("Advertencia", "El producto seleccionado no existe", "warning")
      }
    } else {
      Swal.fire("Advertencia", "Por favor selecciona un producto y especifica una cantidad válida", "warning")
    }
  }

  // Eliminar un servicio
  const eliminarServicio = (servicioId) => {
    const nuevosServicios = serviciosSeleccionados.filter((s) => s.servicio !== servicioId)
    setServiciosSeleccionados(nuevosServicios)
    setCambiosSinGuardar(true) // Marcar que hay cambios sin guardar

    // Guardar en localStorage
    if (cita && cita._id) {
      try {
        localStorage.setItem(`servicios_cita_${cita._id}`, JSON.stringify(nuevosServicios))
        // console.log("Servicios actualizados guardados en localStorage después de eliminar")
      } catch (storageError) {
        console.error("Error al guardar servicios en localStorage:", storageError)
      }
    }
  }

  // Eliminar un producto
  const eliminarProducto = (productoId) => {
    const nuevosProductos = productosSeleccionados.filter((p) => p.producto !== productoId)
    setProductosSeleccionados(nuevosProductos)
    setCambiosSinGuardar(true) // Marcar que hay cambios sin guardar

    // Guardar en localStorage
    if (cita && cita._id) {
      try {
        localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(nuevosProductos))
        // console.log("Productos actualizados guardados en localStorage después de eliminar")
      } catch (storageError) {
        console.error("Error al guardar productos en localStorage:", storageError)
      }
    }
  }

  // Actualizar cantidad de un producto
  const actualizarCantidadProducto = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      return eliminarProducto(productoId)
    }

    const producto = productos.find((p) => p._id === productoId)

    // Verificar stock
    if (producto && producto.stock < nuevaCantidad) {
      return Swal.fire("Advertencia", `Stock insuficiente. Disponible: ${producto.stock}`, "warning")
    }

    const nuevosProductos = productosSeleccionados.map((p) =>
      p.producto === productoId
        ? {
            ...p,
            cantidad: nuevaCantidad,
            subtotal: p.precio * nuevaCantidad,
          }
        : p,
    )

    setProductosSeleccionados(nuevosProductos)
    setCambiosSinGuardar(true) // Marcar que hay cambios sin guardar

    // Guardar en localStorage
    if (cita && cita._id) {
      try {
        localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(nuevosProductos))
        // console.log("Productos actualizados guardados en localStorage después de actualizar cantidad")
      } catch (storageError) {
        console.error("Error al guardar productos en localStorage:", storageError)
      }
    }
  }

  // Guardar cambios en la cita (sin crear venta)
  const guardarCambios = async () => {
    if (isSaving) return

    try {
      setIsSaving(true)
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }

      if (serviciosSeleccionados.length === 0 && productosSeleccionados.length === 0) {
        setIsSaving(false)
        return Swal.fire("Error", "Debe seleccionar al menos un servicio o producto", "error")
      }

      // Verificar si tenemos la información necesaria
      if (!cita || !cita._id) {
        setIsSaving(false)
        return Swal.fire("Error", "Información de cita incompleta", "error")
      }

      // Verificar que la cita tenga cliente y empleado
      if (!cita.nombrecliente || !cita.nombreempleado) {
        setIsSaving(false)
        return Swal.fire("Error", "La cita no tiene cliente o empleado asignado", "error")
      }

      const clienteId = typeof cita.nombrecliente === "object" ? cita.nombrecliente._id : cita.nombrecliente
      const empleadoId = typeof cita.nombreempleado === "object" ? cita.nombreempleado._id : cita.nombreempleado

      // Guardar en localStorage primero para asegurar que no se pierdan los datos
      try {
        localStorage.setItem(`servicios_cita_${cita._id}`, JSON.stringify(serviciosSeleccionados))
        localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(productosSeleccionados))
        // console.log("Servicios y productos guardados en localStorage antes de guardar en API")
      } catch (storageError) {
        console.error("Error al guardar datos en localStorage:", storageError)
      }

      // IMPORTANTE: Ahora solo actualizamos la cita, no creamos una venta
      try {
        // Actualizar el estado de la cita a "En Progreso" y guardar los servicios y productos seleccionados
        const serviciosFormateados = serviciosSeleccionados.map((servicio) => ({
          servicio: typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio,
          precio: servicio.precio || 0,
          tiempo: servicio.tiempo || 0,
        }))

        const productosFormateados = productosSeleccionados.map((producto) => ({
          producto: typeof producto.producto === "object" ? producto.producto._id : producto.producto,
          precio: producto.precio || 0,
          cantidad: producto.cantidad || 1,
        }))

        // Actualizar la cita con los servicios y productos seleccionados y cambiar su estado
        const citaResponse = await axios.put(
          `${API_URL}/citas/${cita._id}`,
          {
            nombreempleado: empleadoId,
            nombrecliente: clienteId,
            fechacita: cita.fechacita,
            horacita: cita.horacita,
            // horacita: cita.horacita || "00:00",
            duracionTotal: duracionTotal,
            servicios: serviciosFormateados, // Guardar los servicios seleccionados en la cita
            productos: productosFormateados, // Guardar los productos seleccionados en la cita
            montototal: precioTotal,
            estadocita: "En Progreso", // Cambiar estado a "En Progreso"
          },
          { headers },
        )

        // console.log("Cita actualizada:", citaResponse.data)

        // Actualizar el estado local de la cita
        if (citaResponse.data && citaResponse.data.cita) {
          setCita(citaResponse.data.cita)
        }

        // Marcar que no hay cambios sin guardar
        setCambiosSinGuardar(false)

        // Mostrar mensaje de éxito
        Swal.fire({
          title: "Éxito",
          text: "Cita actualizada correctamente",
          icon: "success",
          confirmButtonText: "Continuar",
        })
      } catch (error) {
        console.error("Error al actualizar la cita:", error)
        throw error
      }
    } catch (error) {
      console.error("Error al guardar los cambios:", error)

      // Mostrar información detallada del error para depuración
      if (error.response) {
        console.error("Datos de respuesta de error:", error.response.data)
        console.error("Estado de error:", error.response.status)
      }

      let mensajeError = "No se pudo guardar los cambios"

      if (error.response && error.response.data) {
        if (error.response.data.message) {
          mensajeError = error.response.data.message
        } else if (error.response.data.error) {
          mensajeError = error.response.data.error
        } else if (typeof error.response.data === "string") {
          mensajeError = error.response.data
        }
      } else if (error.message) {
        mensajeError = error.message
      }

      Swal.fire("Error", mensajeError, "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Finalizar la venta (crear venta y finalizar)
  const finalizarVenta = async () => {
    if (isSaving) return

    try {
      setIsSaving(true)
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }

      // Verificar si tenemos la información necesaria
      if (!cita || !cita._id) {
        setIsSaving(false)
        return Swal.fire("Error", "Información de cita incompleta", "error")
      }

      // Verificar que la cita tenga cliente y empleado
      if (!cita.nombrecliente || !cita.nombreempleado) {
        setIsSaving(false)
        return Swal.fire("Error", "La cita no tiene cliente o empleado asignado", "error")
      }

      // Verificar que tengamos servicios o productos seleccionados
      if (serviciosSeleccionados.length === 0 && productosSeleccionados.length === 0) {
        // Intentar recuperar datos del localStorage si no hay seleccionados
        try {
          const serviciosGuardados = localStorage.getItem(`servicios_cita_${cita._id}`)
          const productosGuardados = localStorage.getItem(`productos_cita_${cita._id}`)

          if (serviciosGuardados) {
            const serviciosParsed = JSON.parse(serviciosGuardados)
            if (Array.isArray(serviciosParsed) && serviciosParsed.length > 0) {
              // console.log("Recuperando servicios de localStorage para finalizar venta:", serviciosParsed)
              setServiciosSeleccionados(serviciosParsed)
            }
          }

          if (productosGuardados) {
            const productosParsed = JSON.parse(productosGuardados)
            if (Array.isArray(productosParsed) && productosParsed.length > 0) {
              // console.log("Recuperando productos de localStorage para finalizar venta:", productosParsed)
              setProductosSeleccionados(productosParsed)
            }
          }

          if (
            (serviciosGuardados && JSON.parse(serviciosGuardados).length > 0) ||
            (productosGuardados && JSON.parse(productosGuardados).length > 0)
          ) {
            // Continuar con la finalización después de un breve retraso para asegurar que el estado se actualice
            setTimeout(() => {
              finalizarVenta()
            }, 500)
            return
          }
        } catch (storageError) {
          console.error("Error al recuperar datos de localStorage:", storageError)
        }

        setIsSaving(false)
        return Swal.fire("Error", "No hay servicios ni productos seleccionados para finalizar la venta", "error")
      }

      const clienteId = typeof cita.nombrecliente === "object" ? cita.nombrecliente._id : cita.nombrecliente
      const empleadoId = typeof cita.nombreempleado === "object" ? cita.nombreempleado._id : cita.nombreempleado

      // Formatear los servicios para enviar al backend
      const serviciosFormateados = serviciosSeleccionados.map((servicio) => {
        // Asegurarse de que estamos enviando el objeto completo con la estructura correcta
        const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio

        // Buscar el servicio completo en la lista de servicios disponibles para obtener el nombre correcto
        const servicioCompleto = servicios.find((s) => s._id === servicioId)

        // Usar el precio con descuento si está disponible
        const precioFinal = servicio.tieneDescuento ? servicio.precioConDescuento : servicio.precio

        return {
          servicio: servicioId,
          nombreServicio: servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
          precio: precioFinal || 0,
          tiempo: servicio.tiempo || 0,
          tieneDescuento: servicio.tieneDescuento || false,
          precioOriginal: servicio.precioOriginal || precioFinal,
          porcentajeDescuento: servicio.porcentajeDescuento || 0,
        }
      })

      // Formatear los productos para enviar al backend
      const productosFormateados = productosSeleccionados.map((producto) => {
        // Asegurarse de que estamos enviando el objeto completo con la estructura correcta
        const productoId = typeof producto.producto === "object" ? producto.producto._id : producto.producto

        return {
          producto: productoId,
          nombreProducto: producto.nombreProducto || "",
          precio: producto.precio || 0,
          cantidad: producto.cantidad || 1,
          subtotal: producto.subtotal || producto.precio * producto.cantidad,
        }
      })

      // console.log("Servicios formateados para finalizar venta:", serviciosFormateados)
      // console.log("Productos formateados para finalizar venta:", productosFormateados)

      // Verificar que los IDs de servicio sean válidos y usar los IDs correctos
      const serviciosFormateadosConIdsCorrectos = serviciosFormateados.map((servicio) => {
        // El problema es que estamos usando el ID del registro en la cita, no el ID real del servicio
        // Necesitamos obtener el ID real del servicio desde la lista de servicios disponibles

        // Primero, obtener el ID que tenemos (puede ser el ID del registro en la cita)
        const servicioIdActual = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio

        // Buscar si este ID corresponde a un servicio real en la lista de servicios disponibles
        const servicioEnLista = servicios.find((s) => s._id === servicioIdActual)

        if (servicioEnLista) {
          // Si encontramos el servicio en la lista, usamos su ID
          // console.log(
          //   `Servicio encontrado en la lista: ${servicioEnLista.nombreServicio} con ID ${servicioEnLista._id}`,
          // )
          return {
            ...servicio,
            servicio: servicioEnLista._id,
          }
        } else {
          // Si no lo encontramos, puede ser que el ID que tenemos sea el ID del registro en la cita
          // Intentamos buscar por nombre para encontrar el servicio real
          const servicioNombre = servicio.nombreServicio || "Servicio"
          const servicioEncontradoPorNombre = servicios.find(
            (s) => s.nombreServicio && s.nombreServicio.toLowerCase() === servicioNombre.toLowerCase(),
          )

          if (servicioEncontradoPorNombre) {
            // console.log(`Servicio encontrado por nombre: ${servicioNombre} con ID ${servicioEncontradoPorNombre._id}`)
            return {
              ...servicio,
              servicio: servicioEncontradoPorNombre._id,
            }
          }

          // Si aún no lo encontramos, intentamos buscar en los servicios de la cita
          if (cita && cita.servicios && Array.isArray(cita.servicios)) {
            const servicioEnCita = cita.servicios.find((s) => s._id === servicioIdActual)
            if (servicioEnCita && servicioEnCita.servicio) {
              const idServicioReal =
                typeof servicioEnCita.servicio === "object" ? servicioEnCita.servicio._id : servicioEnCita.servicio

              // console.log(`Servicio encontrado en la cita: ID ${idServicioReal}`)
              return {
                ...servicio,
                servicio: idServicioReal,
              }
            }
          }

          // Si todo falla, mantenemos el ID original pero lo registramos
          console.warn(`No se pudo encontrar el servicio real para: ${servicioIdActual}. Usando el ID original.`)
          return {
            ...servicio,
            servicio: servicioIdActual,
          }
        }
      })

      // Importar la función de validación de IDs
      try {
        const { validarIdServicio } = await import("../Servicios/obtenerServicios")

        // Crear una copia de los servicios formateados para no modificar los originales
        const serviciosValidados = [...serviciosFormateadosConIdsCorrectos]

        // Validar los IDs de los servicios antes de enviarlos
        for (let i = 0; i < serviciosValidados.length; i++) {
          const servicio = serviciosValidados[i]
          const idValidado = await validarIdServicio(servicio.servicio)
          serviciosValidados[i] = {
            ...servicio,
            servicio: idValidado,
          }
        }

        // console.log("Servicios con IDs validados:", serviciosValidados)

        // Usar los servicios validados para el backend
        const serviciosFormateadosParaBackend = serviciosValidados.map((servicio) => {
          // Buscar el servicio completo en la lista de servicios disponibles
          const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio
          const servicioCompleto = servicios.find((s) => s._id === servicioId)

          // Determinar si tiene descuento y calcular valores
          const tieneDescuento = servicio.tieneDescuento || false
          const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
          const precioConDescuento = tieneDescuento
            ? Number.parseFloat(servicio.precioConDescuento || 0)
            : precioOriginal
          const descuentoAplicado = tieneDescuento ? precioOriginal - precioConDescuento : 0

          // console.log(
          //   `Preparando servicio para backend - ID: ${servicioId}, Nombre: ${servicio.nombreServicio}, Precio original: ${precioOriginal}, Precio con descuento: ${precioConDescuento}, Descuento aplicado: ${descuentoAplicado}`,
          // )

          // Crear el objeto con la estructura exacta que espera el backend
          return {
            servicio: servicioId,
            nombreServicio:
              servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
            precio: precioOriginal,
            precioFinal: precioConDescuento,
            tiempo: servicio.tiempo || 0,
            descuentoAplicado: descuentoAplicado,
            tipoDescuento: tieneDescuento ? "tipo-servicio" : null,
          }
        })

        // Calcular subtotales para la venta unificada
        const subtotalServicios = precioTotalServicios
        const subtotalProductos = precioTotalProductos

        // Verificar la estructura de datos antes de enviar
        // console.log("Verificando estructura de datos para el backend:")
        // console.log("Cliente ID:", clienteId)
        // console.log("Empleado ID:", empleadoId)
        // console.log("Cita ID:", cita._id)
        // console.log("Servicios formateados para backend:", serviciosFormateadosParaBackend)
        // console.log("Productos formateados:", productosFormateados)
        // console.log("Subtotal servicios:", subtotalServicios)
        // console.log("Subtotal productos:", subtotalProductos)
        // console.log("Total:", precioTotal)
        // console.log("Método de pago:", metodoPago)
        // console.log("Tipo de venta:", getTipoVenta())

        // Validar que los servicios tengan la estructura correcta
        const serviciosValidos = serviciosFormateadosParaBackend.every(
          (s) =>
            s.servicio &&
            s.nombreServicio &&
            typeof s.precio === "number" &&
            typeof s.precioFinal === "number" &&
            typeof s.descuentoAplicado === "number",
        )

        if (!serviciosValidos) {
          console.error("ESTRUCTURA DE SERVICIOS INVÁLIDA:", serviciosFormateadosParaBackend)
          setIsSaving(false)
          return Swal.fire({
            title: "Error de validación",
            text: "La estructura de los servicios no es válida. Revise la consola para más detalles.",
            icon: "error",
          })
        }

        // Declare ventaUnificadaData before using it
        const ventaUnificadaData = {
          cliente: clienteId,
          empleado: empleadoId,
          cita: cita._id,
          servicios: serviciosFormateadosParaBackend,
          productos: productosFormateados,
          subtotalServicios: subtotalServicios,
          subtotalProductos: subtotalProductos,
          total: precioTotal,
          metodoPago: metodoPago,
          tipoVenta: getTipoVenta(),
          estado: true, // Establecer explícitamente como completada
        }

        // console.log("Creando venta unificada:", ventaUnificadaData)

        try {
          // Crear la venta unificada
          const createResponse = await axios.post(`${API_URL}/ventas`, ventaUnificadaData, { headers })
          // console.log("Respuesta de creación de venta unificada:", createResponse.data)

          // Asegurar que la venta esté marcada como finalizada
          const ventaId = createResponse.data.venta?._id || createResponse.data._id
          if (ventaId) {
            try {
              await axios.put(`${API_URL}/ventas/${ventaId}/finalizar`, { metodoPago }, { headers })
              // console.log("Venta marcada explícitamente como finalizada")
            } catch (finalizarError) {
              console.error("Error al marcar la venta como finalizada:", finalizarError)
              // No interrumpir el flujo principal si falla esta operación
            }
          }

          // Actualizar el estado de la cita a "Completada" y liberar el horario
          await axios.put(
            `${API_URL}/citas/${cita._id}`,
            {
              nombreempleado: empleadoId,
              nombrecliente: clienteId,
              fechacita: cita.fechacita,
              horacita: cita.horacita,
              duracionTotal: duracionTotal,
              servicios: serviciosFormateados,
              productos: productosFormateados,
              montototal: precioTotal,
              estadocita: "Completada", // Cambiar estado a "Completada"
              horarioLiberado: true, // Marcar que el horario ha sido liberado
            },
            { headers },
          )

          // Notificar al sistema de agenda que el horario ha sido liberado
          try {
            // Primero, intentar liberar el horario con el endpoint específico
            const liberarResponse = await axios.post(
              `${API_URL}/horarios/liberar`,
              {
                citaId: cita._id,
                empleadoId: empleadoId,
                fecha: cita.fechacita,
                hora: cita.horacita,
                duracion: duracionTotal,
              },
              { headers },
            )
            // console.log("Respuesta de liberación de horario:", liberarResponse.data)

            // Como respaldo, también actualizar directamente la disponibilidad del empleado
            try {
              // Obtener la fecha en formato YYYY-MM-DD
              const fechaFormateada = new Date(cita.fechacita).toISOString().split("T")[0]

              // Intentar actualizar directamente la disponibilidad del empleado
              await axios.put(
                `${API_URL}/empleados/${empleadoId}/disponibilidad`,
                {
                  fecha: fechaFormateada,
                  hora: cita.horacita,
                  disponible: true, // Marcar como disponible
                  citaId: cita._id,
                  accion: "liberar",
                },
                { headers },
              )
              // console.log("Disponibilidad del empleado actualizada directamente")
            } catch (dispError) {
              console.error("Error al actualizar disponibilidad directamente:", dispError)
            }

            // console.log("Horario liberado correctamente en el sistema de agenda")
          } catch (horarioError) {
            console.error("Error al liberar horario:", horarioError)

            // Si falla el endpoint principal, intentar con un enfoque alternativo
            try {
              // Obtener la fecha en formato YYYY-MM-DD
              const fechaFormateada = new Date(cita.fechacita).toISOString().split("T")[0]

              // Intentar actualizar directamente la disponibilidad del empleado
              await axios.put(
                `${API_URL}/empleados/${empleadoId}/disponibilidad`,
                {
                  fecha: fechaFormateada,
                  hora: cita.horacita,
                  disponible: true, // Marcar como disponible
                  citaId: cita._id,
                  accion: "liberar",
                },
                { headers },
              )
              // console.log("Disponibilidad del empleado actualizada como respaldo")
            } catch (dispError) {
              console.error("Error en método alternativo de liberación:", dispError)
              // Mostrar una advertencia al usuario
              Swal.fire({
                title: "Advertencia",
                text: "Es posible que el horario no se haya liberado correctamente. Por favor, verifique la agenda del empleado.",
                icon: "warning",
                confirmButtonText: "Entendido",
              })
            }
          }

          // Limpiar localStorage
          try {
            localStorage.removeItem(`servicios_cita_${cita._id}`)
            localStorage.removeItem(`productos_cita_${cita._id}`)
            // console.log("Datos eliminados de localStorage después de finalizar venta")
          } catch (storageError) {
            console.error("Error al limpiar localStorage:", storageError)
          }

          // Marcar que no hay cambios sin guardar
          setCambiosSinGuardar(false)

          Swal.fire({
            title: "Éxito",
            text: "Venta finalizada correctamente",
            icon: "success",
            confirmButtonText: "Ir a ventas",
          }).then(() => {
            navigate("/ventas-unificadas")
          })
        } catch (error) {
          console.error("Error al crear la venta unificada:", error)
          depurarErrorRespuesta(error)
          throw error
        }
      } catch (error) {
        console.error("Error al validar IDs de servicios:", error)

        // Si hay error en la validación, usar los servicios sin validar
        const serviciosFormateadosParaBackend = serviciosFormateadosConIdsCorrectos.map((servicio) => {
          // Buscar el servicio completo en la lista de servicios disponibles
          const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio
          const servicioCompleto = servicios.find((s) => s._id === servicioId)

          // Determinar si tiene descuento y calcular valores
          const tieneDescuento = servicio.tieneDescuento || false
          const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
          const precioConDescuento = tieneDescuento
            ? Number.parseFloat(servicio.precioConDescuento || 0)
            : precioOriginal
          const descuentoAplicado = tieneDescuento ? precioOriginal - precioConDescuento : 0

          // Crear el objeto con la estructura exacta que espera el backend
          return {
            servicio: servicioId,
            nombreServicio:
              servicio.nombreServicio || (servicioCompleto ? servicioCompleto.nombreServicio : "Servicio"),
            precio: precioOriginal,
            precioFinal: precioConDescuento,
            tiempo: servicio.tiempo || 0,
            descuentoAplicado: descuentoAplicado,
            tipoDescuento: tieneDescuento ? "tipo-servicio" : null,
          }
        })

        // Calcular subtotales para la venta unificada
        const subtotalServicios = precioTotalServicios
        const subtotalProductos = precioTotalProductos

        // Crear la venta unificada con los datos disponibles
        const ventaUnificadaData = {
          cliente: clienteId,
          empleado: empleadoId,
          cita: cita._id,
          servicios: serviciosFormateadosParaBackend,
          productos: productosFormateados,
          subtotalServicios: subtotalServicios,
          subtotalProductos: subtotalProductos,
          total: precioTotal,
          metodoPago: metodoPago,
          tipoVenta: getTipoVenta(),
        }

        // console.log("Creando venta unificada (sin validación de IDs):", ventaUnificadaData)

        try {
          // Crear la venta unificada
          const createResponse = await axios.post(`${API_URL}/ventas`, ventaUnificadaData, { headers })
          // console.log("Respuesta de creación de venta unificada:", createResponse.data)

          // Actualizar el estado de la cita a "Completada"
          await axios.put(
            `${API_URL}/citas/${cita._id}`,
            {
              nombreempleado: empleadoId,
              nombrecliente: clienteId,
              fechacita: cita.fechacita,
              horacita: cita.horacita,
              duracionTotal: duracionTotal,
              servicios: serviciosFormateados,
              productos: productosFormateados,
              montototal: precioTotal,
              estadocita: "Completada", // Cambiar estado a "Completada"
              horarioLiberado: true, // Marcar que el horario ha sido liberado
            },
            { headers },
          )

          // Notificar al sistema de agenda que el horario ha sido liberado
          try {
            // Primero, intentar liberar el horario con el endpoint específico
            const liberarResponse = await axios.post(
              `${API_URL}/horarios/liberar`,
              {
                citaId: cita._id,
                empleadoId: empleadoId,
                fecha: cita.fechacita,
                hora: cita.horacita,
                duracion: duracionTotal,
              },
              { headers },
            )
            // console.log("Respuesta de liberación de horario:", liberarResponse.data)

            // Como respaldo, también actualizar directamente la disponibilidad del empleado
            try {
              // Obtener la fecha en formato YYYY-MM-DD
              const fechaFormateada = new Date(cita.fechacita).toISOString().split("T")[0]

              // Intentar actualizar directamente la disponibilidad del empleado
              await axios.put(
                `${API_URL}/empleados/${empleadoId}/disponibilidad`,
                {
                  fecha: fechaFormateada,
                  hora: cita.horacita,
                  disponible: true, // Marcar como disponible
                  citaId: cita._id,
                  accion: "liberar",
                },
                { headers },
              )
              // console.log("Disponibilidad del empleado actualizada directamente")
            } catch (dispError) {
              console.error("Error al actualizar disponibilidad directamente:", dispError)
            }

            // console.log("Horario liberado correctamente en el sistema de agenda")
          } catch (horarioError) {
            console.error("Error al liberar horario:", horarioError)

            // Si falla el endpoint principal, intentar con un enfoque alternativo
            try {
              // Obtener la fecha en formato YYYY-MM-DD
              const fechaFormateada = new Date(cita.fechacita).toISOString().split("T")[0]

              // Intentar actualizar directamente la disponibilidad del empleado
              await axios.put(
                `${API_URL}/empleados/${empleadoId}/disponibilidad`,
                {
                  fecha: fechaFormateada,
                  hora: cita.horacita,
                  disponible: true, // Marcar como disponible
                  citaId: cita._id,
                  accion: "liberar",
                },
                { headers },
              )
              // console.log("Disponibilidad del empleado actualizada como respaldo")
            } catch (dispError) {
              console.error("Error en método alternativo de liberación:", dispError)
              // Mostrar una advertencia al usuario
              Swal.fire({
                title: "Advertencia",
                text: "Es posible que el horario no se haya liberado correctamente. Por favor, verifique la agenda del empleado.",
                icon: "warning",
                confirmButtonText: "Entendido",
              })
            }
          }

          // Limpiar localStorage
          try {
            localStorage.removeItem(`servicios_cita_${cita._id}`)
            localStorage.removeItem(`productos_cita_${cita._id}`)
            // console.log("Datos eliminados de localStorage después de finalizar venta")
          } catch (storageError) {
            console.error("Error al limpiar localStorage:", storageError)
          }

          // Marcar que no hay cambios sin guardar
          setCambiosSinGuardar(false)

          Swal.fire({
            title: "Éxito",
            text: "Venta finalizada correctamente",
            icon: "success",
            confirmButtonText: "Ir a ventas",
          }).then(() => {
            navigate("/ventas-unificadas")
          })
        } catch (error) {
          console.error("Error al crear la venta unificada:", error)
          depurarErrorRespuesta(error)
          throw error
        }
      }
    } catch (error) {
      console.error("Error en el proceso de finalización:", error)
      let mensajeError = "No se pudo finalizar la venta"

      if (error.response && error.response.data) {
        // console.log("Datos de respuesta de error:", error.response.data)

        if (error.response.data.msg) {
          mensajeError = error.response.data.msg
        } else if (error.response.data.message) {
          mensajeError = error.response.data.message
        } else if (error.response.data.error) {
          mensajeError = error.response.data.error
        } else if (typeof error.response.data === "string") {
          mensajeError = error.response.data
        }

        // Si hay detalles adicionales, mostrarlos
        if (error.response.data.detalles) {
          mensajeError += `: ${error.response.data.detalles}`
        }
      } else if (error.message) {
        mensajeError = error.message
      }

      Swal.fire({
        title: "Error",
        text: mensajeError,
        icon: "error",
        confirmButtonText: "Entendido",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Agregar una función para depurar la respuesta de error del servidor
  // Añadir esta función after the function finalizarVenta

  // Función para depurar errores de respuesta
  const depurarErrorRespuesta = (error) => {
    // console.log("Error completo:", error)

    if (error.response) {
      // console.log("Datos de la respuesta:", error.response.data)
      // console.log("Estado HTTP:", error.response.status)
      // console.log("Cabeceras:", error.response.headers)

      // Intentar mostrar más detalles si están disponibles
      if (error.response.data) {
        if (typeof error.response.data === "string") {
          // console.log("Mensaje de error:", error.response.data)
        } else {
          // console.log("Detalles del error:", JSON.stringify(error.response.data, null, 2))
        }
      }
    } else if (error.request) {
      // console.log("La solicitud fue realizada pero no se recibió respuesta")
      // console.log("Detalles de la solicitud:", error.request)
    } else {
      // console.log("Error al configurar la solicitud:", error.message)
    }

    // console.log("Configuración de la solicitud:", error.config)
  }

  // Update the loading state display
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando datos...</p>
        </div>
      </div>
    )

  // Update the error state display
  if (error)
    return (
      <div className="p-6">
        <div className="error-container" role="alert">
          <strong className="error-title">Error: </strong>
          <span className="error-message">{error}</span>
        </div>
        <button onClick={() => navigate("/citas-en-progreso")} className="btn-back mt-4 bg-red-500 text-foreground">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver a citas
        </button>
      </div>
    )

  return (
    <div className="gestion-container">
      <div className="header-container">
        <h1 className="text-foreground">{id && id !== "new" ? "Gestionar Venta" : "Nueva Venta"}</h1>
        <button
          onClick={async () => {
            // Si hay cambios sin guardar, preguntar al usuario
            if (cambiosSinGuardar) {
              const result = await Swal.fire({
                title: "¿Guardar cambios?",
                text: "Hay cambios sin guardar. ¿Desea guardarlos antes de volver?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Sí, guardar",
                cancelButtonText: "No, volver sin guardar",
                showDenyButton: true,
                denyButtonText: "Cancelar",
              })

              if (result.isConfirmed) {
                // Usuario quiere guardar cambios
                await guardarCambios()
                // Esperar un momento para asegurar que los cambios se guarden
                setTimeout(() => navigate("/citas-en-progreso"), 500)
                return
              } else if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                // Usuario no quiere guardar cambios, pero guardar en localStorage de todos modos
                if (cita && cita._id) {
                  try {
                    localStorage.setItem(`servicios_cita_${cita._id}`, JSON.stringify(serviciosSeleccionados))
                    localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(productosSeleccionados))
                    // console.log("Datos guardados en localStorage antes de navegar sin guardar")
                  } catch (storageError) {
                    console.error("Error al guardar datos en localStorage:", storageError)
                  }
                }

                // Continuar con la navegación
                navigate("/citas-en-progreso")
                return
              } else {
                // Usuario canceló la acción
                return
              }
            }

            // Si no hay cambios, simplemente navegar
            // Pero guardar en localStorage de todos modos para asegurar persistencia
            if (cita && cita._id) {
              try {
                localStorage.setItem(`servicios_cita_${cita._id}`, JSON.stringify(serviciosSeleccionados))
                localStorage.setItem(`productos_cita_${cita._id}`, JSON.stringify(productosSeleccionados))
                // console.log("Datos guardados en localStorage antes de navegar sin cambios")
              } catch (storageError) {
                console.error("Error al guardar datos en localStorage:", storageError)
              }
            }

            navigate("/citas-en-progreso")
          }}
          className="btn-info-2 dark:card-gradient-4 text-foreground"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Volver
        </button>
      </div>

      {/* Información de la cita */}
      <div className="card-1 dark:card-gradient-4 text-foreground">
        <h2 className="card-title-1 text-foreground">Información de la Cita</h2>
        <div className="info-grid text-foreground">
          <div className="info-item">
            <p className="info-label-1">Cliente:</p>
            <p className="info-value-1 text-foreground">
              {cita?.nombrecliente?.nombrecliente
                ? `${cita.nombrecliente.nombrecliente} ${cita.nombrecliente.apellidocliente || ""}`
                : "Cliente no disponible"}
            </p>
          </div>
          <div className="info-item">
            <p className="info-label-1 text-foreground">Empleado:</p>
            <p className="info-value-1 text-foreground">
              {cita?.nombreempleado?.nombreempleado || "Empleado no disponible"}
            </p>
          </div>
          <div className="info-item">
            <p className="info-label-1 text-foreground ">Fecha:</p>
            <p className="info-value-1 text-foreground">
              {new Date(cita.fechacita).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <p className="info-label-1 text-foreground">Hora:</p>
            <p className="info-value-1 text-foreground">{cita.horacita}</p>
          </div>
          <div className="info-item">
            <p className="info-label-1 text-foreground">Estado:</p>
            <span>
              <p className="info-value-1 text-foreground">{cita?.estadocita || "Estado no disponible"}</p>
            </span>
          </div>
        </div>
      </div>

      {/* Pestañas para servicios y productos */}
      <div className="card-1 dark:card-gradient-4 text-foreground">
        <div className="tabs-container dark:card-gradient-4 text-foreground">
          <div className="tabs-header">
            <button
              type="button"
              className={`tab-button-1 bg-pink-600 text-foreground ${activeTab === "servicios" ? "active   hover:bg-pink-400  dark:bg-pink-800 dark:hover:bg-pink-400 " : "bg-pink-500 hover:bg-pink-600"}`}
              onClick={() => setActiveTab("servicios")}
            >
              <FontAwesomeIcon icon={faCompassDrafting} className="mr-2" />
              Servicios
            </button>
            <button
              type="button"
              className={`tab-button-1 bg-pink-600 text-foreground ${activeTab === "productos" ? "active hover:bg-pink-400 dark:bg-pink-800 dark:hover:bg-pink-400" : "bg-pink-500 hover:bg-pink-600"}`}
              onClick={() => setActiveTab("productos")}
            >
              <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
              Productos
            </button>
          </div>

          {/* Tab de Servicios */}
          <div className={`tab-content ${activeTab === "servicios" ? "block" : "hidden"}`}>
            <h2 className="card-title-1 text-foreground">Servicios Seleccionados</h2>
            {serviciosSeleccionados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="tabla-servicios-1 w-full">
                  <thead className="bg-pink-200 text-black dark:card-gradient-4">
                    <tr className="text-foreground">
                      <th className="text-left dark:hover:bg-gray-500/50">Servicio</th>
                      <th className="text-left dark:hover:bg-gray-500/50">Precio</th>
                      <th className="text-right dark:hover:bg-gray-500/50">Tiempo (min)</th>
                      <th className="text-center dark:hover:bg-gray-500/50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="dark:bg-zinc-900/80 text-foreground">
                    {serviciosSeleccionados.map((servicio, index) => (
                      <tr className="dark:hover:bg-gray-500/50 text-foreground" key={index}>
                        <td className="text-left">{servicio.nombreServicio}</td>
                        <td className="text-left">
                          {servicio.tieneDescuento ? (
                            <div className="price-with-discount-1">
                              <span className="text-left original-price-1 text-foreground ">
                                ${Number(servicio.precioOriginal || servicio.precio).toLocaleString('es-ES', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                              <span className="text-left discounted-price-1 text-green-700">
                              <span>${Number(servicio.precioConDescuento || servicio.precio).toLocaleString('es-ES', {
                                   minimumFractionDigits: 2,
                                   maximumFractionDigits: 2
                                })}</span>
                              </span>
                            </div>
                          ) : (
                            <span>${Number(servicio.precio).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

                          )}
                        </td>
                        <td className="text-right">{servicio.tiempo}</td>
                        <td className="text-center">
                          <button
                            onClick={() => eliminarServicio(servicio.servicio)}
                            className="btn-delete-gv text-center dark:bg-rose-800"
                            title="Eliminar servicio"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total Servicios</td>
                      {/* <span>${Number(servicio.precio).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> */}
                      <td className="text-left">${(precioTotalServicios).toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                      {/* <td className="text-right">${precioTotalServicios.toFixed(2)}</td> */}
                      <td className="text-right">{tiempoTotal} min</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay servicios seleccionados</p>
            )}

            {/* Agregar servicios */}
            <div className="mt-4 ">
              <h3 className="text-lg font-semibold mb-2 ">Agregar Servicio</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <select
                    value={nuevoServicio.id}
                    onChange={(e) =>
                      setNuevoServicio({
                        id: e.target.value,
                        nombre: servicios.find((s) => s._id === e.target.value)?.nombreServicio || "",
                      })
                    }
                    className="form-select"
                  >
                    <option value="">Selecciona un servicio</option>
                    {servicios.map((servicio) => {
                      const tieneDescuento =
                        servicio.tieneDescuento ||
                        (servicio.tipoServicio &&
                          servicio.tipoServicio.descuento &&
                          servicio.tipoServicio.descuento > 0)

                      const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
                      const precioConDescuento = tieneDescuento
                        ? servicio.precioConDescuento ||
                          precioOriginal - (precioOriginal * servicio.tipoServicio.descuento) / 100
                        : precioOriginal

                      const porcentajeDescuento = tieneDescuento
                        ? servicio.porcentajeDescuento || servicio.tipoServicio.descuento
                        : 0

                      return (
                        <option key={servicio._id} value={servicio._id}>
                          {servicio.nombreServicio} -
                          {tieneDescuento
                            ? `$${precioConDescuento.toFixed(2)} (${porcentajeDescuento}% OFF)`
                            : `$${precioOriginal.toFixed(2)}`}
                          ({servicio.tiempo} min)
                        </option>
                      )
                    })}
                  </select>
                </div>
                <button onClick={agregarServicio} disabled={isSaving} className="btn-secondary">
                  {isSaving ? (
                    <>
                      <span className="spinner"></span>
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Agregar Servicio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab de Productos */}
          <div className={`tab-content ${activeTab === "productos" ? "block" : "hidden"}`}>
            <h2 className="card-title-1">Productos Seleccionados</h2>
            {productosSeleccionados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="tabla-servicios-1 w-full">
                  <thead className="bg-pink-200 text-black dark:card-gradient-4">
                    <tr className="text-foreground">
                      <th>Producto</th>
                      <th className="text-right dark:hover:bg-gray-500/50">Precio</th>
                      <th className="text-right dark:hover:bg-gray-500/50">Cantidad</th>
                      <th className="text-right dark:hover:bg-gray-500/50">Subtotal</th>
                      <th className="text-center dark:hover:bg-gray-500/50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="dark:bg-zinc-900/80 text-foreground">
                    {productosSeleccionados.map((producto, index) => (
                      <tr className="dark:hover:bg-gray-500/50 text-foreground" key={index}>
                        <td>{producto.nombreProducto}</td>

                        <td className="text-right">
                          ${Number(producto.precio).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          </td>

                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => actualizarCantidadProducto(producto.producto, producto.cantidad - 1)}
                              className="btn-icon-sm bg-pink-200 dark:card-gradient-5"
                            >
                              -
                            </button>
                            <span className="mx-2">{producto.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => actualizarCantidadProducto(producto.producto, producto.cantidad + 1)}
                              className="btn-icon-sm bg-pink-200 dark:card-gradient-5"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right">
                          ${Number(producto.subtotal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                          {/* ${Number.parseFloat(producto.subtotal).toFixed(2)} */}
                          </td>
                        <td className="text-center">
                          <button
                            onClick={() => eliminarProducto(producto.producto)}
                            className="btn-delete-gv dark:bg-rose-800"
                            title="Eliminar producto"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">Total Productos</td>
                      <td className="text-right">
                        ${Number(precioTotalProductos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                        </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay productos seleccionados</p>
            )}

            {/* Agregar productos */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Agregar Producto</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <select
                    value={nuevoProducto.id}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        id: e.target.value,
                        nombre: productos.find((p) => p._id === e.target.value)?.nombreProducto || "",
                      })
                    }
                    className="form-select"
                  >
                    <option value="">Selecciona un producto</option>
                    {productos.map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.nombreProducto} - ${producto.precio} (Stock: {producto.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label htmlFor="cantidad" className="mr-2 whitespace-nowrap">
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        cantidad: Number.parseInt(e.target.value) || 1,
                      })
                    }
                    className="form-input w-20"
                  />
                </div>
                <button onClick={agregarProducto} disabled={isSaving} className="btn-secondary">
                  {isSaving ? (
                    <>
                      <span className="spinner"></span>
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Agregar Producto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de la venta */}
      <div className="card-1 dark:card-gradient-4 text-foreground">
        <h2 className="card-title-1 text-foreground">Resumen de la Venta</h2>
        <div className="info-grid text-foreground">
          {serviciosSeleccionados.length > 0 && (
            <div className="info-item">
              <p className="info-label-1">Total Servicios:</p>
              <p className="info-value-1">
                ${Number(precioTotalServicios).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                </p>
            </div>
          )}
          {productosSeleccionados.length > 0 && (
            <div className="info-item">
              <p className="info-label-1">Total Productos:</p>
              <p className="info-value-1">
                ${Number(precioTotalProductos).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                </p>
            </div>
          )}
          <div className="info-item">
            <p className="info-label-1 underline">Total General:</p>
            <p className="info-value-1 font-bold text-x underline cursor-pointer">
              ${Number(precioTotal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
              </p>
          </div>
          <div className="info-item">
            <p className="info-label-1">Tipo de Venta:</p>
            <p className="info-value-1">
              {getTipoVenta() === "mixta"
                ? "Mixta (Servicios y Productos)"
                : getTipoVenta() === "servicios"
                  ? "Servicios"
                  : "Productos"}
            </p>
          </div>
        </div>
      </div>

      {/* Finalizar venta */}
      <div className="card-1 dark:card-gradient-4 text-foreground">
        <h2 className="card-title-1 text-foreground">Finalizar Venta</h2>
        <div className="form-group">
          <label className="form-label-1 text-foreground">Método de Pago:</label>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="form-select">
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="btn-container">
          <button onClick={guardarCambios} disabled={isSaving} className="btn-secondary">
            {isSaving ? (
              <>
                <span className="spinner"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Guardar Cambios
              </>
            )}
          </button>
          <button onClick={finalizarVenta} disabled={isSaving} className="btn-success">
            {isSaving ? (
              <>
                <span className="spinner"></span>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Finalizar Venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GestionVentaServicio
