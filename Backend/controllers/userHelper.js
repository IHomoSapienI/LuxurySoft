const bcrypt = require("bcryptjs")
const Usuario = require("../modules/usuario")
const Rol = require("../modules/rol")

/**
 * Crea un nuevo usuario en la base de datos
 * @param {Object} userData - Datos del usuario a crear
 * @returns {Promise<Object>} - Usuario creado
 */
const createUser = async (userData) => {
  try {
    console.log("createUser - Datos recibidos:", JSON.stringify(userData, null, 2))

    // Verificar si el rol existe
    let rolId = userData.rol
    if (rolId) {
      const rolExiste = await Rol.findById(rolId)
      if (!rolExiste) {
        throw new Error(`El rol con ID ${rolId} no existe`)
      }
    } else {
      // Asignar rol por defecto (Cliente)
      const defaultRol = await Rol.findOne({ nombreRol: "Cliente" })
      if (!defaultRol) {
        throw new Error("No se encontró el rol por defecto (Cliente)")
      }
      rolId = defaultRol._id
    }

    // Encriptar la contraseña
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(userData.password, salt)

    // Crear el usuario con los datos proporcionados
    const nuevoUsuario = new Usuario({
      nombre: userData.nombre,
      apellido: userData.apellido || "",
      email: userData.email,
      correo: userData.email, // Asegurar que ambos campos tengan el mismo valor
      celular: userData.celular || "",
      password: hashedPassword,
      rol: rolId,
      estado: userData.estado !== undefined ? userData.estado : true,
    })

    // Guardar el usuario en la base de datos
    await nuevoUsuario.save()

    // Obtener el usuario con el rol poblado
    const usuarioGuardado = await Usuario.findById(nuevoUsuario._id).populate("rol")

    console.log("Usuario creado exitosamente:", JSON.stringify(usuarioGuardado, null, 2))

    return usuarioGuardado
  } catch (error) {
    console.error("Error en createUser:", error)
    throw error
  }
}

module.exports = {
  createUser,
}

