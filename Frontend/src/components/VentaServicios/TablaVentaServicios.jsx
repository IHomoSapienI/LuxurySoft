"use client"

import { useState, useEffect } from "react"
import FormularioVentaServicio from "./FormularioVentaServicio"
import { useLocation } from "react-router-dom"
import Modal from "react-modal"
import axios from "axios"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faEdit, faTrash, faInfoCircle, faSearch } from "@fortawesome/free-solid-svg-icons"
import "./tablaVentaServicio.css"

Modal.setAppElement("#root")

const TablaVentaServicios = () => {
  const [ventas, setVentas] = useState([])
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)
  const [detallesCita, setDetallesCita] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const ventasPorPagina = 5
  const [busqueda, setBusqueda] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const location = useLocation()

  const fetchVentas = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("https://gitbf.onrender.com/api/ventaservicios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setVentas(response.data.ventaservicios || [])
    } catch (error) {
      console.error("Error al obtener las ventas:", error)
      Swal.fire("Error", "No tienes permiso para estar aqui :) post: tu token no es válido", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVentas()
  }, [])

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const manejarCancelar = () => {
    setVentaSeleccionada(null)
    setModalAbierto(false)
  }

  const manejarAgregarOActualizar = async (ventaData, ventaId) => {
    setIsProcessing(true)
    try {
      const token = localStorage.getItem("token")
      let response
      if (ventaId) {
        response = await axios.put(`https://gitbf.onrender.com/api/ventaservicios/${ventaId}`, ventaData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        await Swal.fire("Actualizado!", "La venta ha sido actualizada.", "success")
      } else {
        response = await axios.post("https://gitbf.onrender.com/api/ventaservicios", ventaData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        await Swal.fire("Agregado!", "La venta ha sido agregada.", "success")
      }

      await fetchVentas()
      setModalAbierto(false)
    } catch (error) {
      console.error("Error al agregar o actualizar la venta:", error)
      await Swal.fire("Error!", "Hubo un problema al guardar la venta.", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  const manejarEliminarVenta = async (idVenta) => {
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
      setIsProcessing(true)
      try {
        const token = localStorage.getItem("token")
        await axios.delete(`https://gitbf.onrender.com/api/ventaservicios/${idVenta}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        await fetchVentas()
        Swal.fire("Eliminado!", "La venta ha sido eliminada.", "success")
      } catch (error) {
        console.error("Error al eliminar la venta:", error)
        Swal.fire("Error!", "Hubo un problema al eliminar la venta.", "error")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const mostrarDetallesCita = (venta) => {
    setDetallesCita(venta)
    setModalDetallesAbierto(true)
  }

  const indiceUltimaVenta = paginaActual * ventasPorPagina
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina
  const ventasActuales = ventas.slice(indicePrimeraVenta, indiceUltimaVenta)
  const paginasTotales = Math.ceil(ventas.length / ventasPorPagina)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const paginaSiguiente = () => {
    if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1)
  }

  const ventasFiltradas = ventasActuales.filter(
    (venta) =>
      venta.cliente?.nombrecliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      venta.cliente?.apellidocliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      venta.cliente?.correocliente.toLowerCase().includes(busqueda.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tabla-container">
      <h2 className="text-3xl font-semibold mb-8 text-gray-800">Gestión de Ventas de Servicio</h2>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <button
          className="btn-add"
          onClick={() => {
            setVentaSeleccionada(null)
            setModalAbierto(true)
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="spinner"></span>
          ) : (
            <>
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nueva Venta
            </>
          )}
        </button>

        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
            placeholder="Buscar por cliente (nombre, apellido o correo)"
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="tabla-moderna w-full">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.slice((paginaActual - 1) * ventasPorPagina, paginaActual * ventasPorPagina).map((venta) => (
              <tr key={venta._id}>
                <td>{venta.codigoVenta || venta._id.substring(0, 8)}</td>
                <td className="font-medium">
                  {venta.cliente?.nombrecliente} {venta.cliente?.apellidocliente}
                </td>
                <td>{venta.cliente?.correocliente}</td>
                <td>{formatearFechaHora(venta.fecha)}</td>
                <td>${venta.precioTotal.toFixed(2)}</td>
                <td>
                  <span className={`estado-badge ${venta.estado ? "activo" : "inactivo"}`}>
                    {venta.estado ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-center space-x-1">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setVentaSeleccionada(venta)
                        setModalAbierto(true)
                      }}
                      title="Editar venta"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => manejarEliminarVenta(venta._id)}
                      title="Eliminar venta"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button className="btn-info" onClick={() => mostrarDetallesCita(venta)} title="Ver detalles">
                      <FontAwesomeIcon icon={faInfoCircle} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginasTotales > 1 && (
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

      {/* Modal para agregar/editar venta */}
      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={() => setModalAbierto(false)}
          >
            &times;
          </button>
          <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
            {ventaSeleccionada ? "Editar Venta" : "Agregar Nueva Venta"}
          </h2>
          <FormularioVentaServicio
            venta={ventaSeleccionada}
            onGuardar={manejarAgregarOActualizar}
            onCancelar={() => setModalAbierto(false)}
          />
        </div>
      </Modal>

      {/* Modal para mostrar detalles */}
      <Modal
        isOpen={modalDetallesAbierto}
        onRequestClose={() => setModalDetallesAbierto(false)}
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <div className="relative">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
            onClick={() => setModalDetallesAbierto(false)}
          >
            &times;
          </button>
          <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">Detalles de la Venta</h2>
          {detallesCita && (
            <div className="space-y-4 p-4">
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Código Venta:</p>
                <p className="text-lg font-semibold">{detallesCita.codigoVenta || detallesCita._id}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Cliente:</p>
                <p className="text-base">
                  {detallesCita.cliente.nombrecliente} {detallesCita.cliente.apellidocliente}
                </p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Email:</p>
                <p className="text-base">{detallesCita.cliente?.correocliente || "Email no disponible"}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Celular:</p>
                <p className="text-base">{detallesCita.cliente?.celularcliente || "Celular no disponible"}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Fecha y Hora de Venta:</p>
                <p className="text-base">{formatearFechaHora(detallesCita.fecha)}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Fecha y Hora de Cita:</p>
                <p className="text-base">
                  {detallesCita.cita && detallesCita.cita.fechacita
                    ? formatearFechaHora(detallesCita.cita.fechacita)
                    : "Fecha de cita no disponible"}
                </p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Empleado:</p>
                <p className="text-base">{detallesCita.empleado?.nombreempleado || "Empleado no disponible"}</p>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Servicios:</p>
                <table className="tabla-servicios mt-2">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th className="text-right">Precio</th>
                      <th className="text-right">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesCita.servicios.map((servicio) => (
                      <tr key={servicio._id}>
                        <td>{servicio.nombreServicio}</td>
                        <td className="text-right">${servicio.precio.toFixed(2)}</td>
                        <td className="text-right">{servicio.tiempo} min</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="text-right">${detallesCita.precioTotal.toFixed(2)}</td>
                      <td className="text-right">
                        {detallesCita.servicios.reduce((total, servicio) => total + servicio.tiempo, 0)} min
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="form-group">
                <p className="text-sm font-medium text-gray-500">Estado:</p>
                <span className={`estado-badge ${detallesCita.estado ? "activo" : "inactivo"}`}>
                  {detallesCita.estado ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <button onClick={() => setModalDetallesAbierto(false)} className="btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TablaVentaServicios

