"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faPowerOff,
  faToggleOn,
  faToggleOff
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
// import "./tablaTipoServ.css";
import FormularioTipoServicios from "./FormularioTipoServ";
import "../../styles/tablas.css";


Modal.setAppElement("#root");

export default function TablaTipoServicioss() {
  const [tipoServicios, setTipoServicios] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [tipoServicioSeleccionado, setTipoServicioSeleccionado] =
    useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const tipoServiciosPorPagina = 5;
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const obtenerTipoServicios = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://gitbf.onrender.com/api/tiposervicioss",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setTipoServicios(data.tiposerviciosts || []);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      setError("No se pudieron cargar los datos. Por favor, intenta de nuevo.");
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí. Tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    obtenerTipoServicios();
  }, []);

  const manejarAgregarNuevo = () => {
    setTipoServicioSeleccionado(null);
    setModalIsOpen(true);
  };

  const manejarCerrarModal = () => {
    setModalIsOpen(false);
  };

  const manejarTipoServicioAgregadoOActualizado = () => {
    manejarCerrarModal();
    obtenerTipoServicios();
  };

  const manejarEditar = (tipoServicio) => {
    setTipoServicioSeleccionado(tipoServicio);
    setModalIsOpen(true);
  };

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este tipo de servicio?`,
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
          `https://gitbf.onrender.com/api/tiposervicioss/${id}/toggle-estado`,
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
        setTipoServicios(
          tipoServicios.map((ts) =>
            ts._id === id ? { ...ts, activo: nuevoEstado } : ts
          )
        );

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El tipo de servicio ha sido ${
            nuevoEstado ? "activado" : "desactivado"
          }.`,
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error(`Error al ${accion} el tipo de servicio:`, error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} el tipo de servicio`,
          confirmButtonColor: "#db2777",
        });
      }
    }
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
        const response = await fetch(
          `https://gitbf.onrender.com/api/tiposervicioss/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setTipoServicios(tipoServicios.filter((ts) => ts._id !== id));
        Swal.fire({
          icon: "success",
          title: "Eliminado!",
          text: "El tipo de servicio ha sido eliminado.",
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error("Error al eliminar el tipo de servicio:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el tipo de servicio",
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  const indiceUltimoTipoServicio = paginaActual * tipoServiciosPorPagina;
  const indicePrimerTipoServicio =
    indiceUltimoTipoServicio - tipoServiciosPorPagina;

  // Filtrar por búsqueda
  const tipoServiciosFiltrados = tipoServicios.filter((ts) =>
    ts.nombreTipoServicio.toLowerCase().includes(busqueda.toLowerCase())
  );

  const tipoServiciosActuales = tipoServiciosFiltrados.slice(
    indicePrimerTipoServicio,
    indiceUltimoTipoServicio
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginasTotales = Math.ceil(
    tipoServiciosFiltrados.length / tipoServiciosPorPagina
  );

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh] dark:bg-primary">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando tipos de servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerTipoServicios()}
        >
          <FontAwesomeIcon icon="sync" className="mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800 px-4 pt-4 dark:text-foreground">
        Gestión de Tipos de Servicios
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button className="btn-add" onClick={manejarAgregarNuevo}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Tipo de Servicio
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar tipos de servicios..."
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mx-auto w-full">
        <table
          className="universal-tabla-moderna w-full"
          // style={{ width: "100%", tableLayout: "fixed" }}
        >
          <thead className="bg-pink-200 text-black dark:card-gradient-4 ">
            <tr className="text-foreground">
              <th className="dark:hover:bg-gray-500/50" style={{width: "33%"}}>Nombre</th>
              <th className="dark:hover:bg-gray-500/50" style={{width: "33%"}}>Estado</th>
              <th className="dark:hover:bg-gray-500/50 text-foreground" style={{width: "33%"}}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80 ">
            {tipoServiciosActuales.length > 0 ? (
              tipoServiciosActuales.map((tipoServicio) => (
                <tr
                  key={tipoServicio._id}
                  className="dark:hover:bg-gray-500/50 text-foreground"
                >
                  <td className="font-medium ">
                    {tipoServicio.nombreTipoServicio}
                  </td>
                  <td>
                    <span
                      className={`universal-estado-badge text-foreground ${
                        tipoServicio.activo
                          ? "activo bg-emerald-500/50 dark:bg-emerald-500"
                          : "inactivo bg-red-500/80"
                      }`}
                    >
                      {tipoServicio.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2 center">
                      <button
                        className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                        onClick={() => manejarEditar(tipoServicio)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>

                      <button
                        className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminar(tipoServicio._id)}
                        title="Eliminar"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      <button
                        className={`btn-toggle-1
                                                  ${
                                                    tipoServicio.activo
                                                      ? "bg-emerald-400/70  dark:bg-emerald-700 "
                                                      : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                                                  }`}
                        onClick={() =>
                          manejarToggleEstado(tipoServicio._id, tipoServicio.activo)
                        }
                        title={
                          tipoServicio.activo
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                      >
                        <FontAwesomeIcon
                          icon={tipoServicio.activo ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No se encontraron tipos de servicios con ese criterio de
                  búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {tipoServiciosFiltrados.length > 0 && (
        <div className="pagination-container mt-6">
          <button
            onClick={paginaAnterior}
            disabled={paginaActual === 1}
            className={`pagination-btn ${paginaActual === 1 ? "disabled" : ""}`}
          >
            &lt;
          </button>

          <div className="pagination-pages">
            {Array.from({ length: paginasTotales }, (_, index) => (
              <button
                key={index}
                onClick={() => cambiarPagina(index + 1)}
                className={`pagination-number ${
                  paginaActual === index + 1 ? "active" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={paginaSiguiente}
            disabled={paginaActual === paginasTotales}
            className={`pagination-btn ${
              paginaActual === paginasTotales ? "disabled" : ""
            }`}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Modal para agregar/editar tipo de servicio */}
      <Modal
        isOpen={modalIsOpen}
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
          <FormularioTipoServicios
            tipoServicioSeleccionado={tipoServicioSeleccionado}
            onTipoServicioActualizado={manejarTipoServicioAgregadoOActualizado}
            onClose={manejarCerrarModal}
          />
        </div>
      </Modal>
    </div>
  );
}
