"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import axios from "axios"
import Swal from "sweetalert2"
import "./Register.css"
import { useAuth } from "../../context/AuthContext"

export default function Register() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: "",
    password: "",
    confirmPassword: "",
    general: ""
  })

  const [loading, setLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()
  const registerContainerRef = useRef(null)

  const showErrorAlert = (message) => {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
      backdrop: `
        rgba(0,0,0,0.7)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `
    })
  }

  const showSuccessAlert = () => {
    Swal.fire({
      title: '¡Cuenta creada con éxito!',
      text: 'Bienvenido/a a nuestra comunidad',
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#3085d6',
      timer: 3000,
      timerProgressBar: true,
      willClose: () => {
        navigate("/")
      }
    })
  }

  const applyForcedStyles = () => {
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    document.body.classList.add("register-page-active")
    document.documentElement.classList.add("register-page-active")

    const appContainer = document.getElementById("root") || document.getElementById("app")
    if (appContainer) {
      appContainer.classList.add("register-app-container")
      appContainer.style.overflow = "hidden"
      appContainer.style.height = "100vh"
    }

    if (registerContainerRef.current) {
      registerContainerRef.current.style.height = "90vh"
      registerContainerRef.current.style.width = "100%"
      registerContainerRef.current.style.display = "flex"
      registerContainerRef.current.style.alignItems = "flex-start"
      registerContainerRef.current.style.justifyContent = "center"
      registerContainerRef.current.style.paddingTop = "1vh"
      registerContainerRef.current.style.overflow = "hidden"
    }
  }

  useEffect(() => {
    applyForcedStyles()
    const initialTimeout = setTimeout(applyForcedStyles, 100)
    const intervalId = setInterval(applyForcedStyles, 500)

    const preventScroll = (e) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    window.addEventListener("scroll", preventScroll, { passive: false })
    document.addEventListener("touchmove", preventScroll, { passive: false })

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(intervalId)
      document.body.classList.remove("register-page-active")
      document.documentElement.classList.remove("register-page-active")
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""

      window.removeEventListener("scroll", preventScroll)
      document.removeEventListener("touchmove", preventScroll)
      window.removeEventListener("mousemove", handleMouseMove)

      const appContainer = document.getElementById("root") || document.getElementById("app")
      if (appContainer) {
        appContainer.classList.remove("register-app-container")
        appContainer.style.overflow = ""
        appContainer.style.height = ""
      }
    }
  }, [])

  const validateField = (name, value) => {
    let error = ""
    
    switch(name) {
      case "nombre":
        if (!value.trim()) {
          error = "El nombre es obligatorio" // CEVN4
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = "Solo letras, espacios y tildes permitidos" // CEVN5, CEVN6
        } else if (value.length < 3) {
          error = "Mínimo 3 caracteres" // CEVN7
        } else if (value.length > 20) {
          error = "Máximo 20 caracteres" // CEVN8
        } else if (value.trim().split(/\s+/).some(word => word.length === 1)) {
          error = "Cada palabra debe tener al menos 2 letras" // CEVN7
        }
        break
        
      case "apellido":
        if (!value.trim()) {
          error = "El apellido es obligatorio" // CEVN4
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          error = "Solo letras, espacios y tildes permitidos" // CEVN5, CEVN6
        } else if (value.length < 3) {
          error = "Mínimo 3 caracteres" // CEVN7
        } else if (value.length > 20) {
          error = "Máximo 20 caracteres" // CEVN8
        } else if (value.trim().split(/\s+/).some(word => word.length === 1)) {
          error = "Cada palabra debe tener al menos 2 letras" // CEVN7
        }
        break
        
      case "email":
        if (!value.trim()) {
          error = "El email es obligatorio" // CEVN10
        } else if (value.length > 80) {
          error = "Máximo 80 caracteres" // CEVN11
        } else if (/\s/.test(value)) {
          error = "No se permiten espacios" // CEVN9
        } else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
          error = "Formato de email inválido" // CEVN1-8
        } else if ((value.match(/@/g) || []).length > 1) {
          error = "Solo se permite un símbolo @" // CEVN3
        } else if (!value.includes('.')) {
          error = "Dominio incompleto" // CEVN5, CEVN7
        }
        break
        
      case "celular":
        if (!value.trim()) {
          error = "El celular es obligatorio" // CEVN6
        } else if (!/^[0-9]+$/.test(value)) {
          error = "Solo se permiten números" // CEVN4, CEVN5
        } else if (value.length !== 10) {
          error = "Debe tener exactamente 10 dígitos" // CEVN1, CEVN2
        } else if (value.startsWith('0')) {
          error = "No puede comenzar con 0" // CEVN3
        } else if (/^0+$/.test(value)) {
          error = "No puede ser solo ceros" // CEVN7
        } else if (value.includes(' ')) {
          error = "No se permiten espacios" // CEVN8
        } else if (value.startsWith('-')) {
          error = "No se permiten números negativos" // CEVN9
        }
        break
        
      case "password":
        if (!value) {
          error = "La contraseña es obligatoria" // CEVN9
        } else if (value.length < 8) {
          error = "Mínimo 8 caracteres" // CEVN5
        } else if (value.length > 64) {
          error = "Máximo 64 caracteres" // CEVN6, CEVN7
        } else if (/\s/.test(value)) {
          error = "No se permiten espacios" // CEVN8
        } else if (!/[A-Z]/.test(value)) {
          error = "Al menos una mayúscula" // CEVN4
        } else if (!/[0-9]/.test(value)) {
          error = "Al menos un número" // CEVN4
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          error = "Al menos un carácter especial" // CEVN4
        }
        break
        
      case "confirmPassword":
        if (!value) {
          error = "Confirma tu contraseña" // CEVN2
        } else if (value !== formData.password) {
          error = "Las contraseñas no coinciden" // CEVN1
        }
        break
        
      default:
        break
    }
    
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Convertir email a minúsculas mientras se escribe
    const processedValue = name === "email" ? value.toLowerCase() : value
    
    const error = validateField(name, processedValue)
    
    setErrors(prev => ({
      ...prev,
      [name]: error,
      general: ""
    }))
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }))

    if (name === "password") {
      let strength = 0
      if (processedValue.length >= 8) strength += 25
      if (/[A-Z]/.test(processedValue)) strength += 25
      if (/[0-9]/.test(processedValue)) strength += 25
      if (/[^A-Za-z0-9]/.test(processedValue)) strength += 25
      setPasswordStrength(strength)
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {...errors}
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      newErrors[key] = error
      if (error) isValid = false
    })
    
    setErrors(newErrors)
    return isValid
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors(prev => ({...prev, general: ""}))
    
    if (!validateForm()) {
      setLoading(false)
      showErrorAlert("Por favor corrige los errores en el formulario")
      return
    }

    try {
      const response = await axios.post(
        "https://gitbf.onrender.com/api/auth/register",
        {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          celular: formData.celular.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      const { token, role, user } = response.data
      login({
        token,
        role,
        _id:  user._id, // Asegúrate de usar el campo correcto del backend
        nombre:  user.name, // Asegúrate de usar el campo correcto del backend
        correo:  user.email, // Asegúrate de usar el campo correcto del backend
      })
      
      // localStorage.setItem("token", token)
      // localStorage.setItem("userRole", role.toLowerCase())
      // if (user?.id) {
      //   localStorage.setItem("userId", user.id)
      // }

      showSuccessAlert()

      if (role.toLowerCase() === "admin") {
        navigate("/dashboard")
      } else {
        navigate("/")
      }
    } catch (error) {
      console.error("Registration error:", error)
  //       console.log("Detalles del error de Axios:", {
  //   message: error.message,
  //   status: error?.response?.status,
  //   data: error?.response?.data,
  //   headers: error?.response?.headers,
  // });


      let errorMessage = "Error al registrar. Por favor intente nuevamente."

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.msg || "Datos inválidos"
        } else if (error.response.status === 409) {
          errorMessage = "El correo electrónico ya está registrado"
        }
      } else if (error.request) {
        errorMessage = "No se pudo conectar al servidor. Verifique su conexión."
      }

      setErrors(prev => ({...prev, general: errorMessage}))
      showErrorAlert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container" ref={registerContainerRef}>
      <div className="register-background">
        <div className="background-pattern-register"></div>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="floating-bubble-register"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 60 + 40}px`,
              height: `${Math.random() * 60 + 40}px`,
              transform: `translate(
                ${Math.sin((mousePosition.x + i * 100) * 0.01) * 20}px,
                ${Math.cos((mousePosition.y + i * 100) * 0.01) * 20}px
              )`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="register-card"
      >
        <div className="register-content">
          <div className="header-container-register">

          </div>

          <div className="form-container-register">
            <h2 className="welcome-text-register">Crear una cuenta</h2>

            {errors.general && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="error-message">
                {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="input-group-register">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.nombre ? 'input-error' : ''}`}
                  placeholder=" "
                  maxLength={20}
                />
                <label htmlFor="nombre" className="input-label-register">Nombre *</label>
                {errors.nombre && <span className="field-error">{errors.nombre}</span>}
              </div>

              <div className="input-group-register">
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.apellido ? 'input-error' : ''}`}
                  placeholder=" "
                  maxLength={20}
                />
                <label htmlFor="apellido" className="input-label-register">Apellido *</label>
                {errors.apellido && <span className="field-error">{errors.apellido}</span>}
              </div>

              <div className="input-group-register">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.email ? 'input-error' : ''}`}
                  placeholder=" "
                  maxLength={80}
                />
                <label htmlFor="email" className="input-label-register">Correo electrónico *</label>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="input-group-register">
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.celular ? 'input-error' : ''}`}
                  placeholder=" "
                  maxLength={10}
                />
                <label htmlFor="celular" className="input-label-register">Celular *</label>
                {errors.celular && <span className="field-error">{errors.celular}</span>}
              </div>

              <div className="input-group-register">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.password ? 'input-error' : ''}`}
                  placeholder=" "
                  minLength={8}
                  maxLength={64}
                />
                <label htmlFor="password" className="input-label-register">Contraseña *</label>
                {errors.password && <span className="field-error">{errors.password}</span>}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: `hsl(${passwordStrength}, 70%, 45%)`,
                        }}
                      />
                    </div>
                    <span className="strength-text">
                      {passwordStrength <= 25 && "Débil"}
                      {passwordStrength > 25 && passwordStrength <= 50 && "Regular"}
                      {passwordStrength > 50 && passwordStrength <= 75 && "Buena"}
                      {passwordStrength > 75 && "Fuerte"}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-group-register">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`form-input-register ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder=" "
                  minLength={8}
                  maxLength={64}
                />
                <label htmlFor="confirmPassword" className="input-label-register">Confirmar contraseña *</label>
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="register-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="loader">
                    <div className="loader-circle"></div>
                  </div>
                ) : (
                  "Crear cuenta"
                )}
              </motion.button>
            </form>

            <div className="terms-privacy">
              <p>
                Al registrarte, aceptas nuestros{" "}
                <Link to="/terminos" className="terms-link">
                  Términos de servicio
                </Link>{" "}
                y{" "}
                <Link to="/privacidad" className="terms-link">
                  Política de privacidad
                </Link>
              </p>
            </div>

            <div className="login-option">
              <p>
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login" className="login-link">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="register-decoration">
          <div className="decoration-content-register">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="logo-container-register"
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SPA%20Y%20BELLEZA%20MARCA%20DE%20AGUA%20BLANCA-VFG4JvBoS4w0THbQFEavbRqsd9HDxv.png"
                alt="SPA Y BELLEZA"
                className="logo-image-register"
                onError={(e) => {
                  e.target.src = "/default-logo.png"
                }}
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="decoration-title-register"
            >
              Únete a Nuestra Comunidad
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="decoration-text-register"
            >
              Descubre un mundo de belleza y profesionalismo con nosotros
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}