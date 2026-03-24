// Archivo: VerifyToken.jsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import axios from "axios"
import Swal from "sweetalert2"
import "./VerifyToken.css"

export default function VerifyToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [token, setToken] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("recoveryEmail") || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (!email) {
      showErrorAlert({
        title: "Datos incompletos",
        message: "Falta el correo electrónico para continuar con la verificación.",
        onConfirm: () => navigate("/forgot-password"),
      })
    }
  }, [email, navigate])

  useEffect(() => {
    document.body.classList.add("verify-page-active")
    document.documentElement.classList.add("verify-page-active")
    const appContainer = document.getElementById("root") || document.getElementById("app")
    if (appContainer) appContainer.classList.add("verify-app-container")
    if (containerRef.current)
      Object.assign(containerRef.current.style, {
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "4rem",
      })
    return () => {
      document.body.classList.remove("verify-page-active")
      document.documentElement.classList.remove("verify-page-active")
      if (appContainer) appContainer.classList.remove("verify-app-container")
    }
  }, [])

  // Inicializar refs para los inputs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
    // Enfocar el primer input al cargar
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0].focus()
      }, 300)
    }
  }, [])

  const showErrorAlert = ({ title, message, onConfirm }) => {
    Swal.fire({
      title: `<span class="text-error">${title}</span>`,
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
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm()
      }
    })
  }

  const showSuccessAlert = ({ title, message, onConfirm }) => {
    Swal.fire({
      title: `<span class="text-success">${title}</span>`,
      html: `<div class="swal-success-content">${message}</div>`,
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
    }).then((result) => {
      if (result.isConfirmed && onConfirm) {
        onConfirm()
      }
    })
  }

  const showLoadingAlert = () => {
    return Swal.fire({
      title: "Verificando código",
      html: '<p class="swal-loading-message">Estamos validando tu código de verificación...</p>',
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
  }

  const validateToken = (tokenArray) => {
    const tokenString = tokenArray.join("")
    if (tokenString.length !== 6) return "El código debe tener 6 dígitos"
    if (!/^\d+$/.test(tokenString)) return "Solo se permiten números"
    return ""
  }

  const handleInputChange = (index, value) => {
    // Solo permitir dígitos
    if (!/^\d*$/.test(value)) return

    const newToken = [...token]
    newToken[index] = value

    setToken(newToken)
    setError("")

    // Si se ingresó un dígito y no es el último input, mover al siguiente
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Si se presiona Backspace en un input vacío, mover al anterior
    if (e.key === "Backspace" && token[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus()
    }
    // Si se presiona la flecha izquierda, mover al input anterior
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus()
    }
    // Si se presiona la flecha derecha, mover al siguiente input
    else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData("text/plain")
      .replace(/[^0-9]/g, "")
      .slice(0, 6)

    if (pastedData) {
      const newToken = [...token]
      for (let i = 0; i < 6; i++) {
        newToken[i] = i < pastedData.length ? pastedData[i] : ""
      }
      setToken(newToken)

      // Enfocar el último input con valor o el siguiente vacío
      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex].focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const tokenString = token.join("")
    const tokenError = validateToken(token)

    if (tokenError) {
      setError(tokenError)
      return
    }

    setLoading(true)

    try {
      // Mostrar alerta de carga
      const loadingAlert = showLoadingAlert()

      const response = await axios.post("https://gitbf.onrender.com/api/auth/verify-reset-token", {
        token: tokenString,
        email,
      })

      // Cerrar alerta de carga
      loadingAlert.close()

      const resetToken = response.data.resetToken
      if (!resetToken) throw new Error("No se recibió token de restablecimiento")

      // Guardar ambos en localStorage
      localStorage.setItem("resetToken", resetToken)
      localStorage.setItem("recoveryEmail", email)

      // Mostrar alerta de éxito
      showSuccessAlert({
        title: "¡Código verificado!",
        message: `
          <p class="swal-success-message">Tu código ha sido verificado correctamente.</p>
          <p class="swal-instruction">Ahora puedes crear una nueva contraseña para tu cuenta.</p>
        `,
        onConfirm: () => {
          navigate("/reset-password", {
            state: {
              resetToken,
              email,
            },
          })
        },
      })
    } catch (err) {
      let title = "Error de verificación"
      let message = "No pudimos verificar tu código. Por favor intenta nuevamente."

      if (err.response?.status === 400 || err.response?.status === 401) {
        title = "Código inválido"
        message = "El código ingresado es incorrecto o ha expirado."

        if (err.response.data?.expired) {
          showErrorAlert({
            title: "Código expirado",
            message: "El código de verificación ha expirado. Por favor solicita uno nuevo.",
            onConfirm: () => navigate("/forgot-password"),
          })
          setLoading(false)
          return
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      } else if (err.request) {
        title = "Error de conexión"
        message = "No pudimos conectar con el servidor. Por favor verifica tu conexión a internet."
      } else {
        message = `Error: ${err.message}`
      }

      setError(message)
      showErrorAlert({ title, message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="verify-container" ref={containerRef}>
      <div className="verify-background">
        <div className="background-pattern-verify"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="verify-card"
      >
        <div className="verify-content">
          <div className="form-container-verify">
            <h2 className="welcome-text-verify">Verificar código</h2>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-message">
                {error}
              </motion.div>
            )}

            <p className="instruction-text-verify">
              Ingresa el código de 6 dígitos que hemos enviado a:
              <span className="email-highlight">{email}</span>
            </p>

            <form onSubmit={handleSubmit} className="verify-form">
              <div className="verification-code-container">
                {token.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="verification-code-input"
                    required
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="verify-button"
                type="submit"
                disabled={loading || token.join("").length !== 6}
              >
                {loading ? (
                  <div className="loader">
                    <div className="loader-circle"></div>
                  </div>
                ) : (
                  "Verificar código"
                )}
              </motion.button>
            </form>

            <div className="additional-options-verify">
              <motion.button
                onClick={() => navigate("/forgot-password")}
                whileHover={{ scale: 1.05 }}
                className="option-link-verify"
              >
                Solicitar nuevo código
              </motion.button>
              <motion.button
                onClick={() => navigate("/login")}
                whileHover={{ scale: 1.05 }}
                className="option-link-verify"
              >
                Volver al inicio de sesión
              </motion.button>
            </div>
          </div>
        </div>

        <div className="verify-decoration">
          <div className="decoration-content-verify">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="logo-container-verify"
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SPA%20Y%20BELLEZA%20MARCA%20DE%20AGUA%20BLANCA-VFG4JvBoS4w0THbQFEavbRqsd9HDxv.png"
                alt="SPA Y BELLEZA"
                className="logo-image-verify"
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="decoration-title-verify"
            >
              Verificación
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="decoration-text"
            >
              Estamos a un paso de recuperar tu acceso
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
