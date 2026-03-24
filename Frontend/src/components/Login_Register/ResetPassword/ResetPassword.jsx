// Archivo: ResetPassword.jsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import axios from "axios"
import Swal from "sweetalert2"
import "./ResetPassword.css"

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [resetToken, setResetToken] = useState(location.state?.resetToken || localStorage.getItem("resetToken") || "")
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem("recoveryEmail") || "")

  useEffect(() => {
    if (!resetToken) {
      Swal.fire({ icon: "error", title: "Acceso no autorizado", text: "Primero verifica tu código.", confirmButtonText: "Entendido" })
        .then(() => navigate("/forgot-password"))
    }
  }, [resetToken, navigate])

  useEffect(() => {
    document.body.classList.add("reset-page-active")
    document.documentElement.classList.add("reset-page-active")
    const appContainer = document.getElementById("root") || document.getElementById("app")
    if (appContainer) appContainer.classList.add("reset-app-container")
    if (containerRef.current) Object.assign(containerRef.current.style, {
      height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "4rem"
    })
    return () => {
      document.body.classList.remove("reset-page-active")
      document.documentElement.classList.remove("reset-page-active")
      if (appContainer) appContainer.classList.remove("reset-app-container")
    }
  }, [])

  const validatePassword = (password) => {
    if (!password) return "La contraseña es obligatoria"
    if (password.length < 8) return "Mínimo 8 caracteres"
    if (password.length > 64) return "Máximo 64 caracteres"
    if (/\s/.test(password)) return "No se permiten espacios"
    if (/^[a-zA-Z]+$/.test(password)) return "Agrega números o símbolos"
    if (/^\d+$/.test(password)) return "No puede ser solo números"
    if (/^[^a-zA-Z0-9]+$/.test(password)) return "No solo símbolos"
    return ""
  }

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Confirma tu contraseña"
    if (confirmPassword !== password) return "No coinciden"
    return ""
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    setErrors(prev => ({
      ...prev,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(confirmPassword, value)
    }))
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    setErrors(prev => ({
      ...prev,
      confirmPassword: validateConfirmPassword(value, password)
    }))
  }

  const validateForm = () => {
    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(confirmPassword, password)
    setErrors({ password: passwordError, confirmPassword: confirmError })
    return !passwordError && !confirmError
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  if (!validateForm()) {
    setLoading(false)
    return
  }
  try {
    const response = await axios.post("https://gitbf.onrender.com/api/auth/reset-password", { 
      token: resetToken, 
      password, 
      confirmPassword 
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    Swal.fire({ 
      icon: "success", 
      title: "¡Contraseña restablecida!", 
      text: "Tu contraseña fue actualizada.", 
      confirmButtonText: "Iniciar sesión" 
    }).then(() => {
      localStorage.removeItem("recoveryEmail")
      localStorage.removeItem("resetToken")
      navigate("/login")
    })
  } catch (error) {
    console.error("Error completo:", error)
    let errorMessage = "Error al restablecer la contraseña"
    
    if (error.response) {
      if (error.response.status === 401 && error.response.data?.expired) {
        Swal.fire({ 
          icon: "error", 
          title: "Sesión expirada", 
          text: "El tiempo para restablecer ha expirado. Solicita un nuevo código.", 
          confirmButtonText: "Entendido" 
        }).then(() => navigate("/forgot-password"))
        return
      }
      if (error.response.data?.message) {
        errorMessage = error.response.data.message
      }
    }
    
    Swal.fire({ 
      icon: "error", 
      title: "Error", 
      text: errorMessage, 
      confirmButtonText: "Entendido" 
    })
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="reset-container" ref={containerRef}>
      <div className="reset-background">
        <div className="background-pattern-reset"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="reset-card"
      >
        <div className="reset-content">
          <div className="form-container-reset">
            <h2 className="welcome-text-reset">Establece tu nueva contraseña</h2>

            <p className="instruction-text-reset">
              Crea una nueva contraseña segura para tu cuenta.
            </p>


            <form onSubmit={handleSubmit} className="reset-form">
              <div className="input-group-reset">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  minLength={8}
                  maxLength={64}
                  className={`form-input-reset ${errors.password ? 'input-error' : ''}`}
                  placeholder=" "
                />
                <label className="input-label-reset">Nueva contraseña *</label>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="input-group-reset">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  required
                  minLength={8}
                  maxLength={64}
                  className={`form-input-reset ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder=" "
                />
                <label className="input-label-reset">Confirmar contraseña *</label>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="reset-button"
                type="submit"
                disabled={loading || errors.password || errors.confirmPassword}
              >
                {loading ? (
                  <div className="loader">
                    <div className="loader-circle"></div>
                  </div>
                ) : (
                  "Restablecer contraseña"
                )}
              </motion.button>
            </form>

            <div className="additional-options-reset">
              <motion.button 
                onClick={() => navigate("/login")} 
                whileHover={{ scale: 1.05 }} 
                className="option-link-reset"
              >
                Volver al inicio de sesión
              </motion.button>
            </div>
          </div>
        </div>

        <div className="reset-decoration">
          <div className="decoration-content-reset">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="logo-container-reset"
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SPA%20Y%20BELLEZA%20MARCA%20DE%20AGUA%20BLANCA-VFG4JvBoS4w0THbQFEavbRqsd9HDxv.png"
                alt="SPA Y BELLEZA"
                className="logo-image-reset"
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="decoration-title-reset"
            >
              Seguridad renovada
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="decoration-text-reset"
            >
              Protege tu cuenta con una nueva contraseña
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}