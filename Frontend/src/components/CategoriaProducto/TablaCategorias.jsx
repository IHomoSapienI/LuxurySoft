import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import FormularioCategoriaProducto from "./FormularioCategoriaProducto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faSync,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
// import "./TablaCategorias.css";
import "../../styles/tablas.css";

// Configura el contenedor del modal
Modal.setAppElement("#root");

const TablaCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [formModalIsOpen, setFormModalIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const categoriasPorPagina = 5; // Cantidad de categorías a mostrar por página

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const obtenerCategorias = async () => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({
        title: "Error",
        text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
        icon: "error",
        confirmButtonColor: "#db2777",
      });
      setIsLoading(false);
      return;
    }

    try {
      const respuesta = await axios.get(
        "https://gitbf.onrender.com/api/categoriaproductos",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCategorias(respuesta.data.categorias || []);
    } catch (error) {
      console.error("Error al obtener las categorías:", error);
      setError(
        "No se pudieron cargar las categorías. Por favor, intenta de nuevo."
      );
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

  const manejarAgregarNuevo = () => {
    setCategoriaSeleccionada(null);
    setFormModalIsOpen(true);
  };

  const manejarCerrarModal = () => {
    setFormModalIsOpen(false);
    setCategoriaSeleccionada(null);
  };

  const manejarCategoriaAgregadaOActualizada = () => {
    obtenerCategorias();
    manejarCerrarModal();
  };

  const manejarEditar = (categoria) => {
    setCategoriaSeleccionada(categoria);
    setFormModalIsOpen(true);
  };

  const manejarEliminarCategoria = async (id) => {
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
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire({
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          icon: "error",
          confirmButtonColor: "#db2777",
        });
        return;
      }

      try {
        await axios.delete(
          `https://gitbf.onrender.com/api/categoriaproductos/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        obtenerCategorias();
        Swal.fire({
          title: "Eliminado!",
          text: "La categoría ha sido eliminada.",
          icon: "success",
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error("Error al eliminar la categoría:", error);
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la categoría.",
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
      text: `¿Deseas ${accion} esta categoría?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("token");
      if (!token) {
        await Swal.fire({
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          icon: "error",
          confirmButtonColor: "#db2777",
        });
        return;
      }

      try {
        const categoriaActualizada = {
          ...categorias.find((categoria) => categoria._id === id),
          activo: nuevoEstado,
        };

        await axios.put(
          `https://gitbf.onrender.com/api/categoriaproductos/${id}`,
          categoriaActualizada,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Actualizar el estado local
        setCategorias(
          categorias.map((categoria) =>
            categoria._id === id
              ? { ...categoria, activo: nuevoEstado }
              : categoria
          )
        );

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activada" : "Desactivada"}!`,
          text: `La categoría ha sido ${
            nuevoEstado ? "activada" : "desactivada"
          }.`,
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error(`Error al ${accion} la categoría:`, error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} la categoría`,
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  // Funciones de búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const categoriasFiltradas = categorias.filter(
    (categoria) =>
      categoria.nombreCp.toLowerCase().includes(busqueda.toLowerCase()) ||
      categoria.descripcionCp.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Funciones de paginación
  const indiceUltimaCategoria = paginaActual * categoriasPorPagina;
  const indicePrimeraCategoria = indiceUltimaCategoria - categoriasPorPagina;
  const categoriasActuales = categoriasFiltradas.slice(
    indicePrimeraCategoria,
    indiceUltimaCategoria
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginasTotales = Math.ceil(
    categoriasFiltradas.length / categoriasPorPagina
  );

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh] ">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando categorías...</p>
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
          onClick={() => obtenerCategorias()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-foreground px-4 pt-4">
        Gestión de Categorías
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-add"
            onClick={manejarAgregarNuevo}
            title="Agregar nueva categoría"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Categoría
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={handleBusquedaChange}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar categorías..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-4 mx-auto">
        <table className="universal-tabla-moderna w-full">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th className="dark:bg-gray-500/50" style={{ width: "25%" }}>
                Nombre de la Categoría
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "25%" }}>
                Descripción
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "25%" }}>
                Estado
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "25%" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80">
            {categoriasActuales.length > 0 ? (
              categoriasActuales.map((categoria) => (
                <tr key={categoria._id} className="text-foreground">
                  <td className="font-medium">{categoria.nombreCp}</td>
                  <td>{categoria.descripcionCp}</td>
                  <td>
                    <span
                      className={`universal-estado-badge ${
                        categoria.activo 
                        ? "activo bg-emerald-300/70 dark:bg-emerald-500"
                          : "inactivo bg-red-500/80"
                      }`}
                    >
                      {categoria.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    {/* Modificado para usar clases similares a TablaPermisos */}
                    <div className="flex justify-center space-x-2">
                      <button
                        className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                        onClick={() => manejarEditar(categoria)}
                        title="Editar categoría"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminarCategoria(categoria._id)}
                        title="Eliminar categoría"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      {/* <button
                        className={`btn-toggle-1 dark:bg-amber-900/100 dark:hover:bg-amber-400/90 ${categoria.activo ? "active" : "inactive"}`}
                        onClick={() => manejarToggleEstado(categoria._id, categoria.activo)}
                        title={categoria.activo ? "Desactivar categoría" : "Activar categoría"}
                      >
                        <FontAwesomeIcon icon={faPowerOff} />
                      </button> */}

                      <button
                        className={`btn-toggle-1
                                              ${
                                                categoria.activo
                                                  ? "bg-emerald-400/70  dark:bg-emerald-700 "
                                                  : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                                              }`}
                        onClick={() =>
                          manejarToggleEstado(categoria._id, categoria.activo)
                        }
                        title={
                          categoria.activo
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                      >
                        <FontAwesomeIcon
                          icon={categoria.activo ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No se encontraron categorías con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {categorias.length > 0 && (
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

      {/* Modal para agregar/editar categoría */}
      <Modal
        isOpen={formModalIsOpen}
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
          <h2 className="text-2xl font-semibold mb-4 text-center text-pink-600">
            {categoriaSeleccionada ? "Actualizar Categoría" : "Nueva Categoría"}
          </h2>
          <FormularioCategoriaProducto
            categoria={categoriaSeleccionada}
            onClose={manejarCerrarModal}
            onCategoriaAgregadaOActualizada={
              manejarCategoriaAgregadaOActualizada
            }
          />
        </div>
      </Modal>
    </div>
  );
};

export default TablaCategorias;
