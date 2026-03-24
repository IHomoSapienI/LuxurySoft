// "use client"

// import { useState, useEffect } from "react"
// import { useParams, useNavigate } from "react-router-dom"
// import axios from "axios"
// import Swal from "sweetalert2"
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
// import { faArrowLeft, faCheck, faPrint, faTag } from "@fortawesome/free-solid-svg-icons"
// import "./gestionVentaServicio.css"

// const DetalleVenta = () => {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const [venta, setVenta] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isProcessing, setIsProcessing] = useState(false)
//   const [error, setError] = useState(null)
//   const API_URL = "https://gitbf.onrender.com/api"

//   useEffect(() => {
//     const fetchVenta = async () => {
//       setIsLoading(true)
//       setError(null)
//       try {
//         const token = localStorage.getItem("token")

//         // Primero, intentar obtener los servicios con descuentos usando la función existente
//         let serviciosConDescuento = []
//         try {
//           const { obtenerServiciosConDescuento } = await import("../Servicios/obtenerServicios")
//           serviciosConDescuento = await obtenerServiciosConDescuento()
//           console.log("Servicios con descuento obtenidos:", serviciosConDescuento)
//         } catch (descuentoError) {
//           console.error("Error al obtener servicios con descuento:", descuentoError)
//         }

//         // Luego, obtener la venta
//         const response = await axios.get(`${API_URL}/ventas/${id}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         if (response.data && response.data.venta) {
//           const ventaData = response.data.venta
//           console.log("Datos de venta recibidos:", ventaData)

//           // Procesar los servicios para asegurar que la información de descuento esté correcta
//           if (ventaData.servicios && ventaData.servicios.length > 0) {
//             ventaData.servicios = ventaData.servicios.map((servicio) => {
//               // Obtener el ID del servicio
//               const servicioId = typeof servicio.servicio === "object" ? servicio.servicio._id : servicio.servicio

//               // Buscar el servicio en la lista de servicios con descuento
//               const servicioConDescuento = serviciosConDescuento.find((s) => s._id === servicioId)

//               // Si encontramos el servicio con información de descuento, usamos esa información
//               if (servicioConDescuento) {
//                 console.log(
//                   `Servicio encontrado con descuento: ${servicioConDescuento.nombreServicio}, Descuento: ${servicioConDescuento.porcentajeDescuento}%`,
//                 )

//                 return {
//                   ...servicio,
//                   nombreServicio: servicio.nombreServicio || servicioConDescuento.nombreServicio,
//                   tieneDescuento: servicioConDescuento.tieneDescuento || false,
//                   precioOriginal: servicioConDescuento.precioOriginal || Number.parseFloat(servicio.precio || 0),
//                   precioConDescuento:
//                     servicioConDescuento.precioConDescuento || Number.parseFloat(servicio.precio || 0),
//                   porcentajeDescuento: servicioConDescuento.porcentajeDescuento || 0,
//                   tipoServicioNombre: servicioConDescuento.tipoServicio?.nombreTs || "No especificado",
//                   esPromocional: servicioConDescuento.esPromocional || false,
//                 }
//               }

//               // Si ya tiene información de descuento, la mantenemos
//               if (servicio.tieneDescuento !== undefined) {
//                 return {
//                   ...servicio,
//                   precioOriginal: Number.parseFloat(servicio.precioOriginal || servicio.precio || 0),
//                   precioConDescuento: Number.parseFloat(servicio.precioConDescuento || servicio.precio || 0),
//                   tipoServicioNombre: servicio.tipoServicioNombre || "No especificado",
//                 }
//               }

//               // Verificar si hay indicios de descuento en el servicio
//               const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
//               const precioFinal = Number.parseFloat(servicio.precioConDescuento || servicio.precio || 0)

//               const tieneDescuento =
//                 (servicio.porcentajeDescuento && servicio.porcentajeDescuento > 0) || precioOriginal > precioFinal

//               let porcentajeDescuento = servicio.porcentajeDescuento || 0

//               // Si tiene descuento pero no tenemos el porcentaje, calcularlo
//               if (tieneDescuento && porcentajeDescuento === 0 && precioOriginal > 0) {
//                 porcentajeDescuento = Math.round(((precioOriginal - precioFinal) / precioOriginal) * 100)
//               }

//               return {
//                 ...servicio,
//                 tieneDescuento,
//                 precioOriginal,
//                 precioConDescuento: precioFinal,
//                 porcentajeDescuento,
//                 tipoServicioNombre: "No especificado",
//                 esPromocional: false,
//               }
//             })

//             console.log("Servicios procesados con descuentos:", ventaData.servicios)
//           }

//           setVenta(ventaData)
//         } else {
//           throw new Error("Formato de respuesta inválido")
//         }
//       } catch (error) {
//         console.error("Error al cargar la venta:", error)
//         setError("No se pudo cargar la información de la venta")

//         // Si la venta no existe, redirigir a la lista de ventas
//         if (error.response && error.response.status === 404) {
//           Swal.fire({
//             title: "Venta no encontrada",
//             text: "La venta que intentas ver no existe o ha sido eliminada",
//             icon: "error",
//             confirmButtonText: "Volver a ventas",
//           }).then(() => {
//             navigate("/ventas")
//           })
//         }
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     if (id) {
//       fetchVenta()
//     }
//   }, [id, navigate])

//   const formatearFechaHora = ( fecha, hora) => {
//     if (!fecha) return "Fecha no disponible"
//     return new Date(fecha).toLocaleString("es-ES", {
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//     })
//   }

//   const finalizarVenta = async () => {
//     const { value: metodoPago } = await Swal.fire({
//       title: "Seleccione el método de pago",
//       input: "select",
//       inputOptions: {
//         Efectivo: "Efectivo",
//         Tarjeta: "Tarjeta",
//         Transferencia: "Transferencia",
//         Otro: "Otro",
//       },
//       inputPlaceholder: "Seleccione un método de pago",
//       showCancelButton: true,
//       confirmButtonText: "Finalizar venta",
//       cancelButtonText: "Cancelar",
//       inputValidator: (value) => {
//         return new Promise((resolve) => {
//           if (value) {
//             resolve()
//           } else {
//             resolve("Debe seleccionar un método de pago")
//           }
//         })
//       },
//     })

//     if (metodoPago) {
//       setIsProcessing(true)
//       try {
//         const token = localStorage.getItem("token")
//         await axios.put(
//           `${API_URL}/ventas/${id}/finalizar`,
//           { metodoPago },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           },
//         )

//         // Recargar la venta
//         const response = await axios.get(`${API_URL}/ventas/${id}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         if (response.data && response.data.venta) {
//           setVenta(response.data.venta)
//         }

//         Swal.fire("Finalizado!", "La venta ha sido finalizada correctamente.", "success")
//       } catch (error) {
//         console.error("Error al finalizar la venta:", error)
//         Swal.fire("Error!", "Hubo un problema al finalizar la venta.", "error")
//       } finally {
//         setIsProcessing(false)
//       }
//     }
//   }

//   const imprimirComprobante = () => {
//     const ventanaImpresion = window.open("", "_blank")

//     ventanaImpresion.document.write(`
//       <html>
//         <head>
//           <title>Comprobante de Venta</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 20px;
//               line-height: 1.5;
//             }
//             .header {
//               text-align: center;
//               margin-bottom: 20px;
//               border-bottom: 1px solid #ddd;
//               padding-bottom: 10px;
//             }
//             .info-section {
//               margin-bottom: 20px;
//             }
//             .info-row {
//               display: flex;
//               margin-bottom: 5px;
//             }
//             .info-label {
//               font-weight: bold;
//               width: 150px;
//             }
//             table {
//               width: 100%;
//               border-collapse: collapse;
//               margin: 20px 0;
//             }
//             th, td {
//               border: 1px solid #ddd;
//               padding: 8px;
//               text-align: left;
//             }
//             th {
//               background-color: #f2f2f2;
//             }
//             .total-section {
//               margin-top: 20px;
//               text-align: right;
//             }
//             .total-row {
//               font-weight: bold;
//               font-size: 1.1em;
//             }
//             .footer {
//               margin-top: 30px;
//               text-align: center;
//               font-size: 0.9em;
//               color: #666;
//             }
//             .discount-badge {
//               background-color: #e83e8c;
//               color: white;
//               padding: 2px 5px;
//               border-radius: 3px;
//               font-size: 0.8em;
//               margin-left: 5px;
//             }
//             .original-price {
//               text-decoration: line-through;
//               color: #777;
//               margin-right: 5px;
//             }
//             .discounted-price {
//               color: #e83e8c;
//               font-weight: bold;
//             }
//             @media print {
//               button {
//                 display: none;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="header">
//             <h1>Comprobante de Venta</h1>
//             <p>Código: ${venta.codigoVenta || venta._id}</p>
//           </div>
          
//           <div class="info-section">
//             <div class="info-row">
//               <span class="info-label">Fecha:</span>
//               <span>${
//                 Hora(venta.fechaCreacion || venta.fecha)}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Cliente:</span>
//               <span>${venta.cliente?.nombrecliente} ${venta.cliente?.apellidocliente}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Email:</span>
//               <span>${venta.cliente?.correocliente || "No disponible"}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Teléfono:</span>
//               <span>${venta.cliente?.celularcliente || "No disponible"}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Atendido por:</span>
//               <span>${venta.empleado?.nombreempleado || "No disponible"}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Método de Pago:</span>
//               <span>${venta.metodoPago || "No especificado"}</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Estado:</span>
//               <span>${venta.estado ? "Completada" : "Pendiente"}</span>
//             </div>
//           </div>
          
//           ${
//             venta.productos && venta.productos.length > 0
//               ? `
//           <div class="products-section">
//             <h2>Productos</h2>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Producto</th>
//                   <th>Precio</th>
//                   <th>Cantidad</th>
//                   <th>Subtotal</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${venta.productos
//                   .map(
//                     (producto) => `
//                 <tr>
//                   <td>${producto.nombreProducto}</td>
//                   <td>$${Number.parseFloat(producto.precio).toFixed(2)}</td>
//                   <td>${producto.cantidad}</td>
//                   <td>$${Number.parseFloat(producto.subtotal).toFixed(2)}</td>
//                 </tr>
//                 `,
//                   )
//                   .join("")}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colspan="3" style="text-align: right;"><strong>Subtotal Productos:</strong></td>
//                   <td>$${venta.subtotalProductos.toFixed(2)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//           `
//               : ""
//           }
          
//           ${
//             venta.servicios && venta.servicios.length > 0
//               ? `
//           <div class="services-section">
//             <h2>Servicios</h2>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Servicio</th>
//                   <th>Precio</th>
//                   <th>Tiempo</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 ${venta.servicios
//                   .map(
//                     (servicio) => `
//                 <tr>
//                   <td>${servicio.nombreServicio}
//                     ${servicio.tieneDescuento ? `<span class="discount-badge">${servicio.porcentajeDescuento}% OFF</span>` : ""}
//                   </td>
//                   <td>${
//                     servicio.tieneDescuento
//                       ? `<span class="original-price">$${Number.parseFloat(servicio.precioOriginal || servicio.precio).toFixed(2)}</span> 
//                        <span class="discounted-price">$${Number.parseFloat(servicio.precioConDescuento || servicio.precio).toFixed(2)}</span>`
//                       : `$${Number.parseFloat(servicio.precio).toFixed(2)}`
//                   }</td>
//                   <td>${servicio.tiempo} min</td>
//                 </tr>
//                 `,
//                   )
//                   .join("")}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colspan="2" style="text-align: right;"><strong>Subtotal Servicios:</strong></td>
//                   <td>$${venta.subtotalServicios.toFixed(2)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//           `
//               : ""
//           }
          
//           <div class="total-section">
//             <div class="total-row">TOTAL: $${venta.total.toFixed(2)}</div>
//           </div>
          
//           ${
//             venta.observaciones
//               ? `
//           <div class="observations-section">
//             <h3>Observaciones:</h3>
//             <p>${venta.observaciones}</p>
//           </div>
//           `
//               : ""
//           }
          
//           <div class="footer">
//             <p>¡Gracias por su compra!</p>
//             <p>Fecha de impresión: ${new Date().toLocaleString()}</p>
//           </div>
          
//           <button onclick="window.print()">Imprimir</button>
//         </body>
//       </html>
//     `)

//     ventanaImpresion.document.close()
//     setTimeout(() => {
//       ventanaImpresion.focus()
//       ventanaImpresion.print()
//     }, 500)
//   }

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="flex flex-col items-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
//           <p className="mt-4 text-gray-600">Cargando detalles de la venta...</p>
//         </div>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="error-container" role="alert">
//           <strong className="error-title">Error: </strong>
//           <span className="error-message">{error}</span>
//         </div>
//         <button onClick={() => navigate("/ventas")} className="btn-back mt-4">
//           <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
//           Volver a ventas
//         </button>
//       </div>
//     )
//   }

//   if (!venta) {
//     return (
//       <div className="p-6">
//         <div className="error-container" role="alert">
//           <strong className="error-title">Error: </strong>
//           <span className="error-message">No se encontró la venta solicitada</span>
//         </div>
//         <button onClick={() => navigate("/ventas")} className="btn-back mt-4">
//           <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
//           Volver a ventas
//         </button>
//       </div>
//     )
//   }

//   return (
//     <div className="gestion-container">
//       <div className="header-container">
//         <h1>Detalle de Venta</h1>
//         <div className="flex space-x-2">
//           <button onClick={() => navigate("/ventas")} className="btn-back">
//             <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
//             Volver
//           </button>
//           <button onClick={imprimirComprobante} className="btn-secondary">
//             <FontAwesomeIcon icon={faPrint} className="mr-2" />
//             Imprimir
//           </button>
//         </div>
//       </div>

//       <div className="card">
//         <h2 className="card-title">Información General</h2>
//         <div className="info-grid">
//           <div className="info-item">
//             <p className="info-label">Código de Venta:</p>
//             <p className="info-value">{venta.codigoVenta || venta._id}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Fecha:</p>
//             <p className="info-value">{formatearFechaHora(venta.fechaCreacion || venta.fecha)}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Cliente:</p>
//             <p className="info-value">
//               {venta.cliente?.nombrecliente} {venta.cliente?.apellidocliente}
//             </p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Email:</p>
//             <p className="info-value">{venta.cliente?.correocliente || "No disponible"}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Teléfono:</p>
//             <p className="info-value">{venta.cliente?.celularcliente || "No disponible"}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Empleado:</p>
//             <p className="info-value">{venta.empleado?.nombreempleado || "No disponible"}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Método de Pago:</p>
//             <p className="info-value">{venta.metodoPago || "No especificado"}</p>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Estado:</p>
//             <span className={`estado-badge ${venta.estado ? "activo" : "inactivo"}`}>
//               {venta.estado ? "Completada" : "Pendiente"}
//             </span>
//           </div>
//           <div className="info-item">
//             <p className="info-label">Tipo de Venta:</p>
//             <span
//               className={`tipo-badge ${
//                 venta.tipoVenta === "mixta" ? "mixta" : venta.tipoVenta === "productos" ? "productos" : "servicios"
//               }`}
//             >
//               {venta.tipoVenta === "mixta" ? "Mixta" : venta.tipoVenta === "productos" ? "Productos" : "Servicios"}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Productos */}
//       {venta.productos && venta.productos.length > 0 && (
//         <div className="card">
//           <h2 className="card-title">Productos</h2>
//           <div className="overflow-x-auto">
//             <table className="tabla-servicios">
//               <thead>
//                 <tr>
//                   <th>Nombre</th>
//                   <th className="text-right">Precio</th>
//                   <th className="text-right">Cantidad</th>
//                   <th className="text-right">Subtotal</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {venta.productos.map((producto, index) => (
//                   <tr key={`producto-${index}`}>
//                     <td>{producto.nombreProducto}</td>
//                     <td className="text-right">${Number.parseFloat(producto.precio).toFixed(2)}</td>
//                     <td className="text-right">{producto.cantidad}</td>
//                     <td className="text-right">${Number.parseFloat(producto.subtotal).toFixed(2)}</td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan="3" className="text-right font-semibold">
//                     Subtotal Productos:
//                   </td>
//                   <td className="text-right font-semibold">${venta.subtotalProductos.toFixed(2)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Servicios */}
//       {venta.servicios && venta.servicios.length > 0 && (
//         <div className="card">
//           <h2 className="card-title">Servicios</h2>
//           <div className="overflow-x-auto">
//             <table className="tabla-servicios">
//               <thead>
//                 <tr>
//                   <th>Nombre</th>
//                   <th className="text-right">Precio Original</th>
//                   <th className="text-right">Descuento</th>
//                   <th className="text-right">Precio Final</th>
//                   <th className="text-right">Tiempo</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {venta.servicios.map((servicio, index) => {
//                   // Asegurar que los valores sean números
//                   const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
//                   const precioFinal = servicio.tieneDescuento
//                     ? Number.parseFloat(servicio.precioConDescuento || 0)
//                     : precioOriginal

//                   return (
//                     <tr key={`servicio-${index}`}>
//                       <td>{servicio.nombreServicio}</td>
//                       <td className="text-right">${precioOriginal.toFixed(2)}</td>
//                       <td className="text-center">
//                         {servicio.tieneDescuento ? (
//                           <span className="discount-badge">
//                             <FontAwesomeIcon icon={faTag} className="mr-1" />
//                             {servicio.porcentajeDescuento}% OFF
//                           </span>
//                         ) : (
//                           <span className="text-gray-400">-</span>
//                         )}
//                       </td>
//                       <td className="text-right">
//                         {servicio.tieneDescuento ? (
//                           <span className="discounted-price">${precioFinal.toFixed(2)}</span>
//                         ) : (
//                           <span>${precioFinal.toFixed(2)}</span>
//                         )}
//                       </td>
//                       <td className="text-right">{servicio.tiempo} min</td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan="4" className="text-right font-semibold">
//                     Subtotal Servicios:
//                   </td>
//                   <td className="text-right font-semibold">${venta.subtotalServicios.toFixed(2)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Resumen de Descuentos */}
//       {venta.servicios && venta.servicios.some((s) => s.tieneDescuento) && (
//         <div className="card">
//           <h2 className="card-title">Resumen de Descuentos</h2>
//           <div className="p-4 bg-pink-50 rounded-md">
//             <h3 className="text-lg font-semibold mb-2">Servicios con descuento:</h3>
//             <ul className="space-y-2">
//               {venta.servicios
//                 .filter((s) => s.tieneDescuento)
//                 .map((servicio, index) => {
//                   const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
//                   const precioFinal = Number.parseFloat(servicio.precioConDescuento || servicio.precio || 0)
//                   const ahorro = precioOriginal - precioFinal

//                   return (
//                     <li key={`descuento-${index}`} className="flex justify-between border-b pb-2">
//                       <div>
//                         <span className="font-medium">{servicio.nombreServicio}</span>
//                         <span className="discount-badge ml-2">{servicio.porcentajeDescuento}% OFF</span>
//                       </div>
//                       <div className="text-right">
//                         <div>
//                           <span className="original-price">${precioOriginal.toFixed(2)}</span>
//                         </div>
//                         <div>
//                           <span className="discounted-price">${precioFinal.toFixed(2)}</span>
//                         </div>
//                         <div className="text-green-600 font-semibold">Ahorro: ${ahorro.toFixed(2)}</div>
//                       </div>
//                     </li>
//                   )
//                 })}
//             </ul>
//             <div className="mt-4 text-right">
//               <p className="text-lg font-bold text-green-600">
//                 Total ahorrado: $
//                 {venta.servicios
//                   .filter((s) => s.tieneDescuento)
//                   .reduce((total, servicio) => {
//                     const precioOriginal = Number.parseFloat(servicio.precioOriginal || servicio.precio || 0)
//                     const precioFinal = Number.parseFloat(servicio.precioConDescuento || servicio.precio || 0)
//                     return total + (precioOriginal - precioFinal)
//                   }, 0)
//                   .toFixed(2)}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Resumen */}
//       <div className="card">
//         <h2 className="card-title">Resumen</h2>
//         <div className="resumen-venta">
//           {venta.productos && venta.productos.length > 0 && (
//             <p>
//               <strong>Subtotal Productos:</strong> ${venta.subtotalProductos.toFixed(2)}
//             </p>
//           )}
//           {venta.servicios && venta.servicios.length > 0 && (
//             <p>
//               <strong>Subtotal Servicios:</strong> ${venta.subtotalServicios.toFixed(2)}
//             </p>
//           )}
//           <p className="text-xl font-bold mt-2">
//             <strong>TOTAL:</strong> ${venta.total.toFixed(2)}
//           </p>
//         </div>

//         {venta.observaciones && (
//           <div className="mt-4">
//             <h3 className="text-lg font-semibold">Observaciones:</h3>
//             <p className="text-gray-700">{venta.observaciones}</p>
//           </div>
//         )}

//         {!venta.estado && (
//           <div className="mt-6">
//             <button onClick={finalizarVenta} disabled={isProcessing} className="btn-success">
//               {isProcessing ? (
//                 <>
//                   <span className="spinner"></span>
//                   <span>Procesando...</span>
//                 </>
//               ) : (
//                 <>
//                   <FontAwesomeIcon icon={faCheck} className="mr-2" />
//                   Finalizar Venta
//                 </>
//               )}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default DetalleVenta
