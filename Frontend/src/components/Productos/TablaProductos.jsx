"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Modal from "react-modal"
import FormularioProducto from "./FormularioProducto"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPlus,
  faEdit,
  faTrash,
  faFileExcel,
  faSearch,
  faSync,
  faPrint,
  faToggleOn,
  faToggleOff,
} from "@fortawesome/free-solid-svg-icons"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
// import "./tablaProductos.css"
import "../../styles/tablas.css"

// Configura el contenedor del modal
Modal.setAppElement("#root")

const TablaProductos = () => {
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [formModalIsOpen, setFormModalIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const productosPorPagina = 5
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    obtenerProductos()
  }, [])

  const obtenerProductos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        await Swal.fire({
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
        return
      }

      const respuesta = await axios.get("https://gitbf.onrender.com/api/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setProductos(respuesta.data.productos || [])
    } catch (error) {
      console.error("Error al obtener los productos:", error)
      setError("No se pudieron cargar los productos. Por favor, intenta de nuevo.")
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí o tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const abrirFormulario = (producto) => {
    setProductoSeleccionado(producto)
    setFormModalIsOpen(true)
  }

  const cerrarFormulario = () => {
    setFormModalIsOpen(false)
    setProductoSeleccionado(null)
  }

  const manejarProductoActualizado = () => {
    // console.log("Actualizando lista de productos después de crear/editar")
    obtenerProductos()
    cerrarFormulario()
  }

  const manejarEliminarProducto = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminarlo!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire({
            title: "Error",
            text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
            icon: "error",
            confirmButtonColor: "#db2777",
          })
          return
        }

        await axios.delete(`https://gitbf.onrender.com/api/productos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        obtenerProductos()
        Swal.fire({
          title: "Eliminado!",
          text: "El producto ha sido eliminado.",
          icon: "success",
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error("Error al eliminar el producto:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el producto.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  const manejarToggleEstado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const accion = nuevoEstado ? "activar" : "desactivar"

    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este producto?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Sí, ${accion}!`,
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          await Swal.fire({
            title: "Error",
            text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
            icon: "error",
            confirmButtonColor: "#db2777",
          })
          return
        }

        const productoActualizado = {
          ...productos.find((producto) => producto._id === id),
          estado: nuevoEstado,
        }

        await axios.put(`https://gitbf.onrender.com/api/productos/${id}`, productoActualizado, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Actualizar el estado local
        setProductos(
          productos.map((producto) => (producto._id === id ? { ...producto, estado: nuevoEstado } : producto)),
        )

        Swal.fire({
          icon: "success",
          title: `${nuevoEstado ? "Activado" : "Desactivado"}!`,
          text: `El producto ha sido ${nuevoEstado ? "activado" : "desactivado"}.`,
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error(`Error al ${accion} el producto:`, error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo ${accion} el producto`,
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  // Funciones de búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value)
  }

  const productosFiltrados = productos.filter((producto) =>
    producto.nombreProducto.toLowerCase().includes(busqueda.toLowerCase()),
  )

  // Funciones de paginación
  const indiceUltimoProducto = paginaActual * productosPorPagina
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina
  const productosActuales = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginasTotales = Math.ceil(productosFiltrados.length / productosPorPagina)

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1)
  }

  // Función para exportar a Excel
  const exportarExcel = async () => {
    try {
      setExportando(true)

      // Mostrar notificación de inicio de descarga
      const toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })

      toast.fire({
        icon: "info",
        title: "Preparando la descarga...",
      })

      const datosExportar = productos.map((producto) => ({
        "Nombre del Producto": producto.nombreProducto,
        Categoría: typeof producto.categoria === "object" ? producto.categoria.nombreCp : producto.categoria,
        Precio: `$${producto.precio}`,
        Stock: producto.stock,
        Estado: producto.estado ? "Activo" : "Inactivo",
      }))

      const ws = XLSX.utils.json_to_sheet(datosExportar)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Productos")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      saveAs(data, "Productos.xlsx")

      // Mostrar notificación de éxito
      toast.fire({
        icon: "success",
        title: "Archivo descargado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo exportar a Excel",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
    } finally {
      setExportando(false)
    }
  }

  // Función para imprimir
  const imprimirTabla = () => {
    const printWindow = window.open("", "_blank")

    printWindow.document.write(`
      <html>
        <head>
          <title>Listado de Productos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              color: #db2777;
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              color: #374151;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .estado {
              padding: 3px 8px;
              border-radius: 12px;
              font-weight: bold;
              font-size: 12px;
              display: inline-block;
            }
            .activo {
              background-color: #d1fae5;
              color: #065f46;
            }
            .inactivo {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <h1>Listado de Productos</h1>
          <table>
            <thead>
              <tr>
                <th>Nombre del Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${productos
                .map(
                  (producto) => `
                <tr>
                  <td>${producto.nombreProducto}</td>
                  <td>${typeof producto.categoria === "object" ? producto.categoria.nombreCp : producto.categoria}</td>
                  <td>$${producto.precio}</td>
                  <td>${producto.stock}</td>
                  <td>
                    <span class="estado ${producto.estado ? "activo" : "inactivo"}">
                      ${producto.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Fecha de impresión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p>Sistema de Gestión - Belleza Spa</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    // Esperar a que los estilos se carguen
    setTimeout(() => {
      printWindow.print()
      // printWindow.close()
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[64vh] ">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerProductos()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    // Eliminado transition-all duration-500 para evitar transiciones globales
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-foreground px-4 pt-4">Gestión de Productos</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-add"
            onClick={() => {
              setFormModalIsOpen(true)
              setProductoSeleccionado(null)
            }}
            title="Agregar nuevo producto"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nuevo Producto
          </button>
          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando || productos.length === 0}
            title="Exportar a Excel"
          >
            {exportando ? (
              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
            )}
            Exportar
          </button>
          <button
            className="btn-secondary"
            onClick={imprimirTabla}
            disabled={productos.length === 0}
            title="Imprimir listado"
          >
            <FontAwesomeIcon icon={faPrint} className="mr-2" />
            Imprimir
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={handleBusquedaChange}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar productos..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-4 mx-auto">
        <table className="universal-tabla-moderna w-full">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              {/* Cambiado dark:hover:bg-gray-500/50 por dark:bg-gray-500/50 para evitar efectos hover */}
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Nombre del Producto
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Categoría
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Precio
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Stock
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Estado
              </th>
              <th className="dark:bg-gray-500/50" style={{ width: "15%" }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80">
            {productosActuales.length > 0 ? (
              productosActuales.map((producto) => (
                <tr key={producto._id} className="text-foreground">
                  <td className="font-medium">{producto.nombreProducto}</td>
                  <td>{typeof producto.categoria === "object" ? producto.categoria.nombreCp : producto.categoria}</td>
                  <td>${producto.precio}</td>
                  <td>{producto.stock}</td>
                  <td>
                    <span
                      className={`universal-estado-badge ${
                        producto.estado ? "activo bg-emerald-300/70 dark:bg-emerald-500" : "inactivo bg-red-500/80"
                      }`}
                    >
                      {producto.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    {/* Modificado para usar clases similares a TablaPermisos */}
                    <div className="flex justify-center space-x-2">
                      <button
                        className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90"
                        onClick={() => abrirFormulario(producto)}
                        title="Editar producto"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete-1 dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminarProducto(producto._id)}
                        title="Eliminar producto"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <button
                        className={`btn-toggle-1
                                              ${
                                                producto.estado
                                                  ? "bg-emerald-400/70  dark:bg-emerald-700 "
                                                  : "bg-amber-400/70 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
                                              }`}
                        onClick={() => manejarToggleEstado(producto._id, producto.estado)}
                        title={producto.estado ? "Desactivar usuario" : "Activar usuario"}
                      >
                        <FontAwesomeIcon
                          icon={producto.estado ? faToggleOn : faToggleOff}
                          className="text-white text-xl"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No se encontraron productos con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {productos.length > 0 && (
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
                className={`pagination-number ${paginaActual === index + 1 ? "active" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={paginaSiguiente}
            disabled={paginaActual === paginasTotales}
            className={`pagination-btn ${paginaActual === paginasTotales ? "disabled" : ""}`}
          >
            &gt;
          </button>
        </div>
      )}

      {/* Modal para agregar/editar producto */}
      <Modal
        isOpen={formModalIsOpen}
        onRequestClose={cerrarFormulario}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={cerrarFormulario}
          >
            &times;
          </button>
          <h2 className="text-2xl font-semibold mb-4 text-center text-pink-600">
            {productoSeleccionado ? "Actualizar Producto" : "Nuevo Producto"}
          </h2>
          <FormularioProducto
            producto={productoSeleccionado}
            onClose={cerrarFormulario}
            onProductoActualizado={manejarProductoActualizado}
          />
        </div>
      </Modal>
    </div>
  )
}

export default TablaProductos
