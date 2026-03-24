import { useState, useEffect } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import {
  FaUserCircle,
  FaCamera,
  FaEdit,
  FaSave,
  FaTimes,
  FaUserAlt,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaSync,
  FaIdCard,
  FaBriefcase,
  FaMoneyBillWave,
  FaStar,
  FaSpinner,
} from "react-icons/fa"
import "./UserProfile.css"

const UserProfile = () => {
  // Función para desplazar la página hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  // Datos del usuario
  const [userData, setUserData] = useState({
    _id: "",
    nombre: "",
    apellido: "",
    email: "",
    correo: "",
    celular: "",
    fechaRegistro: "",
    rol: "",
    rolId: "",
    estado: true,
    avatar: "avatar1", // Valor predeterminado
  })

  // Información adicional según el rol
  const [additionalInfo, setAdditionalInfo] = useState({})

  // Estado para el avatar seleccionado
  const [selectedAvatar, setSelectedAvatar] = useState("avatar1")

  // Opciones de avatares predefinidos con ilustraciones de personas
  const avatarOptions = [
    {
      id: "avatar1",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairStraight&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Light",
      gender: "female",
    },
    {
      id: "avatar2",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortRound&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Bat&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light",
      gender: "female",
    },
    {
      id: "avatar3",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Black&facialHairType=BeardLight&facialHairColor=Black&clotheType=Hoodie&clotheColor=Blue03&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
      gender: "male",
    },
    {
      id: "avatar4",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairShortWaved&accessoriesType=Prescription02&hairColor=BlondeGolden&facialHairType=MoustacheFancy&facialHairColor=BrownDark&clotheType=BlazerSweater&eyeType=Default&eyebrowType=RaisedExcited&mouthType=Default&skinColor=Pale",
      gender: "male",
    },
    {
      id: "avatar5",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=LongHairCurly&accessoriesType=Blank&hairColor=Red&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=PastelRed&eyeType=Surprised&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Tanned",
      gender: "female",
    },
    {
      id: "avatar6",
      url: "https://avataaars.io/?avatarStyle=Circle&topType=ShortHairTheCaesar&accessoriesType=Sunglasses&hairColor=Black&facialHairType=BeardMedium&facialHairColor=Black&clotheType=ShirtScoopNeck&clotheColor=Gray01&eyeType=Default&eyebrowType=Default&mouthType=Default&skinColor=Brown",
      gender: "male",
    },
  ]

  useEffect(() => {
    fetchUserData()

    // Cargar el avatar guardado en localStorage como respaldo
    const userId = localStorage.getItem("userId")
    const savedAvatar = localStorage.getItem(`userAvatar_${userId}`)
    if (savedAvatar) {
      setSelectedAvatar(savedAvatar)
      setUserData((prev) => ({
        ...prev,
        avatar: savedAvatar,
      }))
    }
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")

      setDebugInfo({
        userId,
        tokenExists: !!token,
        tokenFirstChars: token ? `${token.substring(0, 10)}...` : null,
      })

      if (!token || !userId) {
        throw new Error("No se encontró la información de autenticación")
      }

      const response = await axios.get(`https://gitbf.onrender.com/api/usuarios/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // console.log("Respuesta completa de la API:", response.data)

      if (!response.data) {
        throw new Error("La respuesta de la API no contiene datos del usuario")
      }

      const { usuario, infoAdicional } = response.data

      // Verificar si el servidor devuelve el campo avatar
      // console.log("¿El servidor devuelve avatar?", usuario.hasOwnProperty("avatar"))

      // Obtener el avatar del servidor o del localStorage como respaldo
      const userIdFromStorage = localStorage.getItem("userId")
      const savedAvatar = localStorage.getItem(`userAvatar_${userIdFromStorage}`)
      const avatarToUse = usuario.avatar || savedAvatar || "avatar1"

      // console.log("Avatar a usar:", avatarToUse)

      // Actualizar datos básicos del usuario
      setUserData({
        _id: usuario._id || "",
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        email: usuario.email || usuario.correo || "",
        correo: usuario.correo || usuario.email || "",
        celular: usuario.celular || "",
        fechaRegistro: usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString() : "",
        rol: usuario.rol?.nombreRol || "",
        rolId: typeof usuario.rol === "object" ? usuario.rol._id : usuario.rol,
        estado: usuario.estado !== undefined ? usuario.estado : true,
        avatar: avatarToUse, // Usar el avatar del servidor o el respaldo
      })

      // Actualizar el estado del avatar seleccionado
      setSelectedAvatar(avatarToUse)

      // Actualizar información adicional según el rol
      if (infoAdicional) {
        setAdditionalInfo(infoAdicional)
      }

      setError("")
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error)
      let errorMessage = "No se pudieron cargar los datos del usuario."

      if (error.response) {
        errorMessage += ` Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`
      } else if (error.request) {
        errorMessage += " No se pudo conectar con el servidor."
      } else {
        errorMessage += ` ${error.message}`
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatar(avatarId)
    // Actualizamos el estado local del usuario también
    setUserData((prev) => ({
      ...prev,
      avatar: avatarId,
    }))

    // Guardar en localStorage como respaldo, usando un ID único por usuario
    const userId = localStorage.getItem("userId")
    if (userId) {
      localStorage.setItem(`userAvatar_${userId}`, avatarId)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")

      if (!token || !userId) {
        throw new Error("No se encontró la información de autenticación")
      }

      // Validar campos obligatorios
      if (!userData.nombre || !userData.apellido || !userData.email || !userData.celular) {
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

      // Crear objeto con los datos a enviar
      const updateData = {
        nombre: userData.nombre.trim(),
        apellido: userData.apellido.trim(),
        email: userData.email.trim(),
        correo: userData.email.trim(),
        celular: userData.celular.trim(),
        estado: userData.estado,
        avatar: selectedAvatar,
      }

      // Si hay un rolId, incluirlo
      if (userData.rolId) {
        updateData.rol = userData.rolId
      }

      // console.log("Datos a enviar:", updateData)

      // Realizar la petición con axios
      const response = await axios({
        method: "PUT",
        url: `https://gitbf.onrender.com/api/usuarios/${userId}`,
        data: updateData,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      // console.log("Respuesta del servidor:", response.data)

      if (response.data && response.data.usuario) {
        Swal.fire({
          icon: "success",
          title: "Actualización Exitosa",
          text: "Perfil actualizado exitosamente!",
          confirmButtonColor: "#db2777",
        }).then(() => {
          // Desplazar hacia arriba después de cerrar la alerta
          scrollToTop()
        })

        setSuccess("¡Perfil actualizado con éxito!")

        // Actualizamos el estado local con la respuesta del servidor
        const usuarioActualizado = response.data.usuario

        // Verificar si el servidor devolvió el campo avatar en la respuesta
        // console.log("¿El servidor devuelve avatar en la respuesta?", usuarioActualizado.hasOwnProperty("avatar"))

        // Usar el avatar del servidor o mantener el seleccionado si el servidor no lo devuelve
        const avatarToUse = usuarioActualizado.avatar || selectedAvatar

        setUserData((prev) => ({
          ...prev,
          nombre: usuarioActualizado.nombre || prev.nombre,
          apellido: usuarioActualizado.apellido || prev.apellido,
          email: usuarioActualizado.email || usuarioActualizado.correo || prev.email,
          correo: usuarioActualizado.correo || usuarioActualizado.email || prev.correo,
          celular: usuarioActualizado.celular || prev.celular,
          avatar: avatarToUse,
        }))

        // Guardar en localStorage como respaldo
        localStorage.setItem(`userAvatar_${userId}`, avatarToUse)

        setEditMode(false)

        // Recargar los datos del usuario para asegurar que todo esté actualizado
        setTimeout(() => {
          fetchUserData()
        }, 1000)
      } else {
        throw new Error("La respuesta del servidor no contiene datos válidos")
      }

      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error) {
      console.error("Error al actualizar el perfil:", error)

      let errorMessage = "Error al actualizar el perfil. "

      if (error.response) {
        console.error("Detalles del error:", error.response.data)
        errorMessage += `Error ${error.response.status}: ${
          error.response.data.message || error.response.data.error || error.response.statusText
        }`

        if (error.response.status === 400 && error.response.data.errors) {
          const validationErrors = Object.values(error.response.data.errors)
            .map((err) => err.message || err)
            .join(". ")
          errorMessage += ` ${validationErrors}`
        }
      } else if (error.request) {
        errorMessage += "No se pudo conectar con el servidor. Verifica tu conexión a internet."
      } else {
        errorMessage += error.message
      }

      setError(errorMessage)

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#db2777",
      }).then(() => {
        // Desplazar hacia arriba después de cerrar la alerta
        scrollToTop()
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setError("") // Limpiar errores al cancelar
    fetchUserData() // Restaurar datos originales
    scrollToTop() // Desplazar hacia arriba
  }

  // Renderizar información adicional según el rol
  const renderAdditionalInfo = () => {
    if (userData.rol === "Cliente") {
      return (
        <>
          <div className="info-group">
            <div className="info-label">
              <FaIdCard className="info-icon" />
              <span>Nombre Cliente</span>
            </div>
            <div className="info-value">
              {additionalInfo.nombrecliente || `${userData.nombre} ${userData.apellido}`}
            </div>
          </div>
          {additionalInfo.correocliente && (
            <div className="info-group">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Correo Cliente</span>
              </div>
              <div className="info-value">{additionalInfo.correocliente}</div>
            </div>
          )}
          {additionalInfo.celularcliente && (
            <div className="info-group">
              <div className="info-label">
                <FaPhone className="info-icon" />
                <span>Celular Cliente</span>
              </div>
              <div className="info-value">{additionalInfo.celularcliente}</div>
            </div>
          )}
          {/* Se ha eliminado la visualización del estado del cliente */}
        </>
      )
    } else if (userData.rol === "Empleado") {
      return (
        <>
          <div className="info-group">
            <div className="info-label">
              <FaBriefcase className="info-icon" />
              <span>Nombre Empleado</span>
            </div>
            <div className="info-value">
              {additionalInfo.nombreempleado || `${userData.nombre} ${userData.apellido}`}
            </div>
          </div>
          {additionalInfo.correoempleado && (
            <div className="info-group">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Correo Empleado</span>
              </div>
              <div className="info-value">{additionalInfo.correoempleado}</div>
            </div>
          )}
          {additionalInfo.telefonoempleado && (
            <div className="info-group">
              <div className="info-label">
                <FaPhone className="info-icon" />
                <span>Teléfono</span>
              </div>
              <div className="info-value">{additionalInfo.telefonoempleado}</div>
            </div>
          )}
          {additionalInfo.especialidad && (
            <div className="info-group">
              <div className="info-label">
                <FaStar className="info-icon" />
                <span>Especialidad</span>
              </div>
              <div className="info-value">{additionalInfo.especialidad}</div>
            </div>
          )}
          {additionalInfo.salario && (
            <div className="info-group">
              <div className="info-label">
                <FaMoneyBillWave className="info-icon" />
                <span>Salario</span>
              </div>
              <div className="info-value">${additionalInfo.salario.toLocaleString()}</div>
            </div>
          )}
          {/* Se ha eliminado la visualización del estado del empleado */}
        </>
      )
    }
    return null
  }

  if (loading && !editMode) {
    return (
      <div className="profile-loading-container">
        <div className="profile-loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    )
  }

  // Obtener la URL del avatar actual
  const currentAvatarUrl = avatarOptions.find((a) => a.id === userData.avatar)?.url || avatarOptions[0].url

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          {userData.rol && <span className="profile-role">{userData.rol}</span>}
        </div>

        {error && (
          <div className="profile-error-message">
            <FaExclamationTriangle className="error-icon" />
            <div>
              <p>{error}</p>
              <button className="retry-button" onClick={fetchUserData}>
                <FaSync /> Reintentar
              </button>
            </div>
          </div>
        )}

        {debugInfo && error && (
          <div className="debug-info">
            <h3>Información de depuración:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        {success && <div className="profile-success-message">{success}</div>}

        <div className="profile-photo-section">
          <div className="profile-photo-container">
            <img src={currentAvatarUrl || "/placeholder.svg"} alt="Avatar de perfil" className="profile-photo" />

            {editMode && (
              <button
                type="button"
                className="profile-photo-edit-btn"
                onClick={() => document.getElementById("avatar-selector").scrollIntoView({ behavior: "smooth" })}
                aria-label="Cambiar avatar"
              >
                <FaCamera />
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          {editMode ? (
            <form onSubmit={handleUpdate} className="profile-form">
              <div className="form-group">
                <label>
                  <FaUserAlt className="form-icon" />
                  Nombre <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={userData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaUserAlt className="form-icon" />
                  Apellido <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={userData.apellido}
                  onChange={handleInputChange}
                  placeholder="Tu apellido"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaEnvelope className="form-icon" />
                  Email <span className="text-pink-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={userData.email || userData.correo}
                  onChange={handleInputChange}
                  placeholder="Tu email"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaPhone className="form-icon" />
                  Celular <span className="text-pink-500">*</span>
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={userData.celular}
                  onChange={handleInputChange}
                  placeholder="Tu número de celular"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group" id="avatar-selector">
                <label>
                  <FaUserCircle className="form-icon" />
                  Selecciona un avatar
                </label>
                <div className="avatar-categories">
                  <div className="avatar-category">
                    <h4>Avatares</h4>
                    <div className="avatar-grid">
                      {avatarOptions.map((avatar) => (
                        <div
                          key={avatar.id}
                          className={`avatar-option ${selectedAvatar === avatar.id ? "selected" : ""}`}
                          onClick={() => handleAvatarSelect(avatar.id)}
                        >
                          <img
                            src={avatar.url || "/placeholder.svg"}
                            alt={`Avatar ${avatar.gender === "male" ? "masculino" : "femenino"}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button type="button" className="cancel-btn" onClick={cancelEdit} disabled={loading}>
                  <FaTimes /> Cancelar
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave /> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <div className="info-label">
                  <FaUserAlt className="info-icon" />
                  <span>Nombre Completo</span>
                </div>
                <div className="info-value">
                  {userData.nombre || userData.apellido ? `${userData.nombre} ${userData.apellido}` : "No disponible"}
                </div>
              </div>

              <div className="info-group">
                <div className="info-label">
                  <FaEnvelope className="info-icon" />
                  <span>Email</span>
                </div>
                <div className="info-value">{userData.email || userData.correo || "No disponible"}</div>
              </div>

              <div className="info-group">
                <div className="info-label">
                  <FaPhone className="info-icon" />
                  <span>Celular</span>
                </div>
                <div className="info-value">{userData.celular || "No disponible"}</div>
              </div>

              {userData.fechaRegistro && (
                <div className="info-group">
                  <div className="info-label">
                    <FaCalendarAlt className="info-icon" />
                    <span>Fecha de Registro</span>
                  </div>
                  <div className="info-value">{userData.fechaRegistro}</div>
                </div>
              )}

              {renderAdditionalInfo()}

              <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                <FaEdit /> Editar Perfil
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile