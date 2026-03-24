// const express = require('express');
// const { dbConnection } = require('../database/config');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const path = require('path');
// const compression = require("compression");
// const { expressStaticGzip } = require('express-static-gzip');


// class Server {
//     constructor() {
//         this.app = express();
//         this.port = process.env.PORT || 3000; 
//         this.usuariosPath = '/api/usuarios';
//         this.rolesPath = '/api/roles';
//         this.permisosPath = '/api/permisos';
//         this.tiposerviciosPath = '/api/tiposervicios';
//         this.tiposerviciossPath = '/api/tiposervicioss';
//         this.serviciosPath = '/api/servicios';
//         this.detalleserviciosPath = '/api/detalleservicios';
//         this.ventaserviciosPath = '/api/ventaservicios';
//         this.insumosPath = '/api/insumos';
//         this.empleadosPath = '/api/empleados';
//         this.clientesPath = '/api/clientes';
//         this.citasPath = '/api/citas';
//         this.categoriaproductosPath = '/api/categoriaproductos';
//         this.productosPath = '/api/productos';
//         this.proveedoresPath = '/api/proveedores';
//         this.ventaproductosPath = '/api/ventaproductos'; 
//         this.comprasPath = '/api/compras';
//         this.authPath = '/api/auth';
//         this.bajasProductos= '/api/baja-productos';
//         this.ventasPath = "/api/ventas";
//         this.middlewares();
//         this.routes();
//         this.connectDb();
//     }

//     listen() {
//         this.app.listen(this.port, () => {
//             console.log(`Escuchando por el puerto ${this.port}`);
//         });
//     }

//     middlewares() {
//         // CORS
//         this.app.use(cors({
//             // origin: 'http://localhost:3000',
//             origin: "*", // Permite el dominio de ngrok
//             credentials: true, // Permite cookies en las peticiones
//         }));

//         this.app.use(bodyParser.json()); // for parsing application/json
//         this.app.use(compression());
//         this.app.use(express.static(path.join(__dirname, '../frontend/public'))); // Servir archivos estáticos del frontend
//         // Para servir los archivos subidos
//         this.app.use(express.static('uploads'));
//         this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
        
//     }

//     routes() {
//         this.app.use(this.usuariosPath, require('../routes/usuarios'));
//         this.app.use(this.rolesPath, require('../routes/roles'));
//         this.app.use(this.permisosPath, require('../routes/permisos'));
//         this.app.use(this.tiposerviciosPath, require('../routes/tiposervs'));
//         this.app.use(this.tiposerviciossPath, require('../routes/tiposervicioss'));
//         this.app.use(this.serviciosPath, require('../routes/servicios')); 
//         this.app.use(this.detalleserviciosPath, require('../routes/detalleservicios'));
//         this.app.use(this.ventaserviciosPath, require('../routes/ventaservicios'));
//         this.app.use(this.insumosPath, require('../routes/insumos'));
//         this.app.use(this.empleadosPath, require('../routes/empleados'));
//         this.app.use(this.clientesPath, require('../routes/clientes'));
//         this.app.use(this.citasPath, require('../routes/citas'));
//         this.app.use(this.proveedoresPath, require('../routes/proveedor'));
//         this.app.use(this.categoriaproductosPath, require('../routes/categoriaProductos'));
//         this.app.use(this.productosPath, require('../routes/productos'));
//         this.app.use(this.ventaproductosPath, require('../routes/ventaproductos'));
//         this.app.use(this.comprasPath, require('../routes/compra'));
//         this.app.use(this.authPath, require('../routes/auth'));
//         this.app.use(this.bajasProductos, require('../routes/bajaproducto'));
//         this.app.use(this.ventasPath, require("../routes/venta"));
//     }

//     async connectDb() {
//         await dbConnection();
//     }
// }

// module.exports = Server;

const express = require('express');
const { dbConnection } = require('../database/config');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require("compression");
const expressStaticGzip = require('express-static-gzip');


class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        // Rutas API
        this.usuariosPath = '/api/usuarios';
        this.rolesPath = '/api/roles';
        this.permisosPath = '/api/permisos';
        this.tiposerviciosPath = '/api/tiposervicios';
        this.tiposerviciossPath = '/api/tiposervicioss';
        this.serviciosPath = '/api/servicios';
        this.detalleserviciosPath = '/api/detalleservicios';
        this.ventaserviciosPath = '/api/ventaservicios';
        this.insumosPath = '/api/insumos';
        this.empleadosPath = '/api/empleados';
        this.clientesPath = '/api/clientes';
        this.citasPath = '/api/citas';
        this.categoriaproductosPath = '/api/categoriaproductos';
        this.productosPath = '/api/productos';
        this.proveedoresPath = '/api/proveedores';
        this.ventaproductosPath = '/api/ventaproductos';
        this.comprasPath = '/api/compras';
        this.authPath = '/api/auth';
        this.bajasProductos = '/api/baja-productos';
        this.ventasPath = "/api/ventas";

        this.middlewares();
        this.routes();
        this.connectDb();
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Escuchando por el puerto ${this.port}`);
        });
    }

    middlewares() {
        // CORS
        this.app.use(cors({ origin: "*", credentials: true }));

        // JSON parser
        this.app.use(bodyParser.json());

        // Compresión para APIs (respuestas dinámicas)
        this.app.use(compression());

        // Archivos estáticos comprimidos (gzip, brotli)
        this.app.use(
            '/',
            expressStaticGzip(path.join(__dirname, '../frontend/dist'), {
                enableBrotli: true,
                orderPreference: ['br', 'gz'],
                setHeaders: (res, path) => {
                    if (path.endsWith('.gz')) {
                        res.setHeader('Content-Encoding', 'gzip');
                    }
                    if (path.endsWith('.br')) {
                        res.setHeader('Content-Encoding', 'br');
                    }
                    res.setHeader('Cache-Control', 'public, max-age=31536000');
                }
            })
        );

        // Archivos subidos
        this.app.use(express.static('uploads'));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    }

    routes() {
        this.app.use(this.usuariosPath, require('../routes/usuarios'));
        this.app.use(this.rolesPath, require('../routes/roles'));
        this.app.use(this.permisosPath, require('../routes/permisos'));
        this.app.use(this.tiposerviciosPath, require('../routes/tiposervs'));
        this.app.use(this.tiposerviciossPath, require('../routes/tiposervicioss'));
        this.app.use(this.serviciosPath, require('../routes/servicios'));
        this.app.use(this.detalleserviciosPath, require('../routes/detalleservicios'));
        this.app.use(this.ventaserviciosPath, require('../routes/ventaservicios'));
        this.app.use(this.insumosPath, require('../routes/insumos'));
        this.app.use(this.empleadosPath, require('../routes/empleados'));
        this.app.use(this.clientesPath, require('../routes/clientes'));
        this.app.use(this.citasPath, require('../routes/citas'));
        this.app.use(this.proveedoresPath, require('../routes/proveedor'));
        this.app.use(this.categoriaproductosPath, require('../routes/categoriaProductos'));
        this.app.use(this.productosPath, require('../routes/productos'));
        this.app.use(this.ventaproductosPath, require('../routes/ventaproductos'));
        this.app.use(this.comprasPath, require('../routes/compra'));
        this.app.use(this.authPath, require('../routes/auth'));
        this.app.use(this.bajasProductos, require('../routes/bajaproducto'));
        this.app.use(this.ventasPath, require("../routes/venta"));
    }

    async connectDb() {
        await dbConnection();
    }
}

module.exports = Server;
