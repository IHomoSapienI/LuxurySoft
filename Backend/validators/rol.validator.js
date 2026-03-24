const Joi = require ('joi');
const mongoose = require('mongoose');

const objectValidatr = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
    }
    return value;
};

const rolSchema = Joi.object({
    nombreRol: Joi.string()
        .trim()
        .min(5)
        .max(30)
        .required()
        .pattern(/^[a-zA-Z0-9\s]+$/)
        .messages({
            'string.empty': 'El campo nombreRol es obligatorio.',
            'string.min': 'El campo nombreRol debe tener entre 5 y 30 caracteres.',
            'string.max': 'El campo nombreRol debe tener entre 5 y 30 caracteres.',
            'string.pattern.base': 'El campo nombreRol solo puede contener letras, números y espacios.',
        }),
    permisoRol: Joi.alternatives()
    .try(
        Joi.string().custom(objectValidatr, 'ID de permiso válido'),
        Joi.array().items(Joi.string().custom(objectValidatr, 'ID de permiso válido'))
    )
    .required()
    .messages({
        'string.empty': 'El campo permisoRol es obligatorio.',
        'array.base': 'El campo permisoRol debe ser un arreglo de IDs de permisos.',
        'any.invalid': 'Uno o más IDs de permisos no son válidos.',
    }),
    estadoRol: Joi.boolean().required()
    .messages({
        'boolean.base': 'El campo estadoRol debe ser un booleano.',
        'any.required': 'El campo estadoRol es obligatorio.',
    }),
})

module.exports = {
    rolSchema,
    rolUpdateSchema: rolSchema.fork(
        ['nombreRol', 'permisoRol', 'estadoRol'],
        (field) => field.optional()
    ),
}

