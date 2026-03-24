jest.mock('../modules/cliente', () => ({ findById: jest.fn() }));
jest.mock('../modules/empleado', () => ({ findById: jest.fn() }));
jest.mock('../modules/producto', () => ({ find: jest.fn() }));
jest.mock('../modules/cita', () => ({ findById: jest.fn(), findByIdAndUpdate: jest.fn() }));
jest.mock('../modules/servicio', () => ({ find: jest.fn() }));
jest.mock('../modules/contador', () => ({ findOneAndUpdate: jest.fn() }));

const Venta = require('../modules/venta');
const Cliente = require('../modules/cliente');
const Empleado = require('../modules/empleado');
const Producto = require('../modules/producto');
const Servicio = require('../modules/servicio');
const Cita = require('../modules/cita');
const Contador = require('../modules/contador');
const ventaController = require('../controllers/venta');


describe('crearVenta (controlador)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna error si el cliente o empleado no existe', async () => {
    const req = {
      body: {
        cliente: 'cliente123',
        empleado: 'empleado123',
        productos: [{ producto: 'prod1', cantidad: 1, precio: 10 }]
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    Cliente.findById.mockResolvedValue(null);
    Empleado.findById.mockResolvedValue(null);

    await ventaController.crearVenta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.stringMatching(/cliente o el empleado/i)
    }));
  });

  it('retorna error si la cita no existe', async () => {
    const req = {
      body: {
        cliente: 'cliente123',
        empleado: 'empleado123',
        cita: 'citaInvalida',
        productos: [{ producto: 'prod1', cantidad: 1, precio: 10 }]
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    Cliente.findById.mockResolvedValue({ _id: 'cliente123' });
    Empleado.findById.mockResolvedValue({ _id: 'empleado123' });
    Producto.find.mockResolvedValue([
      { _id: 'prod1', nombreProducto: 'A', precio: 10, stock: 5, save: jest.fn() }
    ]);
    Cita.findById.mockResolvedValue(null);

    await ventaController.crearVenta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.stringMatching(/cita especificada no existe/i)
    }));
  });

  it('retorna error si no hay productos ni servicios', async () => {
    const req = {
      body: {
        cliente: 'cliente123',
        empleado: 'empleado123',
        productos: [],
        servicios: []
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    Cliente.findById.mockResolvedValue({ _id: 'cliente123' });
    Empleado.findById.mockResolvedValue({ _id: 'empleado123' });

    await ventaController.crearVenta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.stringMatching(/al menos un producto o un servicio/i)
    }));
  });

  it('retorna error si el producto no tiene stock suficiente', async () => {
    const req = {
      body: {
        cliente: 'cliente123',
        empleado: 'empleado123',
        productos: [{ producto: 'prod1', cantidad: 10, precio: 5 }]
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    Cliente.findById.mockResolvedValue({ _id: 'cliente123' });
    Empleado.findById.mockResolvedValue({ _id: 'empleado123' });
    Producto.find.mockResolvedValue([
      { _id: 'prod1', nombreProducto: 'Shampoo', precio: 5, stock: 2, save: jest.fn() }
    ]);

    await ventaController.crearVenta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.stringMatching(/stock insuficiente/i)
    }));
  });

  it('crea una venta completa con todos los campos del modelo', async () => {
    const req = {
      body: {
        cliente: 'cliente123',
        empleado: 'empleado123',
        cita: 'cita123',
        productos: [
          {
            producto: 'producto123',
            cantidad: 2,
            precio: 10000,
            nombreProducto: 'Esmalte Rojo',
            subtotal: 20000
          }
        ],
        servicios: [
          {
            servicio: 'servicio123',
            nombreServicio: 'Manicura Básica',
            precio: 50000,
            precioFinal: 40000,
            tiempo: 30,
            descuentoAplicado: 10000,
            tipoDescuento: 'promocional'
          }
        ],
        descuentos: [
          {
            tipo: 'promocional',
            servicioId: 'servicio123',
            nombre: 'Descuento Servicio Manicura',
            valor: 20,
            esPorcentaje: true,
            montoDescontado: 10000
          }
        ],
        metodoPago: 'Efectivo',
        estado: true,
        observaciones: 'Cliente frecuente'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mocks
    Cliente.findById.mockResolvedValue({ _id: 'cliente123', nombrecliente: 'Ana', apellidocliente: 'Pérez', correocliente: 'ana@correo.com', celularcliente: '123456789' });
    Empleado.findById.mockResolvedValue({ _id: 'empleado123', nombreempleado: 'Laura' });
    Producto.find.mockResolvedValue([
      {
        _id: 'producto123',
        nombreProducto: 'Esmalte Rojo',
        precio: 10000,
        stock: 10,
        save: jest.fn()
      }
    ]);
    // Mock con populate para Servicio.find()
    const servicioPopulate = jest.fn().mockResolvedValue([
      {
        _id: 'servicio123',
        nombreServicio: 'Manicura Básica',
        precio: 50000,
        save: jest.fn()
      }
    ]);
    Servicio.find = jest.fn().mockReturnValue({ populate: servicioPopulate });
    Cita.findById.mockResolvedValue({ _id: 'cita123', fechacita: '2025-06-08T10:00:00Z' });
    Cita.findByIdAndUpdate.mockResolvedValue({});
    Contador.findOneAndUpdate.mockResolvedValue({ secuencia: 1 });

    Venta.prototype.save = jest.fn().mockResolvedValue();

    // Venta completa con populate y exec
    const ventaConPopulate = {
      _id: 'venta123',
      total: 55000,
      descuentoTotal: 10000,
      productos: req.body.productos,
      servicios: req.body.servicios,
      descuentos: req.body.descuentos,
    };

    const exec = jest.fn().mockResolvedValue(ventaConPopulate);
    const populate6 = jest.fn().mockReturnValue({ exec });
    const populate5 = jest.fn().mockReturnValue({ populate: populate6 });
    const populate4 = jest.fn().mockReturnValue({ populate: populate5 });
    const populate3 = jest.fn().mockReturnValue({ populate: populate4 });
    const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
    const populate1 = jest.fn().mockReturnValue({ populate: populate2 });

    Venta.findById = jest.fn().mockReturnValue({ populate: populate1 });

    // Ejecutar controlador
    await ventaController.crearVenta(req, res);

    // Asegurar respuesta
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      msg: expect.any(String),
      venta: expect.objectContaining({
        total: 55000,
        descuentoTotal: 10000,
        productos: expect.any(Array),
        servicios: expect.any(Array),
        descuentos: expect.any(Array),
      }),
    }));
  }, 10000);
});
