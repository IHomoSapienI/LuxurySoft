import { useState, useEffect, useMemo } from "react"
import "./formularioVentaServicio.css"

const FormularioVenta = ({ venta, onGuardar, onCancelar }) => {
  const [clientes, setClientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [productos, setProductos] = useState([])
  const [citas, setCitas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [clienteId, setClienteId] = useState("")
  const [clienteEmail, setClienteEmail] = useState("")
  const [clienteApellido, setClienteApellido] = useState("")
  const [clienteCelular, setClienteCelular] = useState("")
  const [nuevoServicio, setNuevoServicio] = useState({ id: "", nombre: "" })
  const [nuevoProducto, setNuevoProducto] = useState({ id: "", nombre: "", cantidad: 1 })
  const [estado, setEstado] = useState(true)
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [productosSeleccionados, setProductosSeleccionados] = useState([])
  const [fecha, setFecha] = useState(new Date().toLocaleString())
  const [ventaId, setVentaId] = useState("")
  const [citaId, setCitaId] = useState("")
  const [empleadoId, setEmpleadoId] = useState("")
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [observaciones, setObservaciones] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("productos") // productos, servicios

  // Fetch data from APIs with Token
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")

      const [clientesResponse, serviciosResponse, citasResponse, empleadosResponse, productosResponse] =
        await Promise.all([
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
          fetch("https://gitbf.onrender.com/api/productos", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

      if (
        !clientesResponse.ok ||
        !serviciosResponse.ok ||
        !citasResponse.ok ||
        !empleadosResponse.ok ||
        !productosResponse.ok
      ) {
        throw new Error("Error en una o más solicitudes")
      }

      const [clientesData, serviciosData, citasData, empleadosData, productosData] = await Promise.all([
        clientesResponse.json(),
        serviciosResponse.json(),
        citasResponse.json(),
        empleadosResponse.json(),
        productosResponse.json(),
      ])

      setClientes(clientesData)
      setServicios(serviciosData.servicios || [])
      setCitas(citasData.citas || [])
      setEmpleados(empleadosData)
      setProductos(productosData.productos || [])
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

      // Cargar servicios seleccionados
      if (venta.servicios && venta.servicios.length > 0) {
        setServiciosSeleccionados(
          venta.servicios.map((servicio) => ({
            _id: servicio.servicio?._id || servicio.servicio,
            nombreServicio: servicio.nombreServicio || "",
            precio: servicio.precio || 0,
            tiempo: servicio.tiempo || 0,
          })),
        )
      }

      // Cargar productos seleccionados
      if (venta.productos && venta.productos.length > 0) {
        setProductosSeleccionados(
          venta.productos.map((producto) => ({
            _id: producto.producto?._id || producto.producto,
            nombreProducto: producto.nombreProducto || "",
            precio: producto.precio || 0,
            cantidad: producto.cantidad || 1,
            subtotal: producto.subtotal || producto.precio * producto.cantidad,
          })),
        )
      }

      setEstado(venta.estado || true)
      setVentaId(venta._id || "")
      setCitaId(venta.cita?._id || "")
      setFecha(venta.fechaCreacion ? new Date(venta.fechaCreacion).toLocaleString() : new Date().toLocaleString())
      setEmpleadoId(venta.empleado?._id || "")
      setMetodoPago(venta.metodoPago || "Efectivo")
      setObservaciones(venta.observaciones || "")

      // Determinar la pestaña activa inicial según el contenido de la venta
      if (venta.productos && venta.productos.length > 0) {
        setActiveTab("productos")
      } else if (venta.servicios && venta.servicios.length > 0) {
        setActiveTab("servicios")
      }
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

  // Calcular subtotales y totales
  const subtotalProductos = useMemo(() => {
    return productosSeleccionados.reduce((total, producto) => total + producto.subtotal, 0)
  }, [productosSeleccionados])

  const subtotalServicios = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => total + servicio.precio, 0)
  }, [serviciosSeleccionados])

  const totalGeneral = useMemo(() => {
    return subtotalProductos + subtotalServicios
  }, [subtotalProductos, subtotalServicios])

  const totalTiempo = useMemo(() => {
    return serviciosSeleccionados.reduce((total, servicio) => total + servicio.tiempo, 0)
  }, [serviciosSeleccionados])

  // Agregar un servicio
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

  // Agregar un producto
  const agregarProducto = () => {
    if (nuevoProducto.id && nuevoProducto.cantidad > 0) {
      const productoSeleccionado = productos.find((prod) => prod._id === nuevoProducto.id)
      if (productoSeleccionado) {
        // Verificar si hay suficiente stock
        if (productoSeleccionado.stock < nuevoProducto.cantidad) {
          alert(`Stock insuficiente. Disponible: ${productoSeleccionado.stock}`)
          return
        }

        // Verificar si el producto ya está en la lista
        const productoExistente = productosSeleccionados.find((prod) => prod._id === productoSeleccionado._id)

        if (productoExistente) {
          // Si ya existe, actualizar la cantidad
          const nuevaCantidad = productoExistente.cantidad + nuevoProducto.cantidad

          // Verificar stock nuevamente
          if (productoSeleccionado.stock < nuevaCantidad) {
            alert(
              `Stock insuficiente para agregar ${nuevoProducto.cantidad} más. Disponible: ${productoSeleccionado.stock}`,
            )
            return
          }

          setProductosSeleccionados((prev) =>
            prev.map((prod) =>
              prod._id === productoSeleccionado._id
                ? {
                    ...prod,
                    cantidad: nuevaCantidad,
                    subtotal: productoSeleccionado.precio * nuevaCantidad,
                  }
                : prod,
            ),
          )
        } else {
          // Si no existe, agregar nuevo
          setProductosSeleccionados((prev) => [
            ...prev,
            {
              _id: productoSeleccionado._id,
              nombreProducto: productoSeleccionado.nombreProducto,
              precio: productoSeleccionado.precio,
              cantidad: nuevoProducto.cantidad,
              subtotal: productoSeleccionado.precio * nuevoProducto.cantidad,
            },
          ])
        }

        setNuevoProducto({ id: "", nombre: "", cantidad: 1 })
      } else {
        alert("El producto seleccionado no existe.")
      }
    } else {
      alert("Debes seleccionar un producto y especificar una cantidad válida.")
    }
  }

  // Eliminar un servicio
  const eliminarServicio = (id) => {
    setServiciosSeleccionados((prev) => prev.filter((servicio) => servicio._id !== id))
  }

  // Eliminar un producto
  const eliminarProducto = (id) => {
    setProductosSeleccionados((prev) => prev.filter((producto) => producto._id !== id))
  }

  // Actualizar cantidad de un producto
  const actualizarCantidadProducto = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(id)
      return
    }

    const producto = productos.find((p) => p._id === id)

    // Verificar stock
    if (producto && producto.stock < nuevaCantidad) {
      alert(`Stock insuficiente. Disponible: ${producto.stock}`)
      return
    }

    setProductosSeleccionados((prev) =>
      prev.map((prod) =>
        prod._id === id
          ? {
              ...prod,
              cantidad: nuevaCantidad,
              subtotal: prod.precio * nuevaCantidad,
            }
          : prod,
      ),
    )
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    // Validar que haya al menos un producto o servicio
    if (productosSeleccionados.length === 0 && serviciosSeleccionados.length === 0) {
      alert("Debe agregar al menos un producto o servicio a la venta.")
      return
    }

    // Validar cliente y empleado
    if (!clienteId || !empleadoId) {
      alert("Debe seleccionar un cliente y un empleado.")
      return
    }

    const ventaData = {
      cliente: clienteId,
      empleado: empleadoId,
      cita: citaId || undefined,
      productos: productosSeleccionados.map((producto) => ({
        producto: producto._id,
        cantidad: producto.cantidad,
        precio: producto.precio,
      })),
      servicios: serviciosSeleccionados.map((servicio) => ({
        servicio: servicio._id,
        precio: servicio.precio,
        tiempo: servicio.tiempo,
      })),
      metodoPago,
      estado,
      observaciones,
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
        <h2 className="text-xl font-semibold mb-4">{venta ? "Editar Venta" : "Agregar Venta"}</h2>

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
            Cita (Opcional)
          </label>
          <select id="cita" value={citaId} onChange={(e) => setCitaId(e.target.value)} className="form-select">
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

        {/* Tabs para productos y servicios */}
        <div className="tabs-container">
          <div className="tabs-header">
            <button
              type="button"
              className={`tab-button ${activeTab === "productos" ? "active" : ""}`}
              onClick={() => setActiveTab("productos")}
            >
              Productos
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === "servicios" ? "active" : ""}`}
              onClick={() => setActiveTab("servicios")}
            >
              Servicios
            </button>
          </div>

          {/* Tab de Productos */}
          <div className={`tab-content ${activeTab === "productos" ? "block" : "hidden"}`}>
            <div className="form-group">
              <label htmlFor="producto" className="form-label">
                Agregar Producto
              </label>
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  id="producto"
                  value={nuevoProducto.id}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      id: e.target.value,
                      nombre: productos.find((p) => p._id === e.target.value)?.nombreProducto || "",
                    })
                  }
                  className="form-select md:flex-grow"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombreProducto} - ${producto.precio} (Stock: {producto.stock})
                    </option>
                  ))}
                </select>
                <div className="flex items-center">
                  <label htmlFor="cantidad" className="mr-2 whitespace-nowrap">
                    Cantidad:
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        cantidad: Number.parseInt(e.target.value) || 1,
                      })
                    }
                    className="form-input w-20"
                  />
                </div>
                <button type="button" onClick={agregarProducto} className="btn-add">
                  Agregar Producto
                </button>
              </div>
            </div>

            <div className="form-group">
              <h3 className="text-lg font-semibold mb-2">Productos Agregados</h3>
              {productosSeleccionados.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="tabla-servicios">
                    <thead>
                      <tr>
                        <th>Nombre del Producto</th>
                        <th className="text-right">Precio</th>
                        <th className="text-right">Cantidad</th>
                        <th className="text-right">Subtotal</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosSeleccionados.map((producto) => (
                        <tr key={producto._id}>
                          <td>{producto.nombreProducto}</td>
                          <td className="text-right">${producto.precio.toFixed(2)}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => actualizarCantidadProducto(producto._id, producto.cantidad - 1)}
                                className="btn-icon-sm"
                              >
                                -
                              </button>
                              <span className="mx-2">{producto.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => actualizarCantidadProducto(producto._id, producto.cantidad + 1)}
                                className="btn-icon-sm"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="text-right">${producto.subtotal.toFixed(2)}</td>
                          <td className="text-center">
                            <button type="button" onClick={() => eliminarProducto(producto._id)} className="btn-danger">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3">Subtotal Productos</td>
                        <td className="text-right">${subtotalProductos.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No hay productos seleccionados</p>
              )}
            </div>
          </div>

          {/* Tab de Servicios */}
          <div className={`tab-content ${activeTab === "servicios" ? "block" : "hidden"}`}>
            <div className="form-group">
              <label htmlFor="servicio" className="form-label">
                Agregar Servicio
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
                        <td>Subtotal Servicios</td>
                        <td className="text-right">${subtotalServicios.toFixed(2)}</td>
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
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="metodoPago" className="form-label">
            Método de Pago
          </label>
          <select
            id="metodoPago"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="form-select"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="observaciones" className="form-label">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div className="resumen-venta">
          <h3 className="text-lg font-semibold">Resumen de la Venta</h3>
          {productosSeleccionados.length > 0 && (
            <p>
              <strong>Subtotal Productos:</strong> ${subtotalProductos.toFixed(2)}
            </p>
          )}
          {serviciosSeleccionados.length > 0 && (
            <p>
              <strong>Subtotal Servicios:</strong> ${subtotalServicios.toFixed(2)}
            </p>
          )}
          <p className="text-lg font-bold">
            <strong>Total:</strong> ${totalGeneral.toFixed(2)}
          </p>
          <div className="checkbox-container">
            <input type="checkbox" id="estado" checked={estado} onChange={(e) => setEstado(e.target.checked)} />
            <label htmlFor="estado">Venta Completada</label>
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

export default FormularioVenta