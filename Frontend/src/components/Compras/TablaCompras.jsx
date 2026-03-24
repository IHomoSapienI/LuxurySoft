import { useState, useEffect } from "react"
import axios from "axios"
import Modal from "react-modal"
import FormularioCompra from "./FormularioCompra"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faFileExcel,
  faSearch,
  faSync,
  faPrint,
} from "@fortawesome/free-solid-svg-icons"
import Swal from "sweetalert2"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
// import "../Compras/tablaCompras.css"
import "../../styles/tablas.css" 


// Configura el contenedor del modal
Modal.setAppElement("#root")

const TablaCompras = () => {
  const [compras, setCompras] = useState([])
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [formModalIsOpen, setFormModalIsOpen] = useState(false)
  const [detallesModalIsOpen, setDetallesModalIsOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const comprasPorPagina = 5
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    obtenerCompras()
  }, [])

  const obtenerCompras = async () => {
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

      const respuesta = await axios.get("https://gitbf.onrender.com/api/compras", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Asegurarse de que compras sea siempre un array
      setCompras(Array.isArray(respuesta.data) ? respuesta.data : [])
    } catch (error) {
      console.error("Error al obtener las compras:", error)
      setError("No se pudieron cargar las compras. Por favor, intenta de nuevo.")
      Swal.fire({
        title: "Error",
        text: "No tienes permiso para estar aquí o tu token no es válido.",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
      // Inicializar con array vacío en caso de error
      setCompras([])
    } finally {
      setIsLoading(false)
    }
  }

  const abrirFormulario = (compra) => {
    setCompraSeleccionada(compra)
    setFormModalIsOpen(true)
  }

  const cerrarFormulario = () => {
    setFormModalIsOpen(false)
    setCompraSeleccionada(null)
  }

  const abrirDetalles = (compra) => {
    setCompraSeleccionada(compra)
    setDetallesModalIsOpen(true)
  }

  const cerrarDetalles = () => {
    setDetallesModalIsOpen(false)
    setCompraSeleccionada(null)
  }

  const manejarCompraActualizada = () => {
    obtenerCompras()
    cerrarFormulario()
  }

  const manejarEliminarCompra = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminarla!",
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

        await axios.delete(`https://gitbf.onrender.com/api/compras/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        obtenerCompras()
        Swal.fire({
          title: "Eliminado!",
          text: "La compra ha sido eliminada.",
          icon: "success",
          confirmButtonColor: "#db2777",
        })
      } catch (error) {
        console.error("Error al eliminar la compra:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la compra.",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      }
    }
  }

  // Funciones de búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value)
  }

  const comprasFiltradas = compras.filter(
    (compra) =>
      compra.proveedor?.nombreProveedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      compra.recibo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      new Date(compra.fechaCompra).toLocaleDateString().includes(busqueda) ||
      compra.monto.toString().includes(busqueda),
  )

  // Funciones de paginación
  const indiceUltimaCompra = paginaActual * comprasPorPagina
  const indicePrimeraCompra = indiceUltimaCompra - comprasPorPagina
  const comprasActuales = comprasFiltradas.slice(indicePrimeraCompra, indiceUltimaCompra)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginasTotales = Math.ceil(comprasFiltradas.length / comprasPorPagina)

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

      const datosExportar = compras.map((compra) => ({
        Proveedor: compra.proveedor?.nombreProveedor || "N/A",
        Recibo: compra.recibo || "N/A",
        "Fecha de Compra": new Date(compra.fechaCompra).toLocaleDateString(),
        "Fecha de Registro": new Date(compra.fechaRegistro).toLocaleDateString(),
        "Monto Total": `$${compra.monto.toFixed(2)}`,
        "Cantidad de Insumos": compra.insumos ? compra.insumos.length : 0,
      }))

      const ws = XLSX.utils.json_to_sheet(datosExportar)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Compras")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      saveAs(data, "Compras.xlsx")

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
          <title>Listado de Compras</title>
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
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <h1>Listado de Compras</h1>
          <table>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Recibo</th>
                <th>Fecha de Compra</th>
                <th>Fecha de Registro</th>
                <th>Monto Total</th>
                <th>Cantidad de Insumos</th>
              </tr>
            </thead>
            <tbody>
              ${compras.map(
                (compra) => `
                <tr>
                  <td>${compra.proveedor?.nombreProveedor || "N/A"}</td>
                  <td>${compra.recibo || "N/A"}</td>
                  <td>${new Date(compra.fechaCompra).toLocaleDateString()}</td>
                  <td>${new Date(compra.fechaRegistro).toLocaleDateString()}</td>
                  <td>$${compra.monto.toFixed(2)}</td>
                  <td>${compra.insumos ? compra.insumos.length : 0}</td>
                </tr>
              `,
              ).join("")}
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
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando compras...</p>
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
          onClick={() => obtenerCompras()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-foreground px-4 pt-4">Gestión de Compras</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-add"
            onClick={() => {
              setFormModalIsOpen(true)
              setCompraSeleccionada(null)
            }}
            title="Agregar nueva compra"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Compra
          </button>
          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando || compras.length === 0}
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
            disabled={compras.length === 0}
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
            placeholder="Buscar compras..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-4 mx-auto">
        <table className="universal-tabla-moderna w-full ">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th className="dark:hover:bg-gray-500/50" style={{ width: "15%" }}>Proveedor</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "15%" }}>Recibo</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "15%" }}>Fecha Compra</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "15%" }}>Fecha Registro</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "10%" }}>Monto</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "10%" }}>Insumos</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "20%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80">
            {comprasActuales.length > 0 ? (
              comprasActuales.map((compra) => (
                <tr key={compra._id} className="dark:hover:bg-gray-500/50 text-foreground">
                  <td className="font-medium">{compra.proveedor ? compra.proveedor.nombreProveedor : "N/A"}</td>
                  <td>{compra.recibo}</td>
                  <td>{new Date(compra.fechaCompra).toLocaleDateString()}</td>
                  <td>{new Date(compra.fechaRegistro).toLocaleDateString()}</td>
                  <td>${compra.monto !== undefined && compra.monto !== null ? compra.monto.toFixed(2) : "0.00"}</td>
                  <td>{compra.insumos ? compra.insumos.length : 0} insumos</td>
                  <td>
                    <div className="flex space-x-2 center">
                      <button className="btn-edit-1 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/90" onClick={() => abrirFormulario(compra)} title="Editar compra">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className="btn-info-1" onClick={() => abrirDetalles(compra)} title="Ver detalles">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        className="btn-delete-1  dark:bg-rose-950/100 dark:hover:bg-rose-800/90"
                        onClick={() => manejarEliminarCompra(compra._id)}
                        title="Eliminar compra"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No se encontraron compras con ese criterio de búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {compras.length > 0 && (
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

      {/* Modal para agregar/editar compra */}
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
            {compraSeleccionada ? "Actualizar Compra" : "Nueva Compra"}
          </h2>
            <FormularioCompra
              compra={compraSeleccionada}
              onClose={cerrarFormulario}
              onSuccess={manejarCompraActualizada}
            />
          
        </div>
      </Modal>

      {/* Modal para ver detalles de compra */}
      <Modal
        isOpen={detallesModalIsOpen}
        onRequestClose={cerrarDetalles}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl" onClick={cerrarDetalles}>
            &times;
          </button>
          <h2 className="text-2xl font-semibold mb-4 text-center text-pink-600">Detalles de la Compra</h2>

          {compraSeleccionada ? (
            <div className="p-4 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ">
                <div className="form-group">
                  <p className="text-sm font-medium text-gray-500">Proveedor:</p>
                  <p className="text-base font-semibold">{compraSeleccionada?.proveedor?.nombreProveedor || "N/A"}</p>
                </div>
                <div className="form-group">
                  <p className="text-sm font-medium text-gray-500">Recibo:</p>
                  <p className="text-base">{compraSeleccionada?.recibo || "N/A"}</p>
                </div>
                <div className="form-group">
                  <p className="text-sm font-medium text-gray-500">Fecha de Compra:</p>
                  <p className="text-base">
                    {compraSeleccionada?.fechaCompra
                      ? new Date(compraSeleccionada.fechaCompra).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="form-group">
                  <p className="text-sm font-medium text-gray-500">Fecha de Registro:</p>
                  <p className="text-base">
                    {compraSeleccionada?.fechaRegistro
                      ? new Date(compraSeleccionada.fechaRegistro).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="form-group col-span-1 md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Monto Total:</p>
                  <p className="text-xl font-bold text-pink-600">${compraSeleccionada.monto.toFixed(2)}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-3 border-b pb-2">Insumos:</h3>
              <div className="overflow-x-auto">
                <table className="tabla-moderna w-full">
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(compraSeleccionada?.insumos) && compraSeleccionada.insumos.length > 0 ? (
                      compraSeleccionada.insumos.map((insumo, index) => (
                        <tr key={index}>
                          <td className="font-medium">{insumo?.insumo?.nombreInsumo || "N/A"}</td>
                          <td>{insumo?.cantidad || 0}</td>
                          <td>${insumo.insumo.precio.toFixed(2)}</td>
                          <td>${(insumo.cantidad * insumo.insumo.precio).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4 text-gray-500">
                          No hay insumos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 p-4">No hay datos disponibles.</p>
          )}

          <div className="flex justify-end mt-4 p-4">
            <button className="btn-secondary" onClick={cerrarDetalles}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TablaCompras