"use client";

import { useEffect, useState, useMemo, useCallback, memo, lazy } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  HeartCrack,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Search,
  Sparkles,
  Clock,
  DollarSign,
  Calendar,
  User,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import "./SeleccionarServicios.css";
import Swal from "sweetalert2";
import { obtenerServiciosConDescuento } from "../Servicios/obtenerServicios";
import { useAuth } from "../../context/AuthContext";

// Lazy loading para componentes pesados
const MotionDiv = lazy(() =>
  import("framer-motion").then((module) => ({ default: module.motion.div }))
);
const AnimatePresence = lazy(() =>
  import("framer-motion").then((module) => ({
    default: module.AnimatePresence,
  }))
);

// Constantes para evitar recreación
const ITEMS_PER_PAGE = 2;
const HORARIOS_DISPONIBLES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

// Skeleton Loaders para prevenir layout shifts
const ServiceSkeleton = memo(() => (
  <div className="loading-skeleton service-skeleton"></div>
));

const EmployeeSkeleton = memo(() => (
  <div className="loading-skeleton employee-skeleton"></div>
));

// Componente de animación de corazones optimizado
const HeartBurst = memo(({ x, y, isBroken = false }) => {
  return (
    <div className="heart-burst" style={{ left: x, top: y }}>
      {[...Array(4)].map(
        (
          _,
          i // Reducido de 8 a 4 para mejor performance
        ) => (
          <div
            key={i}
            className={`floating-heart ${isBroken ? "broken" : ""}`}
            style={{
              transform: `translate(${
                Math.cos((i * 90 * Math.PI) / 180) * 30
              }px, ${Math.sin((i * 90 * Math.PI) / 180) * 30}px)`,
              opacity: 0,
              animation: `heartFloat 0.8s ease-out forwards`,
            }}
          >
            {isBroken ? (
              <HeartCrack className="heart-icon-burst" />
            ) : (
              <Heart className="heart-icon-burst" />
            )}
          </div>
        )
      )}
    </div>
  );
});

// Hook optimizado para empleados y citas con cache
const useEmpleadosYCitas = (currentStep) => {
  const { user } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [isLoadingEmpleados, setIsLoadingEmpleados] = useState(false);
  const [cache, setCache] = useState({
    empleados: null,
    citas: null,
    timestamp: null,
  });

  const obtenerEmpleados = useCallback(async () => {
    if (!user?.token) return;

    // Cache por 5 minutos
    const now = Date.now();
    if (cache.empleados && cache.timestamp && now - cache.timestamp < 300000) {
      setEmpleados(cache.empleados);
      return;
    }

    setIsLoadingEmpleados(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get(
        "https://gitbf.onrender.com/api/empleados",
        {
          headers,
          timeout: 8000,
        }
      );

      if (response.data?.length > 0) {
        setEmpleados(response.data);
        setCache((prev) => ({
          ...prev,
          empleados: response.data,
          timestamp: now,
        }));
      } else {
        setEmpleados([]);
      }
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      setEmpleados([]);
    } finally {
      setIsLoadingEmpleados(false);
    }
  }, [user, cache.empleados, cache.timestamp]);

  const obtenerCitasExistentes = useCallback(async () => {
    if (!user?.token) return;

    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get("https://gitbf.onrender.com/api/citas", {
        headers,
        timeout: 8000,
      });

      const citas = response.data?.citas || response.data || [];
      setCitasExistentes(Array.isArray(citas) ? citas : []);
    } catch (error) {
      console.error("Error al obtener citas:", error);
      setCitasExistentes([]);
    }
  }, [user]);

  useEffect(() => {
    if (currentStep >= 2 && user?.token) {
      obtenerEmpleados();
      obtenerCitasExistentes();
    }
  }, [currentStep, user, obtenerEmpleados, obtenerCitasExistentes]);

  return { empleados, citasExistentes, setCitasExistentes, isLoadingEmpleados };
};

// Hook optimizado para cliente con cache
const useClienteCompleto = (currentStep) => {
  const { user } = useAuth();
  const [clienteCompleto, setClienteCompleto] = useState(null);
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);

  const obtenerClienteCompleto = useCallback(async () => {
    if (!user?.token || !user._id) return;

    setIsLoadingCliente(true);
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get(
        "https://gitbf.onrender.com/api/clientes",
        {
          headers,
          timeout: 8000,
        }
      );

      if (response.data?.length > 0) {
        const clienteEncontrado = response.data.find((cliente) => {
          return (
            cliente.usuario === user._id ||
            (typeof cliente.usuario === "object" &&
              cliente.usuario?._id === user._id) ||
            cliente.correocliente?.toLowerCase() === user.correo?.toLowerCase()
          );
        });

        setClienteCompleto(
          clienteEncontrado || {
            _id: user._id,
            nombrecliente: user.nombre || "",
            apellidocliente: "",
            correocliente: user.correo || "",
            celularcliente: "",
            usuario: user._id,
          }
        );
      } else {
        setClienteCompleto({
          _id: user._id,
          nombrecliente: user.nombre || "",
          apellidocliente: "",
          correocliente: user.correo || "",
          celularcliente: "",
          usuario: user._id,
        });
      }
    } catch (error) {
      console.error("Error al obtener datos del cliente:", error);
      setClienteCompleto({
        _id: user._id,
        nombrecliente: user.nombre || "",
        apellidocliente: "",
        correocliente: user.correo || "",
        celularcliente: "",
        usuario: user._id,
      });
    } finally {
      setIsLoadingCliente(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentStep === 4 && user) {
      obtenerClienteCompleto();
    }
  }, [currentStep, user, obtenerClienteCompleto]);

  return { clienteCompleto, isLoadingCliente };
};

// Componente principal optimizado
const SeleccionarServicios = () => {
  const { user } = useAuth();

  // Estados principales
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [heartBursts, setHeartBursts] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nombreempleado: "",
    nombrecliente: "",
    telefono: "",
    email: "",
    fecha: new Date().toISOString().split("T")[0],
    hora: "",
    notas: "",
  });

  const navigate = useNavigate();

  // Hooks personalizados
  const { empleados, citasExistentes, setCitasExistentes, isLoadingEmpleados } =
    useEmpleadosYCitas(currentStep);
  const { clienteCompleto, isLoadingCliente } = useClienteCompleto(currentStep);

  // Valores memoizados optimizados
  const tiposServicio = useMemo(() => {
    return [
      ...new Set(
        servicios.map(
          (servicio) => servicio.tipoServicio?.nombreTs || "Sin categoría"
        )
      ),
    ];
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    let resultado = servicios;

    if (filtroTipo !== "todos") {
      resultado = resultado.filter(
        (servicio) => servicio.tipoServicio?.nombreTs === filtroTipo
      );
    }

    if (busqueda.trim() !== "") {
      const terminoBusqueda = busqueda.toLowerCase();
      resultado = resultado.filter(
        (servicio) =>
          servicio.nombreServicio.toLowerCase().includes(terminoBusqueda) ||
          servicio.descripcion?.toLowerCase().includes(terminoBusqueda)
      );
    }

    return resultado;
  }, [servicios, filtroTipo, busqueda]);

  const totalPages = useMemo(
    () => Math.ceil(serviciosFiltrados.length / ITEMS_PER_PAGE),
    [serviciosFiltrados.length]
  );

  const duracionTotal = useMemo(() => {
    return serviciosSeleccionados.reduce(
      (total, servicio) => total + (servicio.tiempo || 0),
      0
    );
  }, [serviciosSeleccionados]);

  const getCurrentPageServices = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return serviciosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [serviciosFiltrados, currentPage]);

  // Funciones optimizadas
  const verificarDisponibilidad = useCallback(
    (fecha, hora, empleadoId, duracion) => {
      if (citasExistentes.length === 0 || !empleadoId) return true;

      const [horaSeleccionada, minutosSeleccionados] = hora
        .split(":")
        .map(Number);
      const inicioSeleccionado = horaSeleccionada * 60 + minutosSeleccionados;
      const finSeleccionado = inicioSeleccionado + duracion;

      if (finSeleccionado > 18 * 60) return false;

      const [year, month, day] = fecha.split("-").map(Number);
      const fechaFormateada = `${year}-${month < 10 ? "0" + month : month}-${
        day < 10 ? "0" + day : day
      }`;

      const citasDelDia = citasExistentes.filter((cita) => {
        const fechaCita = new Date(cita.fechacita).toISOString().split("T")[0];
        const citaEmpleadoId =
          typeof cita.nombreempleado === "object" &&
          cita.nombreempleado !== null
            ? cita.nombreempleado._id
            : cita.nombreempleado;

        return (
          fechaCita === fechaFormateada &&
          citaEmpleadoId === empleadoId &&
          cita.estadocita !== "Cancelada"
        );
      });

      return !citasDelDia.some((cita) => {
        const [horaCita, minutosCita] = cita.horacita.split(":").map(Number);
        const inicioCita = horaCita * 60 + minutosCita;
        const duracionCita = cita.duracionTotal || 60;
        const finCita = inicioCita + duracionCita;

        return (
          (inicioSeleccionado >= inicioCita && inicioSeleccionado < finCita) ||
          (finSeleccionado > inicioCita && finSeleccionado <= finCita) ||
          (inicioSeleccionado <= inicioCita && finSeleccionado >= finCita)
        );
      });
    },
    [citasExistentes]
  );

  const manejarSeleccionServicio = useCallback(
    (servicio, event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const yaSeleccionado = serviciosSeleccionados.find(
        (s) => s._id === servicio._id
      );

      // Animación optimizada
      const newBurst = { id: Date.now(), x, y, isBroken: !!yaSeleccionado };
      setHeartBursts((prev) => [...prev, newBurst]);
      setTimeout(() => {
        setHeartBursts((prev) =>
          prev.filter((burst) => burst.id !== newBurst.id)
        );
      }, 800); // Reducido de 1000ms

      if (yaSeleccionado) {
        setServiciosSeleccionados((prev) =>
          prev.filter((s) => s._id !== servicio._id)
        );
        const precioARestar = servicio.tieneDescuento
          ? servicio.precioConDescuento
          : servicio.precioOriginal;
        setTotal((prev) =>
          Number.parseFloat((prev - precioARestar).toFixed(2))
        );
      } else {
        setServiciosSeleccionados((prev) => [...prev, servicio]);
        const precioASumar = servicio.tieneDescuento
          ? servicio.precioConDescuento
          : servicio.precioOriginal;
        setTotal((prev) => Number.parseFloat((prev + precioASumar).toFixed(2)));
      }
    },
    [serviciosSeleccionados]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const nextStep = useCallback(() => {
    if (currentStep === 1 && serviciosSeleccionados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona servicios",
        text: "Por favor, selecciona al menos un servicio",
        confirmButtonColor: "#3498db",
      });
      return;
    }

    if (currentStep === 2 && !formData.nombreempleado) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona empleado",
        text: "Por favor, selecciona un empleado",
        confirmButtonColor: "#3498db",
      });
      return;
    }

    if (currentStep === 3) {
      if (!formData.fecha || !formData.hora) {
        Swal.fire({
          icon: "warning",
          title: "Selecciona fecha y hora",
          text: "Por favor, selecciona fecha y hora",
          confirmButtonColor: "#3498db",
        });
        return;
      }

      const disponible = verificarDisponibilidad(
        formData.fecha,
        formData.hora,
        formData.nombreempleado,
        duracionTotal
      );
      if (!disponible) {
        Swal.fire({
          icon: "error",
          title: "Horario no disponible",
          text: "Lo sentimos, este horario ya no está disponible. Por favor, selecciona otro horario.",
          confirmButtonColor: "#3498db",
        });
        return;
      }
    }

    if (currentStep === 4 && (!formData.nombrecliente || !formData.telefono)) {
      Swal.fire({
        icon: "warning",
        title: "Completa los datos",
        text: "Por favor, completa los campos requeridos",
        confirmButtonColor: "#3498db",
      });
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }, [
    currentStep,
    serviciosSeleccionados.length,
    formData,
    verificarDisponibilidad,
    duracionTotal,
  ]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  // Efectos optimizados
  useEffect(() => {
    const obtenerServicios = async () => {
      setIsLoading(true);
      try {
        const serviciosConDescuento = await obtenerServiciosConDescuento();
        const serviciosActivos = serviciosConDescuento.filter(
          (servicio) => servicio.estado === true
        );
        setServicios(serviciosActivos);
      } catch (error) {
        console.error("Error al obtener los servicios:", error);
        setError(
          "No se pudieron cargar los servicios. Por favor, intenta de nuevo más tarde."
        );
      } finally {
        setIsLoading(false);
      }
    };

    obtenerServicios();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [filtroTipo, busqueda]);

  // Autocompletar formulario optimizado
  useEffect(() => {
    if (currentStep === 4 && clienteCompleto && !isLoadingCliente) {
      const nombreCompleto =
        clienteCompleto.nombrecliente && clienteCompleto.apellidocliente
          ? `${clienteCompleto.nombrecliente} ${clienteCompleto.apellidocliente}`.trim()
          : clienteCompleto.nombrecliente || user?.nombre || "";

      setFormData((prev) => ({
        ...prev,
        nombrecliente: nombreCompleto || prev.nombrecliente,
        telefono: clienteCompleto.celularcliente || prev.telefono,
        email: clienteCompleto.correocliente || user?.correo || prev.email,
      }));
    }
  }, [currentStep, clienteCompleto, isLoadingCliente, user]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user?.token) {
        Swal.fire({
          icon: "error",
          title: "Error de autenticación",
          text: "No estás autenticado. Por favor, inicia sesión.",
          confirmButtonColor: "#3498db",
        });
        return;
      }

      const disponible = verificarDisponibilidad(
        formData.fecha,
        formData.hora,
        formData.nombreempleado,
        duracionTotal
      );
      if (!disponible) {
        Swal.fire({
          icon: "error",
          title: "Horario no disponible",
          text: "Lo sentimos, este horario ya no está disponible. Por favor, selecciona otro horario.",
          confirmButtonColor: "#3498db",
        });
        return;
      }

      const serviciosFormateados = serviciosSeleccionados.map((servicio) => ({
        _id: servicio._id,
        nombreServicio: servicio.nombreServicio,
        precio: servicio.precio,
        tiempo: servicio.tiempo,
      }));

      const [year, month, day] = formData.fecha.split("-").map(Number);
      const [hour, minute] = formData.hora.split(":").map(Number);
      const fechaLocal = new Date(year, month - 1, day, hour, minute);
      const fechaISO = fechaLocal.toISOString();

      const dataToSend = {
        nombreempleado: formData.nombreempleado,
        fechacita: fechaISO,
        horacita: formData.hora,
        duracionTotal: duracionTotal,
        servicios: serviciosFormateados,
        montototal: total,
        estadocita: "Pendiente",
        nombrecliente: clienteCompleto?._id || user._id,
        clienteNombreCompleto: formData.nombrecliente,
        telefono: formData.telefono,
        email: formData.email,
        notas: formData.notas,
      };

      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const response = await axios.post(
          "https://gitbf.onrender.com/api/citas",
          dataToSend,
          { headers }
        );

        setCitasExistentes((prevCitas) => [
          ...prevCitas,
          { ...dataToSend, _id: response.data._id || Date.now().toString() },
        ]);

        Swal.fire({
          icon: "success",
          title: "¡Cita agendada con éxito!",
          text: `Tu cita ha sido programada para el ${new Date(
            formData.fecha
          ).toLocaleDateString("es-ES")} a las ${formData.hora}`,
          confirmButtonText: "Ir al Dashboard",
          confirmButtonColor: "#3498db",
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/mi-cuenta");
        });

        // Reiniciar formulario
        setServiciosSeleccionados([]);
        setTotal(0);
        setFormData({
          nombreempleado: "",
          nombrecliente: "",
          telefono: "",
          email: "",
          fecha: new Date().toISOString().split("T")[0],
          hora: "",
          notas: "",
        });
        setCurrentStep(1);
      } catch (error) {
        console.error("Error completo:", error);
        let mensajeError =
          "Error al guardar la cita. Por favor, intente de nuevo.";

        if (error.response?.data?.error) {
          mensajeError = `Error: ${error.response.data.error}`;
        } else if (error.response?.data?.message) {
          mensajeError = `Error: ${error.response.data.message}`;
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: mensajeError,
          confirmButtonColor: "#3498db",
        });
      }
    },
    [
      user,
      formData,
      verificarDisponibilidad,
      duracionTotal,
      serviciosSeleccionados,
      total,
      clienteCompleto,
      navigate,
      setCitasExistentes,
    ]
  );

  // Estados de carga optimizados
  if (isLoading) {
    return (
      <div className="fullscreen-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fullscreen-view">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fullscreen-view">
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h3>Acceso Restringido</h3>
          <p>Debes iniciar sesión para acceder a esta página.</p>
          <button className="retry-button" onClick={() => navigate("/login")}>
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="servicios-view">
      <div className="notebook-container">
        <div className="notebook">
          {/* Espiral de la libreta */}
          <div className="notebook-spiral">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="spiral-ring"></div>
            ))}
          </div>

          {/* Marcador */}
          <div className="bookmark">
            <Bookmark className="bookmark-icon" />
          </div>

          {/* Botones de navegación para servicios */}
          {currentStep === 1 && (
            <>
              <button
                className={`page-nav-button prev ${
                  currentPage === 0 ? "disabled" : ""
                }`}
                onClick={prevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="nav-icon" />
              </button>

              <button
                className={`page-nav-button next ${
                  currentPage === totalPages - 1 ? "disabled" : ""
                }`}
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="nav-icon" />
              </button>
            </>
          )}

          {/* Contenido de la libreta */}
          <div className="notebook-content">
            {/* Página izquierda */}
            <div className="notebook-page left-page">
              {/* PASO 1: Selección de servicios */}
              {currentStep === 1 && (
                <>
                  <div className="page-header">
                    <h2>Servicios Disponibles</h2>
                    <span className="page-number">
                      Página {currentPage + 1} de {Math.max(1, totalPages)}
                    </span>
                  </div>

                  {/* Filtros y búsqueda */}
                  <div className="filters-section">
                    <div className="search-container">
                      <Search className="search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar servicios..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="search-input"
                      />
                    </div>

                    <div className="filter-tabs">
                      <div className="tabs">
                        <div className="tabs-list">
                          <button
                            className={`tab-button ${
                              filtroTipo === "todos" ? "active" : ""
                            }`}
                            onClick={() => setFiltroTipo("todos")}
                          >
                            Todos
                          </button>
                          {tiposServicio.map((tipo) => (
                            <button
                              key={tipo}
                              className={`tab-button ${
                                filtroTipo === tipo ? "active" : ""
                              }`}
                              onClick={() => setFiltroTipo(tipo)}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="services-list custom-scrollbar">
                    {serviciosFiltrados.length === 0 ? (
                      <div className="no-results">
                        <p>
                          No se encontraron servicios con los filtros actuales.
                        </p>
                      </div>
                    ) : (
                      getCurrentPageServices.map((servicio) => {
                        const isSelected = serviciosSeleccionados.find(
                          (s) => s._id === servicio._id
                        );
                        return (
                          <div
                            key={servicio._id}
                            className={`service-item ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={(e) =>
                              manejarSeleccionServicio(servicio, e)
                            }
                          >
                            <div className="service-checkbox">
                              {isSelected ? (
                                <Heart className="heart-icon filled" />
                              ) : (
                                <Heart className="heart-icon outline" />
                              )}
                            </div>
                            <div className="service-details">
                              <div className="service-header">
                                <h3>{servicio.nombreServicio}</h3>
                                <div className="service-type-badge">
                                  {servicio.tipoServicio?.nombreTs || "General"}
                                  {servicio.tipoServicio?.descuento > 0 && (
                                    <span className="discount-pill">
                                      {servicio.tipoServicio.descuento}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="service-info">
                                <div className="service-price">
                                  <DollarSign className="info-icon" />
                                  {servicio.tieneDescuento ? (
                                    <div className="price-with-discount">
                                      <span className="original-price">
                                        ${servicio.precioOriginal.toFixed(2)}
                                      </span>
                                      <span>
                                        $
                                        {servicio.precioConDescuento.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span>${servicio.precio}</span>
                                  )}
                                </div>
                                <div className="service-time">
                                  <Clock className="info-icon" />
                                  <span>{servicio.tiempo} min</span>
                                </div>
                              </div>

                              <div className="service-description-container">
                                <h4>Descripción:</h4>
                                <p className="service-description">
                                  {servicio.descripcion ||
                                    "Sin descripción disponible para este servicio."}
                                </p>
                              </div>

                              <div className="service-rating">⭐⭐⭐⭐⭐</div>
                            </div>

                            {heartBursts.map((burst) => (
                              <HeartBurst
                                key={burst.id}
                                x={burst.x}
                                y={burst.y}
                                isBroken={burst.isBroken}
                              />
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* PASO 2: Selección de empleado */}
              {currentStep === 2 && (
                <>
                  <div className="page-header">
                    <h2>Selecciona un Estilista</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="employee-list">
                    {isLoadingEmpleados ? (
                      <>
                        <EmployeeSkeleton />
                        <EmployeeSkeleton />
                        <EmployeeSkeleton />
                      </>
                    ) : empleados.length === 0 ? (
                      <div className="no-results">
                        <p>No se encontraron estilistas disponibles.</p>
                        <p className="hint">
                          Por favor, contacta al administrador.
                        </p>
                      </div>
                    ) : (
                      empleados.map((empleado) => (
                        <div
                          key={empleado._id}
                          className={`employee-item ${
                            formData.nombreempleado === empleado._id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              nombreempleado: empleado._id,
                            })
                          }
                        >
                          <div className="employee-avatar">
                            {empleado.nombreempleado.charAt(0)}
                          </div>
                          <div className="employee-details">
                            <h3>{empleado.nombreempleado}</h3>
                            <p>
                              Especialidades:{" "}
                              {empleado.especialidades
                                ? empleado.especialidades.join(", ")
                                : "General"}
                            </p>
                          </div>
                          {formData.nombreempleado === empleado._id && (
                            <div className="employee-selected">
                              <Check className="check-icon" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* PASO 3: Selección de fecha y hora */}
              {currentStep === 3 && (
                <>
                  <div className="page-header">
                    <h2>Fecha y Hora</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="date-time-selection">
                    <div className="date-selection">
                      <label htmlFor="fecha" className="form-label">
                        Selecciona una fecha
                      </label>
                      <input
                        type="date"
                        id="fecha"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="date-input"
                      />
                    </div>

                    <div className="time-selection">
                      <label className="form-label">Horarios disponibles</label>

                      <div className="availability-legend">
                        <div className="legend-item">
                          <div className="legend-color available"></div>
                          <span>Disponible</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color selected"></div>
                          <span>Seleccionado</span>
                        </div>
                        <div className="legend-item">
                          <div className="legend-color occupied"></div>
                          <span>Ocupado</span>
                        </div>
                      </div>

                      <div className="time-slots">
                        {HORARIOS_DISPONIBLES.map((time) => {
                          const disponible = verificarDisponibilidad(
                            formData.fecha,
                            time,
                            formData.nombreempleado,
                            duracionTotal
                          );

                          const [hora, minutos] = time.split(":").map(Number);
                          const inicioMinutos = hora * 60 + minutos;
                          const finMinutos = inicioMinutos + duracionTotal;
                          const excedeTiempo = finMinutos > 18 * 60;

                          const razonNoDisponible = excedeTiempo
                            ? "La duración del servicio excede el horario de trabajo"
                            : "Horario no disponible";

                          return (
                            <div
                              key={time}
                              className={`time-slot ${
                                formData.hora === time ? "selected" : ""
                              } ${
                                !disponible || excedeTiempo ? "ocupado" : ""
                              }`}
                              onClick={() =>
                                disponible &&
                                !excedeTiempo &&
                                setFormData({ ...formData, hora: time })
                              }
                              title={
                                !disponible || excedeTiempo
                                  ? razonNoDisponible
                                  : ""
                              }
                            >
                              {time}
                            </div>
                          );
                        })}
                      </div>

                      <div className="availability-warning">
                        <AlertCircle className="warning-icon" />
                        <p>
                          Los horarios ocupados no pueden ser seleccionados
                          porque ya hay una cita agendada con este estilista.
                        </p>
                      </div>

                      {duracionTotal > 120 && (
                        <div className="availability-warning warning-long-duration">
                          <AlertCircle className="warning-icon" />
                          <p>
                            Los servicios seleccionados suman {duracionTotal}{" "}
                            minutos. Citas muy largas pueden tener
                            disponibilidad limitada.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* PASO 4: Datos del cliente */}
              {currentStep === 4 && (
                <>
                  <div className="page-header">
                    <h2>Tus Datos</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  {isLoadingCliente ? (
                    <div
                      className="loading-indicator"
                      style={{
                        height: "120px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="loading-spinner-small"
                        style={{ width: "32px", height: "32px" }}
                      ></div>
                      <p style={{ marginTop: "0.5rem" }}>
                        Cargando tus datos...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="client-logged-info">
                        <div className="info-badge">
                          <User className="info-badge-icon" />
                          <span>
                            Datos de tu cuenta: {user?.nombre}
                            {clienteCompleto?.celularcliente &&
                              ` • Tel: ${clienteCompleto.celularcliente}`}
                          </span>
                        </div>
                      </div>

                      <div className="client-form">
                        <div className="form-group">
                          <label htmlFor="nombrecliente" className="form-label">
                            Nombre completo *
                          </label>
                          <input
                            type="text"
                            id="nombrecliente"
                            name="nombrecliente"
                            value={formData.nombrecliente}
                            onChange={handleInputChange}
                            placeholder="Tu nombre completo"
                            className="form-input"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="telefono" className="form-label">
                            Teléfono *{" "}
                            {clienteCompleto?.celularcliente
                              ? "(Autocompletado)"
                              : "(Requerido)"}
                          </label>
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleInputChange}
                            placeholder="Tu número de teléfono"
                            className="form-input"
                            required
                          />
                          <small className="form-help">
                            {clienteCompleto?.celularcliente
                              ? "Número obtenido de tu perfil. Puedes modificarlo si es necesario."
                              : "Este número será usado para confirmar tu cita y enviarte recordatorios."}
                          </small>
                        </div>

                        <div className="form-group">
                          <label htmlFor="email" className="form-label">
                            Correo electrónico (Autocompletado)
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Tu correo electrónico"
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="notas" className="form-label">
                            Notas adicionales (opcional)
                          </label>
                          <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleInputChange}
                            placeholder="Cualquier información adicional que quieras compartir"
                            className="form-textarea"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* PASO 5: Confirmación */}
              {currentStep === 5 && (
                <>
                  <div className="page-header">
                    <h2>Confirma tu Cita</h2>
                    <button onClick={prevStep} className="back-button">
                      <ChevronLeft className="nav-icon" /> Volver
                    </button>
                  </div>

                  <div className="confirmation-details">
                    <div className="confirmation-section">
                      <h3>Servicios seleccionados</h3>
                      <ul className="confirmation-services">
                        {serviciosSeleccionados.map((servicio) => (
                          <li key={servicio._id}>
                            <span>{servicio.nombreServicio}</span>
                            {servicio.tieneDescuento ? (
                              <div className="price-with-discount">
                                <span className="original-price">
                                  $
                                  {Number.parseFloat(servicio.precio).toFixed(
                                    2
                                  )}
                                </span>
                                <span className="discounted-price">
                                  ${servicio.precioConDescuento.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span>
                                ${Number.parseFloat(servicio.precio).toFixed(2)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="confirmation-total">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                      <div className="confirmation-duration">
                        <span>Duración total:</span>
                        <span>{duracionTotal} minutos</span>
                      </div>
                    </div>
                    <div className="confirmation-section">
                      <h3>Detalles de la cita</h3>
                      <div className="confirmation-detail">
                        <span>Estilista:</span>
                        <span>
                          {
                            empleados.find(
                              (e) => e._id === formData.nombreempleado
                            )?.nombreempleado
                          }
                        </span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Fecha:</span>
                        <span>
                          {(() => {
                            const [year, month, day] = formData.fecha
                              .split("-")
                              .map(Number);
                            const fechaCorrecta = new Date(
                              year,
                              month - 1,
                              day
                            );
                            return fechaCorrecta.toLocaleDateString("es-ES", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                          })()}
                        </span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Hora:</span>
                        <span>{formData.hora}</span>
                      </div>
                    </div>
                    <div className="confirmation-section">
                      <h3>Tus datos</h3>
                      <div className="confirmation-detail">
                        <span>Nombre:</span>
                        <span>{formData.nombrecliente}</span>
                      </div>
                      <div className="confirmation-detail">
                        <span>Teléfono:</span>
                        <span>{formData.telefono}</span>
                      </div>
                      {formData.email && (
                        <div className="confirmation-detail">
                          <span>Email:</span>
                          <span>{formData.email}</span>
                        </div>
                      )}
                      {formData.notas && (
                        <div className="confirmation-detail">
                          <span>Notas:</span>
                          <span>{formData.notas}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Página derecha - Selecciones y acciones */}
            <div className="notebook-page right-page">
              <div className="page-header">
                <h2>Mi Selección</h2>
                <div className="step-indicator">Paso {currentStep} de 5</div>
              </div>

              {/* Mostrar información del usuario autenticado */}
              {user && (
                <div className="user-info-section">
                  <div className="user-badge">
                    <User className="user-icon" />
                    <div className="user-details">
                      <span className="user-name">{user.nombre}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* <div className="selected-services custom-scrollbar">
                {serviciosSeleccionados.length === 0 ? (
                  <div className="empty-selection">
                    <Sparkles className="sparkle-icon" />
                    <p>No has seleccionado ningún servicio aún.</p>
                    <p className="hint">Haz clic en los servicios de la izquierda para agregarlos.</p>
                  </div>
                ) : (
                  <div className="selection-list">
                    {serviciosSeleccionados.map((servicio) => (
                      <div
                        key={servicio._id}
                        className="selected-item"
                        onClick={(e) => manejarSeleccionServicio(servicio, e)}
                      >
                        <div className="selected-item-content">
                          <Heart className="selected-heart" />
                          <div className="selected-item-details">
                            <span className="item-name">{servicio.nombreServicio}</span>
                            <span className="item-time">{servicio.tiempo} min</span>
                          </div>
                        </div>
                        <div className="item-price">
                          {servicio.tieneDescuento ? (
                            <div className="price-with-discount">
                              <span className="original-price">${Number.parseFloat(servicio.precio).toFixed(2)}</span>
                              <span className="discounted-price">${servicio.precioConDescuento.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span>${Number.parseFloat(servicio.precio).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}

              <div className="selected-services custom-scrollbar">
                {serviciosSeleccionados.length === 0 && (
                  <div className="empty-selection">
                    <Sparkles className="sparkle-icon" />
                    <p>No has seleccionado ningún servicio aún.</p>
                  </div>
                )}

                <p
                  className={`hint hint-lcp ${
                    serviciosSeleccionados.length > 0 ? "hidden" : ""
                  }`}
                >
                  Haz clic en los servicios de la izquierda para agregarlos.
                </p>

                {serviciosSeleccionados.length > 0 && (
                  <div className="selection-list">
                    {serviciosSeleccionados.map((servicio) => (
                      <div
                        key={servicio._id}
                        className="selected-item"
                        onClick={(e) => manejarSeleccionServicio(servicio, e)}
                      >
                        <div className="selected-item-content">
                          <Heart className="selected-heart" />
                          <div className="selected-item-details">
                            <span className="item-name">
                              {servicio.nombreServicio}
                            </span>
                            <span className="item-time">
                              {servicio.tiempo} min
                            </span>
                          </div>
                        </div>
                        <div className="item-price">
                          {servicio.tieneDescuento ? (
                            <div className="price-with-discount">
                              <span className="original-price">
                                ${Number.parseFloat(servicio.precio).toFixed(2)}
                              </span>
                              <span className="discounted-price">
                                ${servicio.precioConDescuento.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span>
                              ${Number.parseFloat(servicio.precio).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="appointment-summary">
                {currentStep >= 2 && (
                  <div className="summary-section">
                    <h3>Resumen de la cita</h3>

                    {currentStep >= 2 && formData.nombreempleado && (
                      <div className="summary-item">
                        <User className="summary-icon" />
                        <span>
                          Estilista:{" "}
                          {
                            empleados.find(
                              (e) => e._id === formData.nombreempleado
                            )?.nombreempleado
                          }
                        </span>
                      </div>
                    )}

                    {currentStep >= 3 && formData.fecha && formData.hora && (
                      <div className="summary-item">
                        <Calendar className="summary-icon" />
                        <span>
                          {(() => {
                            const [year, month, day] = formData.fecha
                              .split("-")
                              .map(Number);
                            const fechaCorrecta = new Date(
                              year,
                              month - 1,
                              day
                            );
                            return fechaCorrecta.toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            });
                          })()}
                          {" a las "}
                          {formData.hora}
                        </span>
                      </div>
                    )}

                    <div className="summary-item">
                      <Clock className="summary-icon" />
                      <span>Duración: {duracionTotal} minutos</span>
                    </div>
                  </div>
                )}

                <div className="total-section">
                  <div className="total-line">
                    <span>Total:</span>
                    <span className="total-amount">${total}</span>
                  </div>

                  {currentStep < 5 ? (
                    <button
                      className="schedule-button"
                      onClick={nextStep}
                      disabled={serviciosSeleccionados.length === 0}
                    >
                      {currentStep === 1 ? "Continuar" : "Siguiente"}
                      <ArrowRight className="button-icon" />
                    </button>
                  ) : (
                    <button className="confirm-button" onClick={handleSubmit}>
                      Confirmar Cita
                      <Check className="button-icon" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SeleccionarServicios);
