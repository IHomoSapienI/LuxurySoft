"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import FormularioUsuario from "./Formulario";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSync,
  faPowerOff,
  faSearch,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import axios from "axios";
import { useSidebar } from "../Sidebar/Sidebar"; // Importamos el hook del sidebar
// import "./tablaUsuarios.css";
import "../../styles/tablas.css"

// Configura el contenedor del modal
Modal.setAppElement("#root");

const TablaUsuarios = () => {
  const { isCollapsed } = useSidebar(); // Usamos el hook del sidebar
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [rolMap, setRolMap] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 5;

  useEffect(() => {
    obtenerUsuariosYRoles();
  }, []);

  const obtenerUsuariosYRoles = async () => {
    setCargando(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      // Primero obtener los roles para asegurar que estén disponibles
      const rolesResponse = await fetch(
        "https://gitbf.onrender.com/api/roles",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!rolesResponse.ok) {
        const errorData = await rolesResponse.json();
        throw new Error(errorData.msg || "Error al obtener los roles");
      }

      const rolesData = await rolesResponse.json();
      const rolesArray = rolesData.roles || [];
      setRoles(rolesArray);

      // Crear un mapa de roles para búsqueda rápida
      const rolMapObj = {};
      rolesArray.forEach((rol) => {
        rolMapObj[rol._id] = rol.nombreRol;
      });
      setRolMap(rolMapObj);

      // console.log("Roles cargados:", rolesArray);
      // console.log("Mapa de roles:", rolMapObj);

      // Luego obtener los usuarios
      const usuariosResponse = await fetch(
        "https://gitbf.onrender.com/api/usuarios",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!usuariosResponse.ok) {
        const errorData = await usuariosResponse.json();
        throw new Error(errorData.msg || "Error al obtener los usuarios");
      }

      const usuariosData = await usuariosResponse.json();
      const usuariosArray = usuariosData.usuarios || [];

      // Asignar nombres de roles a los usuarios para depuración
      const usuariosConRoles = usuariosArray.map((usuario) => {
        // Verificar si el rol es un objeto o un ID
        const rolId =
          typeof usuario.rol === "object" ? usuario.rol._id : usuario.rol;
        const rolNombre =
          typeof usuario.rol === "object"
            ? usuario.rol.nombreRol
            : rolMapObj[rolId] || "Desconocido";

        // console.log(
        //   `Usuario ${usuario.nombre}, ID de rol: ${rolId}, Nombre de rol: ${rolNombre}`
        // );
        return {
          ...usuario,
          rolNombre,
        };
      });

      setUsuarios(usuariosConRoles);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      setError(error.message);
      Swal.fire("Error", error.message, "error");
    } finally {
      setCargando(false);
    }
  };

  const manejarAgregarNuevo = () => {
    setUsuarioEditando(null);
    setModalIsOpen(true);
  };

  const manejarCerrarModal = () => {
    setModalIsOpen(false);
    setUsuarioEditando(null);
  };

  const manejarUsuarioActualizado = () => {
    manejarCerrarModal();
    obtenerUsuariosYRoles();
  };

  const manejarEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setModalIsOpen(true);
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
          `https://gitbf.onrender.com/api/usuarios/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          obtenerUsuariosYRoles();
          Swal.fire("Eliminado!", "El usuario ha sido eliminado.", "success");
        } else {
          const errorData = await response.json();
          Swal.fire(
            "Error",
            errorData.msg || "Error al eliminar el usuario.",
            "error"
          );
        }
      } catch (error) {
        Swal.fire(
          "Error",
          "Error en la solicitud para eliminar el usuario.",
          "error"
        );
      }
    }
  };

  // Añadir esta función después de manejarEliminar
  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? "activar" : "desactivar";

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este usuario?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        // Mostrar indicador de carga
        const loadingToast = Swal.fire({
          title: "Procesando...",
          html: '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto border-pink-500 "></div><p class="mt-4">Por favor espere</p>',
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        const token = localStorage.getItem("token");
        const response = await axios.patch(
          `https://gitbf.onrender.com/api/usuarios/${id}/toggle-estado`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Cerrar indicador de carga
        loadingToast.close();

        // Actualizar el estado local
        setUsuarios(
          usuarios.map((usuario) =>
            usuario._id === id ? { ...usuario, estado: nuevoEstado } : usuario
          )
        );

        Swal.fire(
          `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          `El usuario ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          "success"
        );
      } catch (error) {
        console.error(`Error al ${accion} el usuario:`, error);
        Swal.fire("Error", `No se pudo ${accion} el usuario`, "error");
      }
    }
  };

  const filtrarUsuarios = () => {
    return usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        usuario.email.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosActuales = filtrarUsuarios().slice(
    indicePrimerUsuario,
    indiceUltimoUsuario
  );

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);
  const paginasTotales = Math.ceil(
    filtrarUsuarios().length / usuariosPorPagina
  );
  const paginaAnterior = () =>
    paginaActual > 1 && setPaginaActual(paginaActual - 1);
  const paginaSiguiente = () =>
    paginaActual < paginasTotales && setPaginaActual(paginaActual + 1);

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando usuarios...</p>
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
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerUsuariosYRoles()}
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
        Gestión de Usuarios
      </h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <button className="btn-add" onClick={manejarAgregarNuevo}>
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Nuevo Usuario
        </button>

        <div className="universal-search-container dark:card-gradient-4">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar usuarios..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-auto ">
        <table className="universal-tabla-moderna w-full">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "14%" }}
              >
                Nombre
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "14%" }}
              >
                Apellido
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "18%" }}
              >
                Email
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "12%" }}
              >
                Celular
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "12%" }}
              >
                Rol
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "12%" }}
              >
                Estado
              </th>
              <th
                className="dark:hover:bg-gray-500/50"
                style={{ width: "12%" }}
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80">
            {usuariosActuales.length > 0 ? (
              usuariosActuales.map((usuario) => (
                <tr
                  className="dark:hover:bg-gray-500/50 text-foreground"
                  key={usuario._id}
                >
                  <td className="font-medium">{usuario.nombre}</td>
                  <td>{usuario.apellido}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.celular}</td>
                  <td>
                    {typeof usuario.rol === "object"
                      ? usuario.rol.nombreRol
                      : usuario.rolNombre || "Desconocido"}
                  </td>
                  <td>
                    <span
                      className={`universal-estado-badge ${
                        usuario.estado
                          ? "activo bg-emerald-300/70 dark:bg-emerald-500"
                          : "inactivo bg-red-500/80"
                      }`}
                    >
                      {usuario.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                        onClick={() => manejarEditar(usuario)}
                        title="Editar usuario"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminar(usuario._id)}
                        title="Eliminar usuario"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      {/* <button
                        className={`usuario btn-toggle-1 dark:bg-amber-900/100 dark:hover:bg-amber-400/90 ${usuario.estado ? "active bg-amber-500/80" : "inactive bg-emerald-500/50 dark:bg-emerald-500 "}`}
                        onClick={() => manejarToggleEstado(usuario._id, usuario.estado)}
                        title={usuario.estado ? "Desactivar usuario" : "Activar usuario"}
                      >
                        <FontAwesomeIcon icon={faPowerOff} />
                      </button> */}
                      <button
                        className={`btn-toggle-1
      ${
      usuario.estado
        ? "bg-emerald-400/70  dark:bg-emerald-700 "
        : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
      }`}
                        onClick={() =>
                          manejarToggleEstado(usuario._id, usuario.estado)
                        }
                        title={
                          usuario.estado
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                      >
                        <FontAwesomeIcon
                          icon={usuario.estado ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No se encontraron usuarios con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filtrarUsuarios().length > 0 && (
        <div className="pagination-container mt-6">
          <button
            onClick={paginaAnterior}
            disabled={paginaActual === 1}
            className={`pagination-btn ${
              paginaActual === 1 ? "disabled" : ""
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

      {/* Modal */}
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
          <FormularioUsuario
            onClose={manejarCerrarModal}
            onUsuarioActualizado={manejarUsuarioActualizado}
            usuarioEditando={usuarioEditando}
            roles={roles}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TablaUsuarios;
