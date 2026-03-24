const Joi = require('joi');
const mongoose = require('mongoose');
const tipoServicio = require('../modules/tiposerv');
const servicio = require('../modules/servicio');

const objectValidator = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
}

const servicioSchema = Joi.object({
    nombreServicio: Joi.string()
        .trim()
        .min(5)
        .max(50)
        .required()
        .pattern(/^(?!.*(.)\1{2,})[a-zA-Z\s&.,¡!¿?()]+$/) // evita más de 2 letras consecutivas repetidas
        .custom((value, helpers) => {

            // ❌ Validar que el nombre no contenga solo números
            if (/^\d+$/.test(value)) {
                return helpers.error('any.invalid', { message: 'El nombre del servicio no puede ser solo números.' });
            }
            // ❌ Validar que no sea una cadena completamente repetida
            const repeated = (str) => {
                const len = str.length;
                for (let i = 1; i <= len / 2; i++) {
                    const sub = str.slice(0, i);
                    if (sub.repeat(len / i) === str) {
                        return true;
                    }
                }
                return false;
            };

            if (repeated(value)) {
                return helpers.error('any.invalid', { message: 'El nombre del servicio no puede ser una cadena repetida.' });
            }

            return value;
        }, 'Validación personalizada'),
        
        descripcion: Joi.string()
        .trim()
        .min(5)
        .max(100)
        .required()
        .pattern(/^[\p{L}\p{N}\s.,!?¡¿()&'"%-]+$/u)  // evita más de 2 letras consecutivas repetidas
        .custom((value, helpers) => {

            // ❌ Validar que la descripción no contenga solo números
            if (/^\d+$/.test(value)) {
                return helpers.error('any.invalid', { message: 'La descripción del servicio no puede ser solo números.' });
            }

            // ❌ Validar que no sea una cadena completamente repetida
            const repeated = (str) => {
                const len = str.length;
                for (let i = 1; i <= len / 2; i++) {
                    const sub = str.slice(0, i);
                    if (sub.repeat(len / i) === str) {
                        return true;
                    }
                }
                return false;
            };

            if (repeated(value)) {
                return helpers.error('any.invalid', { message: 'La descripción del servicio no puede ser una cadena repetida.' });
            }

            return value;
        }, 'Validación personalizada'),


        
        precio: Joi.number()
    .integer()
    .min(1)
    .max(999999)
    .required()
    .custom((value, helpers) => {
    if (value.toString().toLowerCase().includes('e')) {
      return helpers.error('number.noExponential');
    }
    return value;
  })
  .messages({
    'number.base': 'El precio debe ser un número.',
    'number.integer': 'El precio debe ser un número entero.',
    'number.min': 'El precio no puede ser menor que 1.',
    'number.max': 'El precio no puede ser mayor que 999999.',
    'any.required': 'El precio es obligatorio.',
    'number.noExponential': 'El precio no puede estar en notación científica.'
  }),

  tiempo: Joi.number()
    .integer()
    .min(1)
    .max(999)
    .required()
    .messages({
      'number.base': 'El tiempo debe ser un número.',
      'number.integer': 'El tiempo debe ser un número entero.',
      'number.min': 'El tiempo no puede ser menor que 1.',
      'number.max': 'El tiempo no puede ser mayor que 999.',
      'any.required': 'El tiempo es obligatorio.'
    }),
    tipoServicio: Joi.alternatives()
    .try(
        Joi.string().custom(objectValidator, 'ID de tipo de servicio válido'),
        Joi.array().items(
            Joi.string().custom(objectValidator, 'ID de tipo de servicio válido')
        )
    )
    .required()
    .messages({
        'string.empty': 'El campo tipoServicio es obligatorio.',
        'array.base': 'El campo tipoServicio debe ser un arreglo de IDs de tipo de servicio.',
        'any.invalid': 'Uno o más IDs de tipo de servicio no son válidos.', }),
tipoServicio2: Joi.alternatives()
    .try(
        Joi.string().custom(objectValidator, 'ID de tipo de servicio válido'),
        Joi.array().items(
            Joi.string().custom(objectValidator, 'ID de tipo de servicio válido')
        )
    )
    .required()
    .messages({
        'string.empty': 'El campo tipoServicio es obligatorio.',
        'array.base': 'El campo tipoServicio debe ser un arreglo de IDs de tipo de servicio.',
        'any.invalid': 'Uno o más IDs de tipo de servicio no son válidos.', }),
    imagenUrl: Joi.string()
  .trim()
  .pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
  .required()
  .messages({
    'string.empty': 'El campo imagenUrl es obligatorio.',
    'string.pattern.base': 'La imagen debe tener una extensión válida (jpg, jpeg, png, gif, webp).',
    'any.required': 'El campo imagenUrl es obligatorio.'
  }),

   


    estado: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'El campo estado debe ser un booleano.',
            'any.required': 'El campo estado es obligatorio.'
        }),

    })

    module.exports = {
        servicioSchema,
        servicioUpdateSchema: servicioSchema.fork(['nombreServicio', 'descripcion', 'precio',
             'tiempo', 'tipoServicio', 'imagenUrl','estado'],
              (field) => field.optional()),     
    }