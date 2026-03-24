const { response } = require("express")
const {usuarioSchema, usuarioUpdateSchema} = require("../validators/usuario.validator")
const Rol = require("../modules/rol")
const Usuario = require("../modules/usuario")
const Cliente = require("../modules/cliente")
const Empleado = require("../modules/empleado")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { createUser } = require("./userHelper")

// Obtener todos los usuarios (sin mostrar contraseñas)
const usuariosGet = async (req, res = response) => {
  try {
    const usuarios = await Usuario.find().select("-password").populate("rol", "nombreRol") // Incluir información del rol

    res.json({
      usuarios,
    })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).json({
      msg: "Error al obtener usuarios",
      error: error.message,
    })
  }
}

// NUEVO: Obtener un usuario específico por ID
const usuarioGetById = async (req, res = response) => {
  const { id } = req.params

  try {
    const usuario = await Usuario.findById(id).select("-password").populate("rol", "nombreRol")

    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      })
    }

    // Obtener información adicional según el rol
    let infoAdicional = {}

    if (usuario.rol.nombreRol === "Cliente") {
      const cliente = await Cliente.findOne({ usuario: id })
      if (cliente) {
        infoAdicional = {
          nombrecliente: cliente.nombrecliente,
          apellidocliente: cliente.apellidocliente,
          correocliente: cliente.correocliente,
          celularcliente: cliente.celularcliente,
          estadocliente: cliente.estadocliente,
        }
      }
    } else if (usuario.rol.nombreRol === "Empleado") {
      const empleado = await Empleado.findOne({ usuario: id })
      if (empleado) {
        infoAdicional = {
          nombreempleado: empleado.nombreempleado,
          apellidoempleado: empleado.apellidoempleado,
          correoempleado: empleado.correoempleado,
          telefonoempleado: empleado.telefonoempleado,
          especialidad: empleado.especialidad,
          salario: empleado.salario,
          estadoempleado: empleado.estadoempleado,
        }
      }
    }

    res.json({
      usuario,
      infoAdicional,
    })
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error)
    res.status(500).json({
      msg: "Error al obtener usuario por ID",
      error: error.message,
    })
  }
}



// Modificar la función usuariosPost para asegurar consistencia en el hash de contraseñas
const usuariosPost = async (req, res = response) => {
  try {
    const { value, error } = usuarioSchema.validate(req.body, { abortEarly: false })

    if (error) {
      const errores = error.details.map((err) => err.message)
      return res.status(400).json({ errores })
    }

    const { nombre, apellido, email, celular, password, estado, rol } = value

    // Verificar si el email ya existe
    const emailExistente = await Usuario.findOne({ $or: [{ correo: email }, { email }] })
    if (emailExistente) {
      return res.status(400).json({ msg: "El correo ya está registrado." })
    }

    // Verificar que el rol existe
    const rolAsignado = await Rol.findById(Array.isArray(rol) ? rol[0] : rol)
    if (!rolAsignado) {
      return res.status(400).json({ msg: "El rol proporcionado no existe." })
    }

    // 🔥 IMPORTANTE: Usar el mismo proceso de hash que en login
    const salt = await bcrypt.genSalt(12) // Usar 12 rondas como estándar
    const hashedPassword = await bcrypt.hash(password, salt)

    // Crear el usuario directamente para asegurar consistencia
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      correo: email, // Asegurar que ambos campos tengan el mismo valor
      celular,
      password: hashedPassword, // Usar la contraseña hasheada
      rol: rolAsignado._id,
      estado: estado !== undefined ? estado : true,
    })

    // Guardar el usuario
    await nuevoUsuario.save()
    console.log("Usuario creado directamente:", nuevoUsuario.email)

    // Asociar con Cliente o Empleado según el rol
    if (rolAsignado.nombreRol === "Cliente") {
      const clienteExistente = await Cliente.findOne({ usuario: nuevoUsuario._id })
      if (!clienteExistente) {
        await new Cliente({
          nombrecliente: nombre,
          apellidocliente: apellido,
          correocliente: email,
          celularcliente: celular,
          estadocliente: estado !== undefined ? estado : true,
          usuario: nuevoUsuario._id,
        }).save()
        console.log(`Cliente creado para el usuario: ${email}`)
      }
      await Empleado.deleteMany({ usuario: nuevoUsuario._id }) // Evita duplicidad
    }

    if (rolAsignado.nombreRol === "Empleado") {
      const empleadoExistente = await Empleado.findOne({ usuario: nuevoUsuario._id })
      if (!empleadoExistente) {
        await new Empleado({
          nombreempleado: nombre,
          apellidoempleado: apellido,
          correoempleado: email,
          celularempleado: celular,
          telefonoempleado: celular,
          estadoempleado: estado !== undefined ? estado : true,
          especialidad: req.body.especialidad || "General",
          salario: req.body.salario || 0,
          usuario: nuevoUsuario._id,
        }).save()
        console.log(`Empleado creado para el usuario: ${email}`)
      }
      await Cliente.deleteMany({ usuario: nuevoUsuario._id })
    }

    // Generar token para la respuesta
    const token = jwt.sign(
      { userId: nuevoUsuario._id, role: rolAsignado.nombreRol },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1h" },
    )

    // Eliminar la contraseña de la respuesta
    const usuarioResponse = nuevoUsuario.toObject()
    delete usuarioResponse.password

    res.status(201).json({
      msg: "Usuario registrado correctamente",
      usuario: usuarioResponse,
      token,
      role: rolAsignado.nombreRol,
    })
  } catch (err) {
    console.error("Error al crear usuario:", err)
    res.status(500).json({ msg: "Error interno del servidor", error: err.message })
  }
}







// // Crear un nuevo usuario
// const usuariosPost = async (req, res = response) => {
  
//   try {
//     const {value, error} = usuarioSchema.validate(req.body, {abortEarly: false})
  
//     if (error){
//       const errores = error.details.map((err)=> err.message)
//       return res.status(400).json({ errores})
//     }

//     const {nombre, apellido, email, celular, password, estado, rol}
//     = value
//     const emailExistente = await Usuario.findOne({ $or: [{ correo: email }, { email }] })
//     if (emailExistente) {
//       return res.status(400).json({ msg: 'El correo ya está registrado.' })
//     }

//     const rolAsignado = await Rol.findById(Array.isArray(rol) ? rol[0] : rol)
//     if (!rolAsignado) {
//       return res.status(400).json({ msg: 'El rol proporcionado no existe.' })
//     }

//     const nuevoUsuario = await createUser({
//       nombre,
//       apellido,
//       correo: email,
//       email,
//       celular,
//       password,
//       rol: rolAsignado._id,
//       estado,
//     })

//     // Asociar con Cliente o Empleado
//     if (rolAsignado.nombreRol === 'Cliente') {
//       const clienteExistente = await Cliente.findOne({ usuario: nuevoUsuario._id })
//       if (!clienteExistente) {
//         await new Cliente({
//           nombrecliente: nombre,
//           apellidocliente: apellido,
//           correocliente: email,
//           celularcliente: celular,
//           estadocliente: estado,
//           usuario: nuevoUsuario._id,
//         }).save()
//       }
//       await Empleado.deleteMany({ usuario: nuevoUsuario._id }) // Evita duplicidad
//     }

//     if (rolAsignado.nombreRol === 'Empleado') {
//       const empleadoExistente = await Empleado.findOne({ usuario: nuevoUsuario._id })
//       if (!empleadoExistente) {
//         await new Empleado({
//           nombreempleado: nombre,
//           apellidoempleado: apellido,
//           correoempleado: email,
//           celularempleado: celular,
//           telefonoempleado: celular,
//           estadoempleado: estado,
//           especialidad: req.body.especialidad || 'General',
//           salario: req.body.salario || 0,
//           usuario: nuevoUsuario._id,
//         }).save()
//       }
//       await Cliente.deleteMany({ usuario: nuevoUsuario._id })
//     }

//     const token = jwt.sign(
//       { userId: nuevoUsuario._id, role: rolAsignado.nombreRol },
//       process.env.JWT_SECRET || 'secret_key',
//       { expiresIn: '1h' }
//     )

//     const usuarioResponse = nuevoUsuario.toObject()
//     delete usuarioResponse.password

//     res.status(201).json({
//       msg: 'Usuario registrado correctamente',
//       usuario: usuarioResponse,
//       token,
//       role: rolAsignado.nombreRol,
//     })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ msg: 'Error interno del servidor' })
//   }



  
  
  
//   // console.log("usuariosPost - Datos recibidos:", JSON.stringify(req.body, null, 2))

//   // const { nombre, apellido, correo, email, celular, password, confirmPassword, rol, tipoUsuario, estadocliente } =
//   //   req.body

//   // try {
//   //   // Usar correo o email según lo que venga en la petición
//   //   const emailUsuario = correo || email

//   //   // Validar campos obligatorios
//   //   if (!nombre || !emailUsuario || !password) {
//   //     return res.status(400).json({
//   //       msg: "Faltan campos obligatorios (nombre, correo/email, password)",
//   //     })
//   //   }

//   //   // Verificar que la contraseña y la confirmación coincidan si se proporciona confirmPassword
//   //   if (confirmPassword && password !== confirmPassword) {
//   //     return res.status(400).json({
//   //       msg: "Las contraseñas no coinciden",
//   //     })
//   //   }

//   //   // Verificar si el usuario ya existe
//   //   const existeEmail = await Usuario.findOne({
//   //     $or: [{ correo: emailUsuario }, { email: emailUsuario }],
//   //   })

//   //   if (existeEmail) {
//   //     return res.status(400).json({
//   //       msg: "El correo ya está registrado",
//   //     })
//   //   }

//   //   // Determinar el rol a asignar
//   //   let rolAsignado

//   //   if (rol) {
//   //     // Si se proporciona un ID de rol, verificar que exista
//   //     rolAsignado = await Rol.findById(rol)
//   //     if (!rolAsignado) {
//   //       return res.status(400).json({
//   //         msg: `El rol con ID ${rol} no existe`,
//   //       })
//   //     }
//   //   } else if (tipoUsuario) {
//   //     // Si se proporciona un tipo de usuario, buscar el rol correspondiente
//   //     const tipoRol = tipoUsuario === "cliente" ? "Cliente" : tipoUsuario === "empleado" ? "Empleado" : "Cliente"

//   //     rolAsignado = await Rol.findOne({ nombreRol: tipoRol })
//   //     if (!rolAsignado) {
//   //       return res.status(400).json({
//   //         msg: `El rol ${tipoRol} no existe en la base de datos`,
//   //       })
//   //     }
//   //   } else {
//   //     // Por defecto, asignar rol de Cliente
//   //     rolAsignado = await Rol.findOne({ nombreRol: "Cliente" })

//   //     // Si no existe el rol Cliente, verificar si hay usuarios
//   //     if (!rolAsignado) {
//   //       const usuarios = await Usuario.countDocuments()

//   //       // Si no hay usuarios, buscar rol Admin
//   //       if (usuarios === 0) {
//   //         rolAsignado = await Rol.findOne({ nombreRol: "Admin" })
//   //       }

//   //       // Si aún no hay rol asignado, error
//   //       if (!rolAsignado) {
//   //         return res.status(400).json({
//   //           msg: "No se encontró un rol válido para asignar",
//   //         })
//   //       }
//   //     }
//   //   }

//   //   console.log("Rol asignado:", JSON.stringify(rolAsignado, null, 2))

//   //   // Usar el helper existente para crear el usuario
//   //   const userData = {
//   //     nombre,
//   //     apellido: apellido || "",
//   //     email: emailUsuario,
//   //     correo: emailUsuario,
//   //     celular: celular || "",
//   //     password,
//   //     rol: rolAsignado._id,
//   //     estado: true,
//   //   }

//   //   // Crear el usuario usando el helper existente
//   //   const nuevoUsuario = await createUser(userData)
//   //   console.log("Usuario creado:", JSON.stringify(nuevoUsuario, null, 2))

//   //   // Verificar el rol y crear el cliente o empleado correspondiente
//   //   if (rolAsignado.nombreRol === "Cliente") {
//   //     // Verificar si ya existe un cliente con este correo
//   //     const clienteExistente = await Cliente.findOne({
//   //       $or: [{ correocliente: emailUsuario }, { usuario: nuevoUsuario._id }],
//   //     })

//   //     if (!clienteExistente) {
//   //       // Crear un nuevo cliente
//   //       const nuevoCliente = new Cliente({
//   //         nombrecliente: nombre,
//   //         apellidocliente: apellido || "",
//   //         correocliente: emailUsuario,
//   //         celularcliente: celular || "",
//   //         estadocliente: estadocliente === "Activo" || estadocliente === true ? true : false,
//   //         usuario: nuevoUsuario._id, // Vincular con el usuario
//   //       })

//   //       await nuevoCliente.save()
//   //       console.log("Cliente creado:", JSON.stringify(nuevoCliente, null, 2))
//   //     }

//   //     // Asegurar que no exista como empleado
//   //     await Empleado.findOneAndDelete({
//   //       $or: [{ correoempleado: emailUsuario }, { usuario: nuevoUsuario._id }],
//   //     })
//   //   } else if (rolAsignado.nombreRol === "Empleado") {
//   //     // Verificar si ya existe un empleado con este correo
//   //     const empleadoExistente = await Empleado.findOne({
//   //       $or: [{ correoempleado: emailUsuario }, { usuario: nuevoUsuario._id }],
//   //     })

//   //     if (!empleadoExistente) {
//   //       // Crear un nuevo empleado
//   //       const nuevoEmpleado = new Empleado({
//   //         nombreempleado: nombre,
//   //         apellidoempleado: apellido || "",
//   //         correoempleado: emailUsuario,
//   //         celularempleado: celular || "",
//   //         telefonoempleado: celular || "", // Añadir el campo telefonoempleado
//   //         estadoempleado: true,
//   //         especialidad: req.body.especialidad || "General",
//   //         salario: req.body.salario || 0,
//   //         usuario: nuevoUsuario._id, // Vincular con el usuario
//   //       })

//   //       await nuevoEmpleado.save()
//   //       console.log("Empleado creado:", JSON.stringify(nuevoEmpleado, null, 2))
//   //     }

//   //     // Asegurar que no exista como cliente
//   //     await Cliente.findOneAndDelete({
//   //       $or: [{ correocliente: emailUsuario }, { usuario: nuevoUsuario._id }],
//   //     })
//   //   }

//   //   // Generar token JWT usando el mismo formato que en authController
//   //   const token = jwt.sign(
//   //     { userId: nuevoUsuario._id, role: rolAsignado.nombreRol },
//   //     process.env.JWT_SECRET || "secret_key",
//   //     { expiresIn: "1h" },
//   //   )

//   //   // Eliminar el campo de la contraseña de la respuesta
//   //   const usuarioResponse = nuevoUsuario.toObject ? nuevoUsuario.toObject() : { ...nuevoUsuario }
//   //   delete usuarioResponse.password

//   //   res.status(201).json({
//   //     msg: "Usuario registrado correctamente",
//   //     usuario: usuarioResponse,
//   //     token,
//   //     role: rolAsignado.nombreRol,
//   //   })
//   // } catch (error) {
//   //   console.error("Error al registrar usuario:", error)
//   //   let msg = "Error al registrar usuario"
//   //   if (error.name === "ValidationError") {
//   //     msg = Object.values(error.errors)
//   //       .map((val) => val.message)
//   //       .join(", ")
//   //   }
//   //   res.status(500).json({
//   //     msg,
//   //     error: error.message,
//   //   })
//   // }
// }

// Actualizar un usuario existente
const usuariosPut = async (req, res = response) => {

  const { id } = req.params

  try {
    const { value, error } = usuarioUpdateSchema.validate(req.body, { abortEarly: false })

    if (error) {
      const errores = error.details.map((err) => err.message)
      return res.status(400).json({ errores })
    }

    const usuario = await Usuario.findById(id)
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' })
    }

    const updates = value

    if (updates.password) {
      const salt = bcrypt.genSaltSync()
      updates.password = bcrypt.hashSync(updates.password, salt)
    }

    await Usuario.findByIdAndUpdate(id, updates, { new: true })

    res.json({ msg: 'Usuario actualizado correctamente' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Error al actualizar el usuario' })
  }


  //   const { id } = req.params
//   const { _id, password, correo, email, rol, ...resto } = req.body

//   // Agregar el correo/email manualmente si vienen
// if (correo) resto.correo = correo
// if (email) resto.email = email

//   try {
//     // Verificar si el usuario existe
//     const usuario = await Usuario.findById(id).populate("rol")
//     if (!usuario) {
//       return res.status(404).json({
//         msg: "Usuario no encontrado",
//       })
//     }

//     if (usuario.rol.nombreRol === "Cliente") {
//   await Cliente.findOneAndUpdate(
//     { usuario: id },
//     {
//       nombrecliente: resto.nombre || usuario.nombre,
//       apellidocliente: resto.apellido || usuario.apellido,
//       correocliente: resto.email || resto.correo || usuario.correo,
//       celularcliente: resto.celular || usuario.celular,
//       // otros campos si aplican
//     }
//   )
// }
// if (usuario.rol.nombreRol === "Empleado") {
//   await Empleado.findOneAndUpdate(
//     { usuario: id },
//     {
//       nombreempleado: resto.nombre || usuario.nombre,
//       apellidoempleado: resto.apellido || usuario.apellido,
//       correoempleado: resto.email || resto.correo || usuario.correo,
//       telefonoempleado: resto.celular || usuario.celular,
//       celularempleado: resto.celular || usuario.celular,
//       // otros campos como salario o especialidad si se actualizan
//     }
//   )
// }


//     // Si se está cambiando el rol
//     if (rol && rol !== usuario.rol._id.toString()) {
//       // Verificar que el nuevo rol exista
//       const nuevoRol = await Rol.findById(rol)
//       if (!nuevoRol) {
//         return res.status(400).json({
//           msg: "El rol especificado no existe",
//         })
//       }

//       // Determinar si está cambiando de cliente a empleado o viceversa
//       const eraCliente = usuario.rol.nombreRol === "Cliente"
//       const eraEmpleado = usuario.rol.nombreRol === "Empleado"
//       const seraCliente = nuevoRol.nombreRol === "Cliente"
//       const seraEmpleado = nuevoRol.nombreRol === "Empleado"

//       // Si cambia de cliente a empleado
//       if (eraCliente && seraEmpleado) {
//         // Eliminar de la tabla de clientes
//         await Cliente.findOneAndDelete({
//           $or: [{ correocliente: usuario.email || usuario.correo }, { usuario: id }],
//         })

//         // Crear en la tabla de empleados
//         const empleado = new Empleado({
//           nombreempleado: usuario.nombre,
//           apellidoempleado: usuario.apellido || resto.apellido || "",
//           correoempleado: usuario.email || usuario.correo,
//           celularempleado: usuario.celular || resto.celular || "",
//           telefonoempleado: usuario.celular || resto.celular || "",
//           estadoempleado: true,
//           especialidad: req.body.especialidad || "General",
//           salario: req.body.salario || 0,
//           usuario: usuario._id,
//         })
//         await empleado.save()
//       }
//       // Si cambia de empleado a cliente
//       else if (eraEmpleado && seraCliente) {
//         // Eliminar de la tabla de empleados
//         await Empleado.findOneAndDelete({
//           $or: [{ correoempleado: usuario.email || usuario.correo }, { usuario: id }],
//         })

//         // Crear en la tabla de clientes
//         const cliente = new Cliente({
//           nombrecliente: usuario.nombre,
//           apellidocliente: usuario.apellido || resto.apellido || "",
//           correocliente: usuario.email || usuario.correo,
//           celularcliente: usuario.celular || resto.celular || "",
//           estadocliente: true,
//           usuario: usuario._id,
//         })
//         await cliente.save()
//       }
//     }

//     // Si se está actualizando la contraseña
//     if (password) {
//       const salt = bcrypt.genSaltSync(10)
//       resto.password = bcrypt.hashSync(password, salt)
//     }

//     // Actualizar usuario
//     const usuarioActualizado = await Usuario.findByIdAndUpdate(
//       id,
//       { ...resto, rol: rol || usuario.rol._id },
//       { new: true },
//     )
//       .select("-password")
//       .populate("rol")

//     res.json({
//       msg: "Usuario actualizado correctamente",
//       usuario: usuarioActualizado,
//     })
//   } catch (error) {
//     console.error("Error al actualizar usuario:", error)
//     res.status(500).json({
//       msg: "Error al actualizar usuario",
//       error: error.message,
//     })
//   }
}

// NUEVO: Actualizar solo el rol de un usuario
const usuariosUpdateRol = async (req, res = response) => {
  const { id } = req.params
  const { rol } = req.body

  if (!rol) {
    return res.status(400).json({
      msg: "El rol es obligatorio",
    })
  }

  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findById(id).populate("rol")
    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      })
    }

    // Verificar que el nuevo rol exista
    const nuevoRol = await Rol.findById(rol)
    if (!nuevoRol) {
      return res.status(400).json({
        msg: "El rol especificado no existe",
      })
    }

    // Si el rol no ha cambiado, no hacer nada
    if (rol === usuario.rol._id.toString()) {
      return res.json({
        msg: "El rol no ha cambiado",
        usuario,
      })
    }

    // Determinar si está cambiando de cliente a empleado o viceversa
    const eraCliente = usuario.rol.nombreRol === "Cliente"
    const eraEmpleado = usuario.rol.nombreRol === "Empleado"
    const seraCliente = nuevoRol.nombreRol === "Cliente"
    const seraEmpleado = nuevoRol.nombreRol === "Empleado"

    // Si cambia de cliente a empleado
    if (eraCliente && seraEmpleado) {
      // Eliminar de la tabla de clientes
      await Cliente.findOneAndDelete({
        $or: [{ correocliente: usuario.email || usuario.correo }, { usuario: id }],
      })

      // Crear en la tabla de empleados
      const empleado = new Empleado({
        nombreempleado: usuario.nombre,
        apellidoempleado: usuario.apellido || "",
        correoempleado: usuario.email || usuario.correo,
        celularempleado: usuario.celular || "",
        telefonoempleado: usuario.celular || "",
        estadoempleado: true,
        especialidad: req.body.especialidad || "General",
        salario: req.body.salario || 0,
        usuario: usuario._id,
      })
      await empleado.save()
    }
    // Si cambia de empleado a cliente
    else if (eraEmpleado && seraCliente) {
      // Eliminar de la tabla de empleados
      await Empleado.findOneAndDelete({
        $or: [{ correoempleado: usuario.email || usuario.correo }, { usuario: id }],
      })

      // Crear en la tabla de clientes
      const cliente = new Cliente({
        nombrecliente: usuario.nombre,
        apellidocliente: usuario.apellido || "",
        correocliente: usuario.email || usuario.correo,
        celularcliente: usuario.celular || "",
        estadocliente: true,
        usuario: usuario._id,
      })
      await cliente.save()
    }

    // Actualizar el rol del usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(id, { rol: nuevoRol._id }, { new: true })
      .select("-password")
      .populate("rol")

    res.json({
      msg: "Rol actualizado correctamente",
      usuario: usuarioActualizado,
    })
  } catch (error) {
    console.error("Error al actualizar rol:", error)
    res.status(500).json({
      msg: "Error al actualizar rol",
      error: error.message,
    })
  }
}

// Eliminar un usuario
const usuariosDelete = async (req, res = response) => {
  const { id } = req.params

  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findById(id).populate("rol")
    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      })
    }

    // Eliminar registros relacionados según el rol
    if (usuario.rol.nombreRol === "Cliente") {
      await Cliente.findOneAndDelete({
        $or: [{ correocliente: usuario.email || usuario.correo }, { usuario: id }],
      })
    } else if (usuario.rol.nombreRol === "Empleado") {
      await Empleado.findOneAndDelete({
        $or: [{ correoempleado: usuario.email || usuario.correo }, { usuario: id }],
      })
    }

    // Eliminar el usuario
    const usuarioEliminado = await Usuario.findByIdAndDelete(id)

    res.json({
      msg: "Usuario eliminado correctamente",
      usuario: usuarioEliminado,
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    res.status(500).json({
      msg: "Error al eliminar usuario",
      error: error.message,
    })
  }
}

// Consultar usuarios con parámetros (PromGet)
const PromGet = async (req, res = response) => {
  const { q, nombre, page = 1, limit = 10 } = req.query
  const limitNum = Number(limit)
  const skip = (Number(page) - 1) * limitNum

  try {
    // Construir filtro
    const filtro = {}
    if (q) {
      filtro.$or = [
        { nombre: { $regex: q, $options: "i" } },
        { apellido: { $regex: q, $options: "i" } },
        { correo: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ]
    }
    if (nombre) {
      filtro.nombre = { $regex: nombre, $options: "i" }
    }

    // Consultar usuarios con paginación
    const [total, usuarios] = await Promise.all([
      Usuario.countDocuments(filtro),
      Usuario.find(filtro).select("-password").populate("rol", "nombreRol").skip(skip).limit(limitNum),
    ])

    res.json({
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: Number(page),
      limit: limitNum,
      usuarios,
    })
  } catch (error) {
    console.error("Error en PromGet:", error)
    res.status(500).json({
      msg: "Error al obtener usuarios",
      error: error.message,
    })
  }
}

// Activar cuenta de usuario
const activateAccount = async (req, res = response) => {
  const { email } = req.body

  try {
    // Verificar si el email existe
    const usuario = await Usuario.findOne({ correo: email })

    if (!usuario) {
      return res.status(404).json({
        msg: "No se encontró ninguna cuenta con ese correo electrónico",
      })
    }

    // Verificar si la cuenta ya está activa
    if (usuario.estado) {
      return res.status(400).json({
        msg: "Esta cuenta ya está activa",
      })
    }

    // Activar la cuenta
    usuario.estado = true
    await usuario.save()

    res.json({
      msg: "Cuenta activada correctamente",
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      msg: "Error al activar la cuenta",
    })
  }
}

// Añadir esta nueva función al final del archivo, antes del module.exports
// Activar/Desactivar un usuario
const usuariosToggleEstado = async (req, res = response) => {
  const { id } = req.params;

  try {
    // Verificar si el usuario existe y popular el campo rol
    const usuario = await Usuario.findById(id).populate("rol");
    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      });
    }

    // Validar si el rol es Admin
    if (usuario.rol && usuario.rol.nombreRol === "Admin") {
      return res.status(403).json({
        msg: "No está permitido desactivar o cambiar el estado de un administrador",
      });
    }

    // Cambiar el estado sin modificar otros campos
    const nuevoEstado = !usuario.estado;

    // Actualizar solo el campo estado
    await Usuario.findByIdAndUpdate(id, { estado: nuevoEstado });

    // Si el usuario es un cliente o empleado, actualizar también su estado en esas colecciones
    if (usuario.rol.nombreRol === "Cliente") {
      await Cliente.findOneAndUpdate({ usuario: id }, { estadocliente: nuevoEstado });
    } else if (usuario.rol.nombreRol === "Empleado") {
      await Empleado.findOneAndUpdate({ usuario: id }, { estadoempleado: nuevoEstado });
    }

    // Obtener el usuario actualizado para la respuesta
    const usuarioActualizado = await Usuario.findById(id).select("-password");

    res.json({
      msg: `Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente`,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al cambiar estado del usuario:", error);
    res.status(500).json({
      msg: "Error al cambiar estado del usuario",
      error: error.message,
    });
  }
};

// Asegúrate de exportar la nueva función
module.exports = {
  usuariosGet,
  usuarioGetById,
  usuariosPost,
  usuariosPut,
  usuariosUpdateRol,
  usuariosDelete,
  PromGet,
  activateAccount,
  usuariosToggleEstado,
}

