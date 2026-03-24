import React, { useState, useEffect } from 'react';
import FormularioVentaProducto from './FormularioVentaProducto';
import Modal from 'react-modal';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

Modal.setAppElement('#root');

const TablaVentaProductos = () => {
    const [ventas, setVentas] = useState([]);
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
    const [detallesVenta, setDetallesVenta] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const ventasPorPagina = 5;
    const [busqueda, setBusqueda] = useState('');

    const fetchVentas = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://gitbf.onrender.com/api/ventaproductos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setVentas(response.data || []);
        } catch (error) {
            console.error('Error al obtener las ventas:', error);
            Swal.fire('Error', 'No se pudieron cargar las ventas', 'error');
        }
    };

    useEffect(() => {
        fetchVentas();
    }, []);

    const manejarCancelar = () => {
        setVentaSeleccionada(null);
        setModalAbierto(false);
    };

    const manejarAgregarOActualizar = async (ventaData, ventaId) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            let response;
            if (ventaId) {
                response = await axios.put(`https://gitbf.onrender.com/api/ventaproductos/${ventaId}`, ventaData, config);
                await Swal.fire('Actualizado!', 'La venta ha sido actualizada.', 'success');
            } else {
                response = await axios.post('https://gitbf.onrender.com/api/ventaproductos', ventaData, config);
                await Swal.fire('Agregado!', 'La venta ha sido agregada.', 'success');
            }

            // console.log('Respuesta del servidor:', response.data);
            await fetchVentas();
            setModalAbierto(false);
        } catch (error) {
            console.error('Error al agregar o actualizar la venta:', error);
            // No mostrar mensaje de error aquí, ya se maneja en FormularioVentaProducto
        }
    };

    const manejarEliminarVenta = async (idVenta) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminarlo!',
            cancelButtonText: 'Cancelar'
        });
    
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token'); // Obtener el token
                // console.log("Token para eliminación:", token); // Verifica que el token sea correcto
                const response = await axios.delete(`https://gitbf.onrender.com/api/ventaproductos/${idVenta}`, {
                    headers: {
                        'Authorization': `Bearer ${token}` // Enviar el token en el encabezado
                    }
                });
                // console.log("Respuesta de eliminación:", response.data); // Mostrar la respuesta del servidor
                fetchVentas();
                Swal.fire('Eliminado!', 'La venta ha sido eliminada.', 'success');
            } catch (error) {
                console.error('Error al eliminar la venta:', error);
                Swal.fire('Error!', error.response?.data?.message || 'Hubo un problema al eliminar la venta.', 'error');
            }
        }
    };
    

    const mostrarDetallesVenta = (venta) => {
        setDetallesVenta(venta);
        setModalDetallesAbierto(true);
    };

    const indiceUltimaVenta = paginaActual * ventasPorPagina;
    const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
    const ventasActuales = ventas.slice(indicePrimeraVenta, indiceUltimaVenta);
    const paginasTotales = Math.ceil(ventas.length / ventasPorPagina);

    const cambiarPagina = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const paginaAnterior = () => {
        if (paginaActual > 1) setPaginaActual(paginaActual - 1);
    };

    const paginaSiguiente = () => {
        if (paginaActual < paginasTotales) setPaginaActual(paginaActual + 1);
    };

    const ventasFiltradas = ventasActuales.filter((venta) =>
        venta.nombreCliente?.nombrecliente.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="p-6 flex flex-col items-center">
            <h2 className="text-3xl font-semibold mb-8">Gestión de Ventas de Productos</h2>

            <div className="flex justify-between mb-5 w-full h-7 max-w-4xl">
                <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded transition duration-300"
                    onClick={() => {
                        setVentaSeleccionada(null);
                        setModalAbierto(true);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </button>

                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="border border-gray-300 rounded-md py-2 px-4 w-1/2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Buscar por cliente"
                />
            </div>

            <div className="w-full max-w-4xl">
                <table className="table min-w-full divide-y divide-gray-200 bg-white border border-gray-300 rounded-lg shadow-md">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ventasFiltradas.map((venta) => (
                            <tr key={venta._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {venta.nombreCliente.nombrecliente}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(venta.fechaVenta).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${venta.total}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {venta.estado ? 'Activo' : 'Inactivo'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded transition duration-300"
                                        onClick={() => {
                                            setVentaSeleccionada(venta);
                                            setModalAbierto(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded transition duration-300"
                                        onClick={() => manejarEliminarVenta(venta._id)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded transition duration-300"
                                        onClick={() => mostrarDetallesVenta(venta)}
                                    >
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                <nav className="flex justify-center">
                    <ul className="inline-flex items-center">
                        <li>
                            <button
                                onClick={paginaAnterior}
                                disabled={paginaActual === 1}
                                className={`px-3 py-1 mx-1 rounded ${
                                    paginaActual === 1 ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                &lt;
                            </button>
                        </li>
                        {Array.from({ length: paginasTotales }, (_, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => cambiarPagina(index + 1)}
                                    className={`px-3 py-1 mx-1 rounded ${
                                        paginaActual === index + 1
                                            ? 'bg-gray-300 text-gray-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                        <li>
                            <button
                                onClick={paginaSiguiente}
                                disabled={paginaActual === paginasTotales}
                                className={`px-3 py-1 mx-1 rounded ${
                                    paginaActual === paginasTotales ? 'bg-gray-200 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                &gt;
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            <Modal
                isOpen={modalAbierto}
                onRequestClose={manejarCancelar}
                className="fixed inset-0 flex items-center justify-center p-4"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full relative max-h-[80vh] overflow-y-auto">
                    <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={manejarCancelar}
                    >
                        &times;
                    </button>
                    <h2 className="text-lg font-semibold mb-4">{ventaSeleccionada ? 'Editar Venta' : 'Agregar Nueva Venta'}</h2>
                    <FormularioVentaProducto
                        venta={ventaSeleccionada}
                        onGuardar={manejarAgregarOActualizar}
                        onCancelar={manejarCancelar}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={modalDetallesAbierto}
                onRequestClose={() => setModalDetallesAbierto(false)}
                className="fixed inset-0 flex items-center justify-center p-4"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full relative">
                    <button
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        onClick={() => setModalDetallesAbierto(false)}
                    >
                        &times;
                    </button>
                    <h2 className="text-2xl font-bold mb-4">Detalles de la Venta</h2>
                    {detallesVenta && (
                        <div className="space-y-4">
                            <p><strong>Cliente:</strong> {detallesVenta.nombreCliente.nombrecliente}</p>
                            <p><strong>Fecha:</strong> {new Date(detallesVenta.fechaVenta).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ${detallesVenta.total}</p>
                            <div>
                                <strong>Productos:</strong>
                                <table className="min-w-full divide-y divide-gray-200 mt-2">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white  divide-y divide-gray-200">
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{detallesVenta.nombreProducto.nombreProducto}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detallesVenta.cantidad}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${detallesVenta.precio}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${detallesVenta.subtotal}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p><strong>Estado:</strong> {detallesVenta.estado ? 'Activo' : 'Inactivo'}</p>
                        </div>
                    )}
                    <button onClick={() => setModalDetallesAbierto(false)} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
                        Cerrar
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default TablaVentaProductos;