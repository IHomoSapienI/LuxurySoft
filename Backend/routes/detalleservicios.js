const { Router } = require('express');
const router = Router();
const {detserviciosGet, detserviciosPost} =require ('../controllers/detalleservicio');

router.get('/', detserviciosGet);
router.post('/', detserviciosPost);
module.exports = router;