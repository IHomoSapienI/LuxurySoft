"use client";

import { useReducer, useEffect, useCallback } from "react";
import Modal from "react-modal";
import FormularioServicio from "./FormularioServicio";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Importar el icono de exportación en la sección de importaciones
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faFileExcel,
  faToggleOn,
  faToggleOff,
  faPowerOff
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { useSidebar } from "../Sidebar/Sidebar";
// import "./tablaServ.css";
import { obtenerServiciosConDescuento } from "./obtenerServicios";
import "../../styles/tablas.css";

Modal.setAppElement("#root");

const ACTIONS = {
  FETCH_INIT: "FETCH_INIT",
  FETCH_SUCCESS: "FETCH_SUCCESS",
  FETCH_FAILURE: "FETCH_FAILURE",
  ADD_SERVICIO: "ADD_SERVICIO",
  UPDATE_SERVICIO: "UPDATE_SERVICIO",
  DELETE_SERVICIO: "DELETE_SERVICIO",
  SET_MODAL: "SET_MODAL",
  SET_SELECTED_SERVICIO: "SET_SELECTED_SERVICIO",
  SET_PAGE: "SET_PAGE",
  SET_SEARCH: "SET_SEARCH",
  SET_SORT: "SET_SORT",
};

const serviciosReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.FETCH_INIT:
      return { ...state, isLoading: true, error: null };
    case ACTIONS.FETCH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        servicios: action.payload,
        error: null,
      };
    case ACTIONS.FETCH_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case ACTIONS.ADD_SERVICIO:
      return { ...state, servicios: [...state.servicios, action.payload] };
    case ACTIONS.UPDATE_SERVICIO:
      return {
        ...state,
        servicios: state.servicios.map((s) =>
          s._id === action.payload._id ? action.payload : s
        ),
      };
    case ACTIONS.DELETE_SERVICIO:
      return {
        ...state,
        servicios: state.servicios.filter((s) => s._id !== action.payload),
      };
    case ACTIONS.SET_MODAL:
      return { ...state, modalIsOpen: action.payload };
    case ACTIONS.SET_SELECTED_SERVICIO:
      return { ...state, servicioSeleccionado: action.payload };
    case ACTIONS.SET_PAGE:
      return { ...state, paginaActual: action.payload };
    case ACTIONS.SET_SEARCH:
      return { ...state, busqueda: action.payload, paginaActual: 1 };
    case ACTIONS.SET_SORT:
      return {
        ...state,
        sortField: action.payload.field,
        sortDirection: action.payload.direction,
      };
    default:
      return state;
  }
};

const TablaServicios = () => {
  const { isCollapsed } = useSidebar();
  const [state, dispatch] = useReducer(serviciosReducer, {
    servicios: [],
    isLoading: true,
    error: null,
    modalIsOpen: false,
    servicioSeleccionado: null,
    paginaActual: 1,
    busqueda: "",
    sortField: "nombreServicio",
    sortDirection: "asc",
  });

  const serviciosPorPagina = 5;

  const obtenerServicios = useCallback(async () => {
    dispatch({ type: ACTIONS.FETCH_INIT });
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        Swal.fire({
          title: "Error",
          text: "No tienes permiso para estar aquí. No se encontró un token válido.",
          icon: "error",
          confirmButtonColor: "#db2777",
        });
        dispatch({
          type: ACTIONS.FETCH_FAILURE,
          payload: "Token no encontrado.",
        });
        return;
      }

      const serviciosConDescuento = await obtenerServiciosConDescuento();
      // console.log(
      //   "Servicios obtenidos con descuentos aplicados:",
      //   serviciosConDescuento
      // );
      dispatch({
        type: ACTIONS.FETCH_SUCCESS,
        payload: serviciosConDescuento || [],
      });
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí. Tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      });
      dispatch({
        type: ACTIONS.FETCH_FAILURE,
        payload: "Error al cargar los servicios. Por favor, intente de nuevo.",
      });
    }
  }, []);

  useEffect(() => {
    obtenerServicios();
  }, [obtenerServicios]);

  const manejarAgregarNuevo = () => {
    dispatch({ type: ACTIONS.SET_SELECTED_SERVICIO, payload: null });
    dispatch({ type: ACTIONS.SET_MODAL, payload: true });
  };

  const manejarCerrarModal = () => {
    dispatch({ type: ACTIONS.SET_MODAL, payload: false });
  };

  const manejarServicioAgregadoOActualizado = async (nuevoServicio) => {
    if (state.servicioSeleccionado) {
      dispatch({ type: ACTIONS.UPDATE_SERVICIO, payload: nuevoServicio });
    } else {
      dispatch({ type: ACTIONS.ADD_SERVICIO, payload: nuevoServicio });
    }
    manejarCerrarModal();

    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: "El servicio ha sido guardado correctamente.",
      confirmButtonColor: "#db2777",
    });

    // Actualizar la lista de servicios después de agregar o editar
    obtenerServicios();
  };

  const manejarEditar = (servicio) => {
    dispatch({ type: ACTIONS.SET_SELECTED_SERVICIO, payload: servicio });
    dispatch({ type: ACTIONS.SET_MODAL, payload: true });
  };

  const manejarEliminar = async (id) => {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminarlo!",
    cancelButtonText: "Cancelar",
  });

  if (result.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      
      // 🔴 Acá estaba el error: no estabas guardando la respuesta
      const response = await fetch(`https://gitbf.onrender.com/api/servicios/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ Revisás si la respuesta fue exitosa
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || "Error al eliminar el servicio");
      }

      dispatch({ type: ACTIONS.DELETE_SERVICIO, payload: id });

      Swal.fire({
        title: "Eliminado!",
        text: "El servicio ha sido eliminado.",
        icon: "success",
        confirmButtonColor: "#db2777",
      });

      obtenerServicios(); // Actualizar la lista después de eliminar
    } catch (error) {
      console.error("Error al eliminar el servicio:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo eliminar el servicio.",
        icon: "error",
        confirmButtonColor: "#db2777",
      });
    }
  }
};

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este servicio?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `https://gitbf.onrender.com/api/servicios/${id}/toggle-estado`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Actualizar el estado local
        dispatch({
          type: ACTIONS.UPDATE_SERVICIO,
          payload: {
            ...state.servicios.find((s) => s._id === id),
            _id: id,
            estado: nuevoEstado,
          },
        });

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El servicio ha sido ${
            nuevoEstado ? "activado" : "desactivado"
          }.`,
          confirmButtonColor: "#db2777",
        });

        // Actualizar la lista después de cambiar el estado
        obtenerServicios();
      } catch (error) {
        console.error(`Error al ${accion} el servicio:`, error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} el servicio`,
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  // Agregar la función para manejar la exportación a Excel después de la función manejarEliminar
  const manejarExportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      // Mostrar indicador de carga
      Swal.fire({
        title: "Generando Excel",
        text: "Por favor espere...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Realizar la solicitud para exportar a Excel
      const response = await fetch(
        "https://gitbf.onrender.com/api/servicios/export-excel",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      // Convertir la respuesta a blob
      const blob = await response.blob();

      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace temporal para descargar el archivo
      const a = document.createElement("a");
      a.href = url;
      a.download = "servicios.xlsx";
      document.body.appendChild(a);
      a.click();

      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: "El archivo Excel ha sido generado correctamente.",
        confirmButtonColor: "#db2777",
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el archivo Excel.",
        confirmButtonColor: "#db2777",
      });
    }
  };

  const handleSort = (field) => {
    const direction =
      state.sortField === field && state.sortDirection === "asc"
        ? "desc"
        : "asc";
    dispatch({
      type: ACTIONS.SET_SORT,
      payload: { field, direction },
    });
  };

  // Filtrar y ordenar servicios
  const serviciosFiltrados = state.servicios
  .filter((servicio) => {
    const searchLower = state.busqueda.toLowerCase();
    const estadoStr = servicio.estado ? "activo" : "inactivo"; // ✅ Aquí

    return (
      servicio.nombreServicio.toLowerCase().includes(searchLower) ||
      (servicio.tipoServicio?.nombreTs || "")
        .toLowerCase()
        .includes(searchLower) ||
      servicio.precio.toString().includes(searchLower) ||
      servicio.tiempo.toString().includes(searchLower) ||
      estadoStr.includes(searchLower) // ✅ y aquí
    );
  })


    .sort((a, b) => {
      const field = state.sortField;
      const direction = state.sortDirection === "asc" ? 1 : -1;

      // Manejar campos anidados como tipoServicio.nombreTs
      if (field === "tipoServicio") {
        const aValue = a.tipoServicio?.nombreTs || "";
        const bValue = b.tipoServicio?.nombreTs || "";
        return direction * aValue.localeCompare(bValue);
      }

      // Manejar campos numéricos
      if (field === "precio" || field === "tiempo") {
        return direction * (a[field] - b[field]);
      }

      // Campos de texto
      return direction * a[field].toString().localeCompare(b[field].toString());
    });

  const indiceUltimoServicio = state.paginaActual * serviciosPorPagina;
  const indicePrimerServicio = indiceUltimoServicio - serviciosPorPagina;
  const serviciosActuales = serviciosFiltrados.slice(
    indicePrimerServicio,
    indiceUltimoServicio
  );

  const cambiarPagina = (numeroPagina) => {
    dispatch({ type: ACTIONS.SET_PAGE, payload: numeroPagina });
  };

  const paginasTotales = Math.ceil(
    serviciosFiltrados.length / serviciosPorPagina
  );

  const paginaAnterior = () => {
    if (state.paginaActual > 1)
      dispatch({ type: ACTIONS.SET_PAGE, payload: state.paginaActual - 1 });
  };

  const paginaSiguiente = () => {
    if (state.paginaActual < paginasTotales)
      dispatch({ type: ACTIONS.SET_PAGE, payload: state.paginaActual + 1 });
  };

  const getSortIcon = (field) => {
    if (state.sortField !== field)
      return <FontAwesomeIcon icon={faSort} className="text-gray-400 ml-1" />;
    return state.sortDirection === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} className="text-pink-500 ml-1" />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className="text-pink-500 ml-1" />
    );
  };

  if (state.isLoading)
    return (
      <div className="flex justify-center items-center h-[64vh] dark:bg-primary">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  if (state.error)
    return <div className="alert alert-error">{state.error}</div>;
// console.log(serviciosActuales)
  return (
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-foreground px-4 pt-4">
        Gestión de Servicios
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex gap-2">
          <button className="btn-add" onClick={manejarAgregarNuevo}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Servicio
          </button>
          <button className="btn-export" onClick={manejarExportarExcel}>
            <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
            Exportar Excel
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={state.busqueda}
            onChange={(e) =>
              dispatch({ type: ACTIONS.SET_SEARCH, payload: e.target.value })
            }
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar servicios..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-auto">
        {/* Modificar la tabla para mostrar información de descuento */}
        <table className="universal-tabla-moderna w-full">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th
                onClick={() => handleSort("nombreServicio")}
                className="dark:hover:bg-gray-500/50"
              >
                Nombre del Servicio {getSortIcon("nombreServicio")}
              </th>
              <th
                onClick={() => handleSort("tipoServicio")}
                className="cursor-pointer dark:hover:bg-gray-500/50"
              >
                Tipo {getSortIcon("tipoServicio")}
              </th>
              <th
                onClick={() => handleSort("tiempo")}
                className="cursor-pointer dark:hover:bg-gray-500/50"
              >
                Tiempo {getSortIcon("tiempo")}
              </th>
              <th
                onClick={() => handleSort("precio")}
                className="cursor-pointer dark:hover:bg-gray-500/50"
              >
                Precio {getSortIcon("precio")}
              </th>
              <th>Precio con Descuento</th>
              <th
                onClick={() => handleSort("estado")}
                className="cursor-pointer dark:hover:bg-gray-500/50"
              >
                Estado {getSortIcon("estado")}
              </th>
              <th className="cursor-pointer dark:hover:bg-gray-500/50">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80 text-foreground">
            {serviciosActuales.length > 0 ? (
              serviciosActuales.map((servicio) => {
                // console.log("tipoServicio:", servicio.tipoServicio);
                // Calcular precio con descuento si el tipo de servicio tiene descuento
                const tieneDescuento = servicio.tipoServicio?.descuento > 0;
                const precioOriginal = Number.parseFloat(servicio.precio);
                const precioConDescuento = tieneDescuento
                  ? precioOriginal -
                    (precioOriginal * servicio.tipoServicio.descuento) / 100
                  : precioOriginal;

                return (
                  <tr key={servicio._id}>
                    <td className="font-medium">{servicio.nombreServicio}</td>
                    <td>
                      {servicio.tipoServicio?.nombreTs || "No definido"}
                      {tieneDescuento && (
                        <span className="ml-2 inline-block bg-pink-200 text-foreground px-2  rounded-full dark:bg-pink-500 ">
                          {servicio.tipoServicio.descuento}% OFF
                        </span>
                      )}
                    </td>
                    <td>{servicio.tiempo} min</td>
                    <td>
                      $
                      {Number(precioOriginal).toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {/* ${precioOriginal.toFixed(2)}</td> */}
                    <td>
                      {tieneDescuento ? (
                        <span className="text-emerald-600 underline cursor-pointer font-medium">
                          $
                          {Number(precioConDescuento).toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                          })}{" "}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`universal-estado-badge ${
                          servicio.estado
                            ? "activo bg-emerald-300/70 dark:bg-emerald-500"
                            : "inactivo bg-red-500/80"
                        }`}
                      >
                        {servicio.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                          onClick={() => manejarEditar(servicio)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                          onClick={() => manejarEliminar(servicio._id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      
                        <button
                          className={`btn-toggle-1
    ${
      servicio.estado
        ? "bg-emerald-400/70  dark:bg-emerald-700 "
        : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
    }`}
                          onClick={() =>
                            manejarToggleEstado(servicio._id, servicio.estado)
                          }
                          title={
                            servicio.estado
                              ? "Desactivar Servicio"
                              : "Activar Servicio"
                          }
                        >
                          <FontAwesomeIcon
                            icon={servicio.estado ? faToggleOn : faToggleOff}
                            className="text-white text-xl"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No se encontraron servicios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {serviciosFiltrados.length > 0 && (
        <div className="pagination-container mt-6">
          <button
            onClick={paginaAnterior}
            disabled={state.paginaActual === 1}
            className={`pagination-btn ${
              state.paginaActual === 1 ? "disabled" : ""
            }`}
          >
            &lt;
          </button>

          <div className="pagination-pages">
            {Array.from({ length: paginasTotales }, (_, index) => (
              <button
                key={index}
                onClick={() => cambiarPagina(index + 1)}
                className={`pagination-number ${
                  state.paginaActual === index + 1 ? "active" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={paginaSiguiente}
            disabled={state.paginaActual === paginasTotales}
            className={`pagination-btn ${
              state.paginaActual === paginasTotales ? "disabled" : ""
            }`}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={state.modalIsOpen}
        onRequestClose={manejarCerrarModal}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={manejarCerrarModal}
          >
            &times;
          </button>
          <FormularioServicio
            servicioSeleccionado={state.servicioSeleccionado}
            onServicioActualizado={manejarServicioAgregadoOActualizado}
            onClose={manejarCerrarModal}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TablaServicios;
