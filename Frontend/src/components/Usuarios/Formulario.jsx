"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FaSpinner, FaUser, FaEnvelope, FaPhone, FaLock, FaUserTag, FaSuperpowers } from "react-icons/fa"

import "./formularioUsuarios.css"

// Importar el hook useSidebar
import { useSidebar } from "../Sidebar/Sidebar"

export default function FormularioUsuario({ onClose, onUsuarioActualizado, usuarioEditando, roles }) {
  // Añadir el hook useSidebar al inicio del componente
  const { isCollapsed } = useSidebar()

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    celular: "",
    password: "",
    confirmPassword: "",
    rol: "",
    tipoUsuario: "",
    estado: "Activo", // Cambiado de boolean a string
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [originalRolId, setOriginalRolId] = useState("")
  const [fetchingCurrentUser, setFetchingCurrentUser] = useState(false)
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const allowedDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];

  useEffect(() => {
    if (usuarioEditando) {
      // Find the role object to determine the user type
      const userRole = roles.find((r) => r._id === usuarioEditando.rol)
      const tipoUsuario = userRole
        ? userRole.nombreRol.toLowerCase() === "cliente"
          ? "cliente"
          : userRole.nombreRol.toLowerCase() === "empleado"
            ? "empleado"
            : ""
        : ""

      setFormData((prevState) => ({
        ...prevState,
        nombre: usuarioEditando.nombre || "",
        apellido: usuarioEditando.apellido || "",
        email: usuarioEditando.email || "",
        celular: usuarioEditando.celular || "",
        rol: usuarioEditando.rol || "",
        tipoUsuario: tipoUsuario,
        estado: usuarioEditando.estado ? "Activo" : "Inactivo",
      }))

      // Guardar el ID del rol original para comparar si cambia
      setOriginalRolId(typeof usuarioEditando.rol === "object" ? usuarioEditando.rol._id : usuarioEditando.rol)
    } else {
      // For new users, set default role if available
      const clienteRole = roles.find((r) => r.nombreRol.toLowerCase() === "cliente")
      if (clienteRole) {
        setFormData((prevState) => ({
          ...prevState,
          rol: clienteRole._id,
          tipoUsuario: "cliente",
        }))
      }
    }
  }, [usuarioEditando, roles])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      // Convertir el checkbox a 'Activo'/'Inactivo'
      setFormData((prevState) => ({
        ...prevState,
        [name]: e.target.checked ? "Activo" : "Inactivo",
      }))
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }))
    }

    if (name === 'email') {
    const domain = value.split('@')[1]?.toLowerCase();
    if (domain && !allowedDomains.includes(domain)) {
      setFormErrors((prev) => ({
        ...prev,
        email: 'Solo se permiten correos de gmail, hotmail, outlook, yahoo o icloud',
      }));
    } else {
      setFormErrors((prev) => ({ ...prev, email: '' }));
    }
  }
    // Validación de coincidencia de contraseña en tiempo real
  if (name === "password" || name === "confirmPassword") {
    const newPassword = name === "password" ? value : formData.password
    const confirmPassword = name === "confirmPassword" ? value : formData.confirmPassword

    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError("Las contraseñas no coinciden")
    } else {
      setPasswordMatchError("")
    }
  }

    // Si se selecciona un rol, actualizar automáticamente el tipoUsuario
    if (name === "rol") {
      const selectedRole = roles.find((r) => r._id === value)
      if (selectedRole) {
        const tipoUsuario =
          selectedRole.nombreRol.toLowerCase() === "cliente"
            ? "cliente"
            : selectedRole.nombreRol.toLowerCase() === "empleado"
              ? "empleado"
              : ""
        setFormData((prevState) => ({
          ...prevState,
          tipoUsuario,
        }))
      }
    }
  }

  // Función para obtener los datos actuales del usuario antes de actualizar
  const fetchCurrentUserData = async (userId) => {
    try {
      setFetchingCurrentUser(true)
      const token = localStorage.getItem("token")
      const response = await axios.get(`https://gitbf.onrender.com/api/usuarios/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error al obtener datos actuales del usuario:", error)
      return null
    } finally {
      setFetchingCurrentUser(false)
    }
  }

  // Función actualizada para manejar la actualización de usuarios
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    

    // Validar campos obligatorios
    if (
      !formData.nombre ||
      !formData.apellido ||
      !formData.email ||
      !formData.celular ||
      !formData.rol ||
      (!usuarioEditando && (!formData.password || !formData.confirmPassword))
    ) {
      setError("Todos los campos son obligatorios")
      setLoading(false)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los campos son obligatorios",
        confirmButtonColor: "#db2777",
      })
      return
    }

    // Validar coincidencia de contraseñas
    if (!usuarioEditando && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
        confirmButtonColor: "#db2777",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")

      // Determinar el tipo de usuario basado en el rol seleccionado
      const selectedRole = roles.find((r) => r._id === formData.rol)
      const isEmpleado = selectedRole && selectedRole.nombreRol.toLowerCase() === "empleado"
      const isCliente = selectedRole && selectedRole.nombreRol.toLowerCase() === "cliente"

      // Verificar si estamos cambiando de rol
      const isRolChanging = usuarioEditando && originalRolId !== formData.rol

      // Si estamos cambiando de rol, usar el endpoint específico para actualizar el rol
      if (isRolChanging && usuarioEditando) {
        // Primero actualizar los datos básicos sin cambiar el rol
        const basicUpdateData = {
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim(),
          celular: formData.celular.trim(),
          estado: formData.estado === "Activo",
        }

        // Si es empleado, agregar campos específicos
        if (isEmpleado) {
          basicUpdateData.especialidad = "General"
          basicUpdateData.salario = 0
        }

        // Actualizar primero los datos básicos
        await axios({
          method: "PUT",
          url: `https://gitbf.onrender.com/api/usuarios/${usuarioEditando._id}`,
          data: basicUpdateData,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        // Luego, actualizar solo el rol usando el nuevo endpoint
        const rolUpdateData = {
          rol: formData.rol,
          // Incluir campos adicionales necesarios para el nuevo rol
          especialidad: isEmpleado ? "General" : undefined,
          salario: isEmpleado ? 0 : undefined,
        }

        await axios({
          method: "PUT",
          url: `https://gitbf.onrender.com/api/usuarios/${usuarioEditando._id}/update-rol`,
          data: rolUpdateData,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        Swal.fire({
          icon: "success",
          title: "Actualización Exitosa",
          text: "Usuario actualizado exitosamente!",
          confirmButtonColor: "#db2777",
        })

        onUsuarioActualizado()
        onClose()
        return
      }

      // Si no estamos cambiando de rol, o es un nuevo usuario, usar el endpoint normal
      const userData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        celular: formData.celular.trim(),
        rol: formData.rol,
        estado: formData.estado === "Activo",
      }

      // Si es un nuevo usuario, agregar contraseña
      if (!usuarioEditando) {
        userData.password = formData.password
        userData.confirmPassword = formData.confirmPassword
      }

      // // Agregar datos específicos para empleado según el modelo exacto
      // if (isEmpleado) {
      //   userData.nombreempleado = formData.nombre.trim()
      //   userData.apellidoempleado = formData.apellido.trim()
      //   userData.correoempleado = formData.email.trim()
      //   userData.telefonoempleado = formData.celular.trim()
      //   userData.estadoempleado = formData.estado === "Activo"

      //   // Asegurarse de que todos los campos requeridos para Empleado estén presentes
      //   userData.especialidad = "General" // Valor por defecto
      //   userData.salario = 0 // Valor por defecto
      // }

      // // Agregar datos específicos para cliente según el modelo exacto
      // if (isCliente) {
      //   userData.nombrecliente = formData.nombre.trim()
      //   userData.apellidocliente = formData.apellido.trim()
      //   userData.correocliente = formData.email.trim()
      //   userData.celularcliente = formData.celular.trim()
      //   userData.estadocliente = formData.estado === "Activo"
      // }

      // console.log("Datos a enviar:", userData)

      // Usar axios para la solicitud
      const url = usuarioEditando
        ? `https://gitbf.onrender.com/api/usuarios/${usuarioEditando._id}`
        : "https://gitbf.onrender.com/api/usuarios"

      const response = await axios({
        method: usuarioEditando ? "PUT" : "POST",
        url,
        data: userData,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data) {
        Swal.fire({
          icon: "success",
          title: usuarioEditando ? "Actualización Exitosa" : "Registro Exitoso",
          text: usuarioEditando ? "Usuario actualizado exitosamente!" : "Usuario creado exitosamente!",
          confirmButtonColor: "#db2777",
        })

        onUsuarioActualizado()
        onClose()
      }
    } catch (error) {
  console.error("Error completo:", error)

  let errorMsg = "Error al procesar la solicitud"
  let errorDetails = ""

  if (error.response?.data?.errores && Array.isArray(error.response.data.errores)) {
    // Si viene un array de errores, lo convertimos a string amigable
    errorMsg = "Errores de validación: Intente corregir el campo de email usar un dominio válido"
    errorDetails = error.response.data.errores.join("\n")
  } else if (error.response?.data?.error) {
    errorMsg = error.response.data.error
  } else if (error.response?.data?.msg) {
    errorMsg = error.response.data.msg
  } else if (error.message) {
    errorMsg = error.message
  }

  setError(`${errorMsg} ${errorDetails}`)

  Swal.fire({
    icon: "error",
    title: "Error",
    text: errorMsg,
    footer: errorDetails || "Si el problema persiste, contacte al administrador del sistema",
    confirmButtonColor: "#db2777",
  })
}
finally {
      setLoading(false)
    }
  }

  return (
    <div className="formulario-moderno-user max-h-[80vh] overflow-y-auto bg-white p-6 rounded-lg shadow-lg w-full max-w-[100%]">
      <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: "#db2777" }}>
        {usuarioEditando ? "Editar Usuario" : "Agregar Usuario"}
      </h2>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div className="form-group">
          <label htmlFor="nombre" className="form-label">
            Nombre <span className="text-pink-500">*</span>
          </label>
          <div className="relative">
            
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
            </div>
            
            <input
            
              type="text"
              id="nombre"
              name="nombre"
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z\s]+$"
              title="El nombre solo puede contener letras y espacios"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="form-input-1  focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="Ingrese su nombre"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="apellido" className="form-label">
            Apellido <span className="text-pink-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSuperpowers className="text-gray-400" />
            </div>
            <input
              type="text"
              id="apellido"
              name="apellido"
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z\s]+$"
              title="El apellido solo puede contener letras y espacios"
              value={formData.apellido}
              onChange={handleChange}
              required
              className="form-input-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="Ingrese su apellido"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email <span className="text-pink-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              minLength={10}
              maxLength={80}
              pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+@(gmail\.com|hotmail\.com|outlook\.com|yahoo\.com|icloud\.com){2,}$"
              title="El email debe tener un formato válido, Solo se permiten correos de gmail, hotmail, outlook, yahoo o icloud "
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="ejemplo@dominio.com"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="celular" className="form-label">
            Celular <span className="text-pink-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="text-gray-400" />
            </div>
            <input
              type="text"
              id="celular"
              name="celular"
              minLength={10}
              maxLength={10}
              pattern="^[1-9][0-9]{9}$"
              title="El celular debe tener 10 dígitos y no puede comenzar con 0"
              value={formData.celular}
              onChange={handleChange}
              required
              className="form-input-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
              placeholder="Ingrese su número de celular"
            />
          </div>
        </div>

        {!usuarioEditando && (
          <>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  minLength={8}
                  maxLength={64}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,64}"
                  title="La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales"
                  className="form-input-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
                  placeholder="Ingrese su contraseña"
                />
              </div>
              {/* <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p> */}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Contraseña <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  maxLength={64}
                  className="form-input-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
                  placeholder="Confirme su contraseña"
                />
                {passwordMatchError && (
  <p className="text-red-500 text-sm mt-1 ml-8">{passwordMatchError}</p>
)}
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="rol" className="form-label">
            Rol <span className="text-pink-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUserTag className="text-gray-400" />
            </div>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              required
              className="form-select-1 pl-10 focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
            >
              <option value="">Seleccionar rol</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.nombreRol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="estado" className="form-label">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="form-select focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Campo oculto para asegurar que tipoUsuario siempre se envíe */}
        <input type="hidden" name="tipoUsuario" value={formData.tipoUsuario} />

        <div className="flex justify-between mt-6">
          <button type="submit" disabled={loading || fetchingCurrentUser} className="btn-primary">
            {loading || fetchingCurrentUser ? (
              <div className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                <span>Procesando...</span>
              </div>
            ) : usuarioEditando ? (
              "Actualizar Usuario"
            ) : (
              "Guardar Usuario"
            )}
          </button>
          <button type="button" onClick={onClose} disabled={loading || fetchingCurrentUser} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

