import { useEffect, useState } from "react"
import axios from "axios"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileExcel, faSync, faSearch } from "@fortawesome/free-solid-svg-icons"
// import "./TablaBajaInsumo.css"
import "../../styles/tablas.css"

const TablaBajaInsumo = () => {
  const [bajas, setBajas] = useState([])
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const bajasPorPagina = 5

  const obtenerBajasProductos = async () => {
    setCargando(true)
    setError(null)
    try {
      console.log("Obteniendo bajas de productos...")
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

      const response = await axios.get("https://gitbf.onrender.com/api/baja-productos", {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Extraer el array 'bajas' de la respuesta
      const bajasData = response.data && response.data.bajas ? response.data.bajas : []
      
      console.log("Datos recibidos:", response.data)
      console.log("Array de bajas extraído:", bajasData)

      setBajas(bajasData)
    } catch (error) {
      console.error("Error completo:", error)
      setError(error)

      if (error.response) {
        Swal.fire({
          title: "Error",
          text: `Error ${error.response.status}: ${error.response.data.message || "No se pudieron cargar las bajas de productos"}`,
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      } else if (error.request) {
        Swal.fire({
          title: "Error",
          text: "No se pudo conectar con el servidor",
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      } else {
        Swal.fire({
          title: "Error",
          text: `Error: ${error.message}`,
          icon: "error",
          confirmButtonColor: "#db2777",
        })
      }
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    obtenerBajasProductos()
  }, [])

  // Filtrar bajas según la búsqueda
  const bajasFiltradas = bajas.filter(
    (baja) =>
      baja.producto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      baja.observaciones?.toLowerCase().includes(busqueda.toLowerCase()),
  )

  // Paginación
  const indiceUltimaBaja = paginaActual * bajasPorPagina
  const indicePrimeraBaja = indiceUltimaBaja - bajasPorPagina
  const bajasActuales = bajasFiltradas.slice(indicePrimeraBaja, indiceUltimaBaja)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginasTotales = Math.ceil(bajasFiltradas.length / bajasPorPagina)

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1)
  }

  // Función para exportar a Excel
  const exportarExcel = async () => {
    if (bajasFiltradas.length === 0) {
      Swal.fire({
        title: "Error",
        text: "No hay datos para exportar",
        icon: "error",
        confirmButtonColor: "#db2777",
      })
      return
    }

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

      const datosExportar = bajasFiltradas.map((baja) => ({
        Insumo: baja.producto,
        "Fecha de Baja": new Date(baja.fechaBaja).toLocaleDateString(),
        Cantidad: baja.cantidad,
        Observaciones: baja.observaciones,
      }))

      const ws = XLSX.utils.json_to_sheet(datosExportar)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Bajas de Insumos")

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      saveAs(data, "BajasInsumos.xlsx")

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

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando bajas de insumos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">No se pudieron cargar las bajas de insumos</span>
        </div>
        <button
          className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded flex items-center"
          onClick={() => obtenerBajasProductos()}
        >
          <FontAwesomeIcon icon={faSync} className="mr-2" />
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="content">
      <h2 className="text-3xl font-semibold mb-6 text-foreground px-4 pt-4">Bajas de Insumos</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 px-4">
        <div className="flex space-x-2">
          <button
            className="btn-export"
            onClick={exportarExcel}
            disabled={exportando || bajasFiltradas.length === 0}
            title="Exportar a Excel"
          >
            {exportando ? (
              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
            ) : (
              <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
            )}
            Exportar
          </button>
        </div>

        <div className="universal-search-container">
          <FontAwesomeIcon icon={faSearch} className="universal-search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="universal-search-input dark:card-gradient-4"
            placeholder="Buscar bajas..."
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow mx-4 mx-auto">
        <table className="universal-tabla-moderna w-full">
          <thead className="bg-pink-200 text-black dark:card-gradient-4">
            <tr className="text-foreground">
              <th className="dark:hover:bg-gray-500/50" style={{ width: "25%" }}>Insumo</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "25%" }}>Fecha de Baja</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "25%" }}>Cantidad</th>
              <th className="dark:hover:bg-gray-500/50" style={{ width: "25%" }}>Observaciones</th>
            </tr>
          </thead>
          <tbody className="dark:bg-zinc-900/80">
            {bajasActuales.length > 0 ? (
              bajasActuales.map((baja) => (
                <tr key={baja._id} className="dark:hover:bg-gray-500/50 text-foreground">
                  <td className="font-medium">{baja.producto}</td>
                  <td>{new Date(baja.fechaBaja).toLocaleDateString()}</td>
                  <td>{baja.cantidad}</td>
                  <td>{baja.observaciones}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No hay bajas de insumos registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {bajasFiltradas.length > 0 && (
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
    </div>
  )
}

export default TablaBajaInsumo