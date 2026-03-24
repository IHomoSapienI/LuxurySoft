"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaCut,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaMoneyBillWave,
  FaRegClock,
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaRedo,
  FaCalendarCheck,
  FaClipboardList,
  FaUserClock,
} from "react-icons/fa"
import { useLocation } from "react-router-dom"
import { obtenerServiciosConDescuento } from "../Servicios/obtenerServicios"

// Datos de respaldo en caso de fallo de API
const DATOS_RESPALDO = {
  empleados: [
    {
      _id: "emp1",
      nombreempleado: "Empleado Demo",
      especialidades: ["Corte", "Peinado", "Tinte"],
      schedule: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
      ],
    },
  ],
  clientes: [{ _id: "cli1", nombrecliente: "Cliente Demo", apellidocliente: "Apellido" }],
  servicios: [
    { _id: "serv1", nombreServicio: "Corte de Cabello", precio: 150, tiempo: 30 },
    { _id: "serv2", nombreServicio: "Peinado", precio: 200, tiempo: 45 },
    { _id: "serv3", nombreServicio: "Tinte", precio: 350, tiempo: 90 },
  ],
}

export default function FormularioCita({ cita, fechaSeleccionada, servicioSeleccionado, onCitaActualizada, onClose }) {
  const location = useLocation()

  const totalDesdeSeleccionarServicios = location.state?.total || 0
  const empleadoIdPredeterminado = location.state?.empleadoId || ""
  const serviciosDesdeSeleccionarServicios = location.state?.serviciosSeleccionados || []
  const vieneDePaginaServicios = location.state?.fromSeleccionarServicios || false

  const [formData, setFormData] = useState({
    nombreempleado: empleadoIdPredeterminado,
    nombrecliente: "",
    fechacita: fechaSeleccionada ? fechaSeleccionada.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    horacita: "",
    duracionTotal: 0,
    montototal: 0,
    estadocita: "Pendiente",
  })

  const [empleados, setEmpleados] = useState([])
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [nuevoServicio, setNuevoServicio] = useState({ id: "", nombre: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [horaSeleccionada, setHoraSeleccionada] = useState("")
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([])
  const [paso, setPaso] = useState(1)
  const [currentMonth, setCurrentMonth] = useState(fechaSeleccionada ? new Date(fechaSeleccionada) : new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usandoDatosRespaldo, setUsandoDatosRespaldo] = useState(false)
  const [intentosConexion, setIntentosConexion] = useState(0)

  // Definir la función actualizarHorariosDisponibles con useCallback ANTES de usarla
  const actualizarHorariosDisponibles = useCallback(
    async (fecha, empleadoId) => {
      const empleado = empleados.find((e) => e._id === empleadoId)
      if (!empleado) {
        setHorariosDisponibles([])
        return
      }

      const diaSemana = fecha.getDay()
      const horarioDia = empleado.schedule?.find((s) => s.dayOfWeek === diaSemana)

      // Horario predeterminado o del empleado
      const horario = horarioDia || { startTime: "09:00", endTime: "18:00" }

      // Duración total de los servicios
      const duracionTotal = serviciosSeleccionados.reduce(
        (total, servicio) => total + (Number(servicio.tiempo) || 0),
        0,
      )

      try {
        // Generar horarios disponibles básicos sin verificar conflictos
        const [horaInicio, minInicio] = horario.startTime.split(":").map(Number)
        const [horaFin, minFin] = horario.endTime.split(":").map(Number)
        const inicioMinutos = horaInicio * 60 + minInicio
        const finMinutos = horaFin * 60 + minFin

        // NUEVA IMPLEMENTACIÓN: Calcular la hora actual más 6 horas de anticipación
        const ahora = new Date()
        const fechaActual = new Date(fecha)
        fechaActual.setHours(0, 0, 0, 0) // Resetear a inicio del día

        // Verificar si la fecha seleccionada es hoy
        const esHoy =
          fechaActual.getDate() === ahora.getDate() &&
          fechaActual.getMonth() === ahora.getMonth() &&
          fechaActual.getFullYear() === ahora.getFullYear()

        // Calcular la hora mínima permitida (actual + 6 horas)
        let horaMinima = 0
        if (esHoy) {
          const horaActual = ahora.getHours()
          const minutosActuales = ahora.getMinutes()
          horaMinima = (horaActual + 6) * 60 + minutosActuales // Convertir a minutos desde inicio del día
        }

        const horarios = []
        for (let minutos = inicioMinutos; minutos <= finMinutos - duracionTotal; minutos += 30) {
          // NUEVA CONDICIÓN: Solo agregar horarios que cumplan con la anticipación de 6 horas
          if (!esHoy || minutos >= horaMinima) {
            const hora = Math.floor(minutos / 60)
            const min = minutos % 60
            horarios.push(`${hora.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
          }
        }

        setHorariosDisponibles(horarios)

        if (horarios.length > 0 && (!horaSeleccionada || !horarios.includes(horaSeleccionada))) {
          setHoraSeleccionada(horarios[0])
          setFormData((prev) => ({ ...prev, horacita: horarios[0] }))
        }

        // Si no estamos usando datos de respaldo, intentamos obtener las citas existentes
        if (!usandoDatosRespaldo) {
          try {
            const token = localStorage.getItem("token")
            const headers = { Authorization: `Bearer ${token}` }
            const fechaStr = fecha.toISOString().split("T")[0]

            const citasResponse = await axios.get(`https://gitbf.onrender.com/api/citas`, { headers })
            const citasDelDia = citasResponse.data.citas.filter((c) => {
              if (!c.fechacita || !c.nombreempleado) return false
              const citaFecha = new Date(c.fechacita).toISOString().split("T")[0]
              const citaEmpleadoId = typeof c.nombreempleado === "object" ? c.nombreempleado._id : c.nombreempleado
              return (
                citaFecha === fechaStr &&
                citaEmpleadoId === empleadoId &&
                c._id !== (cita?._id || "") &&
                !(c.horarioLiberado || c.estadocita === "Cancelada") // Ignorar citas con horario liberado o canceladas
              )
            })

            // Si no hay citas, mantenemos los horarios básicos
            if (citasDelDia.length === 0) return

            // Crear bloques ocupados
            const bloquesOcupados = citasDelDia
              .map((c) => {
                if (!c.horacita) return null
                const [hora, min] = c.horacita.split(":").map(Number)
                const inicioBloque = hora * 60 + min
                const duracionCita = c.duracionTotal || 60
                return {
                  inicio: inicioBloque,
                  fin: inicioBloque + duracionCita,
                }
              })
              .filter(Boolean)

            // Filtrar horarios disponibles
            const horariosDisponiblesFiltrados = horarios.filter((horaStr) => {
              const [hora, min] = horaStr.split(":").map(Number)
              const inicioMinutos = hora * 60 + min
              const finMinutos = inicioMinutos + duracionTotal

              return !bloquesOcupados.some(
                (bloque) =>
                  (inicioMinutos >= bloque.inicio && inicioMinutos < bloque.fin) ||
                  (finMinutos > bloque.inicio && finMinutos <= bloque.fin) ||
                  (inicioMinutos <= bloque.inicio && finMinutos >= bloque.fin),
              )
            })

            // Solo actualizamos si hay horarios disponibles después de filtrar
            if (horariosDisponiblesFiltrados.length > 0) {
              setHorariosDisponibles(horariosDisponiblesFiltrados)

              if (!horaSeleccionada || !horariosDisponiblesFiltrados.includes(horaSeleccionada)) {
                setHoraSeleccionada(horariosDisponiblesFiltrados[0])
                setFormData((prev) => ({ ...prev, horacita: horariosDisponiblesFiltrados[0] }))
              }
            }
          } catch (error) {
            console.error("Error al obtener citas:", error)
            // Si hay error al obtener citas, mantenemos los horarios básicos
          }
        }
      } catch (error) {
        console.error("Error general:", error)
        // En caso de error, mostrar horarios sin validación
        const [horaInicio, minInicio] = horario.startTime.split(":").map(Number)
        const [horaFin, minFin] = horario.endTime.split(":").map(Number)
        const inicioMinutos = horaInicio * 60 + minInicio
        const finMinutos = horaFin * 60 + minFin

        // NUEVA IMPLEMENTACIÓN: Calcular la hora actual más 6 horas de anticipación
        const ahora = new Date()
        const fechaActual = new Date(fecha)
        fechaActual.setHours(0, 0, 0, 0) // Resetear a inicio del día

        // Verificar si la fecha seleccionada es hoy
        const esHoy =
          fechaActual.getDate() === ahora.getDate() &&
          fechaActual.getMonth() === ahora.getMonth() &&
          fechaActual.getFullYear() === ahora.getFullYear()

        // Calcular la hora mínima permitida (actual + 6 horas)
        let horaMinima = 0
        if (esHoy) {
          const horaActual = ahora.getHours()
          const minutosActuales = ahora.getMinutes()
          horaMinima = (horaActual + 6) * 60 + minutosActuales // Convertir a minutos desde inicio del día
        }

        const horarios = []
        for (let minutos = inicioMinutos; minutos <= finMinutos - duracionTotal; minutos += 30) {
          // NUEVA CONDICIÓN: Solo agregar horarios que cumplan con la anticipación de 6 horas
          if (!esHoy || minutos >= horaMinima) {
            const hora = Math.floor(minutos / 60)
            const min = minutos % 60
            horarios.push(`${hora.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
          }
        }

        setHorariosDisponibles(horarios)

        if (horarios.length > 0 && (!horaSeleccionada || !horarios.includes(horaSeleccionada))) {
          setHoraSeleccionada(horarios[0])
          setFormData((prev) => ({ ...prev, horacita: horarios[0] }))
        }
      }
    },
    [empleados, serviciosSeleccionados, cita, horaSeleccionada, usandoDatosRespaldo],
  )

  // Función para cargar datos con manejo de errores mejorado
  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
      }

      const headers = { Authorization: `Bearer ${token}` }

      // Usar Promise.allSettled para manejar mejor los errores parciales
      const resultados = await Promise.allSettled([
        axios.get("https://gitbf.onrender.com/api/empleados", { headers }),
        axios.get("https://gitbf.onrender.com/api/clientes", { headers }),
        obtenerServiciosConDescuento(),
      ])

      // Verificar si todas las peticiones fueron exitosas
      const todasExitosas = resultados.every((resultado) => resultado.status === "fulfilled")

      if (todasExitosas) {
        // Extraer los datos de las respuestas exitosas
        const empleadosResponse = resultados[0].value.data
        const clientesResponse = resultados[1].value.data
        const serviciosResponse = resultados[2].value // obtenerServiciosConDescuento() devuelve directamente los datos

        setEmpleados(empleadosResponse)
        setEmpleadosFiltrados(empleadosResponse)
        setClientes(clientesResponse)

        const serviciosData = serviciosResponse || []
        setServicios(serviciosData)

        // Inicializar datos de la cita si existe
        if (cita) {
          setFormData({
            nombreempleado: cita.nombreempleado?._id || "",
            nombrecliente: cita.nombrecliente?._id || "",
            fechacita: new Date(cita.fechacita).toISOString().slice(0, 16),
            horacita: cita.horacita || "",
            duracionTotal: cita.duracionTotal || 0,
            montototal: cita.montototal || 0,
            estadocita: cita.estadocita || "Pendiente",
          })

          if (cita.servicios && Array.isArray(cita.servicios)) {
            setServiciosSeleccionados(cita.servicios)
          }

          const hora = new Date(cita.fechacita).getHours()
          const minutos = new Date(cita.fechacita).getMinutes()
          setHoraSeleccionada(`${hora.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`)
          setCurrentMonth(new Date(cita.fechacita))
        }

        setUsandoDatosRespaldo(false)
      } else {
        // Si alguna petición falló, usar datos de respaldo
        console.error("Algunas peticiones fallaron, usando datos de respaldo")
        throw new Error("No se pudieron cargar todos los datos necesarios")
      }
    } catch (error) {
      console.error("Error al cargar datos:", error)

      // Usar datos de respaldo
      setEmpleados(DATOS_RESPALDO.empleados)
      setEmpleadosFiltrados(DATOS_RESPALDO.empleados)
      setClientes(DATOS_RESPALDO.clientes)
      setServicios(DATOS_RESPALDO.servicios)
      setUsandoDatosRespaldo(true)

      // Mostrar mensaje de error solo si no estamos usando datos de respaldo
      if (intentosConexion > 0) {
        setError(
          "No se pudieron cargar los datos del servidor. Se están utilizando datos de demostración. " +
            "Algunas funcionalidades pueden estar limitadas.",
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [cita, intentosConexion])

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Función para reintentar la conexión
  const reintentarConexion = () => {
    setIntentosConexion(intentosConexion + 1)
    setError(null)
    cargarDatos()
  }

  // Inicializar formData con datos de location
  useEffect(() => {
    if (!cita) {
      const fechaAUsar = fechaSeleccionada ? fechaSeleccionada.toISOString().slice(0, 16) : formData.fechacita

      setFormData((prevData) => ({
        ...prevData,
        nombreempleado: empleadoIdPredeterminado || prevData.nombreempleado,
        montototal: totalDesdeSeleccionarServicios || prevData.montototal,
        fechacita: fechaAUsar,
      }))
    }
  }, [empleadoIdPredeterminado, totalDesdeSeleccionarServicios, fechaSeleccionada, cita, formData.fechacita])

  // NUEVO: Manejar servicios preseleccionados desde SeleccionarServicios
  useEffect(() => {
    if (vieneDePaginaServicios && serviciosDesdeSeleccionarServicios.length > 0 && !cita) {
      // Usar los servicios que vienen de la página de selección
      setServiciosSeleccionados(serviciosDesdeSeleccionarServicios)

      // Actualizar el monto total
      setFormData((prevData) => ({
        ...prevData,
        montototal: totalDesdeSeleccionarServicios,
      }))

      // Opcional: Avanzar automáticamente al paso 2 si estamos en el paso 1
      if (paso === 1) {
        setPaso(2)
      }
    }
  }, [vieneDePaginaServicios, serviciosDesdeSeleccionarServicios, totalDesdeSeleccionarServicios, cita, paso])

  // Agregar servicio seleccionado
  useEffect(() => {
    if (servicioSeleccionado && servicios.length > 0 && !cita) {
      const servicio = servicios.find((s) => s._id === servicioSeleccionado)
      if (servicio && !serviciosSeleccionados.some((s) => s._id === servicio._id)) {
        setServiciosSeleccionados((prev) => [
          ...prev,
          {
            _id: servicio._id,
            nombreServicio: servicio.nombreServicio,
            precio: servicio.precio,
            tiempo: servicio.tiempo,
            tieneDescuento: servicio.tieneDescuento || false,
            precioOriginal: servicio.precioOriginal || servicio.precio,
            precioConDescuento: servicio.precioConDescuento || servicio.precio,
            porcentajeDescuento: servicio.porcentajeDescuento || 0,
          },
        ])
      }
    }
  }, [servicioSeleccionado, servicios, cita, serviciosSeleccionados])

  // Filtrar empleados según los servicios seleccionados
  useEffect(() => {
    if (serviciosSeleccionados.length > 0 && empleados.length > 0) {
      const especialidadesNecesarias = serviciosSeleccionados
        .map((servicio) => {
          const servicioCompleto = servicios.find((s) => s._id === servicio._id || s._id === servicio.servicio)
          return servicioCompleto?.nombreServicio || ""
        })
        .filter(Boolean)

      const empleadosConEspecialidades = empleados.filter((empleado) => {
        const especialidadesEmpleado = empleado.especialidades || []
        return especialidadesNecesarias.some((esp) => especialidadesEmpleado.includes(esp))
      })

      setEmpleadosFiltrados(empleadosConEspecialidades.length > 0 ? empleadosConEspecialidades : empleados)
    } else {
      setEmpleadosFiltrados(empleados)
    }
  }, [serviciosSeleccionados, empleados, servicios])

  // Actualizar horarios disponibles cuando cambia la fecha o el empleado
  useEffect(() => {
    if (formData.fechacita && formData.nombreempleado) {
      setHorariosDisponibles([])
      // Usar setTimeout para asegurar que la actualización se ejecute después de que el estado se haya actualizado
      setTimeout(() => {
        actualizarHorariosDisponibles(new Date(formData.fechacita), formData.nombreempleado)
      }, 0)
    }
  }, [formData.fechacita, formData.nombreempleado, serviciosSeleccionados, actualizarHorariosDisponibles])

  // Añadir un useEffect adicional para cargar los horarios disponibles cuando se carga el componente
  useEffect(() => {
    // Si tenemos fecha y empleado al cargar el componente, actualizar horarios disponibles
    if (formData.fechacita && formData.nombreempleado && isLoading === false) {
      // console.log("Cargando horarios disponibles iniciales")
      actualizarHorariosDisponibles(new Date(formData.fechacita), formData.nombreempleado)
    }
  }, [isLoading, formData.fechacita, formData.nombreempleado, actualizarHorariosDisponibles]) // Solo se ejecuta cuando cambia isLoading (cuando termina de cargar)

  const precioTotal = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => {
      const precio = servicio.tieneDescuento ? servicio.precioConDescuento : (servicio.precio || 0)
      return total + precio
    }, 0)
  }, [serviciosSeleccionados])

  const totalTiempo = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => total + (servicio.tiempo || 0), 0)
  }, [serviciosSeleccionados])

  // Actualizar duracionTotal cuando cambian los servicios seleccionados
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      duracionTotal: totalTiempo,
      montototal: precioTotal,
    }))
  }, [totalTiempo, precioTotal])

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))

    if (name === "hora") {
      setHoraSeleccionada(value)
      setFormData((prevData) => ({
        ...prevData,
        horacita: value,
      }))
    }
  }

  const agregarServicio = () => {
    if (nuevoServicio.id) {
      const servicioSeleccionado = servicios.find((serv) => serv._id === nuevoServicio.id)
      if (servicioSeleccionado && !serviciosSeleccionados.some((serv) => serv._id === servicioSeleccionado._id)) {
        setServiciosSeleccionados((prev) => [
          ...prev,
          {
            _id: servicioSeleccionado._id,
            nombreServicio: servicioSeleccionado.nombreServicio,
            precio: servicioSeleccionado.precio,
            tiempo: servicioSeleccionado.tiempo,
            tieneDescuento: servicioSeleccionado.tieneDescuento || false,
            precioOriginal: servicioSeleccionado.precioOriginal || servicioSeleccionado.precio,
            precioConDescuento: servicioSeleccionado.precioConDescuento || servicioSeleccionado.precio,
            porcentajeDescuento: servicioSeleccionado.porcentajeDescuento || 0,
          },
        ])
        setNuevoServicio({ id: "", nombre: "" })
      } else {
        Swal.fire({
          title: "Error",
          text: "Este servicio ya fue agregado o no existe.",
          icon: "error",
          confirmButtonColor: "#ff69b4",
        })
      }
    } else {
      Swal.fire({
        title: "Error",
        text: "Debes seleccionar un servicio antes de agregar.",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }
  }

  const eliminarServicio = (id) => {
    setServiciosSeleccionados((prev) => prev.filter((servicio) => servicio._id !== id))
  }

  // Función para manejar el envío del formulario con mejor manejo de errores
  const manejarSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return

    if (serviciosSeleccionados.length === 0) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar al menos un servicio",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    if (!formData.nombreempleado) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar un empleado",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    if (!formData.nombrecliente) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar un cliente",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    if (!horaSeleccionada) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar una hora",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    // Si estamos usando datos de respaldo, mostrar mensaje informativo
    if (usandoDatosRespaldo) {
      return Swal.fire({
        title: "Modo demostración",
        text: "Esta función no está disponible en modo demostración. Intente conectarse al servidor para usar todas las funcionalidades.",
        icon: "info",
        confirmButtonColor: "#ff69b4",
      })
    }

    setIsSubmitting(true)

    // Obtener la fecha actual del estado
    const fechaActual = new Date(formData.fechacita)

    // Extraer componentes de la fecha
    const year = fechaActual.getFullYear()
    const month = fechaActual.getMonth()
    const day = fechaActual.getDate()

    // Extraer componentes de la hora
    const [horas, minutos] = horaSeleccionada.split(":").map(Number)

    // Crear una nueva fecha combinando fecha y hora
    const fechaCompleta = new Date(year, month, day, horas, minutos, 0)

    // Preparar los servicios en el formato que espera el backend
    const serviciosFormateados = serviciosSeleccionados.map((servicio) => ({
      _id: servicio._id,
      nombreServicio: servicio.nombreServicio,
      precio: servicio.precio,
      tiempo: servicio.tiempo,
    }))

    const dataToSend = {
      ...formData,
      fechacita: fechaCompleta.toISOString(),
      horacita: horaSeleccionada,
      duracionTotal: totalTiempo,
      servicios: serviciosFormateados,
      montototal: precioTotal,
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
      }

      const headers = { Authorization: `Bearer ${token}` }

      if (cita) {
        const response = await axios.put(`https://gitbf.onrender.com/api/citas/${cita._id}`, dataToSend, { headers })
        // console.log("RESPUESTA DEL SERVIDOR (ACTUALIZACIÓN):", response.data)
        Swal.fire({
          title: "¡Éxito!",
          text: "Cita actualizada correctamente",
          icon: "success",
          confirmButtonColor: "#ff69b4",
        })
      } else {
        const response = await axios.post("https://gitbf.onrender.com/api/citas", dataToSend, { headers })
        // console.log("RESPUESTA DEL SERVIDOR (CREACIÓN):", response.data)
        Swal.fire({
          title: "¡Éxito!",
          text: "Cita creada correctamente",
          icon: "success",
          confirmButtonColor: "#ff69b4",
        })
      }

      onCitaActualizada()
      if (onClose) onClose()
    } catch (error) {
      let mensajeError = "Error al guardar la cita. Por favor, intente de nuevo."
      if (error.response?.data?.error) {
        mensajeError = `Error: ${error.response.data.error}`
      } else if (error.response?.data?.message) {
        mensajeError = `Error: ${error.response.data.message}`
      }
      console.error("ERROR COMPLETO:", error)
      Swal.fire({
        title: "Error",
        text: mensajeError,
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const manejarEliminar = async () => {
    if (
      await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff69b4",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      }).then((result) => result.isConfirmed)
    ) {
      try {
        setIsSubmitting(true)

        // Si estamos usando datos de respaldo, mostrar mensaje informativo
        if (usandoDatosRespaldo) {
          Swal.fire({
            title: "Modo demostración",
            text: "Esta función no está disponible en modo demostración. Intente conectarse al servidor para usar todas las funcionalidades.",
            icon: "info",
            confirmButtonColor: "#ff69b4",
          })
          return
        }

        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
        }

        const headers = { Authorization: `Bearer ${token}` }

        await axios.delete(`https://gitbf.onrender.com/api/citas/${cita._id}`, { headers })
        Swal.fire({
          title: "Eliminado",
          text: "La cita ha sido eliminada correctamente.",
          icon: "success",
          confirmButtonColor: "#ff69b4",
        })
        onCitaActualizada()
        onClose()
      } catch (error) {
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la cita.",
          icon: "error",
          confirmButtonColor: "#ff69b4",
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const avanzarPaso = () => {
    if (paso === 1 && serviciosSeleccionados.length === 0) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar al menos un servicio",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    if (paso === 2 && !formData.nombreempleado) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar un empleado",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    if (paso === 3 && !formData.nombrecliente) {
      return Swal.fire({
        title: "Error",
        text: "Debe seleccionar un cliente",
        icon: "error",
        confirmButtonColor: "#ff69b4",
      })
    }

    setPaso(paso + 1)
  }

  const retrocederPaso = () => {
    setPaso(paso - 1)
  }

  // Renderizar el indicador de carga
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-fadeIn">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-pink-500 mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Cargando datos</h2>
            <p className="text-gray-500 text-sm">Estamos preparando todo para ti...</p>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar mensaje de error con opción para reintentar
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 mb-4">
              <FaExclamationTriangle size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Ha ocurrido un error</h2>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>

            {usandoDatosRespaldo && (
              <div className="bg-blue-50 p-3 rounded-lg text-blue-700 mb-4 text-sm">
                <p className="font-medium">Estás utilizando datos de demostración.</p>
                <p>Algunas funcionalidades pueden estar limitadas.</p>
              </div>
            )}
          </div>
          <div className="flex justify-center space-x-3">
            <button
              onClick={reintentarConexion}
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:translate-y-[-2px] flex items-center"
            >
              <FaRedo className="mr-2" />
              Reintentar conexión
            </button>
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg shadow-md transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar el formulario por pasos
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-xl shadow-2xl border border-pink-100 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Botón de cerrar mejorado */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white hover:bg-pink-50 text-pink-500 hover:text-pink-700 rounded-full p-2 shadow-md transition-all duration-200 z-20 transform hover:scale-110 hover:rotate-90"
          aria-label="Cerrar"
        >
          <FaTimes size={16} />
        </button>

        {/* Encabezado con título */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-5">
          <h1 className="text-lg font-bold">{cita ? "Modificar Cita" : "Nueva Cita"}</h1>

          {/* Mostrar indicador de modo demostración si es necesario */}
          {usandoDatosRespaldo && (
            <div className="mt-1 text-xs bg-white bg-opacity-20 rounded px-2 py-0.5 inline-block">
              Modo demostración
            </div>
          )}
        </div>

        {/* Indicador de pasos */}
        <div className="sticky top-0 bg-white bg-opacity-95 pt-3 pb-2 px-4 z-10 border-b border-pink-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className={`step ${paso >= 1 ? "active" : ""}`}>
              <div className="step-circle">
                <FaCut className="step-icon" />
              </div>
              <div className="step-text">Servicios</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${paso >= 2 ? "active" : ""}`}>
              <div className="step-circle">
                <FaUser className="step-icon" />
              </div>
              <div className="step-text">Empleado</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${paso >= 3 ? "active" : ""}`}>
              <div className="step-circle">
                <FaCalendarAlt className="step-icon" />
              </div>
              <div className="step-text">Fecha y Hora</div>
            </div>
            <div className="step-line"></div>
            <div className={`step ${paso >= 4 ? "active" : ""}`}>
              <div className="step-circle">
                <FaCheck className="step-icon" />
              </div>
              <div className="step-text">Confirmar</div>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <form onSubmit={manejarSubmit} className="p-3 sm:p-4">
            {/* Paso 1: Selección de servicios */}
            {paso === 1 && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-fadeIn">
                <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center">
                  <FaCut className="mr-2 text-pink-500" />
                  Selecciona los servicios
                </h2>

                {/* NUEVO: Mostrar mensaje cuando los servicios ya están seleccionados */}
                {vieneDePaginaServicios && serviciosSeleccionados.length > 0 ? (
                  <div className="bg-pink-50 p-3 rounded-lg mb-3 border border-pink-200">
                    <p className="text-pink-700 font-medium flex items-center text-sm">
                      <FaCheck className="mr-2" />
                      Ya has seleccionado {serviciosSeleccionados.length} servicios desde la página anterior.
                    </p>
                    <div className="mt-2 bg-white p-2 rounded-lg border border-pink-200 max-h-48 overflow-y-auto custom-scrollbar">
                      {serviciosSeleccionados.map((servicio, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-1.5 px-2 border-b border-pink-100 last:border-0 hover:bg-pink-50 rounded-md transition-colors"
                        >
                          <span className="truncate mr-2 font-medium text-sm">{servicio.nombreServicio}</span>
                          <div className="flex items-center shrink-0">
                            <div className="flex flex-col items-end mr-3">
                              {servicio.tieneDescuento ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through">${servicio.precioOriginal}</span>
                                  <span className="font-medium text-pink-600">${servicio.precioConDescuento.toFixed(2)}</span>
                                  <span className="text-xs text-green-600">({servicio.porcentajeDescuento}% OFF)</span>
                                </>
                              ) : (
                                <span className="font-medium text-pink-600">${servicio.precio}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => eliminarServicio(servicio._id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                              aria-label="Eliminar servicio"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={avanzarPaso}
                      className="mt-3 bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg shadow-md transition-all duration-200 transform hover:translate-y-[-2px] flex items-center justify-center text-sm"
                    >
                      Continuar con estos servicios
                      <FaChevronRight className="ml-2" />
                    </button>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Servicios disponibles:</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={nuevoServicio.id}
                        onChange={(e) =>
                          setNuevoServicio({
                            id: e.target.value,
                            nombre: servicios.find((s) => s._id === e.target.value)?.nombreServicio || "",
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all duration-200 text-gray-700 bg-white text-sm"
                      >
                        <option value="">Selecciona un servicio</option>
                        {servicios.map((servicio) => (
                          <option key={servicio._id} value={servicio._id}>
                            {servicio.nombreServicio} - ${servicio.tieneDescuento ? servicio.precioConDescuento.toFixed(2) : servicio.precio} ({servicio.tiempo} min) {servicio.tieneDescuento ? `(${servicio.porcentajeDescuento}% OFF)` : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={agregarServicio}
                        className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 transform hover:translate-y-[-2px] shadow-md flex items-center justify-center text-sm"
                      >
                        <FaPlus className="mr-1.5" />
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {serviciosSeleccionados.length > 0 && !vieneDePaginaServicios ? (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2 text-gray-700 flex items-center text-sm">
                      <FaCheck className="mr-2 text-green-500" />
                      Servicios seleccionados:
                    </h3>
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-3 rounded-lg max-h-48 overflow-y-auto custom-scrollbar border border-pink-200">
                      {serviciosSeleccionados.map((servicio, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 px-3 mb-1.5 border-b border-pink-100 last:border-0 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="truncate mr-2">
                            <span className="font-medium text-gray-800 text-sm">{servicio.nombreServicio}</span>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <FaRegClock className="mr-1" size={10} />
                              <span>{servicio.tiempo} min</span>
                            </div>
                          </div>
                          <div className="flex items-center shrink-0">
                            <div className="flex flex-col items-end mr-3">
                              {servicio.tieneDescuento ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through">${servicio.precioOriginal}</span>
                                  <span className="font-medium text-pink-600">${servicio.precioConDescuento.toFixed(2)}</span>
                                  <span className="text-xs text-green-600">({servicio.porcentajeDescuento}% OFF)</span>
                                </>
                              ) : (
                                <span className="font-medium text-pink-600">${servicio.precio}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => eliminarServicio(servicio._id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                              aria-label="Eliminar servicio"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 font-bold bg-white mt-2 p-2.5 rounded-lg shadow-sm border border-pink-100">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="mr-2 text-green-500" />
                          <span className="text-sm">Total</span>
                          <div className="flex items-center ml-3 text-xs font-normal text-gray-500">
                            <FaRegClock className="mr-1" size={10} />
                            <span>{totalTiempo} min</span>
                          </div>
                        </div>
                        <span className="text-pink-600 text-lg">${precioTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  !vieneDePaginaServicios && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <FaCut className="mx-auto mb-2 text-gray-400" size={24} />
                      <p className="font-medium text-sm">No has seleccionado ningún servicio</p>
                      <p className="text-xs mt-1">Selecciona al menos un servicio para continuar</p>
                    </div>
                  )
                )}

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={avanzarPaso}
                    disabled={serviciosSeleccionados.length === 0}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-2px] transition-all duration-200 shadow-md flex items-center text-sm"
                  >
                    Siguiente
                    <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Selección de empleado */}
            {paso === 2 && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-fadeIn">
                <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center">
                  <FaUser className="mr-2 text-pink-500" />
                  Selecciona un empleado
                </h2>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-3 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-start">
                    <FaInfoCircle className="text-blue-500 mr-2 mt-0.5 shrink-0" />
                    Estos son los empleados disponibles que pueden realizar los servicios seleccionados:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {empleadosFiltrados.length > 0 ? (
                      empleadosFiltrados.map((empleado) => (
                        <div
                          key={empleado._id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                            formData.nombreempleado === empleado._id
                              ? "border-pink-500 bg-pink-50 shadow-md"
                              : "hover:border-pink-300 hover:bg-pink-50 border-gray-200"
                          }`}
                          onClick={() => setFormData({ ...formData, nombreempleado: empleado._id })}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 shrink-0 ${
                                formData.nombreempleado === empleado._id ? "bg-pink-500" : "bg-gray-400"
                              }`}
                            >
                              {empleado.nombreempleado.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="font-medium truncate text-gray-800 text-sm">{empleado.nombreempleado}</h3>
                              <p className="text-xs text-gray-500 truncate">
                                Especialidades: {(empleado.especialidades || []).join(", ")}
                              </p>
                            </div>
                            {formData.nombreempleado === empleado._id && (
                              <div className="ml-auto">
                                <div className="bg-pink-500 text-white rounded-full p-1">
                                  <FaCheck size={10} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FaUser className="mx-auto mb-2 text-gray-400" size={24} />
                        <p className="font-medium text-sm">
                          No hay empleados disponibles para los servicios seleccionados
                        </p>
                        <p className="text-xs mt-1">Intenta seleccionar otros servicios</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={retrocederPaso}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 flex items-center text-sm"
                  >
                    <FaChevronLeft className="mr-2" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={avanzarPaso}
                    disabled={!formData.nombreempleado}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-2px] flex items-center text-sm"
                  >
                    Siguiente
                    <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Paso 3: Selección de fecha, hora y cliente */}
            {paso === 3 && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-fadeIn">
                <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center">
                  <FaCalendarAlt className="mr-2 text-pink-500" />
                  Selecciona cliente y hora
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente:</label>
                  <select
                    name="nombrecliente"
                    value={formData.nombrecliente}
                    onChange={manejarCambio}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all duration-200 text-gray-700 bg-white text-sm"
                    required
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente._id} value={cliente._id}>
                        {cliente.nombrecliente} {cliente.apellidocliente || ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg mb-4 border border-pink-200">
                  <h3 className="font-medium mb-2 text-gray-700 flex items-center text-sm">
                    <FaInfoCircle className="text-pink-500 mr-1.5" />
                    Información de la cita
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-2.5 rounded-lg shadow-sm">
                    <div className="flex items-start">
                      <FaCalendarAlt className="text-pink-500 mt-0.5 mr-1.5 shrink-0" size={14} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Fecha seleccionada:</p>
                        <p className="text-gray-800 text-sm">
                          {new Date(formData.fechacita).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FaUser className="text-pink-500 mt-0.5 mr-1.5 shrink-0" size={14} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Empleado:</p>
                        <p className="text-gray-800 text-sm">
                          {empleados.find((e) => e._id === formData.nombreempleado)?.nombreempleado ||
                            "No seleccionado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FaRegClock className="text-pink-500 mt-0.5 mr-1.5 shrink-0" size={14} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Duración total:</p>
                        <p className="text-gray-800 text-sm">{totalTiempo} minutos</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FaMoneyBillWave className="text-pink-500 mt-0.5 mr-1.5 shrink-0" size={14} />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Precio total:</p>
                        <p className="text-gray-800 font-bold text-sm">${precioTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horarios disponibles */}
                <div className="mt-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 md:mb-0 flex items-center">
                      <FaClock className="mr-1.5 text-pink-500" size={14} />
                      Selecciona un horario disponible:
                    </label>
                    <div className="text-xs text-gray-500 bg-blue-50 p-1.5 rounded border border-blue-100">
                      <p className="flex items-center">
                        <FaInfoCircle className="text-blue-500 mr-1" size={12} />
                        <strong>Horario:</strong> {(() => {
                          const empleado = empleados.find((e) => e._id === formData.nombreempleado)
                          if (!empleado) return "No seleccionado"

                          const diaSemana = new Date(formData.fechacita).getDay()
                          const horario = empleado.schedule?.find((s) => s.dayOfWeek === diaSemana)

                          if (horario) {
                            return `${horario.startTime} - ${horario.endTime}`
                          } else {
                            return "9:00 - 18:00"
                          }
                        })()}
                      </p>
                    </div>
                  </div>

                  {horariosDisponibles.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-gray-50 rounded-lg border border-gray-200">
                      {horariosDisponibles.map((hora) => (
                        <div
                          key={hora}
                          className={`p-1.5 border rounded-lg text-center cursor-pointer transition-all duration-200 text-xs ${
                            horaSeleccionada === hora
                              ? "bg-pink-500 text-white border-pink-500 shadow-md transform scale-105"
                              : "hover:bg-pink-50 hover:border-pink-300 bg-white border-gray-200"
                          }`}
                          onClick={() => {
                            setHoraSeleccionada(hora)
                            setFormData({ ...formData, horacita: hora })
                          }}
                        >
                          {hora}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                      <svg
                        className="w-8 h-8 text-yellow-400 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <p className="font-medium text-sm">
                        No hay horarios disponibles para la fecha y empleado seleccionados.
                      </p>
                      <p className="text-xs mt-1">
                        Prueba con otra fecha o selecciona otro empleado en el paso anterior.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={retrocederPaso}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 flex items-center text-sm"
                  >
                    <FaChevronLeft className="mr-2" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={avanzarPaso}
                    disabled={!formData.nombrecliente || !horaSeleccionada}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-2px] flex items-center text-sm"
                  >
                    Siguiente
                    <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* Paso 4: Confirmación */}
            {paso === 4 && (
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 mb-3 animate-fadeIn">
                <h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center">
                  <FaCheck className="mr-2 text-pink-500" />
                  Confirma tu cita
                </h2>

                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg max-h-[45vh] overflow-y-auto custom-scrollbar border border-pink-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaUser className="mr-1.5" size={12} />
                        Cliente
                      </h3>
                      <p className="text-gray-800 text-sm">
                        {clientes.find((c) => c._id === formData.nombrecliente)?.nombrecliente || "No seleccionado"}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaUserClock className="mr-1.5" size={12} />
                        Empleado
                      </h3>
                      <p className="text-gray-800 text-sm">
                        {empleados.find((e) => e._id === formData.nombreempleado)?.nombreempleado || "No seleccionado"}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaCalendarAlt className="mr-1.5" size={12} />
                        Fecha y Hora
                      </h3>
                      <p className="text-gray-800 text-sm">
                        {new Date(formData.fechacita).toLocaleDateString()} a las {horaSeleccionada}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaRegClock className="mr-1.5" size={12} />
                        Duración Total
                      </h3>
                      <p className="text-gray-800 text-sm">{totalTiempo} minutos</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaCalendarCheck className="mr-1.5" size={12} />
                        Estado
                      </h3>
                      <p className="text-gray-800 text-sm">{formData.estadocita}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                      <h3 className="font-medium text-pink-700 mb-1 flex items-center text-sm">
                        <FaMoneyBillWave className="mr-1.5" size={12} />
                        Precio Total
                      </h3>
                      <p className="font-bold text-pink-600 text-base">${precioTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-white p-3 rounded-lg shadow-sm border border-pink-100">
                    <h3 className="font-medium text-pink-700 mb-2 flex items-center text-sm">
                      <FaClipboardList className="mr-1.5" size={12} />
                      Servicios
                    </h3>
                    <ul className="space-y-1.5">
                      {serviciosSeleccionados.map((servicio, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center py-1.5 px-2.5 bg-pink-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center">
                            <span className="h-1.5 w-1.5 bg-pink-500 rounded-full mr-1.5"></span>
                            <span className="font-medium">{servicio.nombreServicio}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 mr-2 text-xs">({servicio.tiempo} min)</span>
                            <div className="flex flex-col items-end">
                              {servicio.tieneDescuento ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through">${servicio.precioOriginal}</span>
                                  <span className="font-medium text-pink-600">${servicio.precioConDescuento.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="font-medium text-pink-600">${servicio.precio}</span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <div>
                    <button
                      type="button"
                      onClick={retrocederPaso}
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-all duration-200 mr-2 flex items-center text-sm"
                    >
                      <FaChevronLeft className="mr-2" />
                      Anterior
                    </button>

                    {cita && (
                      <button
                        type="button"
                        onClick={manejarEliminar}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center text-sm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                            Eliminando...
                          </div>
                        ) : (
                          <>
                            <FaTimes className="mr-1.5" />
                            Eliminar
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200 font-medium transform hover:translate-y-[-2px] flex items-center text-sm"
                    disabled={isSubmitting || usandoDatosRespaldo}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                        {cita ? "Actualizando..." : "Creando..."}
                      </div>
                    ) : (
                      <>
                        <FaCheck className="mr-1.5" />
                        {cita ? "Actualizar Cita" : "Crear Cita"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ffb6c1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff69b4;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 60px;
          z-index: 10;
        }
        
        .step-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #f9f0ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          color: #6b7280;
        }
        
        .step.active .step-circle {
          background-color: #ff69b4;
          color: white;
          box-shadow: 0 3px 5px rgba(255, 105, 180, 0.3);
          transform: scale(1.1);
        }
        
        .step-icon {
          font-size: 12px;
        }
        
        .step-text {
          font-size: 10px;
          color: #6b7280;
          text-align: center;
        }
        
        .step.active .step-text {
          color: #ff69b4;
          font-weight: 500;
        }
        
        .step-line {
          flex-grow: 1;
          height: 2px;
          background-color: #f9f0ff;
          margin-top: -18px;
          z-index: 0;
        }

        @media (max-width: 640px) {
          .step {
            width: 50px;
          }
          
          .step-circle {
            width: 22px;
            height: 22px;
          }
          
          .step-icon {
            font-size: 10px;
          }
          
          .step-text {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  )
}