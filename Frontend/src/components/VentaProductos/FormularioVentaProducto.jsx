import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const FormularioVentaProducto = ({ venta, onGuardar, onCancelar }) => {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [clienteId, setClienteId] = useState('');
    const [clienteDocumento, setClienteDocumento] = useState('');
    const [nuevoProducto, setNuevoProducto] = useState({ id: '', nombre: '' });
    const [estado, setEstado] = useState(true);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [ventaId, setVentaId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const [clientesResponse, productosResponse] = await Promise.all([
                axios.get('https://gitbf.onrender.com/api/clientes', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                axios.get('https://gitbf.onrender.com/api/productos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            setClientes(clientesResponse.data || []);
            setProductos(productosResponse.data.productos || []);
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Error al cargar los datos. Por favor, intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (venta) {
            setClienteId(venta.cliente || '');
            setProductosSeleccionados(venta.productos || []);
            setEstado(venta.estado || true);
            setVentaId(venta._id || '');
            setFecha(venta.fechaVenta ? new Date(venta.fechaVenta).toISOString().split('T')[0] : '');
        } else {
            setClienteId('');
            setProductosSeleccionados([]);
            setEstado(true);
            setVentaId('');
            setFecha(new Date().toISOString().split('T')[0]);
        }
    }, [venta]);

    useEffect(() => {
        const clienteSeleccionado = clientes.find(cliente => cliente._id === clienteId);
        setClienteDocumento(clienteSeleccionado ? clienteSeleccionado.documentocliente || '' : '');
    }, [clienteId, clientes]);

    const precioTotal = useMemo(() => {
        return productosSeleccionados.reduce((total, producto) => total + (producto.precio * producto.cantidad), 0);
    }, [productosSeleccionados]);

    const agregarProducto = () => {
        if (nuevoProducto.id) {
            const productoSeleccionado = productos.find(prod => prod._id === nuevoProducto.id);
            if (productoSeleccionado && !productosSeleccionados.some(prod => prod._id === productoSeleccionado._id)) {
                setProductosSeleccionados(prev => [
                    ...prev,
                    {
                        _id: productoSeleccionado._id,
                        nombreProducto: productoSeleccionado.nombreProducto,
                        precio: productoSeleccionado.precio,
                        cantidad: 1
                    }
                ]);
                setNuevoProducto({ id: '', nombre: '' });
            } else {
                Swal.fire('Advertencia', 'Este producto ya fue agregado o no existe.', 'warning');
            }
        } else {
            Swal.fire('Advertencia', 'Debes seleccionar un producto antes de agregar.', 'warning');
        }
    };

    const eliminarProducto = (id) => {
        setProductosSeleccionados(prev => prev.filter(producto => producto._id !== id));
    };

    const handleCantidadChange = (id, cantidad) => {
        setProductosSeleccionados(prev => prev.map(producto => 
            producto._id === id ? { ...producto, cantidad: parseInt(cantidad) } : producto
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!clienteId || productosSeleccionados.length === 0 || precioTotal <= 0) {
            Swal.fire('Error', 'Por favor, complete todos los campos requeridos.', 'error');
            return;
        }
    
        const ventaData = {
            nombreCliente: clienteId,
            productos: productosSeleccionados.map(producto => ({
                nombreProducto: producto._id,
                descripcion: producto.nombreProducto,
                precio: producto.precio,
                cantidad: producto.cantidad
            })),
            estado,
            fechaVenta: fecha,
            precioTotal
        };
    
        try {
            await onGuardar(ventaData, ventaId);
        } catch (error) {
            console.error('Error detallado al guardar la venta:', error);
            Swal.fire('Error', error.response?.data?.message || 'Hubo un problema al guardar la venta.', 'error');
        }
    };

    if (isLoading) return <div className="text-center py-4">Cargando datos...</div>;
    if (error) return <div className="text-center py-4 text-red-600">Error: {error}</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">
                {venta ? 'Editar Venta de Producto' : 'Agregar Venta de Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {ventaId && (
                    <div>
                        <label htmlFor="ventaId" className="block text-sm font-medium text-gray-700">ID de la Venta</label>
                        <input id="ventaId" value={ventaId} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-100" />
                    </div>
                )}

                <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha de Venta <span className="text-red-500">*</span></label>
                    <input 
                        id="fecha" 
                        type="date" 
                        value={fecha} 
                        onChange={(e) => setFecha(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" 
                        required
                    />
                </div>

                <div>
                    <label htmlFor="cliente" className="block text-sm font-medium text-gray-700">Cliente <span className="text-red-500">*</span></label>
                    <select
                        id="cliente"
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        required
                    >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map(cliente => (
                            <option key={cliente._id} value={cliente._id}>
                                {cliente.nombrecliente} - {cliente.documentocliente}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="documento" className="block text-sm font-medium text-gray-700">Documento del Cliente</label>
                    <input id="documento" value={clienteDocumento} readOnly className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-gray-100" />
                </div>

                <div>
                    <label htmlFor="producto" className="block text-sm font-medium text-gray-700">Productos</label>
                    <div className="flex space-x-2">
                        <select
                            id="producto"
                            value={nuevoProducto.id}
                            onChange={(e) => setNuevoProducto({ id: e.target.value, nombre: productos.find(p => p._id === e.target.value)?.nombreProducto || '' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                            <option value="">Selecciona un producto</option>
                            {productos.map(producto => (
                                <option key={producto._id} value={producto._id}>
                                    {producto.nombreProducto}
                                </option>
                            ))}
                        </select>
                        <button 
                            type="button" 
                            onClick={agregarProducto} 
                            className="mt-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Agregar Producto
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Productos Agregados</h3>
                    {productosSeleccionados.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {productosSeleccionados.map(producto => (
                                        <tr key={producto._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{producto.nombreProducto}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <input
                                                    type="number"
                                                    value={producto.cantidad}
                                                    onChange={(e) => handleCantidadChange(producto._id, e.target.value)}
                                                    className="w-20 p-1 border rounded"
                                                    min="1"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(producto.precio * producto.cantidad).toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button 
                                                    type="button" 
                                                    onClick={() => eliminarProducto(producto._id)} 
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                                        <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${precioTotal.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No hay productos agregados.</p>
                    )}
                </div>

                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                        id="estado"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value === 'true')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button 
                        type="submit" 
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {venta ? 'Actualizar Venta' : 'Crear Venta'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onCancelar} 
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioVentaProducto;