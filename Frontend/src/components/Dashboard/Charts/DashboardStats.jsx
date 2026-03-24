"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { DollarSign, Users, ShoppingBag, CalendarHeart, Package, Scissors } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../ui/card"
import { Badge } from "../../ui/badge"

const DashboardStats = () => {
  const [stats, setStats] = useState({
    ingresosTotales: { valor: 0, cambio: 0 },
    ingresosProductos: { valor: 0, cambio: 0 },
    ingresosServicios: { valor: 0, cambio: 0 },
    citasTotales: { valor: 0, cambio: 0 },
    clientesNuevos: { valor: 0, cambio: 0 },
    serviciosVendidos: { valor: 0, cambio: 0 },
    productosVendidos: { valor: 0, cambio: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No se encontró token de autenticación")
        }

        const headers = { Authorization: `Bearer ${token}` }

        // Obtener datos de citas
        const citasResponse = await axios.get("https://gitbf.onrender.com/api/citas", { headers })
        const citas = citasResponse.data.citas || []

        // Obtener datos de ventas
        const ventasResponse = await axios.get("https://gitbf.onrender.com/api/ventas", { headers })
        const ventas = ventasResponse.data.ventas || []

        // Obtener datos de clientes
        const clientesResponse = await axios.get("https://gitbf.onrender.com/api/clientes", { headers })
        const clientes = clientesResponse.data || []

        // Debug: Mostrar estructura de clientes
        console.log("=== DEBUG CLIENTES ===")
        console.log("Total clientes obtenidos:", clientes.length)
        if (clientes.length > 0) {
          console.log("Estructura del primer cliente:", clientes[0])
          console.log("Campos de fecha disponibles:", {
            fechacreacion: clientes[0].fechacreacion,
            createdAt: clientes[0].createdAt,
            fechaCreacion: clientes[0].fechaCreacion,
            _id: clientes[0]._id,
          })
        }

        // Calcular estadísticas
        const ahora = new Date()
        const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)

        console.log("Fechas de referencia:")
        console.log("Inicio mes actual:", inicioMesActual.toISOString())
        console.log("Inicio mes anterior:", inicioMesAnterior.toISOString())

        // Filtrar citas por mes actual y anterior
        const citasMesActual = citas.filter((cita) => new Date(cita.fechacita) >= inicioMesActual)
        const citasMesAnterior = citas.filter(
          (cita) => new Date(cita.fechacita) >= inicioMesAnterior && new Date(cita.fechacita) < inicioMesActual,
        )

        // Filtrar ventas por mes actual y anterior
        // Solo considerar ventas finalizadas para los ingresos
        const ventasMesActual = ventas.filter((venta) => {
          // Verificar si la venta está finalizada (estado true)
          if (!venta.estado) return false

          // Usar fecha de creación o finalización
          const ventaDate = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
          return ventaDate >= inicioMesActual
        })

        const ventasMesAnterior = ventas.filter((venta) => {
          // Verificar si la venta está finalizada (estado true)
          if (!venta.estado) return false

          // Usar fecha de creación o finalización
          const ventaDate = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
          return ventaDate >= inicioMesAnterior && ventaDate < inicioMesActual
        })

        // Calcular ingresos totales
        const ingresosMesActual = ventasMesActual.reduce((total, venta) => total + (venta.total || 0), 0)
        const ingresosMesAnterior = ventasMesAnterior.reduce((total, venta) => total + (venta.total || 0), 0)
        const cambioPorcentajeIngresos =
          ingresosMesAnterior === 0 ? 100 : ((ingresosMesActual - ingresosMesAnterior) / ingresosMesAnterior) * 100

        // Calcular ingresos por productos
        const ingresosProductosMesActual = ventasMesActual.reduce(
          (total, venta) => total + (venta.subtotalProductos || 0),
          0,
        )
        const ingresosProductosMesAnterior = ventasMesAnterior.reduce(
          (total, venta) => total + (venta.subtotalProductos || 0),
          0,
        )
        const cambioPorcentajeProductos =
          ingresosProductosMesAnterior === 0
            ? 100
            : ((ingresosProductosMesActual - ingresosProductosMesAnterior) / ingresosProductosMesAnterior) * 100

        // Calcular ingresos por servicios
        const ingresosServiciosMesActual = ventasMesActual.reduce(
          (total, venta) => total + (venta.subtotalServicios || 0),
          0,
        )
        const ingresosServiciosMesAnterior = ventasMesAnterior.reduce(
          (total, venta) => total + (venta.subtotalServicios || 0),
          0,
        )
        const cambioPorcentajeServicios =
          ingresosServiciosMesAnterior === 0
            ? 100
            : ((ingresosServiciosMesActual - ingresosServiciosMesAnterior) / ingresosServiciosMesAnterior) * 100

        // Calcular número de citas
        const numCitasMesActual = citasMesActual.length
        const numCitasMesAnterior = citasMesAnterior.length
        const cambioPorcentajeCitas =
          numCitasMesAnterior === 0 ? 100 : ((numCitasMesActual - numCitasMesAnterior) / numCitasMesAnterior) * 100

        // ===== LÓGICA CORREGIDA PARA CLIENTES NUEVOS =====

        // Función para obtener fecha de creación del cliente
        const getClientCreationDate = (cliente) => {
          // Intentar diferentes campos de fecha en orden de prioridad
          const possibleDateFields = [
            cliente.fechacreacion,
            cliente.createdAt,
            cliente.fechaCreacion,
            cliente.fecha_creacion,
            cliente.created_at,
          ]

          for (const dateField of possibleDateFields) {
            if (dateField) {
              const date = new Date(dateField)
              // Verificar que la fecha es válida
              if (!isNaN(date.getTime())) {
                return date
              }
            }
          }

          // Si no hay fecha válida, usar fecha actual como fallback
          console.warn("Cliente sin fecha de creación válida:", cliente._id)
          return new Date()
        }

        // Filtrar y contar clientes nuevos del mes actual
        const clientesNuevosMesActual = clientes.filter((cliente) => {
          const fechaCreacion = getClientCreationDate(cliente)
          const esDelMesActual = fechaCreacion >= inicioMesActual

          if (esDelMesActual) {
            console.log("Cliente nuevo del mes actual:", {
              id: cliente._id,
              nombre: cliente.nombrecliente,
              fecha: fechaCreacion.toISOString(),
            })
          }

          return esDelMesActual
        }).length

        // Filtrar y contar clientes nuevos del mes anterior
        const clientesNuevosMesAnterior = clientes.filter((cliente) => {
          const fechaCreacion = getClientCreationDate(cliente)
          return fechaCreacion >= inicioMesAnterior && fechaCreacion < inicioMesActual
        }).length

        console.log("=== RESUMEN CLIENTES NUEVOS ===")
        console.log("Clientes nuevos mes actual:", clientesNuevosMesActual)
        console.log("Clientes nuevos mes anterior:", clientesNuevosMesAnterior)

        const cambioPorcentajeClientes =
          clientesNuevosMesAnterior === 0
            ? clientesNuevosMesActual > 0
              ? 100
              : 0
            : ((clientesNuevosMesActual - clientesNuevosMesAnterior) / clientesNuevosMesAnterior) * 100

        // Calcular servicios vendidos
        const serviciosVendidosMesActual = ventasMesActual.reduce((total, venta) => {
          if (!venta.servicios || !Array.isArray(venta.servicios)) return total
          return total + venta.servicios.length
        }, 0)

        const serviciosVendidosMesAnterior = ventasMesAnterior.reduce((total, venta) => {
          if (!venta.servicios || !Array.isArray(venta.servicios)) return total
          return total + venta.servicios.length
        }, 0)

        const cambioPorcentajeServiciosVendidos =
          serviciosVendidosMesAnterior === 0
            ? 100
            : ((serviciosVendidosMesActual - serviciosVendidosMesAnterior) / serviciosVendidosMesAnterior) * 100

        // Calcular productos vendidos
        const productosVendidosMesActual = ventasMesActual.reduce((total, venta) => {
          if (!venta.productos || !Array.isArray(venta.productos)) return total
          return total + venta.productos.reduce((sum, producto) => sum + (producto.cantidad || 0), 0)
        }, 0)

        const productosVendidosMesAnterior = ventasMesAnterior.reduce((total, venta) => {
          if (!venta.productos || !Array.isArray(venta.productos)) return total
          return total + venta.productos.reduce((sum, producto) => sum + (producto.cantidad || 0), 0)
        }, 0)

        const cambioPorcentajeProductosVendidos =
          productosVendidosMesAnterior === 0
            ? 100
            : ((productosVendidosMesActual - productosVendidosMesAnterior) / productosVendidosMesAnterior) * 100

        // Actualizar estado con las estadísticas calculadas
        setStats({
          ingresosTotales: {
            valor: ingresosMesActual,
            cambio: cambioPorcentajeIngresos.toFixed(1),
          },
          ingresosProductos: {
            valor: ingresosProductosMesActual,
            cambio: cambioPorcentajeProductos.toFixed(1),
          },
          ingresosServicios: {
            valor: ingresosServiciosMesActual,
            cambio: cambioPorcentajeServicios.toFixed(1),
          },
          citasTotales: {
            valor: numCitasMesActual,
            cambio: cambioPorcentajeCitas.toFixed(1),
          },
          clientesNuevos: {
            valor: clientesNuevosMesActual,
            cambio: cambioPorcentajeClientes.toFixed(1),
          },
          serviciosVendidos: {
            valor: serviciosVendidosMesActual,
            cambio: cambioPorcentajeServiciosVendidos.toFixed(1),
          },
          productosVendidos: {
            valor: productosVendidosMesActual,
            cambio: cambioPorcentajeProductosVendidos.toFixed(1),
          },
        })
      } catch (error) {
        console.error("Error al obtener estadísticas:", error)
        setError("No se pudieron cargar las estadísticas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Actualizar cada 5 minutos
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden border-none shadow-md animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
                <div className="h-5 w-12 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>
  }

  const statsData = [
    {
      title: "Ingresos Totales",
      value: `$${stats.ingresosTotales.valor.toLocaleString()}`,
      change: `${stats.ingresosTotales.cambio}%`,
      icon: <DollarSign className="h-5 w-5 text-pink-600 dark:text-black" />,
      trend: Number.parseFloat(stats.ingresosTotales.cambio) >= 0 ? "up" : "down",
      className: "card-gradient-1 text-black dark:card-gradient-33 dark:text-foreground ",
      details: [
        {
          label: "Productos",
          value: `$${stats.ingresosProductos.valor.toLocaleString()}`,
          icon: <Package className="h-4 w-4" />,
          change: `${stats.ingresosProductos.cambio}%`,
          trend: Number.parseFloat(stats.ingresosProductos.cambio) >= 0 ? "up" : "down",
        },
        {
          label: "Servicios",
          value: `$${stats.ingresosServicios.valor.toLocaleString()}`,
          icon: <Scissors className="h-4 w-4" />,
          change: `${stats.ingresosServicios.cambio}%`,
          trend: Number.parseFloat(stats.ingresosServicios.cambio) >= 0 ? "up" : "down",
        },
      ],
    },
    {
      title: "Citas Totales",
      value: stats.citasTotales.valor.toString(),
      change: `${stats.citasTotales.cambio}%`,
      icon: <CalendarHeart className="h-5 w-5 text-pink-600 dark:text-black" />,
      trend: Number.parseFloat(stats.citasTotales.cambio) >= 0 ? "up" : "down",
      className: "card-gradient-1 text-black dark:card-gradient-33 dark:text-black",
    },
    {
      title: "Clientes Nuevos",
      value: stats.clientesNuevos.valor.toString(),
      change: `${stats.clientesNuevos.cambio}%`,
      icon: <Users className="h-5 w-5 text-pink-600 dark:text-black" />,
      trend: Number.parseFloat(stats.clientesNuevos.cambio) >= 0 ? "up" : "down",
      className: "card-gradient-1 dark:card-gradient-33 dark:text-black",
    },
    {
      title: "Ventas",
      value: (stats.serviciosVendidos.valor + stats.productosVendidos.valor).toString(),
      change: `${((Number(stats.serviciosVendidos.cambio) + Number(stats.productosVendidos.cambio)) / 2).toFixed(1)}%`,
      icon: <ShoppingBag className="h-5 w-5 text-pink-600 dark:text-black" />,
      trend: (Number(stats.serviciosVendidos.cambio) + Number(stats.productosVendidos.cambio)) / 2 >= 0 ? "up" : "down",
      className: "card-gradient-1 text-black dark:card-gradient-33 dark:text-black",
      details: [
        {
          label: "Productos",
          value: stats.productosVendidos.valor.toString(),
          icon: <Package className="h-4 w-4" />,
          change: `${stats.productosVendidos.cambio}%`,
          trend: Number.parseFloat(stats.productosVendidos.cambio) >= 0 ? "up" : "down",
        },
        {
          label: "Servicios",
          value: stats.serviciosVendidos.valor.toString(),
          icon: <Scissors className="h-4 w-4" />,
          change: `${stats.serviciosVendidos.cambio}%`,
          trend: Number.parseFloat(stats.serviciosVendidos.cambio) >= 0 ? "up" : "down",
        },
      ],
    },
  ]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {statsData.map((stat, index) => (
        <motion.div key={index} variants={item}>
          <Card className={`overflow-hidden border-none shadow-md ${stat.className} hover-glow`}>
            <CardHeader className="pb-2 dark:text-black">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-black">
                  {stat.title}
                </CardTitle>
                <div className="rounded-full bg-primary/20 p-1.5 dark:text-primary">{stat.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between dark:text-primary">
                <div className="text-2xl font-bold ">{stat.value}</div>
                <Badge variant={stat.trend === "up" ? "success" : "destructive"} className="text-xsw">
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
            {stat.details && (
              <CardFooter className="pt-0 pb-3 px-6 dark:text-black">
                <div className="w-full grid grid-cols-2 gap-2 text-xs border-t pt-2 dark:text-black">
                  {stat.details.map((detail, idx) => (
                    <div key={idx} className="flex flex-col items-start">
                      <div className="flex items-center gap-1 text-muted-foreground dark:text-black">
                        {detail.icon}
                        <span>{detail.label}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <span>{detail.value}</span>
                        <Badge
                          variant={detail.trend === "up" ? "success" : "destructive"}
                          className="text-[10px] px-1 py-0"
                        >
                          {detail.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default DashboardStats
