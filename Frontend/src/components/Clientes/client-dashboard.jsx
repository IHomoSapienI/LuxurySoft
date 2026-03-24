"use client"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "moment/locale/es"
import Swal from "sweetalert2"
import "./client-dashboard.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {useAuth} from "../../context/AuthContext" // Importar el contexto de autenticación
import axios from "axios"

// Importar íconos
import { FontAwesomeIcon, } from "@fortawesome/react-fontawesome"
import {
  faCalendarAlt,
  faShoppingBag,
  faUser,
  faFileInvoice,
  faExclamationTriangle,
  faSync,
  faClock,
  faChartBar,
  faEye,
  faCreditCard,
  faScissors,
  faHeart,
  faBookmark,
  faMapMarkerAlt,
  faStar,
  faGift,
  faCog,
  faMagicWandSparkles,
  faTimes,
  faArrowUp,
  faArrowDown
  
} from "@fortawesome/free-solid-svg-icons"

// Configurar moment en español
moment.locale("es")
const localizer = momentLocalizer(moment)

// Claves para almacenamiento local
const STORAGE_KEYS = {
  CITAS: "client_dashboard_citas",
  VENTAS: "client_dashboard_ventas",
  USER_DATA: "client_dashboard_user",
  LAST_FETCH: "client_dashboard_last_fetch",
}

// Componente de tarjeta de estadísticas
const StatCard = ({ title, value, description, icon, color, trend }) => (
  <div className={`stat-card ${color}`}>
    <div className="flex items-center p-4">
      <div className="stat-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="ml-4">
        <p className="stat-label">{title}</p>
        <p className="stat-value">{value}</p>
        <p className="text-xs text-gray-500">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <FontAwesomeIcon
              icon={trend.isPositive ? faArrowUp : faArrowDown}
              className={trend.isPositive ? "text-green-500" : "text-red-500"}
            />
            <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>{trend.value}</span>
            <span className="text-gray-500">{trend.text}</span>
          </div>
        )}
      </div>
    </div>
  </div>
)

// Componente de gráfico de barras simplificado
const BarChart = ({ data }) => {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const maxValue = Math.max(...data, 1)

  return (
    <div className="chart-container">
      <div className="flex h-64">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center justify-end flex-1">
            <div
              className="w-full bg-pink-500 rounded-t-sm mx-1"
              style={{ height: `${(value / maxValue) * 100}%`, minHeight: "4px" }}
            ></div>
            <div className="text-xs mt-2 text-gray-600">{months[index]}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <div>$0</div>
        <div>${Math.round(maxValue).toLocaleString()}</div>
      </div>
    </div>
  )
}

// Componente de próxima cita
const UpcomingAppointment = ({ appointment, onCancelAppointment }) => {
  if (!appointment) {
    return (
      <div className="card bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-1">Próxima Cita</h3>
        <p className="text-sm text-gray-500 mb-4">No tienes citas programadas</p>
        <div className="flex justify-center py-6">
          <FontAwesomeIcon icon={faClock} className="text-gray-300 text-5xl" />
        </div>
        <button className="btn-primary w-full">Agendar una cita</button>
      </div>
    )
  }

  const fecha = moment(appointment.start).format("DD MMM, YYYY")
  const hora = moment(appointment.start).format("HH:mm")
  const empleado = appointment.cita?.nombreempleado?.nombreempleado || appointment.title || "Sin asignar"
  const servicios = appointment.cita?.servicios || []

  const handleCancelClick = () => {
    Swal.fire({
      title: "Cancelar Cita",
      html: `
        <div class="text-left">
          <p>¿Estás seguro que deseas cancelar esta cita?</p>
          <p class="mt-2 mb-1 font-semibold">Motivo de cancelación:</p>
          <textarea id="cancelReason" class="w-full border border-gray-300 rounded p-2" 
            placeholder="Por favor, indica el motivo de la cancelación" rows="3"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, volver",
      preConfirm: () => {
        const reason = Swal.getPopup().querySelector("#cancelReason").value
        if (!reason) {
          Swal.showValidationMessage("Por favor indica el motivo de la cancelación")
          return false
        }
        return reason
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onCancelAppointment(appointment.id, result.value)
      }
    })
  }

  return (
    <div className="card bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-1">Próxima Cita</h3>
      <p className="text-sm text-gray-500 mb-4">
        {fecha} a las {hora}
      </p>
      <div className="flex items-center space-x-4 rounded-md border p-4 mb-4">
        <FontAwesomeIcon icon={faClock} className="text-pink-500" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">
            {servicios.length > 0 ? servicios.map((s) => s.nombreServicio).join(", ") : "Servicio no especificado"}
          </p>
          <div className="flex items-center pt-2">
            <FontAwesomeIcon icon={faUser} className="mr-1 text-gray-400 text-xs" />
            <span className="text-xs text-gray-500">{empleado}</span>
          </div>
          <div className="flex items-center">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400 text-xs" />
            <span className="text-xs text-gray-500">Salón Principal</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button className="btn-outline" onClick={handleCancelClick}>
          Cancelar
        </button>
        <button className="btn-primary">Modificar</button>
      </div>
    </div>
  )
}

// Componente de puntos de fidelidad
const LoyaltyPoints = ({ points }) => {
  // Calcular el nivel y progreso
  const levels = [
    { name: "Bronce", min: 0, max: 100, color: "bg-amber-700" },
    { name: "Plata", min: 100, max: 300, color: "bg-slate-400" },
    { name: "Oro", min: 300, max: 600, color: "bg-amber-400" },
    { name: "Platino", min: 600, max: 1000, color: "bg-emerald-400" },
    { name: "Diamante", min: 1000, max: Number.POSITIVE_INFINITY, color: "bg-blue-400" },
  ]

  const currentLevel = levels.find((level) => points >= level.min && points < level.max) || levels[0]
  const nextLevel = levels[levels.indexOf(currentLevel) + 1]

  // Calcular el progreso hacia el siguiente nivel
  const progress = nextLevel
    ? Math.round(((points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100

  return (
    <div className="card bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold">Puntos de Fidelidad</h3>
        <div className="rounded-full bg-pink-100 p-1">
          <FontAwesomeIcon icon={faStar} className="text-pink-600" />
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">Nivel {currentLevel.name}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{points} puntos</span>
        {nextLevel && (
          <span className="text-xs text-gray-500">
            {nextLevel.min} para {nextLevel.name}
          </span>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div className={`h-2.5 rounded-full ${currentLevel.color}`} style={{ width: `${progress}%` }}></div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <FontAwesomeIcon icon={faGift} className="mr-2 text-pink-500" />
            Descuento en tu próxima visita
          </span>
          <span className="font-medium">{Math.min(points / 10, 25)}%</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <FontAwesomeIcon icon={faStar} className="mr-2 text-pink-500" />
            Servicios exclusivos
          </span>
          <span className="font-medium">{currentLevel.name === "Bronce" ? "No" : "Sí"}</span>
        </div>
      </div>

      <button className="btn-outline w-full text-xs">Ver beneficios completos</button>
    </div>
  )
}

// Componente de citas recientes
const RecentAppointments = ({ appointments, onCancelAppointment }) => {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-gray-500">No hay citas recientes</p>
      </div>
    )
  }

  const handleCancelClick = (appointment) => {
    Swal.fire({
      title: "Cancelar Cita",
      html: `
        <div class="text-left">
          <p>¿Estás seguro que deseas cancelar esta cita?</p>
          <p class="mt-2 mb-1 font-semibold">Motivo de cancelación:</p>
          <textarea id="cancelReason" class="w-full border border-gray-300 rounded p-2" 
            placeholder="Por favor, indica el motivo de la cancelación" rows="3"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, volver",
      preConfirm: () => {
        const reason = Swal.getPopup().querySelector("#cancelReason").value
        if (!reason) {
          Swal.showValidationMessage("Por favor indica el motivo de la cancelación")
          return false
        }
        return reason
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onCancelAppointment(appointment.id, result.value)
      }
    })
  }

  return (
    <div className="space-y-6">
      {appointments.map((appointment) => {
        const empleado = appointment.cita?.nombreempleado?.nombreempleado || appointment.title || "Sin asignar"
        const fecha = moment(appointment.start).format("DD MMM, YYYY")
        const hora = moment(appointment.start).format("HH:mm")
        const servicios = appointment.cita?.servicios || []

        // Determinar el color del badge según el estado
        let badgeClass = "status-badge status-badge-pending"
        if (appointment.estado === "Confirmada") badgeClass = "status-badge status-badge-confirmed"
        if (appointment.estado === "En Progreso") badgeClass = "status-badge status-badge-in-progress"
        if (appointment.estado === "Cancelada") badgeClass = "status-badge status-badge-cancelled"
        if (appointment.estado === "Completada") badgeClass = "status-badge status-badge-completed"

        // Obtener las iniciales del empleado para el avatar
        const iniciales = empleado
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)

        // Solo mostrar botón de cancelar si la cita no está cancelada o completada
        const canCancel = appointment.estado !== "Cancelada" && appointment.estado !== "Completada"

        return (
          <div key={appointment.id} className="flex items-center">
            <div className="avatar-circle mr-4 flex items-center justify-center bg-pink-100 text-pink-600">
              {iniciales}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{empleado}</p>
                <span className={badgeClass}>{appointment.estado}</span>
              </div>
              <p className="text-sm text-gray-500">
                {fecha} a las {hora}
              </p>
              {servicios.length > 0 && (
                <p className="text-xs text-gray-500">{servicios.map((s) => s.nombreServicio).join(", ")}</p>
              )}
              {appointment.motivoCancelacion && (
                <p className="text-xs italic text-red-500">
                  <strong>Motivo de cancelación:</strong> {appointment.motivoCancelacion}
                </p>
              )}
            </div>
            {canCancel && (
              <button
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={() => handleCancelClick(appointment)}
                title="Cancelar cita"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Componente principal del Dashboard
const ClientDashboard = () => {
  const [userData, setUserData] = useState(null)
  const [citas, setCitas] = useState([])
  const [ventas, setVentas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [debugMode, setDebugMode] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState(null)
  const navigate = useNavigate()
  const { user, loading } = useAuth() // Obtener el usuario desde el contexto de autenticación

  // Cargar datos desde localStorage al inicio
  useEffect(() => {
    const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const storedCitas = localStorage.getItem(STORAGE_KEYS.CITAS)
    const storedVentas = localStorage.getItem(STORAGE_KEYS.VENTAS)
    const storedLastFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH)

    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData))
      } catch (e) {
        console.error("Error al cargar datos de usuario desde localStorage:", e)
      }
    }

    if (storedCitas) {
      try {
        const parsedCitas = JSON.parse(storedCitas)
        // Convertir las fechas de string a objetos Date
        const formattedCitas = parsedCitas.map((cita) => ({
          ...cita,
          start: new Date(cita.start),
          end: new Date(cita.end),
        }))
        setCitas(formattedCitas)
      } catch (e) {
        console.error("Error al cargar citas desde localStorage:", e)
      }
    }

    if (storedVentas) {
      try {
        setVentas(JSON.parse(storedVentas))
      } catch (e) {
        console.error("Error al cargar ventas desde localStorage:", e)
      }
    }

    if (storedLastFetch) {
      setLastFetchTime(new Date(storedLastFetch))
    }

    

  }, [])




useEffect(() => {
  if (!user) return;

  fetchData({
    user,
    citas,
    ventas,
    userData,
    setUserData,
    setCitas,
    setVentas,
    lastFetchTime,
    setLastFetchTime,
    setIsLoading,
    navigate,
  });
}, [user]);



  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    }

    if (citas.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CITAS, JSON.stringify(citas))
    }

    if (ventas.length > 0) {
      localStorage.setItem(STORAGE_KEYS.VENTAS, JSON.stringify(ventas))
    }

    if (lastFetchTime) {
      localStorage.setItem(STORAGE_KEYS.LAST_FETCH, lastFetchTime.toISOString())
    }
  }, [userData, citas, ventas, lastFetchTime])





  // Función para cancelar una cita
  const handleCancelAppointment = async (citaId, motivoCancelacion) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")

      if (!token) {
        Swal.fire("Error", "Debes iniciar sesión para realizar esta acción", "error")
        navigate("/login")
        return
      }

      // Fix the API endpoint URL to match your backend route
      // The correct endpoint should be /api/citas/{id}/cancelar
      await axios.put(
        `https://gitbf.onrender.com/api/citas/${citaId}/cancelar`,
        {
          motivo: motivoCancelacion,
          horarioLiberado: true, // Asegurar que el horario se libere
        }, // Send the cancellation reason in the request body
        { headers: { Authorization: `Bearer ${token}` } },
      )

      // Actualizar el estado local de las citas
      setCitas((prevCitas) =>
        prevCitas.map((cita) => {
          if (cita.id === citaId) {
            return {
              ...cita,
              estado: "Cancelada",
              backgroundColor: "#d9534f", // Rojo para citas canceladas
              motivoCancelacion,
            }
          }
          return cita
        }),
      )

      // Añadir esta línea para forzar la actualización de la próxima cita
      const citasActualizadas = citas.map((cita) =>
        cita.id === citaId ? { ...cita, estado: "Cancelada", backgroundColor: "#d9534f", motivoCancelacion } : cita,
      )
      const citasOrdenadas = [...citasActualizadas].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      )
      const nuevaProximaCita =
        citasOrdenadas.find((cita) => new Date(cita.start) > new Date() && cita.estado !== "Cancelada") || null

      Swal.fire({
        icon: "success",
        title: "Cita cancelada",
        text: "La cita ha sido cancelada exitosamente",
      })
    } catch (error) {
      console.error("Error al cancelar la cita:", error)

      // Add more detailed error information
      let errorMessage = "No se pudo cancelar la cita. Por favor, intenta nuevamente."
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += ` (${error.response.status}: ${error.response.data?.message || "Error desconocido"})`
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += " (No se recibió respuesta del servidor)"
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para comparar IDs
  const areIdsSimilar = (id1, id2) => {
    if (!id1 || !id2) return false

    // Convertir a string si no lo son
    const str1 = String(id1)
    const str2 = String(id2)

    // Si son exactamente iguales
    if (str1 === str2) return true

    // Si los primeros 20 caracteres son iguales (para manejar posibles variaciones en el formato)
    const minLength = Math.min(str1.length, str2.length, 20)
    return str1.substring(0, minLength) === str2.substring(0, minLength)
  }

  // Funciones para comparar emails y nombres
  const areEmailsSimilar = (email1, email2) => {
    if (!email1 || !email2) return false
    return String(email1).toLowerCase() === String(email2).toLowerCase()
  }

  const areNamesSimilar = (name1, name2) => {
    if (!name1 || !name2) return false

    // Normalizar nombres: convertir a minúsculas y eliminar espacios
    const normalizedName1 = String(name1).toLowerCase().trim()
    const normalizedName2 = String(name2).toLowerCase().trim()

    // Verificar si son exactamente iguales después de normalizar
    if (normalizedName1 === normalizedName2) return true

    // Verificar si uno contiene al otro
    return normalizedName1.includes(normalizedName2) || normalizedName2.includes(normalizedName1)
  }

 const fetchData = async ({
  user,
  citas,
  ventas,
  userData,
  setUserData,
  setCitas,
  setVentas,
  lastFetchTime,
  setLastFetchTime,
  setIsLoading,
  navigate,
}) => {
  if (!user?.token) {
    Swal.fire("Error", "Debes iniciar sesión para ver esta página", "error");
    navigate("/login");
    return;
  }

  const now = new Date();
  const cacheExpired =
    !lastFetchTime || now.getTime() - lastFetchTime.getTime() > 5 * 60 * 1000;

  if (!cacheExpired && citas.length > 0 && ventas.length > 0) {
    console.log("Usando datos en caché. Última actualización:", lastFetchTime);
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  try {
    const headers = { Authorization: `Bearer ${user.token}` };
    const userId = user._id;
    const userName = user.nombre;
    const userEmail = user.correo;
console.log("Usuario recibido en fetchData:", user);

    if (!userId) {
      Swal.fire("Error", "No se pudo identificar al usuario", "error");
      navigate("/login");
      return;
    }

    if (!userData) {
      try {
        const usuarioResponse = await axios.get(
          `https://gitbf.onrender.com/api/usuarios/${userId}`,
          { headers }
        );
        const rawUserData = usuarioResponse.data;
        const extractedUserData = rawUserData.usuario || rawUserData;
        setUserData(extractedUserData);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        if (userName && userEmail) {
          setUserData({
            _id: userId,
            nombre: userName,
            correo: userEmail,
            rol: user.rol || "cliente",
          });
        } else {
          Swal.fire("Error", "No se pudieron cargar tus datos de perfil", "error");
          setIsLoading(false);
          return;
        }
      }
    }

    // 2. Obtener y filtrar citas
    try {
      const citasResponse = await axios.get(`https://gitbf.onrender.com/api/citas`, { headers });
      const todasLasCitas = citasResponse.data.citas || citasResponse.data || [];

      const correoUsuario = userData?.correo || userEmail;
      const nombreUsuario = userData?.nombre || userName;

      const citasFiltradas = todasLasCitas.filter((cita) => {
        // lógica para filtrar según ID, email, nombre, igual que antes
        if (areIdsSimilar(cita.nombrecliente, userId) || areIdsSimilar(cita.cliente, userId)) return true;
        if (areIdsSimilar(cita.nombrecliente?._id, userId) || areIdsSimilar(cita.cliente?._id, userId)) return true;

        const correoCliente = cita.nombrecliente?.correocliente || cita.cliente?.correocliente;
        if (correoUsuario && correoCliente && areEmailsSimilar(correoCliente, correoUsuario)) return true;

        const nombreCliente = cita.nombrecliente?.nombrecliente || cita.cliente?.nombrecliente || cita.cliente?.nombre;
        if (nombreUsuario && nombreCliente && areNamesSimilar(nombreCliente, nombreUsuario)) return true;

        return false;
      });

      if (citasFiltradas.length > 0) {
        const citasFormateadas = citasFiltradas.map((cita) => {
          const fechaInicio = new Date(cita.fechacita);
          const duracionTotal = cita.duracionTotal || 60;
          const fechaFin = new Date(fechaInicio.getTime() + duracionTotal * 60000);

          let colorEvento = "#3174ad"; // Azul (Pendiente)
          if (cita.estadocita === "Completada") colorEvento = "#5cb85c";
          if (cita.estadocita === "Cancelada") colorEvento = "#d9534f";
          if (cita.estadocita === "En Progreso") colorEvento = "#f0ad4e";

          return {
            id: cita._id,
            title: cita.nombreempleado?.nombreempleado || "Sin asignar",
            start: fechaInicio,
            end: fechaFin,
            estado: cita.estadocita,
            cita,
            backgroundColor: colorEvento,
            motivoCancelacion: cita.motivoCancelacion,
          };
        });

        setCitas(citasFormateadas);
      }
    } catch (error) {
      console.error("Error al obtener las citas:", error);
    }

    // 3. Obtener y filtrar ventas
    try {
      const ventasResponse = await axios.get(`https://gitbf.onrender.com/api/ventas`, { headers });
      const todasLasVentas = ventasResponse.data.ventas || ventasResponse.data || [];

      const correoUsuario = userData?.correo || userEmail;
      const nombreUsuario = userData?.nombre || userName;

      const ventasFiltradas = todasLasVentas.filter((venta) => {
        if (areIdsSimilar(venta.cliente, userId)) return true;
        if (venta.cliente?._id && areIdsSimilar(venta.cliente._id, userId)) return true;

        const correoCliente = venta.cliente?.correocliente;
        if (correoUsuario && correoCliente && areEmailsSimilar(correoCliente, correoUsuario)) return true;

        const nombreCliente = venta.cliente?.nombrecliente || venta.cliente?.nombre;
        if (nombreUsuario && nombreCliente && areNamesSimilar(nombreCliente, nombreUsuario)) return true;

        return false;
      });

      if (ventasFiltradas.length > 0) {
        setVentas(ventasFiltradas);
      }
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
    }

     setLastFetchTime(new Date());
  } catch (error) {
    console.error("Error general:", error);
    Swal.fire("Error", "No se pudieron cargar tus datos", "error");
  } finally {
    setIsLoading(false);
  }
};

 
 
 

  

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    }
  }

  const handleSelectCita = (event) => {
    // Determinar si la cita puede ser cancelada (no está cancelada o completada)
    const canCancel = event.estado !== "Cancelada" && event.estado !== "Completada"

    let footerHtml = ""
    if (canCancel) {
      footerHtml = `
        <div class="mt-4 text-right">
          <button id="cancelAppointmentBtn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
            Cancelar Cita
          </button>
        </div>
      `
    }

    Swal.fire({
      title: "Detalles de la Cita",
      html: `
        <div class="text-left">
          <p><strong>Fecha:</strong> ${moment(event.start).format("DD/MM/YYYY")}</p>
          <p><strong>Hora:</strong> ${moment(event.start).format("HH:mm")}</p>
          <p><strong>Empleado:</strong> ${event.title}</p>
          <p><strong>Estado:</strong> ${event.estado}</p>
          <p><strong>Servicios:</strong></p>
          <ul>
            ${
              event.cita.servicios
                ?.map((servicio) => `<li>${servicio.nombreServicio} - $${servicio.precio}</li>`)
                .join("") || "No hay servicios registrados"
            }
          </ul>
          <p><strong>Total:</strong> $${event.cita.montototal || 0}</p>
          ${event.motivoCancelacion ? `<p class="text-red-500 mt-2"><strong>Motivo de cancelación:</strong> ${event.motivoCancelacion}</p>` : ""}
        </div>
        ${footerHtml}
      `,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      showCancelButton: false,
      didOpen: () => {
        const cancelBtn = Swal.getPopup().querySelector("#cancelAppointmentBtn")
        if (cancelBtn) {
          cancelBtn.addEventListener("click", () => {
            Swal.close()
            // Mostrar el diálogo de cancelación
            Swal.fire({
              title: "Cancelar Cita",
              html: `
                <div class="text-left">
                  <p>¿Estás seguro que deseas cancelar esta cita?</p>
                  <p class="mt-2 mb-1 font-semibold">Motivo de cancelación:</p>
                  <textarea id="cancelReason" class="w-full border border-gray-300 rounded p-2" 
                    placeholder="Por favor, indica el motivo de la cancelación" rows="3"></textarea>
                </div>
              `,
              showCancelButton: true,
              confirmButtonColor: "#d33",
              cancelButtonColor: "#3085d6",
              confirmButtonText: "Sí, cancelar",
              cancelButtonText: "No, volver",
              preConfirm: () => {
                const reason = Swal.getPopup().querySelector("#cancelReason").value
                if (!reason) {
                  Swal.showValidationMessage("Por favor indica el motivo de la cancelación")
                  return false
                }
                return reason
              },
            }).then((result) => {
              if (result.isConfirmed) {
                handleCancelAppointment(event.id, result.value)
              }
            })
          })
        }
      },
    })
  }

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-light-bg">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Cargando tus datos...</p>
        </div>
      </div>
    )
  }

  // Usar datos del usuario
  const nombre = userData?.nombre || localStorage.getItem("userName") || "Usuario"
  const apellido = userData?.apellido || ""
  const correo = userData?.correo || userData?.email || localStorage.getItem("userEmail") || ""

  // Calcular estadísticas básicas
  const citasPendientes = citas.filter((cita) => cita.estado === "Pendiente" || cita.estado === "Confirmada").length
  const totalVentas = ventas.length
  const totalGastado = ventas.reduce((total, venta) => total + (venta.total || 0), 0)

  // Obtener la próxima cita
  const citasOrdenadas = [...citas].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  // Cambiar esta línea:
  //const proximaCita = citasOrdenadas.find((cita) => new Date(cita.start) > new Date()) || null
  // Por esta línea que excluye las citas canceladas:
  const proximaCita =
    citasOrdenadas.find((cita) => new Date(cita.start) > new Date() && cita.estado !== "Cancelada") || null

  // Preparar datos para gráficos
  const ventasPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Inicializar con ceros para cada mes

  ventas.forEach((venta) => {
    const fecha = new Date(venta.fechaCreacion || venta.fecha)
    const mes = fecha.getMonth() // 0-11
    ventasPorMes[mes] += venta.total || 0
  })

  return (
    <div className="dashboard-container p-6">
      <div className="dashboard-header p-6 mb-6">
        <div className="dashboard-bubble"></div>
        <div className="dashboard-bubble"></div>
        <div className="dashboard-bubble"></div>

        <div className="header-content flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h1 className="welcome-text text-2xl">
            Bienvenido, {nombre} {apellido}
          </h1>
          <div className="user-actions mt-2 md:mt-0 flex items-center">
            <span className="user-info mr-4">
              <FontAwesomeIcon icon={faUser} className="mr-2" />
              {correo || "Sin correo registrado"}
            </span>
            <div className="dropdown relative">
              <button className="action-button action-button-info mr-3" title="Opciones">
                <FontAwesomeIcon icon={faCog} size="lg" />
              </button>
              <div className="dropdown-content">
                <button onClick={() => fetchData(true)} className="dropdown-item">
                  <FontAwesomeIcon icon={faSync} className="mr-2" />
                  Actualizar datos
                </button>
                {/* <button onClick={crearCitasDePrueba} className="dropdown-item">
                  <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                  Cargar datos de prueba
                </button> */}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StatCard
            title="Total Compras"
            value={totalVentas.toString()}
            description="Historial de compras"
            icon={faShoppingBag}
            color="stat-card-purchases"
            trend={{
              value: "+12%",
              isPositive: true,
              text: "desde el mes pasado",
            }}
          />
          <StatCard
            title="Citas Programadas"
            value={citasPendientes.toString()}
            description="Citas pendientes"
            icon={faCalendarAlt}
            color="stat-card-appointments"
            trend={{
              value: "2",
              isPositive: true,
              text: "nuevas este mes",
            }}
          />
          <StatCard
            title="Total Gastado"
            value={`$${totalGastado.toLocaleString()}`}
            description="En todos los servicios"
            icon={faCreditCard}
            color="stat-card-next"
            trend={{
              value: "+5%",
              isPositive: true,
              text: "desde el mes pasado",
            }}
          />
        </div>
      </div>

      {/* Mensaje de advertencia si no hay datos */}
      {citas.length === 0 && ventas.length === 0 && (
        <div className="warning-message mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Nota:</strong> No se encontraron citas ni compras asociadas a tu cuenta. Si acabas de
                registrarte, esto es normal. Si crees que deberías ver tus datos, por favor contacta al administrador o
                haz clic en el botón <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" />
                para cargar datos de prueba y visualizar la interfaz.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="dashboard-tabs flex">
          <button
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Resumen
          </button>
          <button
            className={`tab-button ${activeTab === "citas" ? "active" : ""}`}
            onClick={() => setActiveTab("citas")}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            Mis Citas
          </button>
          <button
            className={`tab-button ${activeTab === "ventas" ? "active" : ""}`}
            onClick={() => setActiveTab("ventas")}
          >
            <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
            Mis Compras
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="fade-in">
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div className="md:col-span-2 content-container">
              <h2 className="text-xl font-semibold mb-4">Historial de Compras</h2>
              <BarChart data={ventasPorMes} />
            </div>

            <div className="space-y-6">
              <UpcomingAppointment appointment={proximaCita} onCancelAppointment={handleCancelAppointment} />
              <LoyaltyPoints points={Math.floor(totalGastado / 10000)} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="content-container p-6">
              <h2 className="text-xl font-semibold mb-4">Citas Recientes</h2>
              <RecentAppointments appointments={citas.slice(0, 5)} onCancelAppointment={handleCancelAppointment} />
            </div>

            <div className="content-container p-6">
              <h2 className="text-xl font-semibold mb-4">Servicios Recomendados</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-pink-100 p-3">
                    <FontAwesomeIcon icon={faScissors} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Tratamiento Capilar Premium</h4>
                    <p className="text-sm text-gray-500">Hidratación profunda y reparación</p>
                  </div>
                  <span className="badge badge-new">Nuevo</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-purple-100 p-3">
                    <FontAwesomeIcon icon={faMagicWandSparkles} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Manicure Deluxe</h4>
                    <p className="text-sm text-gray-500">Con diseños exclusivos</p>
                  </div>
                  <span className="badge badge-popular">Popular</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <FontAwesomeIcon icon={faHeart} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Facial Rejuvenecedor</h4>
                    <p className="text-sm text-gray-500">Tratamiento anti-edad</p>
                  </div>
                  <span className="badge badge-discount">-15%</span>
                </div>
              </div>
              <button className="btn-outline w-full mt-6">
                <FontAwesomeIcon icon={faBookmark} className="mr-2" />
                Ver todos los servicios
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "citas" && (
        <div className="content-container fade-in">
          <h2 className="text-xl font-semibold p-4 border-b">Mis Citas</h2>
          {citas.length > 0 ? (
            <div className="calendar-container">
              <Calendar
                localizer={localizer}
                events={citas}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onSelectEvent={handleSelectCita}
                eventPropGetter={eventStyleGetter}
                views={["month", "week", "day"]}
                messages={{
                  next: "Sig",
                  previous: "Ant",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "No hay citas en este rango de fechas",
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tienes citas programadas
              <p className="mt-2 text-sm">
                <em>
                  Nota: Si acabas de registrarte, es posible que aún no tengas citas asignadas. Puedes usar el botón{" "}
                  <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" /> para cargar datos de prueba.
                </em>
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "ventas" && (
        <div className="content-container fade-in">
          <h2 className="text-xl font-semibold p-4 border-b">Mis Compras</h2>
          {ventas.length > 0 ? (
            <div className="overflow-x-auto p-4">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Servicios</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((venta) => (
                    <tr key={venta._id}>
                      <td>{formatearFechaHora(venta.fechaCreacion || venta.fecha)}</td>
                      <td>{venta.codigoVenta || venta._id.substring(0, 8)}</td>
                      <td>
                        {venta.servicios && venta.servicios.length > 0
                          ? venta.servicios.map((s) => s.nombreServicio).join(", ")
                          : "Ninguno"}
                      </td>
                      <td>
                        {venta.productos && venta.productos.length > 0
                          ? venta.productos.map((p) => p.nombreProducto).join(", ")
                          : "Ninguno"}
                      </td>
                      <td>${venta.total?.toLocaleString() || "0"}</td>
                      <td>
                        <span
                          className={`status-badge ${venta.estado ? "status-badge-completed" : "status-badge-pending"}`}
                        >
                          {venta.estado ? "Completada" : "Pendiente"}
                        </span>
                      </td>
                      <td>
                        <button className="action-button">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tienes compras registradas
              <p className="mt-2 text-sm">
                <em>
                  Nota: Si acabas de registrarte, es posible que aún no tengas compras registradas. Puedes usar el botón{" "}
                  <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" /> para cargar datos de prueba.
                </em>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ClientDashboard
