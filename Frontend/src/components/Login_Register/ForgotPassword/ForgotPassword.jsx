"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import axios from "axios"
import Swal from "sweetalert2"
import "./ForgotPassword.css"

export default function ForgotPassword() {
  // Estados del componente
  const [formData, setFormData] = useState({ email: "" })
  const [errors, setErrors] = useState({ email: "", general: "" })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const containerRef = useRef(null)

  // Función para mostrar alertas de error personalizadas
  const showErrorAlert = (message) => {
    Swal.fire({
      title: '<span class="text-error">Error</span>',
      html: `<p class="swal-error-message">${message}</p>`,
      icon: "error",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#e11d48",
      customClass: {
        container: "swal-container",
        popup: "swal-popup",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
      },
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
      backdrop: `rgba(0,0,0,0.6)`,
      allowOutsideClick: false,
      timerProgressBar: true,
      timer: 5000,
    })
  }

  // Función para aplicar estilos forzados al contenedor
  const applyForcedStyles = () => {
    document.body.classList.add("forgot-page-active")
    document.documentElement.classList.add("forgot-page-active")
    const appContainer = document.getElementById("root") || document.getElementById("app")
    if (appContainer) appContainer.classList.add("forgot-app-container")
    if (containerRef.current)
      Object.assign(containerRef.current.style, {
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "4rem",
      })
  }

  // Efecto para manejar estilos y limpieza al desmontar
  useEffect(() => {
    applyForcedStyles()
    const initialTimeout = setTimeout(applyForcedStyles, 100)
    const intervalId = setInterval(applyForcedStyles, 500)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
      document.body.classList.remove("forgot-page-active")
      document.documentElement.classList.remove("forgot-page-active")
      const appContainer = document.getElementById("root") || document.getElementById("app")
      if (appContainer) appContainer.classList.remove("forgot-app-container")
    }
  }, [])

  // Función de validación de campos
  const validateField = (name, value) => {
    let error = ""
    if (name === "email") {
      if (!value.trim()) error = "El email es obligatorio"
      else if (value.length > 80) error = "Máximo 80 caracteres"
      else if (/\s/.test(value)) error = "No se permiten espacios"
      else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) error = "Formato inválido"
    }
    return error
  }

  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    const processedValue = value.toLowerCase()
    const error = validateField(name, processedValue)
    setErrors((prev) => ({ ...prev, [name]: error, general: "" }))
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  // Validación completa del formulario
  const validateForm = () => {
    const newErrors = { ...errors }
    const error = validateField("email", formData.email)
    newErrors.email = error
    setErrors(newErrors)
    return !error
  }

  // Manejador de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors((prev) => ({ ...prev, general: "" }))

    if (!validateForm()) {
      setLoading(false)
      showErrorAlert("Por favor corrige los errores en el formulario antes de continuar")
      return
    }

    try {
      // Mostrar alerta de carga
      const loadingAlert = Swal.fire({
        title: "Enviando solicitud",
        html: '<p class="swal-loading-message">Estamos procesando tu solicitud...</p>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading()
        },
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
        },
        backdrop: `rgba(0,0,0,0.6)`,
      })

      // Llamada a la API para solicitar restablecimiento
      const response = await axios.post("https://gitbf.onrender.com/api/auth/request-password-reset", {
        email: formData.email.trim(),
      })

      loadingAlert.close()

      // Guardar email en localStorage para uso posterior
      localStorage.setItem("recoveryEmail", formData.email)

      // Mostrar alerta de éxito
      Swal.fire({
        title: '<span class="text-success">¡Código enviado!</span>',
        html: `
          <div class="swal-success-content">
            <p class="swal-success-message">Hemos enviado un código de verificación a:</p>
            <p class="swal-email-highlight">${formData.email}</p>
            <p class="swal-instruction">Por favor revisa tu bandeja de entrada y sigue las instrucciones.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Continuar",
        confirmButtonColor: "#10b981",
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
        },
        showClass: {
          popup: "animate__animated animate__zoomIn animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut animate__faster",
        },
        backdrop: `rgba(0,0,0,0.6)`,
        allowOutsideClick: false,
      }).then(() => navigate("/verify-token", { state: { email: formData.email } }))
    } catch (error) {
      // Manejo de diferentes tipos de errores
      let errorMessage = "Error al solicitar restablecimiento de contraseña"
      let errorDetail = "Por favor intenta nuevamente más tarde"

      if (error.response?.status === 404) {
        errorMessage = "Correo no registrado"
        errorDetail = "El correo electrónico ingresado no está asociado a ninguna cuenta"
      } else if (error.response?.status === 429) {
        errorMessage = "Demasiados intentos"
        errorDetail = "Has realizado muchas solicitudes. Intenta nuevamente más tarde"
      } else if (error.request) {
        errorMessage = "Error de conexión"
        errorDetail = "No se pudo conectar al servidor. Verifica tu conexión a internet"
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }))

      showErrorAlert(`
        <div class="swal-error-content">
          <p class="swal-error-title">${errorMessage}</p>
          <p class="swal-error-detail">${errorDetail}</p>
        </div>
      `)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-container" ref={containerRef}>
      <div className="forgot-background">
        <div className="background-pattern-forgot"></div>
      </div>

      {/* Tarjeta principal con animación de entrada */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="forgot-card"
      >
        {/* Sección de contenido (formulario) */}
        <div className="forgot-content">
          <div className="form-container-forgot">
            <h2 className="welcome-text-forgot">Recupera tu contraseña</h2>

            {/* Mensaje de error general */}
            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="error-message"
              >
                {errors.general}
              </motion.div>
            )}

            <p className="instruction-text-forgot">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {/* Formulario principal */}
            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="input-group-forgot">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`form-input-forgot ${errors.email ? "input-error" : ""}`}
                  placeholder=" "
                  maxLength={80}
                />
                <label htmlFor="email" className="input-label-forgot">
                  Correo electrónico *
                </label>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              {/* Botón de envío con animaciones */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="forgot-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="loader">
                    <div className="loader-circle"></div>
                  </div>
                ) : (
                  "Enviar enlace de recuperación"
                )}
              </motion.button>
            </form>

            {/* Enlace para volver al login */}
            <div className="additional-options-forgot">
              <Link to="/login" className="option-link-forgot">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Sección decorativa (lado derecho en desktop) */}
        <div className="forgot-decoration">
          <div className="decoration-content-forgot">
            {/* Logo con animación */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="logo-container-forgot"
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SPA%20Y%20BELLEZA%20MARCA%20DE%20AGUA%20BLANCA-VFG4JvBoS4w0THbQFEavbRqsd9HDxv.png"
                alt="SPA Y BELLEZA"
                className="logo-image-forgot"
              />
            </motion.div>
            
            {/* Textos decorativos con animaciones */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="decoration-title-forgot"
            >
              Recupera tu acceso
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="decoration-text-forgot"
            >
              Estamos aquí para ayudarte a recuperar tu cuenta
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
