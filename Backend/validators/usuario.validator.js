const Joi = require('joi');
const mongoose = require('mongoose');
const rol = require('../modules/rol');

const objectValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

const usuarioSchema = Joi.object({
    nombre: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
        'string.empty': 'El campo nombreUsuario es obligatorio.',
        'string.min': 'El campo nombreUsuario debe tener entre 3 y 50 caracteres.',
        'string.max': 'El campo nombreUsuario debe tener entre 3 y 50 caracteres.',
        'string.pattern.base': 'El campo nombreUsuario solo puede contener letras y espacios.',
    }),
    apellido: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
        'string.empty': 'El campo apellido de Usuario es obligatorio.',
        'string.min': 'El campo apellido de Usuario debe tener entre 3 y 50 caracteres.',
        'string.max': 'El campo apellido de Usuario debe tener entre 3 y 50 caracteres.',
        'string.pattern.base': 'El campo apellido de Usuario solo puede contener letras y espacios.',
    }),


    email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .min(10)
    .max(80)
    .required()
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .custom((value, helpers) => {
    const domain = value.split('@')[1]?.toLowerCase();
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com','icloud.com','live.com','protonmail.com','tutanota.com','zoho.com','yandex.com'];
    if (!domain || !allowedDomains.includes(domain)) {
      return helpers.error('email.invalidDomain', { value });
      // return helpers.error('any.invalid');
    }

    // Validar que el dominio no tenga caracteres inválidos
    const invalidDomainChars = /[^a-zA-Z0-9.-]/;
    if (invalidDomainChars.test(domain)) {
      return helpers.error('email.invalidDomainChars', { value });
    }

    return value; // ✅ pasa la validación
  }, 'Validación personalizada de dominio'),



  celular: Joi.string()
  .trim()
  .length(10)
  .required()
    .pattern(/^[1-9][0-9]{9}$/)
    .custom((value, helpers) => {

    if (/^(\d)\1{9}$/.test(value)) {
    return helpers.error('string.repetido');
    }
    if (/\s/.test(value)) {
    return helpers.error('string.espacios');    
    }
    return value; // ✅ pasa la validación
    })
    .messages({
        'string.empty': 'El campo celular es obligatorio.',
        'string.length': 'El campo celular debe tener exactamente 10 dígitos.',
        'string.pattern.base': 'El campo celular solo puede contener números.',
        'string.repetido': 'El campo celular no puede contener dígitos repetidos.',
        'string.espacios': 'El campo celular no puede contener espacios en blanco.',
    }),

    password: Joi.string()
  .min(8)
  .max(64)
  .required()
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]{8,64}$/)
  .messages({
    'string.empty': 'La contraseña es obligatoria.',
    'string.min': 'La contraseña debe tener al menos 8 caracteres.',
    'string.max': 'La contraseña no puede superar los 64 caracteres.',
    'string.pattern.base':
      'La contraseña debe incluir una mayúscula, una minúscula, un número, un carácter especial y no debe contener espacios.',
  }),
  confirmPassword: Joi.any()
  // .trim()
  .valid(Joi.ref('password'))
  .required()
  .messages({
    'any.only': 'Las contraseñas no coinciden.',
    'any.required': 'La confirmación de la contraseña es obligatoria.',
  }),
  rol: Joi.alternatives()
  .try(
    Joi.string().custom(objectValidator, 'ID de rol válido'),
    Joi.array().items(Joi.string().custom(objectValidator, 'ID de rol válido'))
  )
  .required()
  .messages({
    'string.empty': 'El campo rol es obligatorio.',
    'array.base': 'El campo rol debe ser un arreglo de IDs de roles.',
    'any.invalid': 'Uno o más IDs de roles no son válidos.',
  }),
  estado: Joi.boolean()
  .required()
  .messages({
    'boolean.base': 'El campo estado debe ser un booleano.',
    'any.required': 'El campo estado es obligatorio.',
  }),
  especialidad: Joi.string(),
  salario: Joi.number()
}).unknown(false);
module.exports = {
    usuarioSchema,
    usuarioUpdateSchema: usuarioSchema.fork(
        ['nombre', 'apellido', 'email', 'celular', 'password', 'confirmPassword', 'rol', 'estado'],
        (field) => field.optional()
    ),
};
