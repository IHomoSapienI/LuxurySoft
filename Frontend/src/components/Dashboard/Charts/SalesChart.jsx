"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { motion } from "framer-motion"
import { Button } from "../../ui/button"

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}: ${new Intl.NumberFormat().format(entry.value)}
            </span>
          </p>
        ))}
        {payload.length > 1 && (
          <p className="text-sm font-semibold border-t mt-1 pt-1">
            Total: ${new Intl.NumberFormat().format(payload.reduce((sum, entry) => sum + entry.value, 0))}
          </p>
        )}
      </div>
    )
  }
  return null
}

const SalesChart = () => {
  const [data, setData] = useState([])
  const [rawData, setRawData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("year") // 'year', 'month', 'week'
  const [debugMode, setDebugMode] = useState(false)
  const [showCombined, setShowCombined] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No se encontró token de autenticación")
        }

        const headers = { Authorization: `Bearer ${token}` }

        // Obtener datos solo del endpoint de ventas
        const response = await axios.get("https://gitbf.onrender.com/api/ventas", { headers })
        const ventas = response.data.ventas || []

        console.log("Datos de ventas:", ventas)

        // Guardar datos sin procesar para depuración
        setRawData(ventas)

        // Filtrar solo ventas finalizadas (estado true)
        const ventasFinalizadas = ventas.filter((venta) => venta.estado === true)

        // Procesar datos según el rango de tiempo seleccionado
        let processedData

        if (timeRange === "year") {
          processedData = processYearlyData(ventasFinalizadas)
        } else if (timeRange === "month") {
          processedData = processMonthlyData(ventasFinalizadas)
        } else {
          processedData = processWeeklyData(ventasFinalizadas)
        }

        setData(processedData)
      } catch (error) {
        console.error("Error al obtener datos de ventas:", error)
        setError("No se pudieron cargar los datos de ventas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Procesar datos por año (mensualmente)
  const processYearlyData = (ventas) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const currentYear = new Date().getFullYear()

    // Inicializar array con todos los meses
    const monthlyData = months.map((month) => ({
      month,
      productos: 0,
      servicios: 0,
      total: 0,
    }))

    // Sumar ventas por mes
    ventas.forEach((venta) => {
      const date = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())

      // Solo procesar ventas del año actual
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()
        // Asegurarse de que el índice es válido
        if (monthIndex >= 0 && monthIndex < 12) {
          // Agregar subtotales de productos y servicios
          monthlyData[monthIndex].productos += venta.subtotalProductos || 0
          monthlyData[monthIndex].servicios += venta.subtotalServicios || 0
          monthlyData[monthIndex].total += venta.total || 0
        }
      }
    })

    return monthlyData
  }

  // Procesar datos por mes (semanalmente)
  const processMonthlyData = (ventas) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filtrar ventas del mes actual
    const ventasThisMonth = ventas.filter((venta) => {
      const date = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Agrupar por semana del mes
    const weeklyData = [
      { month: "Semana 1", productos: 0, servicios: 0, total: 0 },
      { month: "Semana 2", productos: 0, servicios: 0, total: 0 },
      { month: "Semana 3", productos: 0, servicios: 0, total: 0 },
      { month: "Semana 4", productos: 0, servicios: 0, total: 0 },
      { month: "Semana 5", productos: 0, servicios: 0, total: 0 },
    ]

    ventasThisMonth.forEach((venta) => {
      const date = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
      const dayOfMonth = date.getDate()

      // Asignar a la semana correspondiente (aproximado)
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4)
      weeklyData[weekIndex].productos += venta.subtotalProductos || 0
      weeklyData[weekIndex].servicios += venta.subtotalServicios || 0
      weeklyData[weekIndex].total += venta.total || 0
    })

    return weeklyData
  }

  // Procesar datos por semana (diariamente)
  const processWeeklyData = (ventas) => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

    // Calcular fecha de inicio de la semana actual (lunes)
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = domingo, 1 = lunes, ...
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Ajustar para que lunes sea el primer día

    const monday = new Date(now)
    monday.setDate(now.getDate() - diff)
    monday.setHours(0, 0, 0, 0)

    // Inicializar array con todos los días
    const dailyData = days.map((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)

      return {
        month: day,
        date: date.toISOString().split("T")[0],
        productos: 0,
        servicios: 0,
        total: 0,
      }
    })

    // Sumar ventas por día
    ventas.forEach((venta) => {
      const ventaDate = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
      const ventaDateStr = ventaDate.toISOString().split("T")[0]

      const dayData = dailyData.find((d) => d.date === ventaDateStr)
      if (dayData) {
        dayData.productos += venta.subtotalProductos || 0
        dayData.servicios += venta.subtotalServicios || 0
        dayData.total += venta.total || 0
      }
    })

    // Eliminar el campo date que ya no necesitamos
    return dailyData.map(({ month, productos, servicios, total }) => ({ month, productos, servicios, total }))
  }

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
  }

  const toggleDisplayMode = () => {
    setShowCombined(!showCombined)
  }

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="flex justify-between mb-4">
        <div className="flex gap-4">
          <Button variant="outline" size="sm" onClick={toggleDebugMode} className="text-xs hover:bg-pink-500 hover:text-black">
            {debugMode ? "Ocultar Datos" : "Mostrar Datos"}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleDisplayMode} className="text-xs hover:bg-pink-500 hover:text-black">
            {showCombined ? "Mostrar Separado" : "Mostrar Combinado"}
          </Button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange("week")}
            className={`px-3 py-1 rounded-md text-sm  ${
              timeRange === "week"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500  "
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === "month"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500  "
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => handleTimeRangeChange("year")}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === "year"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500  "
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Año
          </button>
        </div>
      </div>

      {debugMode && (
        <div className="mb-4 p-4 border rounded-md bg-muted/20 text-xs overflow-auto max-h-[200px]">
          <h3 className="font-bold mb-2">Datos sin procesar ({rawData.length} registros):</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">ID</th>
                <th className="text-left p-1">Fecha</th>
                <th className="text-left p-1">Productos</th>
                <th className="text-left p-1">Servicios</th>
                <th className="text-left p-1">Total</th>
                <th className="text-left p-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rawData.map((venta, index) => {
                const fecha = new Date(venta.fechaCreacion || venta.fechaFinalizacion || new Date())
                const fechaFormateada = fecha ? fecha.toLocaleDateString() : "Sin fecha"

                return (
                  <tr key={index} className="border-b hover:bg-muted/40">
                    <td className="p-1">{venta._id || index}</td>
                    <td className="p-1">{fechaFormateada}</td>
                    <td className="p-1">${(venta.subtotalProductos || 0).toFixed(2)}</td>
                    <td className="p-1">${(venta.subtotalServicios || 0).toFixed(2)}</td>
                    <td className="p-1">${(venta.total || 0).toFixed(2)}</td>
                    <td className="p-1">{venta.estado ? "✅" : "❌"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[250px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} style={{ filter: "drop-shadow(0px 0px 10px hsl(330, 81%, 58%))" }}>
            <defs>
              <linearGradient id="productosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A105FBFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#000000FF" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="serviciosGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0000BCFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#000000FF" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF00D9FF" stopOpacity={0.8}  />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{
                paddingBottom: "20px",
                fontSize: "12px",
              }}
            />

            {showCombined ? (
              <Bar
                dataKey="total"
                name="Total"
                fill="url(#totalGradient)"
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
                animationBegin={0}
              />
            ) : (
              <>
                <Bar
                  dataKey="productos"
                  name="Productos"
                  fill="url(#productosGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationBegin={0}
                  stackId="a"
                />
                <Bar
                  dataKey="servicios"
                  name="Servicios"
                  fill="url(#serviciosGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationBegin={200}
                  stackId="a"
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

export default SalesChart

