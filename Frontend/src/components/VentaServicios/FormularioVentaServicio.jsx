"use client"

import { useState, useEffect, useMemo } from "react"
import "./formularioVentaServicio.css"

const FormularioVentaServicio = ({ venta, onGuardar, onCancelar }) => {
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [citas, setCitas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [clienteId, setClienteId] = useState("")
  const [clienteEmail, setClienteEmail] = useState("")
  const [clienteApellido, setClienteApellido] = useState("")
  const [clienteCelular, setClienteCelular] = useState("")
  const [nuevoServicio, setNuevoServicio] = useState({ id: "", nombre: "" })
  const [estado, setEstado] = useState(true)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [fecha, setFecha] = useState(new Date().toLocaleString())
  const [ventaId, setVentaId] = useState("")
  const [citaId, setCitaId] = useState("")
  const [empleadoId, setEmpleadoId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch data from APIs with Token
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")

      const [clientesResponse, serviciosResponse, citasResponse, empleadosResponse] = await Promise.all([
        fetch("https://gitbf.onrender.com/api/clientes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("https://gitbf.onrender.com/api/servicios", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("https://gitbf.onrender.com/api/citas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("https://gitbf.onrender.com/api/empleados", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      if (!clientesResponse.ok || !serviciosResponse.ok || !citasResponse.ok || !empleadosResponse.ok) {
        throw new Error("Error en una o más solicitudes")
      }

      const [clientesData, serviciosData, citasData, empleadosData] = await Promise.all([
        clientesResponse.json(),
        serviciosResponse.json(),
        citasResponse.json(),
        empleadosResponse.json(),
      ])

      setClientes(clientesData)
      setServicios(serviciosData.servicios || [])
      setCitas(citasData.citas || [])
      setEmpleados(empleadosData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Error al cargar los datos. Por favor, intente de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (venta) {
      setClienteId(venta.cliente?._id || "")
      setServiciosSeleccionados(
        venta.servicios.map((servicio) => ({
          _id: servicio.servicio?._id || servicio._id,
          nombreServicio: servicio.nombreServicio || "",
          precio: servicio.precio || 0,
          tiempo: servicio.tiempo || 0,
        })),
      )
      setEstado(venta.estado || true)
      setVentaId(venta._id || "")
      setCitaId(venta.cita?._id || "")
      setFecha(venta.cita ? new Date(venta.cita.fechacita).toLocaleString() : "")
      setEmpleadoId(venta.empleado?._id || "")
    }
  }, [venta])

  useEffect(() => {
    const clienteSeleccionado = clientes.find((cliente) => cliente._id === clienteId)
    if (clienteSeleccionado) {
      setClienteEmail(clienteSeleccionado.correocliente || "")
      setClienteApellido(clienteSeleccionado.apellidocliente || "")
      setClienteCelular(clienteSeleccionado.celularcliente || "")
    } else {
      setClienteEmail("")
      setClienteApellido("")
      setClienteCelular("")
    }
  }, [clienteId, clientes])

  const precioTotal = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => total + servicio.precio, 0)
  }, [serviciosSeleccionados])

  const totalTiempo = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => total + servicio.tiempo, 0)
  }, [serviciosSeleccionados])

  const agregarServicio = () => {
    if (nuevoServicio.id) {
      const servicioSeleccionado = servicios.find((serv) => serv._id === nuevoServicio.id)
      if (servicioSeleccionado && !serviciosSeleccionados.some((serv) => serv._id === servicioSeleccionado._id)) {
        setServiciosSeleccionados((prev) => [
          ...prev,
          {
            _id: servicioSeleccionado._id,
            nombreServicio: servicioSeleccionado.nombreServicio,
            precio: servicioSeleccionado.precio,
            tiempo: servicioSeleccionado.tiempo,
          },
        ])
        setNuevoServicio({ id: "", nombre: "" })
      } else {
        alert("Este servicio ya fue agregado o no existe.")
      }
    } else {
      alert("Debes seleccionar un servicio antes de agregar.")
    }
  }

  const eliminarServicio = (id) => {
    setServiciosSeleccionados((prev) => prev.filter((servicio) => servicio._id !== id))
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    if (!clienteId || !citaId || !empleadoId || serviciosSeleccionados.length === 0 || precioTotal <= 0) {
      alert("Por favor, complete todos los campos requeridos.")
      return
    }

    const ventaData = {
      cliente: clienteId,
      cita: citaId,
      empleado: empleadoId,
      servicios: serviciosSeleccionados.map((servicio) => ({
        servicio: servicio._id,
        nombreServicio: servicio.nombreServicio,
        precio: servicio.precio,
        tiempo: servicio.tiempo,
      })),
      precioTotal,
      estado,
    }

    setIsLoading(true)
    try {
      await onGuardar(ventaData, ventaId)
    } catch (error) {
      console.error("Error al guardar la venta:", error)
      alert(`Error al guardar la venta: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    )
  if (error) return <div>Error: {error}</div>

  return (
    <div className="formulario-moderno">
      <form onSubmit={manejarSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">
          {venta ? "Editar Venta de Servicio" : "Agregar Venta de Servicio"}
        </h2>

        {ventaId && (
          <div className="form-group">
            <label htmlFor="ventaId" className="form-label">
              ID de la Venta
            </label>
            <input id="ventaId" value={ventaId} readOnly className="form-input bg-gray-100" />
          </div>
        )}

        {venta && venta.codigoVenta && (
          <div className="form-group">
            <label htmlFor="codigoVenta" className="form-label">
              Código de Venta
            </label>
            <input id="codigoVenta" value={venta.codigoVenta} readOnly className="form-input bg-gray-100" />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="fecha" className="form-label">
            Fecha de Venta
          </label>
          <input id="fecha" value={fecha} readOnly className="form-input bg-gray-100" />
        </div>

        <div className="form-group">
          <label htmlFor="cliente" className="form-label">
            Cliente <span className="text-pink-500">*</span>
          </label>
          <select
            id="cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente._id} value={cliente._id}>
                {cliente.nombrecliente} {cliente.apellidocliente} - {cliente.correocliente}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email del Cliente
          </label>
          <input id="email" value={clienteEmail} readOnly className="form-input bg-gray-100" />
        </div>

        <div className="form-group">
          <label htmlFor="apellido" className="form-label">
            Apellido del Cliente
          </label>
          <input id="apellido" value={clienteApellido} readOnly className="form-input bg-gray-100" />
        </div>

        <div className="form-group">
          <label htmlFor="celular" className="form-label">
            Celular del Cliente
          </label>
          <input id="celular" value={clienteCelular} readOnly className="form-input bg-gray-100" />
        </div>

        <div className="form-group">
          <label htmlFor="cita" className="form-label">
            Cita <span className="text-pink-500">*</span>
          </label>
          <select id="cita" value={citaId} onChange={(e) => setCitaId(e.target.value)} className="form-select" required>
            <option value="">Selecciona una cita</option>
            {citas.map((cita) => (
              <option key={cita._id} value={cita._id}>
                {new Date(cita.fechacita).toLocaleString()} - {cita.descripcion}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="empleado" className="form-label">
            Empleado <span className="text-pink-500">*</span>
          </label>
          <select
            id="empleado"
            value={empleadoId}
            onChange={(e) => setEmpleadoId(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Selecciona un empleado</option>
            {empleados.map((empleado) => (
              <option key={empleado._id} value={empleado._id}>
                {empleado.nombreempleado}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="servicio" className="form-label">
            Servicios <span className="text-pink-500">*</span>
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <select
              id="servicio"
              value={nuevoServicio.id}
              onChange={(e) =>
                setNuevoServicio({
                  id: e.target.value,
                  nombre: servicios.find((s) => s._id === e.target.value)?.nombreServicio || "",
                })
              }
              className="form-select md:flex-grow"
            >
              <option value="">Selecciona un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio._id} value={servicio._id}>
                  {servicio.nombreServicio} - ${servicio.precio} ({servicio.tiempo} min)
                </option>
              ))}
            </select>
            <button type="button" onClick={agregarServicio} className="btn-add">
              Agregar Servicio
            </button>
          </div>
        </div>

        <div className="form-group">
          <h3 className="text-lg font-semibold mb-2">Servicios Agregados</h3>
          {serviciosSeleccionados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="tabla-servicios">
                <thead>
                  <tr>
                    <th>Nombre del Servicio</th>
                    <th className="text-right">Precio</th>
                    <th className="text-right">Tiempo (mins)</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {serviciosSeleccionados.map((servicio) => (
                    <tr key={servicio._id}>
                      <td>{servicio.nombreServicio}</td>
                      <td className="text-right">${servicio.precio.toFixed(2)}</td>
                      <td className="text-right">{servicio.tiempo}</td>
                      <td className="text-center">
                        <button type="button" onClick={() => eliminarServicio(servicio._id)} className="btn-danger">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="text-right">${precioTotal.toFixed(2)}</td>
                    <td className="text-right">{totalTiempo} mins</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay servicios seleccionados</p>
          )}
        </div>

        <div className="resumen-venta">
          <h3 className="text-lg font-semibold">Resumen de la Venta</h3>
          <p>
            <strong>Total Precio:</strong> ${precioTotal.toFixed(2)}
          </p>
          <p>
            <strong>Total Tiempo:</strong> {totalTiempo} mins
          </p>
          <div className="checkbox-container">
            <input type="checkbox" id="estado" checked={estado} onChange={(e) => setEstado(e.target.checked)} />
            <label htmlFor="estado">Estado</label>
          </div>
        </div>

        <div className="btn-container">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Guardando...</span>
              </>
            ) : (
              "Guardar Venta"
            )}
          </button>
          <button type="button" onClick={onCancelar} className="btn-secondary" disabled={isLoading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormularioVentaServicio

