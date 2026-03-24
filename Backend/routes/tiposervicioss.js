const {Router} = require('express');

const router = Router();

const { tiposerviciostsGet,
    tiposerviciostsPost,
    tiposerviciostsPut,
    tiposerviciostsDelete,
    tiposerviciostsToggleEstado } = require('../controllers/tiposervicios');

    router.get('/', tiposerviciostsGet);
    router.post('/', tiposerviciostsPost);
    router.put('/:id', tiposerviciostsPut);
    router.delete('/:id', tiposerviciostsDelete);
    router.patch('/:id/toggle-estado', tiposerviciostsToggleEstado);
    module.exports = router;