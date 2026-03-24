"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle, faTimes, faBug } from "@fortawesome/free-solid-svg-icons"

const FormularioBajaInsumo = ({ insumo, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    cantidad: 1,
    observaciones: "",
    fechaBaja: new Date().toISOString().split("T")[0],
  })

  const [loading, setLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    cantidad: "",
    fechaBaja: "",
    observaciones: "",
  })

  // Funciones de validación (mantenidas igual)
  const validarCantidad = (valor) => {
    if (isNaN(valor) || valor === "" || valor === null) {
      return "La cantidad debe ser un número válido"
    }

    const num = Number(valor)

    if (num <= 0) {
      return "La cantidad debe ser mayor a cero"
    }

    if (!Number.isInteger(num)) {
      return "La cantidad debe ser un número entero"
    }

    if (num > (insumo?.stock || 0)) {
      return `La cantidad no puede ser mayor al stock disponible (${insumo?.stock || 0})`
    }

    return ""
  }

  const validarFecha = (fecha) => {
    if (!fecha) {
      return "La fecha de baja es requerida"
    }

    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    const fechaSeleccionada = new Date(fecha)
    fechaSeleccionada.setHours(0, 0, 0, 0)

    if (fechaSeleccionada > fechaActual) {
      return "La fecha no puede ser futura"
    }

    const unAñoAtras = new Date()
    unAñoAtras.setFullYear(unAñoAtras.getFullYear() - 1)
    unAñoAtras.setHours(0, 0, 0, 0)

    if (fechaSeleccionada < unAñoAtras) {
      return "La fecha no puede ser anterior a un año"
    }

    return ""
  }

  const validarObservaciones = (texto) => {
    if (!texto || texto.trim() === "") {
      return "Las observaciones son requeridas"
    }

    const textoTrimmed = texto.trim()

    if (textoTrimmed.length < 10) {
      return "Las observaciones deben tener al menos 10 caracteres"
    }

    if (textoTrimmed.length > 300) {
      return "Las observaciones no pueden exceder los 300 caracteres"
    }

    return ""
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    let errorMessage = ""
    if (name === "cantidad") {
      errorMessage = validarCantidad(value)
    } else if (name === "fechaBaja") {
      errorMessage = validarFecha(value)
    } else if (name === "observaciones") {
      errorMessage = validarObservaciones(value)
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMessage,
    })

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    const errors = {
      cantidad: validarCantidad(formData.cantidad),
      fechaBaja: validarFecha(formData.fechaBaja),
      observaciones: validarObservaciones(formData.observaciones),
    }

    setFieldErrors(errors)
    return !Object.values(errors).some((error) => error !== "")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    // CORREGIDO: Estructura de datos que coincide con lo que espera el backend
    const datosBaja = {
      // Cambiar de 'insumoId' a 'productoId' si es necesario
      productoId: insumo._id,
      // Asegurar que el nombre del producto se incluya
      producto: insumo.nombreInsumo,
      fechaBaja: formData.fechaBaja,
      cantidad: Number(formData.cantidad),
      observaciones: formData.observaciones.trim(),
    }

    console.log("🚀 Datos a enviar:", datosBaja)
    console.log("📦 Insumo completo:", insumo)

    // Enviar datos al componente padre
    onSubmit(datosBaja)
    setLoading(false)
  }

  const stockRestante = (insumo?.stock || 0) - Number(formData.cantidad || 0)

  return (
    <div className="p-6 w-full mx-auto" style={{ maxWidth: "90%", minWidth: "600px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
        Dar de Baja Insumo
      </h2>

      {/* Panel de Debug */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <button
          type="button"
          onClick={() => setDebugMode(!debugMode)}
          className="flex items-center text-yellow-800 font-medium"
        >
          <FontAwesomeIcon icon={faBug} className="mr-2" />
          {debugMode ? "Ocultar" : "Mostrar"} Info de Debug
        </button>

        {debugMode && (
          <div className="mt-3 bg-gray-100 p-3 rounded text-xs">
            <h4 className="font-bold mb-2">Información del Insumo:</h4>
            <pre>{JSON.stringify(insumo, null, 2)}</pre>
            <h4 className="font-bold mb-2 mt-4">Datos del Formulario:</h4>
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del Insumo */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">📦 Información del Insumo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">ID del Insumo</label>
              <input type="text" value={insumo?._id || ""} className="form-input w-full bg-gray-100 text-xs" readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre del Insumo</label>
              <input
                type="text"
                value={insumo?.nombreInsumo || ""}
                className="form-input w-full bg-gray-100"
                readOnly
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Actual</label>
              <input
                type="text"
                value={`${insumo?.stock || 0} unidades`}
                className="form-input w-full bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Campos del formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="fechaBaja" className="form-label">
              Fecha de Baja <span className="text-pink-500">*</span>
            </label>
            <input
              type="date"
              id="fechaBaja"
              name="fechaBaja"
              value={formData.fechaBaja}
              onChange={handleInputChange}
              max={new Date().toISOString().split("T")[0]}
              className={`form-input w-full ${fieldErrors.fechaBaja ? "border-red-500" : ""}`}
              required
            />
            {fieldErrors.fechaBaja && <p className="text-red-500 text-sm mt-1">{fieldErrors.fechaBaja}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="cantidad" className="form-label">
              Cantidad a dar de baja <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              id="cantidad"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleInputChange}
              min="1"
              max={insumo?.stock || 1}
              step="1"
              className={`form-input w-full ${fieldErrors.cantidad ? "border-red-500" : ""}`}
              required
            />
            {fieldErrors.cantidad && <p className="text-red-500 text-sm mt-1">{fieldErrors.cantidad}</p>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="observaciones" className="form-label">
            Observaciones <span className="text-pink-500">*</span>
            <span className="ml-2 text-xs text-gray-500">({formData.observaciones.length}/300)</span>
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            maxLength={300}
            className={`form-input w-full resize-none ${fieldErrors.observaciones ? "border-red-500" : ""}`}
            rows={4}
            placeholder="Motivo de la baja (vencimiento, daño, deterioro, etc.)"
            required
          />
          {fieldErrors.observaciones && <p className="text-red-500 text-sm mt-1">{fieldErrors.observaciones}</p>}
        </div>

        {/* Resumen de la operación */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800 mb-2">📊 Resumen de la Baja</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-pink-700">
            <div>
              <span className="font-medium">Stock Actual:</span>
              <span className="ml-2 font-bold">{insumo?.stock || 0} unidades</span>
            </div>
            <div>
              <span className="font-medium">Cantidad a dar de baja:</span>
              <span className="ml-2 font-bold text-red-600">{formData.cantidad || 0} unidades</span>
            </div>
            <div>
              <span className="font-medium">Stock Restante:</span>
              <span className={`ml-2 font-bold ${stockRestante <= 0 ? "text-red-600" : "text-green-600"}`}>
                {stockRestante} unidades
              </span>
            </div>
          </div>
        </div>

        <div className="btn-container mt-6 flex justify-end space-x-4">
          <button
            type="submit"
            className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500"
            disabled={loading || Object.values(fieldErrors).some((error) => error !== "")}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                Dar de Baja
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

export default FormularioBajaInsumo
