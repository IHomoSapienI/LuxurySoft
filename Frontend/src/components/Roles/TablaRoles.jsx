"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import FormularioRol from "./FormularioRol";
import FormularioPermiso from "../Permisos/FormularioPermiso";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faInfoCircle,
  faShieldAlt,
  faPowerOff,
  faFileExcel,
  faToggleOn,
  faToggleOff,
  faSync,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axiosInstance   from "../../util/axiosConfig";
// import "./tablaRol.css";
import "../../styles/tablas.css"

Modal.setAppElement("#root");

export default function TablaRoles() {
  const [roles, setRoles] = useState([]);
  const [permisoMap, setPermisoMap] = useState({});
  const [modalRolIsOpen, setModalRolIsOpen] = useState(false);
  const [modalDetallesIsOpen, setModalDetallesIsOpen] = useState(false);
  const [modalPermisoIsOpen, setModalPermisoIsOpen] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const rolesPorPagina = 5;
  const [busqueda, setBusqueda] = useState("");
  const [exportando, setExportando] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // const obtenerRoles = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const token = localStorage.getItem("token");
  //     const rolesResponse = await fetch(
  //       "https://gitbf.onrender.com/api/roles",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     if (!rolesResponse.ok)
  //       throw new Error(`HTTP error! status: ${rolesResponse.status}`);
  //     const rolesData = await rolesResponse.json();
  //     setRoles(rolesData.roles || []);

  //     const permisosResponse = await fetch(
  //       "https://gitbf.onrender.com/api/permisos",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     if (!permisosResponse.ok)
  //       throw new Error(`HTTP error! status: ${permisosResponse.status}`);
  //     const permisosData = await permisosResponse.json();
  //     const permisoMap = {};
  //     permisosData.permisos.forEach((permiso) => {
  //       permisoMap[permiso._id] = permiso.nombrePermiso;
  //     });
  //     setPermisoMap(permisoMap);
  //   } catch (error) {
  //     console.error("Error al obtener los datos:", error);
  //     setError("No se pudieron cargar los datos. Por favor, intenta de nuevo.");
  //     Swal.fire({
  //       title: "Error",
  //       text: "No tienes permiso para estar aquí. Tu token no es válido.",
  //       icon: "error",
  //       confirmButtonColor: "#db2777",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

const obtenerRoles = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const [rolesRes, permisosRes] = await Promise.all([
      axiosInstance.get("/roles"),
      axiosInstance.get("/permisos"),
    ]);

    const rolesData = rolesRes.data;
    const permisosData = permisosRes.data;

    setRoles(rolesData.roles || []);
    const permisoMap = {};
    permisosData.permisos.forEach((permiso) => {
      permisoMap[permiso._id] = permiso.nombrePermiso;
    });
    setPermisoMap(permisoMap);
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
    obtenerRoles();
  }, []);

  const manejarAgregarNuevo = () => {
    setRolSeleccionado(null);
    setModalRolIsOpen(true);
  };

  const manejarAgregarPermiso = () => {
    setModalPermisoIsOpen(true);
  };
  const manejarCerrarModal = () => {
    setModalRolIsOpen(false);
  };

  const manejarCerrarModalDetalles = () => {
    setModalDetallesIsOpen(false);
  };

  const manejarCerrarModalPermiso = () => {
    setModalPermisoIsOpen(false);
  };

  const manejarRolAgregadoOActualizado = () => {
    manejarCerrarModal();
    obtenerRoles();
  };

  const manejarPermisoCreado = () => {
    manejarCerrarModalPermiso();
    obtenerRoles();
  };

  const manejarEditar = (rol) => {
    setRolSeleccionado(rol);
    setModalRolIsOpen(true);
  };

  const manejarVerDetalles = (rol) => {
    setRolSeleccionado(rol);
    setModalDetallesIsOpen(true);
  };

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este rol?`,
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
          `https://gitbf.onrender.com/api/roles/${id}/toggle-estado`,
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

        const data = await response.json();

        // Actualizar el estado local
        setRoles(
          roles.map((rol) =>
            rol._id === id ? { ...rol, estadoRol: nuevoEstado } : rol
          )
        );

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El rol ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error(`Error al ${accion} el rol:`, error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} el rol`,
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  const manejarEliminar = async (id) => {
    // Obtener el rol para verificar si es Admin
    const rolAEliminar = roles.find((rol) => rol._id === id);

    // Si es un rol Admin, mostrar mensaje de error sin intentar eliminar
    if (
      rolAEliminar &&
      (rolAEliminar.nombreRol.toLowerCase() === "admin" || rolAEliminar.esAdmin)
    ) {
      Swal.fire({
        icon: "error",
        title: "Acción no permitida",
        text: "No se puede eliminar el rol de Administrador",
        confirmButtonColor: "#db2777",
      });
      return;
    }

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
          `https://gitbf.onrender.com/api/roles/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();

          // Si el backend indica que es un rol Admin
          if (errorData.isAdminRole) {
            throw new Error("No se puede eliminar el rol de Administrador");
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setRoles(roles.filter((rol) => rol._id !== id));
        Swal.fire({
          icon: "success",
          title: "Eliminado!",
          text: "El rol ha sido eliminado.",
          confirmButtonColor: "#db2777",
        });
      } catch (error) {
        console.error("Error al eliminar el rol:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo eliminar el rol",
          confirmButtonColor: "#db2777",
        });
      }
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando(true);
      const token = localStorage.getItem("token");

      // Mostrar notificación de inicio de descarga
      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      toast.fire({
        icon: "info",
        title: "Preparando la descarga...",
      });

      // Realizar la solicitud para descargar el archivo
      const response = await fetch(
        "https://gitbf.onrender.com/api/roles/export-excel",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Crear un objeto URL para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear un elemento <a> para descargar el archivo
      const a = document.createElement("a");
      a.href = url;
      a.download = "roles.xlsx";
      document.body.appendChild(a);
      a.click();

      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mostrar notificación de éxito
      toast.fire({
        icon: "success",
        title: "Archivo descargado correctamente",
      });
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo exportar la lista de roles a Excel",
        confirmButtonColor: "#db2777",
      });
    } finally {
      setExportando(false);
    }
  };

  const indiceUltimoRol = paginaActual * rolesPorPagina;
  const indicePrimerRol = indiceUltimoRol - rolesPorPagina;
  const rolesActuales = roles.slice(indicePrimerRol, indiceUltimoRol);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginasTotales = Math.ceil(roles.length / rolesPorPagina);

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
  };

  const rolesFiltrados = rolesActuales.filter((rol) =>
    rol.nombreRol.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando roles...</p>
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
          onClick={() => obtenerRoles()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="content">
      <h2 className="text-3xl font-semibold mb-8 text-foreground px-4 pt-4">
        Gestión de Roles
      </h2>
      
      <div className="flex  flex-col md:flex-row justify-between  items-center mb-6 gap-4 px-4 ">
        <div className="flex space-x-2">
          <button 
          className="btn-add" 
          onClick={manejarAgregarNuevo}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Rol
          </button>

          {/* <button
            className="btn-secondary"
            onClick={manejarAgregarPermiso}
            title="Agregar nuevo permiso"
          >
            <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
            Nuevo Permiso
          </button> */}

          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando}
            title="Exportar a Excel"
          >
            {exportando ? (
              <div className="flex items-center">
                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                <span>Exportando...</span>
              </div>
            ) : (
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
            )}
            Exportar
          </button>
          
        </div>



          <div className="universal-search-container w-full md:w-2/3">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar roles..."
          />
        </div>
      </div>
        

        

      <div className="overflow-x-auto rounded-lg shadow  mx-auto">
        <table
          className="universal-tabla-moderna w-full"
          style={{ width: "100%", tableLayout: "fixed" }}
        >
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th className="dark:hover:bg-gray-500/50">Nombre del Rol</th>
              <th className="dark:hover:bg-gray-500/50">Estado</th>
              <th className="dark:hover:bg-gray-500/50">Acciones</th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80 text-foreground">
            {rolesFiltrados.length > 0 ? (
              rolesFiltrados.map((rol) => (
                <tr
                  key={rol._id}
                  className="dark:hover:bg-gray-500/50 text-foreground"
                >
                  <td className="font-medium">{rol.nombreRol}</td>
                  <td>
                    <span
                      className={`universal-estado-badge ${
                        rol.estadoRol
                          ? "activo bg-emerald-300/70 dark:bg-emerald-500"
                          : "inactivo bg-red-500/80"
                      }`}
                    >
                      {rol.estadoRol ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2 center">
                      <button
                        className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                        onClick={() => manejarEditar(rol)}
                        title="Editar rol"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>

                      <button
                        className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminar(rol._id)}
                        title="Eliminar rol"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>

                      <button
                        className="btn-info-1"
                        onClick={() => manejarVerDetalles(rol)}
                        title="Ver detalles"
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </button>

                      {/* <button
                        className={`btn-toggle-1 dark:bg-amber-900/100 dark:hover:bg-amber-400/90 ${rol.estadoRol ? "active" : "inactive"}`}
                        onClick={() => manejarToggleEstado(rol._id, rol.estadoRol)}
                        title={rol.estadoRol ? "Desactivar rol" : "Activar rol"}
                      >
                        <FontAwesomeIcon icon={faPowerOff} />
                      </button> */}

                      <button
                        className={`btn-toggle-1 transition-all duration-200 ease-in-out
                          ${
                            rol.estadoRol
                              ? "bg-emerald-400/70  dark:bg-emerald-700 "
                              : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                          }`}
                        onClick={() =>
                          manejarToggleEstado(rol._id, rol.estadoRol)
                        }
                        title={
                          rol.estadoRol
                            ? "Desactivar Rol"
                            : "Activar Rol"
                        }
                      >
                        <FontAwesomeIcon
                          icon={rol.estadoRol ? faToggleOn : faToggleOff}
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
                  No se encontraron roles con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {roles.length > 0 && (
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

      {/* Modal para agregar/editar rol */}
      <Modal
        isOpen={modalRolIsOpen}
        onRequestClose={manejarCerrarModal}
        className="modal-content-rol-form"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={manejarCerrarModal}
          >
            &times;
          </button>
          <FormularioRol
            rolSeleccionado={rolSeleccionado}
            onRolActualizado={manejarRolAgregadoOActualizado}
            onClose={manejarCerrarModal}
          />
        </div>
      </Modal>

      {/* Modal para mostrar detalles */}
      <Modal
        isOpen={modalDetallesIsOpen}
        onRequestClose={manejarCerrarModalDetalles}
        className="modal-content-rol-form"
        overlayClassName="modal-overlay"
      >
        <div className="relative h-[90vh]">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={manejarCerrarModalDetalles}
          >
            &times;
          </button>
          <div className="p-6 modal-p">
            <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
              Detalles del Rol
            </h2>
            {rolSeleccionado &&
            permisoMap &&
            Object.keys(permisoMap).length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="mb-2">
                    <strong className="text-gray-700">Nombre del Rol:</strong>{" "}
                    <span className="text-gray-900">
                      {rolSeleccionado.nombreRol}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong className="text-gray-700">Estado:</strong>{" "}
                    <span
                      className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rolSeleccionado.estadoRol
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rolSeleccionado.estadoRol ? "Activo" : "Inactivo"}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Permisos asignados:
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-[90vh] overflow-y-auto">
                    <ul className="space-y-2 max-h-[90vh]">
                      {rolSeleccionado.permisoRol.map((permiso) => (
                        <li key={permiso._id} className="flex items-center">
                          <span className="h-2 w-2 bg-pink-500 rounded-full mr-2"></span>
                          <span className="text-gray-700">
                            {permisoMap[String(permiso._id)] ||
                              "Permiso desconocido"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                <p className="ml-4 text-gray-600">Cargando información...</p>
              </div>
            )}

            <div className="mt-6 fixed justify-end ">
              <button
                onClick={manejarCerrarModalDetalles}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal para agregar permiso */}
      <Modal
        isOpen={modalPermisoIsOpen}
        onRequestClose={manejarCerrarModalPermiso}
        className="modal-content-rol-form"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={manejarCerrarModalPermiso}
          >
            &times;
          </button>
          <FormularioPermiso
            onClose={manejarCerrarModalPermiso}
            onPermisoCreated={manejarPermisoCreado}
          />
        </div>
      </Modal>
    </div>
  );
}
