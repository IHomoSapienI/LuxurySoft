import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes, faPlus, faTrash, faShoppingCart } from "@fortawesome/free-solid-svg-icons"

const FormularioCompra = ({ compra, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    proveedor: "",
    recibo: "",
    fechaCompra: "",
    fechaRegistro: new Date().toISOString().split("T")[0],
    insumos: [],
  })
  const [proveedores, setProveedores] = useState([])
  const [insumos, setInsumos] = useState([])
  const [nuevoInsumo, setNuevoInsumo] = useState({ id: "", nombre: "" })
  const [montoTotal, setMontoTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    proveedor: "",
    fechaCompra: "",
    insumos: "",
  })

  const apiUrl = "https://gitbf.onrender.com/api/compras"
  const proveedoresUrl = "https://gitbf.onrender.com/api/proveedores"
  const insumosUrl = "https://gitbf.onrender.com/api/insumos"

  // Funciones de validación del lado del cliente
  const validarProveedor = (proveedor) => {
    if (!proveedor || proveedor.trim() === "") {
      return "Debe seleccionar un proveedor"
    }
    return ""
  }

  const validarFechaCompra = (fecha) => {
    if (!fecha) {
      return "La fecha de compra es requerida"
    }

    const fechaCompraDate = new Date(fecha)
    const fechaActual = new Date()

    if (isNaN(fechaCompraDate.getTime())) {
      return "Formato de fecha inválido"
    }

    if (fechaCompraDate > fechaActual) {
      return "La fecha de compra no puede ser futura"
    }

    return ""
  }

  const validarInsumos = (insumos) => {
    if (!insumos || insumos.length === 0) {
      return "Debe agregar al menos un insumo"
    }
    return ""
  }

  // Validar cantidad de insumo
  const validateCantidad = (cantidad) => {
    if (cantidad === "" || cantidad === null || cantidad === undefined) {
      return "La cantidad es requerida"
    }

    const num = Number(cantidad)
    if (isNaN(num)) {
      return "La cantidad debe ser un número válido"
    }

    if (num <= 0) {
      return "La cantidad debe ser mayor que cero"
    }

    if (!Number.isInteger(num)) {
      return "La cantidad debe ser un número entero"
    }

    return null
  }

  // Validar precio de insumo
  const validatePrecio = (precio) => {
    if (precio === "" || precio === null || precio === undefined) {
      return null // El precio puede ser opcional si viene del insumo
    }

    const num = Number(precio)
    if (isNaN(num)) {
      return "El precio debe ser un número válido"
    }

    if (num < 0) {
      return "El precio no puede ser negativo"
    }

    return null
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")

      try {
        if (!token) {
          throw new Error("No se encontró token de autenticación")
        }

        const headers = { Authorization: `Bearer ${token}` }

        // Hacer peticiones por separado para mejor manejo de errores
        let proveedoresRes, insumosRes

        try {
          proveedoresRes = await axios.get(proveedoresUrl, { headers })
        } catch (provError) {
          console.error("Error obteniendo proveedores:", provError)
          throw provError
        }

        try {
          insumosRes = await axios.get(insumosUrl, { headers })
        } catch (insError) {
          console.error("Error obteniendo insumos:", insError)
          throw insError
        }

        // Procesar respuestas
        let proveedoresData = []
        let insumosData = []

        // Manejar diferentes estructuras de respuesta para proveedores
        if (proveedoresRes.data) {
          if (Array.isArray(proveedoresRes.data)) {
            proveedoresData = proveedoresRes.data
          } else if (proveedoresRes.data.proveedores && Array.isArray(proveedoresRes.data.proveedores)) {
            proveedoresData = proveedoresRes.data.proveedores
          } else if (proveedoresRes.data.data && Array.isArray(proveedoresRes.data.data)) {
            proveedoresData = proveedoresRes.data.data
          } else {
            console.warn("Estructura de respuesta de proveedores no reconocida:", proveedoresRes.data)
          }
        }

        // Manejar diferentes estructuras de respuesta para insumos
        if (insumosRes.data) {
          if (Array.isArray(insumosRes.data)) {
            insumosData = insumosRes.data
          } else if (insumosRes.data.insumos && Array.isArray(insumosRes.data.insumos)) {
            insumosData = insumosRes.data.insumos
          } else if (insumosRes.data.data && Array.isArray(insumosRes.data.data)) {
            insumosData = insumosRes.data.data
          } else {
            console.warn("Estructura de respuesta de insumos no reconocida:", insumosRes.data)
          }
        }

        setProveedores(proveedoresData)
        setInsumos(insumosData)

        if (compra) {
          setFormData({
            proveedor: compra.proveedor?._id || "",
            recibo: compra.recibo || "",
            fechaCompra: compra.fechaCompra ? compra.fechaCompra.split("T")[0] : "",
            fechaRegistro: compra.fechaRegistro
              ? compra.fechaRegistro.split("T")[0]
              : new Date().toISOString().split("T")[0],
            insumos: compra.insumos
              ? compra.insumos.map((insumo) => ({
                  _id: insumo.insumo?._id || "",
                  nombreInsumo: insumo.insumo?.nombreInsumo || "Desconocido",
                  cantidad: insumo.cantidad || 1,
                  precio: insumo.insumo?.precio || 0,
                }))
              : [],
          })
        } else {
          const nuevoRecibo = `REC-${Date.now()}`
          setFormData((prevState) => ({
            ...prevState,
            recibo: nuevoRecibo,
          }))
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)

        let errorMessage = "No se pudieron cargar los datos necesarios"

        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = "Token de autenticación inválido o expirado"
              break
            case 403:
              errorMessage = "No tienes permisos para acceder a estos datos"
              break
            case 404:
              errorMessage = "Endpoint no encontrado"
              break
            case 500:
              errorMessage = "Error interno del servidor"
              break
            default:
              errorMessage = `Error del servidor: ${error.response.status}`
          }
        } else if (error.request) {
          errorMessage = "No se pudo conectar con el servidor"
        }

        setError(errorMessage)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonColor: "#db2777",
        })
        setProveedores([])
        setInsumos([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [compra])

  const montoTotalCalculado = useMemo(() => {
    return formData.insumos.reduce((total, insumo) => total + (insumo.cantidad || 0) * (insumo.precio || 0), 0)
  }, [formData.insumos])

  useEffect(() => {
    setMontoTotal(montoTotalCalculado)
  }, [montoTotalCalculado])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    let errorMessage = ""
    if (name === "proveedor") {
      errorMessage = validarProveedor(value)
    } else if (name === "fechaCompra") {
      errorMessage = validarFechaCompra(value)
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMessage,
    })

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const agregarInsumo = () => {
    if (!nuevoInsumo.id) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Debes seleccionar un insumo antes de agregar.",
        confirmButtonColor: "#db2777",
      })
      return
    }

    const insumoSeleccionado = insumos.find((i) => i._id === nuevoInsumo.id)
    if (!insumoSeleccionado) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Insumo no encontrado.",
        confirmButtonColor: "#db2777",
      })
      return
    }

    if (formData.insumos.some((i) => i._id === insumoSeleccionado._id)) {
      Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "Este insumo ya fue agregado.",
        confirmButtonColor: "#db2777",
      })
      return
    }

    setFormData((prevState) => ({
      ...prevState,
      insumos: [
        ...prevState.insumos,
        {
          _id: insumoSeleccionado._id,
          nombreInsumo: insumoSeleccionado.nombreInsumo,
          cantidad: 1,
          precio: insumoSeleccionado.precio,
          errors: {},
        },
      ],
    }))
    setNuevoInsumo({ id: "", nombre: "" })

    // Actualizar validación de insumos
    setFieldErrors({
      ...fieldErrors,
      insumos: "",
    })
  }

  const eliminarInsumo = (id) => {
    const nuevosInsumos = formData.insumos.filter((insumo) => insumo._id !== id)
    setFormData((prevState) => ({
      ...prevState,
      insumos: nuevosInsumos,
    }))

    // Validar si quedan insumos
    setFieldErrors({
      ...fieldErrors,
      insumos: validarInsumos(nuevosInsumos),
    })
  }

  const handleInsumoChange = (id, field, value) => {
    setFormData((prevState) => ({
      ...prevState,
      insumos: prevState.insumos.map((insumo) => {
        if (insumo._id === id) {
          const updatedInsumo = { ...insumo }

          if (field === "cantidad") {
            const cantidadValue = value === "" ? "" : Number.parseInt(value)
            updatedInsumo.cantidad = cantidadValue

            // Validar cantidad
            const cantidadError = validateCantidad(cantidadValue)
            updatedInsumo.errors = { ...updatedInsumo.errors }
            if (cantidadError) {
              updatedInsumo.errors.cantidad = cantidadError
            } else {
              delete updatedInsumo.errors.cantidad
            }
          } else if (field === "precio") {
            const precioValue = value === "" ? "" : Number.parseFloat(value)
            updatedInsumo.precio = precioValue

            // Validar precio
            const precioError = validatePrecio(precioValue)
            updatedInsumo.errors = { ...updatedInsumo.errors }
            if (precioError) {
              updatedInsumo.errors.precio = precioError
            } else {
              delete updatedInsumo.errors.precio
            }
          }

          return updatedInsumo
        }
        return insumo
      }),
    }))
  }

  const validateForm = () => {
    const errors = {
      proveedor: validarProveedor(formData.proveedor),
      fechaCompra: validarFechaCompra(formData.fechaCompra),
      insumos: validarInsumos(formData.insumos),
    }

    // Validar cada insumo
    let hasInsumoErrors = false
    formData.insumos.forEach((insumo) => {
      const cantidadError = validateCantidad(insumo.cantidad)
      const precioError = validatePrecio(insumo.precio)

      if (cantidadError || precioError) {
        hasInsumoErrors = true
      }
    })

    setFieldErrors(errors)

    return !Object.values(errors).some((error) => error !== "") && !hasInsumoErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Por favor corrija los errores en el formulario",
        confirmButtonColor: "#db2777",
      })
      return
    }

    setLoading(true)
    setError(null)

    const compraData = {
      proveedor: formData.proveedor,
      recibo: formData.recibo.trim(),
      fechaCompra: formData.fechaCompra,
      fechaRegistro: formData.fechaRegistro,
      insumos: formData.insumos.map((insumo) => ({
        insumo: insumo._id,
        cantidad: Number.parseInt(insumo.cantidad),
        precio: Number.parseFloat(insumo.precio),
      })),
      monto: montoTotal,
    }

    const token = localStorage.getItem("token")

    try {
      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se encontró el token de autenticación. Por favor, inicia sesión.",
          confirmButtonColor: "#db2777",
        })
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      }

      let response
      if (compra) {
        response = await axios.put(`${apiUrl}/${compra._id}`, compraData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Compra actualizada correctamente",
          confirmButtonColor: "#db2777",
        })
      } else {
        response = await axios.post(apiUrl, compraData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Compra creada correctamente",
          confirmButtonColor: "#db2777",
        })
      }

      if (onSuccess) onSuccess()
      if (onClose) onClose()
    } catch (error) {
      console.error("Error:", error)

      let errorMessage = "No se pudo guardar la compra"
      if (error.response && error.response.status === 401) {
        errorMessage = "No autorizado. Por favor, inicie sesión nuevamente."
      } else if (error.response && error.response.status === 400) {
        errorMessage = error.response.data.mensaje || "Verifique los campos e intente nuevamente."
      }

      setError(errorMessage)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#db2777",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[64vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-700">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 w-full mx-auto" style={{ maxWidth: "95%", minWidth: "900px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
        {compra ? "Editar Compra" : "Nueva Compra"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica de la compra */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">📋 Información de la Compra</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="proveedor" className="form-label">
                Proveedor <span className="text-pink-500">*</span>
              </label>
              <select
                id="proveedor"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleInputChange}
                className={`form-input w-full ${fieldErrors.proveedor ? "border-red-500" : ""}`}
                required
              >
                <option value="">
                  {proveedores.length === 0 ? "No hay proveedores disponibles" : "Selecciona un proveedor"}
                </option>
                {Array.isArray(proveedores) &&
                  proveedores.map((prov) => (
                    <option key={prov._id} value={prov._id}>
                      {prov.nombreProveedor || prov.nombre || "Proveedor sin nombre"}
                    </option>
                  ))}
              </select>
              {fieldErrors.proveedor && <p className="text-red-500 text-sm mt-1">{fieldErrors.proveedor}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="recibo" className="form-label">
                Número de Recibo
              </label>
              <input
                type="text"
                id="recibo"
                name="recibo"
                value={formData.recibo}
                className="form-input w-full bg-gray-100"
                placeholder="Generado automáticamente"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Este número se genera automáticamente</p>
            </div>

            <div className="form-group">
              <label htmlFor="fechaCompra" className="form-label">
                Fecha de Compra <span className="text-pink-500">*</span>
              </label>
              <input
                type="date"
                id="fechaCompra"
                name="fechaCompra"
                value={formData.fechaCompra}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                className={`form-input w-full ${fieldErrors.fechaCompra ? "border-red-500" : ""}`}
                required
              />
              {fieldErrors.fechaCompra && <p className="text-red-500 text-sm mt-1">{fieldErrors.fechaCompra}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="fechaRegistro" className="form-label">
                Fecha de Registro
              </label>
              <input
                type="date"
                id="fechaRegistro"
                name="fechaRegistro"
                value={formData.fechaRegistro}
                className="form-input w-full bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Selección de insumos */}
        <div className="form-group">
          <label htmlFor="insumo" className="form-label">
            Agregar Insumos <span className="text-pink-500">*</span>
          </label>
          <div className="flex space-x-2">
            <select
              id="insumo"
              value={nuevoInsumo.id}
              onChange={(e) =>
                setNuevoInsumo({
                  id: e.target.value,
                  nombre: insumos.find((i) => i._id === e.target.value)?.nombreInsumo || "",
                })
              }
              className="form-input flex-1"
            >
              <option value="">{insumos.length === 0 ? "No hay insumos disponibles" : "Selecciona un insumo"}</option>
              {Array.isArray(insumos) &&
                insumos.map((insumo) => (
                  <option key={insumo._id} value={insumo._id}>
                    {insumo.nombreInsumo || insumo.nombre || "Insumo sin nombre"} - ${insumo.precio || 0}
                  </option>
                ))}
            </select>
            <button type="button" onClick={agregarInsumo} disabled={insumos.length === 0} className="btn-primary">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Agregar
            </button>
          </div>
          {fieldErrors.insumos && <p className="text-red-500 text-sm mt-1">{fieldErrors.insumos}</p>}
        </div>

        {/* Tabla de insumos */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-pink-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-pink-800">📦 Insumos de la Compra</h3>
          </div>

          {formData.insumos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Insumo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unitario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.insumos.map((insumo) => (
                    <tr key={insumo._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{insumo.nombreInsumo}</td>
                      <td className="px-4 py-3">
                        <div className="w-24">
                          <input
                            type="number"
                            value={insumo.cantidad}
                            min="1"
                            step="1"
                            onChange={(e) => handleInsumoChange(insumo._id, "cantidad", e.target.value)}
                            className={`form-input w-full text-sm ${insumo.errors?.cantidad ? "border-red-500" : ""}`}
                          />
                          {insumo.errors?.cantidad && (
                            <p className="text-xs text-red-600 mt-1">{insumo.errors.cantidad}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-28">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              value={insumo.precio}
                              min="0"
                              step="0.01"
                              onChange={(e) => handleInsumoChange(insumo._id, "precio", e.target.value)}
                              className={`form-input w-full pl-6 text-sm ${
                                insumo.errors?.precio ? "border-red-500" : ""
                              }`}
                            />
                          </div>
                          {insumo.errors?.precio && <p className="text-xs text-red-600 mt-1">{insumo.errors.precio}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        ${((insumo.cantidad || 0) * (insumo.precio || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => eliminarInsumo(insumo._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          title="Eliminar insumo"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <FontAwesomeIcon icon={faShoppingCart} className="text-4xl mb-2 text-gray-300" />
              <p>No hay insumos agregados a la compra</p>
              <p className="text-sm">Selecciona un insumo y haz clic en "Agregar"</p>
            </div>
          )}
        </div>

        {/* Resumen de la compra */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800 mb-3">💰 Resumen de la Compra</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-pink-700">
            <div>
              <span className="font-medium">Total de Insumos:</span>
              <span className="ml-2 font-bold">{formData.insumos.length} items</span>
            </div>
            <div>
              <span className="font-medium">Cantidad Total:</span>
              <span className="ml-2 font-bold">
                {formData.insumos.reduce((total, insumo) => total + (insumo.cantidad || 0), 0)} unidades
              </span>
            </div>
            <div>
              <span className="font-medium">Monto Total:</span>
              <span className="ml-2 font-bold text-lg text-pink-800">${montoTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="btn-container mt-6 flex justify-end space-x-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {compra ? "Actualizar Compra" : "Crear Compra"}
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormularioCompra