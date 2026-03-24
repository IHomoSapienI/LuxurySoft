"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons"

const FormularioEmpleado = ({ empleado, onClose, onEmpleadoActualizado = () => {} }) => {
  const [formData, setFormData] = useState({
    nombreempleado: "",
    apellidoempleado: "",
    correoempleado: "",
    telefonoempleado: "",
    estadoempleado: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({
    nombreempleado: "",
    apellidoempleado: "",
    correoempleado: "",
    telefonoempleado: "",
  })

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombreempleado: empleado.nombreempleado || "",
        apellidoempleado: empleado.apellidoempleado || "",
        correoempleado: empleado.correoempleado || "",
        telefonoempleado: empleado.telefonoempleado || "",
        estadoempleado: empleado.estadoempleado === true || empleado.estadoempleado === "Activo",
      })
    }
  }, [empleado])

  // Función para validar nombre y apellido
  const validateName = (value) => {
    if (!value) return "Este campo es requerido"
    if (value.length < 3) return "Debe tener al menos 3 caracteres"
    if (value.length > 20) return "No debe exceder los 20 caracteres"
    if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(value)) return "Solo se permiten letras, espacios y tildes"
    return ""
  }

  // Función para validar correo electrónico
  const validateEmail = (value) => {
    if (!value) return "Este campo es requerido"
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
      if (!value.includes("@")) return "Falta el símbolo @"
      if (!value.includes(".")) return "Falta el dominio completo"
      if (/[A-Z]/.test(value)) return "El correo debe estar en minúsculas"
      if (/[^a-z0-9._%+-@]/.test(value)) return "Caracteres especiales no permitidos"
      return "Formato de correo inválido"
    }
    return ""
  }

  // Función para validar teléfono
  const validatePhone = (value) => {
    if (!value) return "Este campo es requerido"
    if (!/^[0-9]+$/.test(value)) return "Solo se permiten números"
    if (value.startsWith("0")) return "No debe comenzar con 0"
    if (value.length !== 10) return "Debe tener exactamente 10 dígitos"
    if (/^0+$/.test(value)) return "No puede ser solo ceros"
    return ""
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Validación en tiempo real
    let errorMessage = ""
    if (name === "nombreempleado" || name === "apellidoempleado") {
      errorMessage = validateName(value)
    } else if (name === "correoempleado") {
      errorMessage = validateEmail(value.toLowerCase())
    } else if (name === "telefonoempleado") {
      errorMessage = validatePhone(value)
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: errorMessage,
    })

    if (name === "estadoempleado") {
      setFormData({
        ...formData,
        [name]: value === "Activo",
      })
    } else {
      setFormData({
        ...formData,
        [name]: name === "correoempleado" ? value.toLowerCase() : value,
      })
    }
  }

  const validateForm = () => {
    const errors = {
      nombreempleado: validateName(formData.nombreempleado),
      apellidoempleado: validateName(formData.apellidoempleado),
      correoempleado: validateEmail(formData.correoempleado),
      telefonoempleado: validatePhone(formData.telefonoempleado),
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

    try {
      const token = localStorage.getItem("token")
      const url = empleado
        ? `https://gitbf.onrender.com/api/empleados/${empleado._id}`
        : "https://gitbf.onrender.com/api/empleados"
      const method = empleado ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.msg || "Error al guardar el empleado")
      }

      const data = await response.json()
      Swal.fire({
        icon: "success",
        title: "¡Éxito!",
        text: empleado ? "Empleado actualizado correctamente" : "Empleado creado correctamente",
        confirmButtonColor: "#db2777",
      })

      onEmpleadoActualizado(data.empleado || data)
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
        {empleado ? "Editar Empleado" : "Nuevo Empleado"}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="nombreempleado" className="form-label">
            Nombre del Empleado <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="nombreempleado"
            name="nombreempleado"
            value={formData.nombreempleado}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.nombreempleado ? "border-red-500" : ""}`}
          />
          {fieldErrors.nombreempleado && <p className="text-red-500 text-sm mt-1">{fieldErrors.nombreempleado}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="apellidoempleado" className="form-label">
            Apellido del Empleado <span className="text-pink-500">*</span>
          </label>
          <input
            type="text"
            id="apellidoempleado"
            name="apellidoempleado"
            value={formData.apellidoempleado}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.apellidoempleado ? "border-red-500" : ""}`}
          />
          {fieldErrors.apellidoempleado && <p className="text-red-500 text-sm mt-1">{fieldErrors.apellidoempleado}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="correoempleado" className="form-label">
            Correo Electrónico <span className="text-pink-500">*</span>
          </label>
          <input
            type="email"
            id="correoempleado"
            name="correoempleado"
            value={formData.correoempleado}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.correoempleado ? "border-red-500" : ""}`}
          />
          {fieldErrors.correoempleado && <p className="text-red-500 text-sm mt-1">{fieldErrors.correoempleado}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="telefonoempleado" className="form-label">
            Número de Teléfono <span className="text-pink-500">*</span>
          </label>
          <input
            type="tel"
            id="telefonoempleado"
            name="telefonoempleado"
            value={formData.telefonoempleado}
            onChange={handleInputChange}
            className={`form-input w-full ${fieldErrors.telefonoempleado ? "border-red-500" : ""}`}
            maxLength="10"
          />
          {fieldErrors.telefonoempleado && <p className="text-red-500 text-sm mt-1">{fieldErrors.telefonoempleado}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="estadoempleado" className="form-label">
            Estado <span className="text-pink-500">*</span>
          </label>
          <select
            id="estadoempleado"
            name="estadoempleado"
            value={formData.estadoempleado ? "Activo" : "Inactivo"}
            onChange={handleInputChange}
            className="form-input w-full"
            required
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
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

export default FormularioEmpleado
