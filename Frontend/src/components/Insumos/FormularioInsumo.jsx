import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons"

const FormularioInsumo = ({ insumo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombreInsumo: "",
    stock: "",
    precio: "",
    estado: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    nombreInsumo: "",
    stock: "",
    precio: "",
  })
  const [modoEdicion, setModoEdicion] = useState(false)

  const apiUrl = "https://gitbf.onrender.com/api/insumos"

  // Funciones de validación del lado del cliente
  const validarNombreInsumo = (nombre) => {
    if (!nombre || nombre.trim() === "") {
      return "El nombre del insumo es requerido"
    }

    const nombreTrimmed = nombre.trim()

    if (nombreTrimmed.length < 3 || nombreTrimmed.length > 30) {
      return "El nombre debe tener entre 3 y 30 caracteres"
    }

    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/
    if (!regex.test(nombreTrimmed)) {
      return "Solo se permiten letras, números y espacios"
    }

    const soloNumeros = /^\d+$/
    const soloEspacios = /^\s+$/
    if (soloNumeros.test(nombreTrimmed) || soloEspacios.test(nombreTrimmed)) {
      return "El nombre debe contener al menos una letra"
    }

    return ""
  }

  const validarStock = (stock) => {
    if (!stock || stock.trim() === "") {
      return "El stock es requerido"
    }

    const stockNum = Number(stock)

    if (isNaN(stockNum)) {
      return "El stock debe ser un número válido"
    }

    if (!Number.isInteger(stockNum)) {
      return "El stock debe ser un número entero"
    }

    if (stockNum < 1) {
      return "El stock debe ser mayor o igual a 1"
    }

    if (stockNum > 999999) {
      return "El stock no puede exceder 999,999 unidades"
    }

    return ""
  }

  const validarPrecio = (precio) => {
    if (!precio || precio.trim() === "") {
      return "El precio es requerido"
    }

    const precioNum = Number(precio)

    if (isNaN(precioNum)) {
      return "El precio debe ser un número válido"
    }

    if (precioNum <= 0) {
      return "El precio debe ser mayor que cero"
    }

    if (precioNum > 999999.99) {
      return "El precio no puede exceder $999,999.99"
    }

    const decimales = (precio.split(".")[1] || "").length
    if (decimales > 2) {
      return "El precio puede tener máximo 2 decimales"
    }

    return ""
  }

  useEffect(() => {
    if (insumo) {
      setFormData({
        nombreInsumo: insumo.nombreInsumo || "",
        stock: insumo.stock?.toString() || "",
        precio: insumo.precio?.toString() || "",
        estado: insumo.estado !== undefined ? insumo.estado : true,
      })
      setModoEdicion(true)
    } else {
      setFormData({
        nombreInsumo: "",
        stock: "",
        precio: "",
        estado: true,
      })
      setModoEdicion(false)
    }
    setFieldErrors({
      nombreInsumo: "",
      stock: "",
      precio: "",
    })
  }, [insumo])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value

    if (type === "checkbox") {
      newValue = checked
    }

    // Validación en tiempo real
    let errorMessage = ""
    if (name === "nombreInsumo") {
      errorMessage = validarNombreInsumo(newValue)
    } else if (name === "stock") {
      errorMessage = validarStock(newValue)
    } else if (name === "precio") {
      errorMessage = validarPrecio(newValue)
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMessage,
    })

    if (name === "estado") {
      setFormData({
        ...formData,
        [name]: value === "Activo",
      })
    } else {
      setFormData({
        ...formData,
        [name]: newValue,
      })
    }
  }

  const validateForm = () => {
    const errors = {
      nombreInsumo: validarNombreInsumo(formData.nombreInsumo),
      stock: validarStock(formData.stock),
      precio: validarPrecio(formData.precio),
    }

    setFieldErrors(errors)

    return !Object.values(errors).some((error) => error !== "")
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Error de validación",
        text: "Por favor corrige los errores en el formulario",
        confirmButtonColor: "#db2777",
      })
      return
    }

    setLoading(true)
    setError(null)

    const insumoData = {
      nombreInsumo: formData.nombreInsumo.trim(),
      stock: Number(formData.stock),
      precio: Number(formData.precio),
      estado: formData.estado,
    }

    try {
      const token = localStorage.getItem("token")
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      if (modoEdicion) {
        await axios.put(`${apiUrl}/${insumo._id}`, insumoData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Insumo actualizado correctamente",
          confirmButtonColor: "#db2777",
        })
      } else {
        await axios.post(apiUrl, insumoData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Insumo creado correctamente",
          confirmButtonColor: "#db2777",
        })
      }

      if (onSuccess) onSuccess()
      if (onClose) onClose()
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error.response?.data?.message || "Hubo un problema al guardar el insumo"
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

  // Calcular valor total en stock
  const valorTotalStock =
    formData.stock && formData.precio ? (Number(formData.stock) * Number(formData.precio)).toFixed(2) : "0.00"

  return (
    <div className="p-6 w-full mx-auto" style={{ maxWidth: "90%", minWidth: "800px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        {modoEdicion ? "Editar Insumo" : "Nuevo Insumo"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombreInsumo" className="form-label">
            Nombre del Insumo <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="nombreInsumo"
            name="nombreInsumo"
            value={formData.nombreInsumo}
            onChange={handleInputChange}
            maxLength={30}
            className={`form-input w-full ${fieldErrors.nombreInsumo ? "border-red-500" : ""}`}
            placeholder="Ingrese el nombre del insumo (3-30 caracteres)"
          />
          {fieldErrors.nombreInsumo && <p className="text-red-500 text-sm mt-1">{fieldErrors.nombreInsumo}</p>}
          <p className="text-xs text-gray-500 mt-1">{formData.nombreInsumo.length}/30 caracteres</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="stock" className="form-label">
              Stock <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="1"
                max="999999"
                step="1"
                className={`form-input w-full ${fieldErrors.stock ? "border-red-500" : ""}`}
                placeholder="Cantidad en stock"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400 text-sm">unidades</span>
              </div>
            </div>
            {fieldErrors.stock && <p className="text-red-500 text-sm mt-1">{fieldErrors.stock}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="precio" className="form-label">
              Precio <span className="text-pink-500 ml-[5px]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                min="0.01"
                max="999999.99"
                step="0.01"
                className={`form-input w-full pl-8 ${fieldErrors.precio ? "border-red-500" : ""}`}
                placeholder="0.00"
              />
            </div>
            {fieldErrors.precio && <p className="text-red-500 text-sm mt-1">{fieldErrors.precio}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="estado" className="form-label">
            Estado <span className="text-pink-500">*</span>
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado ? "Activo" : "Inactivo"}
            onChange={handleInputChange}
            className="form-input w-full"
            required
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Información del Insumo */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800 mb-2">📋 Información del Insumo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-pink-700">
            <div>
              <span className="font-medium">Valor Total en Stock:</span>
              <span className="ml-2 font-bold">${valorTotalStock}</span>
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 font-bold ${formData.estado ? "text-green-600" : "text-red-600"}`}>
                {formData.estado ? "Disponible" : "No Disponible"}
              </span>
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
                Guardar
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

export default FormularioInsumo
