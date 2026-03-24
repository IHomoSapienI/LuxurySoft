import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DetalleVentaProducto.css';

const DetalleVentaProducto = ({ ventaId, onClose }) => {
    const [venta, setVenta] = useState(null);

    useEffect(() => {
        const fetchDetalleVenta = async () => {
            try {
                const response = await axios.get(`https://gitbf.onrender.com/api/ventaproductos/${ventaId}`);
                setVenta(response.data);
            } catch (error) {
                console.error('Error al obtener los detalles de la venta:', error);
            }
        };

        if (ventaId) {
            fetchDetalleVenta();
        }
    }, [ventaId]);

    if (!venta) {
        return <div>Cargando detalles de la venta...</div>;
    }

    return (
        <div className="detalle-modal fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded-md max-w-lg w-full">
                <h2 className="text-lg font-semibold mb-4">Detalle de la Venta</h2>

                <div className="mb-2">
                    <strong>Cliente:</strong> {venta.cliente || 'Cliente no disponible'}
                </div>
                <div className="mb-2">
                    <strong>Estado:</strong> {venta.estado ? 'Activo' : 'Inactivo'}
                </div>
                <div className="mb-2">
                    <strong>Fecha de Registro:</strong> {new Date(venta.fechaRegistro).toLocaleDateString() || 'Fecha no disponible'}
                </div>
                <div className="mb-2">
                    <strong>Recibo:</strong> {venta.recibo || 'Recibo no disponible'}
                </div>
                <div className="mb-2">
                    <strong>Monto Total:</strong> ${venta.montoTotal?.toFixed(2) || '0.00'}
                </div>

                <h3 className="font-semibold mt-4">Productos:</h3>
                <table className="min-w-full mt-2 border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border">Producto</th>
                            <th className="px-4 py-2 border">Cantidad</th>
                            <th className="px-4 py-2 border">Precio</th>
                            <th className="px-4 py-2 border">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {venta.productos.map((producto) => (
                            <tr key={producto.id} className="border-b">
                                <td className="px-4 py-2">{producto.nombreProducto || 'Producto no disponible'}</td>
                                <td className="px-4 py-2">{producto.cantidad || '0'}</td>
                                <td className="px-4 py-2">${producto.precio?.toFixed(2) || '0.00'}</td>
                                <td className="px-4 py-2">${(producto.precio * producto.cantidad).toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4">
                    <button
                        onClick={onClose}
                        className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalleVentaProducto;
