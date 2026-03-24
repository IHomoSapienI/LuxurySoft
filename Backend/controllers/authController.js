// const bcrypt = require("bcryptjs")
// const jwt = require("jsonwebtoken")
// const User = require("../modules/usuario")
// const Rol = require("../modules/rol")
// const Cliente = require("../modules/cliente")
// const Empleado = require("../modules/empleado")
// const { createUser } = require("../controllers/userHelper")
// const nodemailer = require("nodemailer")
// const crypto = require("crypto")

// // Configuración mejorada del transporter
// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE || "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// })

// // Verificación del transporter
// transporter.verify((error, success) => {
//   if (error) {
//     console.error("Error al configurar el correo:", error)
//   } else {
//     console.log("Servidor de correo configurado correctamente")
//   }
// })

// const login = async (req, res) => {
//   const { email, password } = req.body

//   try {
//     // Validar entrada
//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email y contraseña son requeridos",
//       })
//     }

//     const user = await User.findOne({ email: email.toLowerCase().trim() })
//     // .populate("rol")
//     .populate({
//   path: "rol",
//   populate: {
//     path: "permisoRol", // Este es el nombre correcto del campo en tu modelo Rol
    
//   },
// })
//   console.log("Usuario:", user);
// console.log("Permisos del rol:", user.rol.permisoRol); // Agrega esta línea
//     if (!user) {
//       return res.status(400).json({ message: "Credenciales inválidas" })
//     }

//     // Verificar si el usuario está activo
//     if (!user.estado) {
//       return res.status(401).json({
//         message: "Tu cuenta ha sido desactivada. Contacta al administrador.",
//         cuentaInactiva: true,
//       })
//     }

//     // Verificar contraseña
//     const isMatch = await bcrypt.compare(password.trim(), user.password)
//     if (!isMatch) {
//       return res.status(400).json({ message: "Credenciales inválidas" })
//     }

//     // Verificar si el rol está activo
//     if (!user.rol || !user.rol.estadoRol) {
//       return res.status(403).json({
//         message: "Tu rol ha sido desactivado. Contacta al administrador.",
//         rolDesactivado: true,
//       })
//     }

//     // Generar token
//     const token = jwt.sign({ userId: user._id, role: user.rol.nombreRol }, process.env.JWT_SECRET || "secret_key", {
//       expiresIn: "24h",
//     })

//     res.json({
//       success: true,
//       token,
//       role: user.rol.nombreRol,
//       permisos: user.rol.permisoRol.map(p=>({
//         id: p._id,
//         nombrePermiso: p.nombrePermiso,
//         descripcion:p.descripcion,
//         activo: p.activo,
//         categoria: p.categoria,
//         nivel: p.nivel,
//       })),
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.nombre,
//       },
//     })
//   } catch (error) {
//     console.error("Error en login:", error)
//     res.status(500).json({ message: "Error interno del servidor" })
//   }
// }

// const register = async (req, res) => {
//   const { nombre, apellido, email, password, confirmPassword, rol, estado, celular } = req.body

//   try {
//     // Validaciones básicas
//     if (!nombre || !apellido || !email || !password || !confirmPassword || !celular) {
//       return res.status(400).json({
//         message: "Todos los campos son obligatorios",
//       })
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         message: "Las contraseñas no coinciden",
//       })
//     }

//     // Verificar si el usuario ya existe
//     const userExists = await User.findOne({ email: email.toLowerCase().trim() })
//     if (userExists) {
//       return res.status(400).json({ message: "El usuario ya existe" })
//     }

//        // Verificar si el correo ya existe en la tabla de clientes
//     const clienteExists = await Cliente.findOne({ correocliente: email.toLowerCase().trim() })
//     if (clienteExists) {
//       return res.status(400).json({ message: "El correo ya está registrado como cliente" })
//     }

//     // Verificar si el celular ya existe en la tabla de clientes
//     const celularExists = await Cliente.findOne({ celularcliente: celular })
//     if (celularExists) {
//       return res.status(400).json({ message: "El celular ya está registrado como cliente" })
//     }


//     // Manejar rol
//     let rolId
//     if (rol) {
//       const existeRol = await Rol.findById(rol)
//       if (!existeRol || !existeRol.estadoRol) {
//         return res.status(400).json({
//           message: "El rol especificado no es válido o está desactivado",
//         })
//       }
//       rolId = rol
//     } else {
//       const defaultRol = await Rol.findOne({ nombreRol: "Cliente" })
//       if (!defaultRol || !defaultRol.estadoRol) {
//         return res.status(400).json({
//           message: "El rol por defecto no está disponible. Contacta al administrador.",
//         })
//       }
//       rolId = defaultRol._id
//       // const rolObj = await Rol.findById(rolId)

//     }

//     // Crear usuario
//     const newUser = await createUser({
//       nombre,
//       apellido,
//       email: email.toLowerCase().trim(),
//       password,
//       rol: rolId,
//       estado: estado !== undefined ? estado : true,
//       celular,
//     })
//     const rolObj = await Rol.findById(newUser.rol._id || newUser.rol)
// // Asociar con Cliente o Empleado según el rolAdd commentMore actions
//     if (rolObj.nombreRol === 'Cliente') {
//       if (!clienteExistente) {
//         await new Cliente({
//           nombrecliente: nombre,
//           apellidocliente: apellido,
//           correocliente: email,
//           celularcliente: celular,
//           estadocliente: estado !== undefined ? estado : true,
//           usuario: newUser._id,
//         }).save()
//         console.log(`Cliente creado automáticamente para el usuario: ${email}`)
//       }
//       // Eliminar cualquier registro de empleado para evitar duplicidad
//       await Empleado.deleteMany({ usuario: newUser._id })
//     }

//     if (rolObj.nombreRol === 'Empleado') {
//       const empleadoExistente = await Empleado.findOne({ usuario: newUser._id })
//       if (!empleadoExistente) {
//         await new Empleado({
//           nombreempleado: nombre,
//           apellidoempleado: apellido,
//           correoempleado: email,
//           celularempleado: celular,
//           telefonoempleado: celular,
//           estadoempleado: estado !== undefined ? estado : true,
//           especialidad: especialidad || 'General',
//           salario: salario || 0,
//           usuario: newUser._id,
//         }).save()
//         console.log(`Empleado creado automáticamente para el usuario: ${email}`)
//       }
//       // Eliminar cualquier registro de cliente para evitar duplicidad
//       await Cliente.deleteMany({ usuario: newUser._id })

//     }


//     // Generar token
//     const token = jwt.sign(
//       { userId: newUser._id, role: newUser.rol.nombreRol },
//       process.env.JWT_SECRET || "secret_key",
//       { expiresIn: "24h" },
//     )

//     res.status(201).json({
//       success: true,
//       token,
//       role: newUser.rol.nombreRol,
//       user: {
//         id: newUser._id,
//         email: newUser.email,
//         name: newUser.nombre,
//       },
//     })
//   } catch (error) {
//     console.error("Error en registro:", error)
//     res.status(500).json({ message: "Error interno del servidor" })
//   }
// }







// const requestPasswordReset = async (req, res) => {
//   const { email } = req.body

//   try {
//     // Validar entrada
//     if (!email) {
//       return res.status(400).json({ message: "El email es requerido" })
//     }

//     const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("rol")

//     // Siempre devolver el mismo mensaje por seguridad
//     const successMessage =
//       "Si el correo existe en nuestra base de datos, recibirás un código para restablecer tu contraseña."

//     if (!user || !user.estado) {
//       return res.status(200).json({ message: successMessage })
//     }

//     // Generar código de 6 dígitos
//     const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

//     // Hashear el código y establecer expiración (15 minutos)
//     const hashedCode = await bcrypt.hash(resetCode, 10)
//     user.resetPasswordToken = hashedCode
//     user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

//     await user.save({ validateBeforeSave: false })

//     // Enviar email
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: user.email,
//       subject: "Código de verificación - NailsSoft",
//       html: `
//         <!DOCTYPE html>
//         <html>
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Código de verificación</title>
//           <style>
//             body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
//             .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
//             .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e1e1e1; }
//             .content { padding: 20px 0; }
//             .code { font-size: 32px; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-weight: bold; color: #2c3e50; }
//             .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777; }
//             .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1 style="color: #2c3e50;">NailsSoft</h1>
//               <h2 style="color: #34495e;">Código de Verificación</h2>
//             </div>
//             <div class="content">
//               <p>Hola <strong>${user.nombre}</strong>,</p>
//               <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código para continuar:</p>
              
//               <div class="code">${resetCode}</div>
              
//               <div class="warning">
//                 <strong>⚠️ Importante:</strong>
//                 <ul>
//                   <li>Este código expira en <strong>15 minutos</strong></li>
//                   <li>Solo úsalo si solicitaste el restablecimiento</li>
//                   <li>No compartas este código con nadie</li>
//                 </ul>
//               </div>
              
//               <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
//             </div>
//             <div class="footer">
//               <p>Este es un correo automático, no respondas a este mensaje.</p>
//               <p>&copy; ${new Date().getFullYear()} NailsSoft. Todos los derechos reservados.</p>
//             </div>
//           </div>
//         </body>
//         </html>
//       `,
//     }

//     await transporter.sendMail(mailOptions)
//     console.log(`Código de verificación enviado a: ${user.email}`)

//     res.status(200).json({
//       success: true,
//       message: successMessage,
//       email: user.email, // Para usar en el frontend
//     })
//   } catch (error) {
//     console.error("Error al solicitar restablecimiento:", error)
//     res.status(500).json({ message: "Error interno del servidor" })
//   }
// }

// const verifyResetToken = async (req, res) => {
//   const { token, email } = req.body

//   try {
//     // Validar entrada
//     if (!token || !email) {
//       return res.status(400).json({ message: "Código y email son requeridos" })
//     }

//     // Validar formato del código
//     if (!/^\d{6}$/.test(token)) {
//       return res.status(400).json({ message: "El código debe tener 6 dígitos" })
//     }

//     // Buscar usuario con token válido y no expirado
//     const user = await User.findOne({
//       email: email.toLowerCase().trim(),
//       resetPasswordExpires: { $gt: new Date() },
//     })

//     if (!user || !user.resetPasswordToken) {
//       return res.status(400).json({
//         message: "El código ha expirado o es inválido",
//         expired: true,
//       })
//     }

//     // Verificar el código
//     const isValidToken = await bcrypt.compare(token, user.resetPasswordToken)
//     if (!isValidToken) {
//       return res.status(400).json({ message: "Código incorrecto" })
//     }

//     // Generar token temporal para autorizar el restablecimiento
//     const tempToken = jwt.sign(
//       {
//         userId: user._id,
//         resetVerified: true,
//         email: user.email,
//       },
//       process.env.JWT_SECRET || "secret_key",
//       { expiresIn: "15m" },
//     )

//     res.status(200).json({
//       success: true,
//       message: "Código verificado correctamente",
//       resetToken: tempToken,
//     })
//   } catch (error) {
//     console.error("Error al verificar código:", error)
//     res.status(500).json({ message: "Error interno del servidor" })
//   }
// }

// const resetPassword = async (req, res) => {
//   const { token, password, confirmPassword } = req.body

//   try {
//     // Validar entrada
//     if (!token || !password || !confirmPassword) {
//       return res.status(400).json({
//         message: "Token, contraseña y confirmación son requeridos",
//       })
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Las contraseñas no coinciden" })
//     }

//     // Validar contraseña
//     if (password.length < 8 || password.length > 64) {
//       return res.status(400).json({
//         message: "La contraseña debe tener entre 8 y 64 caracteres",
//       })
//     }

//     // Verificar token JWT
//     let decoded
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key")
//     } catch (jwtError) {
//       if (jwtError.name === "TokenExpiredError") {
//         return res.status(401).json({
//           message: "La sesión de restablecimiento ha expirado",
//           expired: true,
//         })
//       }
//       return res.status(401).json({
//         message: "Token de autorización inválido",
//         invalid: true,
//       })
//     }

//     if (!decoded.resetVerified) {
//       return res.status(401).json({
//         message: "Autorización inválida",
//         invalid: true,
//       })
//     }

//     // Buscar usuario y verificar que el rol sea válido
//     const user = await User.findById(decoded.userId).populate('rol')
//     if (!user) {
//       return res.status(400).json({ message: "Usuario no encontrado" })
//     }

//     // Verificar y corregir el rol si es necesario
//     if (!user.rol || typeof user.rol === 'string') {
//       console.log(`Corrigiendo rol para usuario ${user.email}`)
      
//       // Buscar el rol por defecto
//       const defaultRol = await Rol.findOne({ nombreRol: "Cliente", estadoRol: true })
//       if (!defaultRol) {
//         return res.status(500).json({
//           message: "Error de configuración: rol por defecto no encontrado"
//         })
//       }
      
//       // Asignar el rol correcto
//       user.rol = defaultRol._id
//     }

//     // Hashear nueva contraseña
//     const salt = await bcrypt.genSalt(12)
//     const hashedPassword = await bcrypt.hash(password, salt)

//     // Actualizar contraseña y limpiar tokens de reset
//     user.password = hashedPassword
//     user.resetPasswordToken = undefined
//     user.resetPasswordExpires = undefined

//     // Guardar con validación deshabilitada para evitar problemas con otros campos
//     await user.save({ validateBeforeSave: false })

//     console.log(`Contraseña restablecida para: ${user.email}`)

//     res.status(200).json({
//       success: true,
//       message: "Contraseña restablecida correctamente",
//     })
//   } catch (error) {
//     console.error("Error al restablecer contraseña:", error)
    
//     // Manejo específico de errores de validación
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({
//         message: "Error de validación en los datos del usuario",
//         error: error.message
//       })
//     }
    
//     res.status(500).json({
//       message: "Error interno del servidor",
//     })
//   }
// }

// // Obtener datos del usuario autenticado
// const getUserData = async (req, res) => {
//   try {
//     const userId = req.userId;

//     if (!userId) {
//       return res.status(401).json({ message: "Token inválido o faltante" });
//     }

//     // Traer al usuario con su rol y permisos poblados
//     const user = await Usuario.findById(userId)
//       .populate("role", "nombre") // solo traemos el nombre del rol
//       .populate({
//         path: "permisos",
//         select: "nombrePermiso descripcion categoria activo nivel", // los campos que quieras del permiso
//       })

//     if (!user) {
//       return res.status(404).json({ message: "Usuario no encontrado" });
//     }

//     res.status(200).json({
//       _id: user._id,
//       nombre: user.nombre,
//       correo: user.correo,
//       role: user.role.nombre,
//       permisos: user.permisos || [],
//     });
//   } catch (error) {
//     console.error("Error al obtener usuario:", error);
//     res.status(500).json({ message: "Error al obtener datos del usuario" });
//   }
// }



// module.exports = {
//   login,
//   register,
//   requestPasswordReset,
//   verifyResetToken,
//   resetPassword,
//   getUserData,
// }
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../modules/usuario")
const Rol = require("../modules/rol")
const Cliente = require("../modules/cliente")
const Empleado = require("../modules/empleado")
const { createUser } = require("../controllers/userHelper")
const nodemailer = require("nodemailer")
const crypto = require("crypto")

// 🔥 CORRECCIÓN: createTransport (sin "er" al final)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

// Verificación del transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al configurar el correo:", error)
  } else {
    console.log("Servidor de correo configurado correctamente")
  }
})

const login = async (req, res) => {
  const { email, password } = req.body

  try {
    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate({
      path: "rol",
      populate: {
        path: "permisoRol",
      },
    })

    console.log("Usuario:", user)
    console.log("Permisos del rol:", user?.rol?.permisoRol)

    if (!user) {
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    // Verificar si el usuario está activo
    if (!user.estado) {
      return res.status(401).json({
        message: "Tu cuenta ha sido desactivada. Contacta al administrador.",
        cuentaInactiva: true,
      })
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password.trim(), user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" })
    }

    // Verificar si el rol está activo
    if (!user.rol || !user.rol.estadoRol) {
      return res.status(403).json({
        message: "Tu rol ha sido desactivado. Contacta al administrador.",
        rolDesactivado: true,
      })
    }

    // Generar token
    const token = jwt.sign({ userId: user._id, role: user.rol.nombreRol }, process.env.JWT_SECRET || "secret_key", {
      expiresIn: "24h",
    })

    res.json({
      success: true,
      token,
      role: user.rol.nombreRol,
      permisos: user.rol.permisoRol.map((p) => ({
        id: p._id,
        nombrePermiso: p.nombrePermiso,
        descripcion: p.descripcion,
        activo: p.activo,
        categoria: p.categoria,
        nivel: p.nivel,
      })),
      user: {
        id: user._id,
        email: user.email,
        name: user.nombre,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const register = async (req, res) => {
  const { nombre, apellido, email, password, confirmPassword, rol, estado, celular } = req.body

  try {
    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !confirmPassword || !celular) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios",
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      })
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email: email.toLowerCase().trim() })
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" })
    }

    // Verificar si el correo ya existe en la tabla de clientes
    const clienteExists = await Cliente.findOne({ correocliente: email.toLowerCase().trim() })
    if (clienteExists) {
      return res.status(400).json({ message: "El correo ya está registrado como cliente" })
    }

    // Verificar si el celular ya existe en la tabla de clientes
    const celularExists = await Cliente.findOne({ celularcliente: celular })
    if (celularExists) {
      return res.status(400).json({ message: "El celular ya está registrado como cliente" })
    }

    // Manejar rol
    let rolId
    if (rol) {
      const existeRol = await Rol.findById(rol)
      if (!existeRol || !existeRol.estadoRol) {
        return res.status(400).json({
          message: "El rol especificado no es válido o está desactivado",
        })
      }
      rolId = rol
    } else {
      const defaultRol = await Rol.findOne({ nombreRol: "Cliente" })
      if (!defaultRol || !defaultRol.estadoRol) {
        return res.status(400).json({
          message: "El rol por defecto no está disponible. Contacta al administrador.",
        })
      }
      rolId = defaultRol._id
    }

    // Crear usuario
    const newUser = await createUser({
      nombre,
      apellido,
      email: email.toLowerCase().trim(),
      password,
      rol: rolId,
      estado: estado !== undefined ? estado : true,
      celular,
    })

    const rolObj = await Rol.findById(newUser.rol._id || newUser.rol)

    // 🔥 CORRECCIÓN: Asociar con Cliente o Empleado según el rol
    if (rolObj.nombreRol === "Cliente") {
      // 🔥 CORRECCIÓN: Usar la variable correcta "clienteExists"
      if (!clienteExists) {
        await new Cliente({
          nombrecliente: nombre,
          apellidocliente: apellido,
          correocliente: email,
          celularcliente: celular,
          estadocliente: estado !== undefined ? estado : true,
          usuario: newUser._id,
        }).save()
        console.log(`Cliente creado automáticamente para el usuario: ${email}`)
      }
      // Eliminar cualquier registro de empleado para evitar duplicidad
      await Empleado.deleteMany({ usuario: newUser._id })
    }

    if (rolObj.nombreRol === "Empleado") {
      const empleadoExistente = await Empleado.findOne({ usuario: newUser._id })
      if (!empleadoExistente) {
        await new Empleado({
          nombreempleado: nombre,
          apellidoempleado: apellido,
          correoempleado: email,
          celularempleado: celular,
          telefonoempleado: celular,
          estadoempleado: estado !== undefined ? estado : true,
          especialidad: "General", // Valor por defecto
          salario: 0, // Valor por defecto
          usuario: newUser._id,
        }).save()
        console.log(`Empleado creado automáticamente para el usuario: ${email}`)
      }
      // Eliminar cualquier registro de cliente para evitar duplicidad
      await Cliente.deleteMany({ usuario: newUser._id })
    }

    // Generar token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.rol.nombreRol },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" },
    )

    res.status(201).json({
      success: true,
      token,
      role: newUser.rol.nombreRol,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.nombre,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const requestPasswordReset = async (req, res) => {
  const { email } = req.body

  try {
    // Validar entrada
    if (!email) {
      return res.status(400).json({ message: "El email es requerido" })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("rol")

    // Siempre devolver el mismo mensaje por seguridad
    const successMessage =
      "Si el correo existe en nuestra base de datos, recibirás un código para restablecer tu contraseña."

    if (!user || !user.estado) {
      return res.status(200).json({ message: successMessage })
    }

    // Generar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Hashear el código y establecer expiración (15 minutos)
    const hashedCode = await bcrypt.hash(resetCode, 10)
    user.resetPasswordToken = hashedCode
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    await user.save({ validateBeforeSave: false })

    // Enviar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Código de verificación - NailsSoft",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de verificación</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e1e1e1; }
            .content { padding: 20px 0; }
            .code { font-size: 32px; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-weight: bold; color: #2c3e50; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #2c3e50;">NailsSoft</h1>
              <h2 style="color: #34495e;">Código de Verificación</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${user.nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código para continuar:</p>
              
              <div class="code">${resetCode}</div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este código expira en <strong>15 minutos</strong></li>
                  <li>Solo úsalo si solicitaste el restablecimiento</li>
                  <li>No compartas este código con nadie</li>
                </ul>
              </div>
              
              <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} NailsSoft. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Código de verificación enviado a: ${user.email}`)

    res.status(200).json({
      success: true,
      message: successMessage,
      email: user.email,
    })
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const verifyResetToken = async (req, res) => {
  const { token, email } = req.body

  try {
    // Validar entrada
    if (!token || !email) {
      return res.status(400).json({ message: "Código y email son requeridos" })
    }

    // Validar formato del código
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: "El código debe tener 6 dígitos" })
    }

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({
        message: "El código ha expirado o es inválido",
        expired: true,
      })
    }

    // Verificar el código
    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken)
    if (!isValidToken) {
      return res.status(400).json({ message: "Código incorrecto" })
    }

    // Generar token temporal para autorizar el restablecimiento
    const tempToken = jwt.sign(
      {
        userId: user._id,
        resetVerified: true,
        email: user.email,
      },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "15m" },
    )

    res.status(200).json({
      success: true,
      message: "Código verificado correctamente",
      resetToken: tempToken,
    })
  } catch (error) {
    console.error("Error al verificar código:", error)
    res.status(500).json({ message: "Error interno del servidor" })
  }
}

const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body

  try {
    // Validar entrada
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Token, contraseña y confirmación son requeridos",
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Las contraseñas no coinciden" })
    }

    // Validar contraseña
    if (password.length < 8 || password.length > 64) {
      return res.status(400).json({
        message: "La contraseña debe tener entre 8 y 64 caracteres",
      })
    }

    // Verificar token JWT
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key")
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "La sesión de restablecimiento ha expirado",
          expired: true,
        })
      }
      return res.status(401).json({
        message: "Token de autorización inválido",
        invalid: true,
      })
    }

    if (!decoded.resetVerified) {
      return res.status(401).json({
        message: "Autorización inválida",
        invalid: true,
      })
    }

    // Buscar usuario y verificar que el rol sea válido
    const user = await User.findById(decoded.userId).populate("rol")
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" })
    }

    // Verificar y corregir el rol si es necesario
    if (!user.rol || typeof user.rol === "string") {
      console.log(`Corrigiendo rol para usuario ${user.email}`)

      // Buscar el rol por defecto
      const defaultRol = await Rol.findOne({ nombreRol: "Cliente", estadoRol: true })
      if (!defaultRol) {
        return res.status(500).json({
          message: "Error de configuración: rol por defecto no encontrado",
        })
      }

      // Asignar el rol correcto
      user.rol = defaultRol._id
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Actualizar contraseña y limpiar tokens de reset
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    // Guardar con validación deshabilitada para evitar problemas con otros campos
    await user.save({ validateBeforeSave: false })

    console.log(`Contraseña restablecida para: ${user.email}`)

    res.status(200).json({
      success: true,
      message: "Contraseña restablecida correctamente",
    })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)

    // Manejo específico de errores de validación
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Error de validación en los datos del usuario",
        error: error.message,
      })
    }

    res.status(500).json({
      message: "Error interno del servidor",
    })
  }
}

// Obtener datos del usuario autenticado - Compatible con tu middleware
const getUserData = async (req, res) => {
  try {
    const userId = req.userId // Tu middleware ya establece esto

    if (!userId) {
      return res.status(401).json({ message: "Token inválido o faltante" })
    }

    // Usar "User" para mantener consistencia y poblar correctamente
    const user = await User.findById(userId).populate({
      path: "rol",
      populate: {
        path: "permisoRol",
        select: "nombrePermiso descripcion categoria activo nivel",
      },
    })

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" })
    }

    // Estructura de respuesta consistente con el login
    res.status(200).json({
      _id: user._id,
      nombre: user.nombre,
      correo: user.email, // Usar el campo correcto del modelo
      role: user.rol.nombreRol,
      permisos: user.rol.permisoRol || [],
    })
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    res.status(500).json({ message: "Error al obtener datos del usuario" })
  }
}

module.exports = {
  login,
  register,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  getUserData,
}
