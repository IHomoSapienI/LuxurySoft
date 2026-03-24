const Joi = require('joi');

const tipoDescuentoSchema = Joi.object({
    nombreTs:Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .pattern(/^(?!.*([a-zA-ZáéíóúÁÉÍÓÚñÑ])\1{2,})([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)$/)
    .messages({
        'string.pattern.base': 'El nombre no debe contener más de dos letras iguales consecutivas.',
        'string.base': 'El campo nombreTipoServicio debe ser una cadena de texto.',
        'string.empty': 'El campo nombreTipoServicio no puede estar vacío.',
        'string.min': 'El campo nombreTipoServicio debe tener al menos 3 caracteres.',
        'string.max': 'El campo nombreTipoServicio no puede tener más de 50 caracteres.',
        'any.required': 'El campo nombreTipoServicio es obligatorio.',
    })
.custom((value, helpers) => {
  if (/^\d+$/.test(value)) {
    return helpers.message('El nombre del tipo de descuento no puede ser solo números.');
  }

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
    return helpers.message('El nombre del tipo de servicio no puede ser una cadena repetida.');
  }

  return value;
}, 'Validación personalizada'),
    activo: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'El campo activo debe ser un booleano.',
            'any.required': 'El campo activo es obligatorio.'
        }),
    descuento: Joi.number()
    .integer()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.base': 'El campo descuento debe ser un número.',
            'number.min': 'El descuento no puede ser menor que 0.',
            'number.max': 'El descuento no puede ser mayor que 100.',
        })
  //       .custom((value, helpers) => {
  //   if (value !== 0 && /^0/.test(String(value))) {
  //     return helpers.message('El descuento no puede comenzar con 0');
  //   }
  //   return value;
  // })
  .default(0)
  .messages({
    'number.base': 'El campo descuento debe ser un número.',
    'number.min': 'El descuento no puede ser menor que 0.',
    'number.max': 'El descuento no puede ser mayor que 100.',
  }),
        
        
    esPromocional: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'El campo esPromocional debe ser un booleano.',
        })
})

module.exports = {
    tipoDescuentoSchema,
    tipoDescuentoUpdateSchema: tipoDescuentoSchema.fork(['nombreTs', 'activo', 'descuento', 'esPromocional'], (schema) => schema.optional()),
}