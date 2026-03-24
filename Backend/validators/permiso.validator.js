const Joi = require('joi');

const permisoSchema = Joi.object({

    nombrePermiso: Joi.string()
        .trim()
        .min(5)
        .max(30)
        .required()
        .pattern(/^[a-zA-Z0-9\s]+$/)
        .messages({
        'string.empty': 'El campo nombrePermiso es obligatorio.',
        'string.min': 'El campo nombrePermiso debe tener entre 5 y 30 caracteres.',
        'string.max': 'El campo nombrePermiso debe tener entre 5 y 30 caracteres.',
        'string.pattern.base': 'El campo nombrePermiso solo puede contener letras, números y espacios.',
        }),
    descripcion: Joi.string()
    .trim()
    .min(10)
    .max(80)
    .required()
    // .pattern(/^[a-zA-Z0-9\s]+$/)
    .pattern(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚüÜñÑ()"'¡!¿?,.:;\-]+$/)
    .messages({
        'string.empty': 'El campo descripcion es obligatorio.',
        'string.min': 'El campo descripcion debe tener al menos 10 caracteres.',
        'string.max': 'El campo descripcion debe tener como máximo 100 caracteres.',
        'string.pattern.base': 'El campo descripcion solo puede contener letras, números, espacios y caracteres especiales como tildes áéíóú()"\',.:;¡!¿?-.',
    }),
    activo: Joi.boolean().required(),
    categoria: Joi.string().required(),
    nivel: Joi.string()
        .required() 
        .valid('read', 'write', 'delete')
        .optional()
        .messages({
            'any.only': 'El nivel debe ser uno de los siguientes: read, write, delete.',
            'any.required': 'El campo nivel es obligatorio.',}),    


})

module.exports = {
    permisoSchema,
    permisopdateSchema: permisoSchema.fork(
        ['nombrePermiso', 'descripcion', 'activo', 'categoria', 'nivel'],
        (field)=> field.optional()
    ),
};

