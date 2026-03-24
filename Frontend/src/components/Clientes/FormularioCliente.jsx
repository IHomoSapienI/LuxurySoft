"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons"
import "./FormularioCliente.css"

const FormularioCliente = ({ cliente, onClose, onClienteActualizado = () => {} }) => {
  const [formData, setFormData] = useState({
    nombrecliente: "",
    apellidocliente: "",
    correocliente: "",
    celularcliente: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    nombrecliente: "",
    apellidocliente: "",
    correocliente: "",
    celularcliente: "",
  })

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombrecliente: cliente.nombrecliente || "",
        apellidocliente: cliente.apellidocliente || "",
        correocliente: cliente.correocliente || "",
        celularcliente: cliente.celularcliente || "",
      })
    }
  }, [cliente])

  const validateNombreApellido = (value) => {
    if (!value) return "Este campo es requerido"
    if (value.length < 3) return "Debe tener al menos 3 caracteres"
    if (value.length > 20) return "No puede exceder los 20 caracteres"
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return "Solo se permiten letras, espacios y tildes"
    return ""
  }

  const validateEmail = (value) => {
    if (!value) return "Este campo es requerido"
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
    if (!emailRegex.test(value)) {
      if (!value.includes('@')) return "Falta el símbolo @"
      if (value.split('@').length < 2 || !value.split('@')[1]) return "Falta el dominio"
      if (!value.includes('.') || value.split('.').length < 2 || !value.split('.')[1]) {
        return "Dominio sin punto o incompleto"
      }
      return "Formato de correo inválido"
    }
    return ""
  }

  const validateCelular = (value) => {
    if (!value) return "Este campo es requerido"
    if (value.startsWith('0')) return "No debe comenzar con 0"
    if (value.includes('-')) return "No se permiten números negativos"
    if (/\s/.test(value)) return "No se permiten espacios"
    if (!/^\d+$/.test(value)) return "Solo se permiten números"
    if (value.length !== 10) return "Debe tener exactamente 10 dígitos"
    if (/^0+$/.test(value)) return "No puede ser solo ceros"
    return ""
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Validación en tiempo real
    let errorMsg = ""
    switch (name) {
      case "nombrecliente":
      case "apellidocliente":
        errorMsg = validateNombreApellido(value)
        break
      case "correocliente":
        errorMsg = validateEmail(value.toLowerCase())
        break
      case "celularcliente":
        errorMsg = validateCelular(value)
        break
      default:
        break
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMsg
    })
  }

  const validateForm = () => {
    const errors = {
      nombrecliente: validateNombreApellido(formData.nombrecliente),
      apellidocliente: validateNombreApellido(formData.apellidocliente),
      correocliente: validateEmail(formData.correocliente.toLowerCase()),
      celularcliente: validateCelular(formData.celularcliente),
    }

    setFieldErrors(errors)

    return !Object.values(errors).some(error => error !== "")
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

    try {
      const token = localStorage.getItem("token")
      const url = cliente
        ? `https://gitbf.onrender.com/api/clientes/${cliente._id}`
        : "https://gitbf.onrender.com/api/clientes"
      const method = cliente ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          correocliente: formData.correocliente.toLowerCase()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Error al guardar el cliente")
      }

      const data = await response.json()
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: cliente ? "Cliente actualizado correctamente" : "Cliente creado correctamente",
        confirmButtonColor: "#db2777",
      })

      onClienteActualizado(data.cliente || data)
      onClose()
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#db2777",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
   <div className="p-6 w-full mx-auto" style={{ maxWidth: "90%", minWidth: "800px" }}>
      <h2 className="text-2xl font-semibold mb-6 text-center text-pink-600">
        {cliente ? "Editar Cliente" : "Nuevo Cliente"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombrecliente" className="form-label">
            Nombre del Cliente <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="nombrecliente"
            name="nombrecliente"
            value={formData.nombrecliente}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.nombrecliente ? "border-red-500" : ""}`}
          />
          {fieldErrors.nombrecliente && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.nombrecliente}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="apellidocliente" className="form-label">
            Apellido del Cliente <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="apellidocliente"
            name="apellidocliente"
            value={formData.apellidocliente}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.apellidocliente ? "border-red-500" : ""}`}
          />
          {fieldErrors.apellidocliente && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.apellidocliente}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="correocliente" className="form-label">
            Correo Electrónico <span className="text-pink-500">*</span>
          </label>
          <input
            type="email"
            id="correocliente"
            name="correocliente"
            value={formData.correocliente}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.correocliente ? "border-red-500" : ""}`}
          />
          {fieldErrors.correocliente && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.correocliente}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="celularcliente" className="form-label">
            Número de Celular <span className="text-pink-500">*</span>
          </label>
          <input
            type="tel"
            id="celularcliente"
            name="celularcliente"
            value={formData.celularcliente}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.celularcliente ? "border-red-500" : ""}`}
          />
          {fieldErrors.celularcliente && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.celularcliente}</p>
          )}
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

export default FormularioCliente