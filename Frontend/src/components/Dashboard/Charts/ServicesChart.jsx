"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { motion } from "framer-motion"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(300, 70%, 70%)",
  "hsl(320, 70%, 75%)",
  "hsl(340, 70%, 80%)",
  "hsl(360, 70%, 85%)",
  "hsl(20, 70%, 80%)",
  "hsl(40, 70%, 75%)",
  "hsl(60, 70%, 70%)",
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md dark:bg-foreground dark:text-white">
        <p className="font-medium text-black">{payload[0].name}</p>
        <p className="text-sm text-black">
          <span className="font-medium text-primary dark:text-white">{payload[0].value}</span>{" "}
          {payload[0].value === 1 ? "servicio" : "servicios"}
        </p>
      </div>
    )
  }
  return null
}

const ServicesChart = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("month") // 'year', 'month', 'week'

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

        // Obtener citas y empleados
        const [citasResponse, empleadosResponse] = await Promise.all([
          axios.get("https://gitbf.onrender.com/api/citas", { headers }),
          axios.get("https://gitbf.onrender.com/api/empleados", { headers }),
        ])

        const citas = citasResponse.data.citas || []
        const empleados = empleadosResponse.data || []

        // Filtrar citas según el rango de tiempo
        const filteredCitas = filterCitasByTimeRange(citas, timeRange)

        // Procesar datos para el gráfico
        const processedData = processServicesByEmployee(filteredCitas, empleados)
        setData(processedData)
      } catch (error) {
        console.error("Error al obtener datos de servicios:", error)
        setError("No se pudieron cargar los datos de servicios")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Filtrar citas por rango de tiempo
  const filterCitasByTimeRange = (citas, range) => {
    const now = new Date()
    let startDate

    if (range === "week") {
      // Inicio de la semana actual (lunes)
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate = new Date(now)
      startDate.setDate(now.getDate() - diff)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === "month") {
      // Inicio del mes actual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      // Inicio del año actual
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    return citas.filter((cita) => new Date(cita.fechacita) >= startDate)
  }

  // Procesar servicios por empleado
  const processServicesByEmployee = (citas, empleados) => {
    // Crear un mapa para contar servicios por empleado
    const employeeServiceCount = {}

    // Inicializar contador para cada empleado
    empleados.forEach((empleado) => {
      employeeServiceCount[empleado._id] = {
        employee: empleado.nombreempleado,
        value: 0,
      }
    })

    // Contar servicios por empleado
    citas.forEach((cita) => {
      if (cita.nombreempleado && cita.servicios && Array.isArray(cita.servicios)) {
        const empleadoId = typeof cita.nombreempleado === "object" ? cita.nombreempleado._id : cita.nombreempleado

        if (employeeServiceCount[empleadoId]) {
          employeeServiceCount[empleadoId].value += cita.servicios.length
        }
      }
    })

    // Convertir a array y filtrar empleados sin servicios
    return Object.values(employeeServiceCount)
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  const handleTimeRangeChange = (range) => {
    setTimeRange(range)
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

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-gray-500">No hay datos disponibles para el período seleccionado</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <div className="flex justify-end mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange("week")}
            className={`px-3 py-1 rounded-md text-sm  ${
              timeRange === "week"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500 hover:text-black"
                : "bg-muted text-muted-foreground hover:bg-muted/80 "
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`px-3 py-1 rounded-md text-sm  ${
              timeRange === "month"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500 hover:text-black"
                : "bg-muted text-muted-foreground hover:bg-muted/80 "
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => handleTimeRangeChange("year")}
            className={`px-3 py-1 rounded-md text-sm  ${
              timeRange === "year"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500 hover:text-black"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Año
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[250px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="employee"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              style={{ filter: "drop-shadow(0px 0px 10px hsl(330, 81%, 58%))" }}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                const RADIAN = Math.PI / 180
                const radius = 25 + innerRadius + (outerRadius - innerRadius)
                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                

                return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize="11"
                  >
                    {`${data[index].employee} (${value})`}
                  </text>
                )
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={4}
                  style={{ filter: "drop-shadow(0px 0px 10px hsl(330, 81%, 58%))" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
            
              layout="vertical"
              verticalAlign="middle"
              align="right"
              
              wrapperStyle={{
                fontSize: "12px",
                color: "hsl(var(--foreground))",
                paddingLeft: "20px",
              }}
              style={{ filter: "drop-shadow(0px 0px 10px hsl(330, 81%, 58%))" }}

            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

export default ServicesChart

