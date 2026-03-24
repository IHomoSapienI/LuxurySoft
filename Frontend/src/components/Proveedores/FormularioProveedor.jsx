"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons"

const FormularioProveedor = ({ proveedor, onProveedorActualizado, onClose }) => {
  const [formData, setFormData] = useState({
    nombreProveedor: "",
    contacto: "",
    numeroContacto: "",
    provee: "",
    estado: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    nombreProveedor: "",
    contacto: "",
    numeroContacto: "",
    provee: "",
  })
  const [modoEdicion, setModoEdicion] = useState(false)

  const apiUrl = "https://gitbf.onrender.com/api/proveedores"

  // Funciones de validación del lado del cliente
  const validarNombreProveedor = (nombre) => {
    if (!nombre || nombre.trim() === "") {
      return "El nombre del proveedor es requerido"
    }

    const nombreTrimmed = nombre.trim()

    if (nombreTrimmed.length < 3 || nombreTrimmed.length > 20) {
      return "El nombre debe tener entre 3 y 20 caracteres"
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/.test(nombreTrimmed)) {
      return "Solo se permiten letras, números y espacios"
    }

    return ""
  }

  const validarContacto = (contacto) => {
    if (!contacto || contacto.trim() === "") {
      return "El contacto es requerido"
    }

    const contactoTrimmed = contacto.trim()

    if (contactoTrimmed.length < 3 || contactoTrimmed.length > 20) {
      return "El contacto debe tener entre 3 y 20 caracteres"
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(contactoTrimmed)) {
      return "El contacto solo puede contener letras y espacios"
    }

    return ""
  }

  const validarNumeroContacto = (numero) => {
    if (!numero || numero.trim() === "") {
      return "El número de contacto es requerido"
    }

    if (!/^\d+$/.test(numero)) {
      return "El número solo puede contener dígitos"
    }

    if (numero.length <= 7) {
      return "El número debe tener más de 7 dígitos"
    }

    if (numero.length > 12) {
      return "El número debe tener menos de 12 dígitos"
    }

    return ""
  }

  const validarProvee = (provee) => {
    if (!provee || provee.trim() === "") {
      return "Debe especificar qué provee"
    }

    const proveeTrimmed = provee.trim()

    if (proveeTrimmed.length < 3 || proveeTrimmed.length > 50) {
      return "Debe tener entre 3 y 50 caracteres"
    }

    return ""
  }

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombreProveedor: proveedor.nombreProveedor || "",
        contacto: proveedor.contacto || "",
        numeroContacto: proveedor.numeroContacto || "",
        provee: proveedor.provee || "",
        estado: proveedor.estado !== undefined ? proveedor.estado : true,
      })
      setModoEdicion(true)
    } else {
      setFormData({
        nombreProveedor: "",
        contacto: "",
        numeroContacto: "",
        provee: "",
        estado: true,
      })
      setModoEdicion(false)
    }
    setFieldErrors({
      nombreProveedor: "",
      contacto: "",
      numeroContacto: "",
      provee: "",
    })
  }, [proveedor])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = value

    if (type === "checkbox") {
      newValue = checked
    }

    // Validación en tiempo real
    let errorMessage = ""
    if (name === "nombreProveedor") {
      errorMessage = validarNombreProveedor(newValue)
    } else if (name === "contacto") {
      errorMessage = validarContacto(newValue)
    } else if (name === "numeroContacto") {
      errorMessage = validarNumeroContacto(newValue)
    } else if (name === "provee") {
      errorMessage = validarProvee(newValue)
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
      nombreProveedor: validarNombreProveedor(formData.nombreProveedor),
      contacto: validarContacto(formData.contacto),
      numeroContacto: validarNumeroContacto(formData.numeroContacto),
      provee: validarProvee(formData.provee),
    }

    setFieldErrors(errors)

    return !Object.values(errors).some((error) => error !== "")
  }

  const handleSubmit = async (e) => {
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

    const proveedorData = {
      nombreProveedor: formData.nombreProveedor.trim(),
      contacto: formData.contacto.trim(),
      numeroContacto: formData.numeroContacto.trim(),
      provee: formData.provee.trim(),
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

      let response
      if (modoEdicion) {
        response = await axios.put(`${apiUrl}/${proveedor._id}`, proveedorData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Proveedor actualizado correctamente",
          confirmButtonColor: "#db2777",
        })
      } else {
        response = await axios.post(apiUrl, proveedorData, config)
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Proveedor creado correctamente",
          confirmButtonColor: "#db2777",
        })
      }

      if (onProveedorActualizado) {
        onProveedorActualizado(response.data)
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage =
        error.response?.data?.mensaje || error.response?.data?.message || "Hubo un problema al guardar el proveedor"
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

  return (
    <div className="p-6 w-full mx-auto" style={{ maxWidth: "90%", minWidth: "600px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        {modoEdicion ? "Editar Proveedor" : "Nuevo Proveedor"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombreProveedor" className="form-label">
            Nombre del Proveedor <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="nombreProveedor"
            name="nombreProveedor"
            value={formData.nombreProveedor}
            onChange={handleInputChange}
            maxLength={20}
            className={`form-input w-full ${fieldErrors.nombreProveedor ? "border-red-500" : ""}`}
            placeholder="Ingrese el nombre del proveedor (3-20 caracteres)"
          />
          {fieldErrors.nombreProveedor && <p className="text-red-500 text-sm mt-1">{fieldErrors.nombreProveedor}</p>}
          <p className="text-xs text-gray-500 mt-1">{formData.nombreProveedor.length}/20 caracteres</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="contacto" className="form-label">
              Contacto <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              id="contacto"
              name="contacto"
              value={formData.contacto}
              onChange={handleInputChange}
              maxLength={20}
              className={`form-input w-full ${fieldErrors.contacto ? "border-red-500" : ""}`}
              placeholder="Nombre del contacto (3-20 caracteres)"
            />
            {fieldErrors.contacto && <p className="text-red-500 text-sm mt-1">{fieldErrors.contacto}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.contacto.length}/20 caracteres</p>
          </div>

          <div className="form-group">
            <label htmlFor="numeroContacto" className="form-label">
              Número de Contacto <span className="text-pink-500">*</span>
            </label>
            <input
              type="tel"
              id="numeroContacto"
              name="numeroContacto"
              value={formData.numeroContacto}
              onChange={handleInputChange}
              maxLength={12}
              className={`form-input w-full ${fieldErrors.numeroContacto ? "border-red-500" : ""}`}
              placeholder="Número telefónico (8-12 dígitos)"
            />
            {fieldErrors.numeroContacto && <p className="text-red-500 text-sm mt-1">{fieldErrors.numeroContacto}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.numeroContacto.length}/12 dígitos</p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="provee" className="form-label">
            ¿Qué Provee? <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="provee"
            name="provee"
            value={formData.provee}
            onChange={handleInputChange}
            maxLength={50}
            className={`form-input w-full ${fieldErrors.provee ? "border-red-500" : ""}`}
            placeholder="Descripción de productos o servicios (3-50 caracteres)"
          />
          {fieldErrors.provee && <p className="text-red-500 text-sm mt-1">{fieldErrors.provee}</p>}
          <p className="text-xs text-gray-500 mt-1">{formData.provee.length}/50 caracteres</p>
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

        {/* Información del Proveedor */}
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-pink-800 mb-2">📋 Información del Proveedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-pink-700">
            <div>
              <span className="font-medium">Contacto Principal:</span>
              <span className="ml-2">{formData.contacto || "Sin especificar"}</span>
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-2 font-bold ${formData.estado ? "text-green-600" : "text-red-600"}`}>
                {formData.estado ? "Activo" : "Inactivo"}
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

export default FormularioProveedor
