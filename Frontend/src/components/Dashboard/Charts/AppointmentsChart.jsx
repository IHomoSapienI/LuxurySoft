"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { motion } from "framer-motion"

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md dark:bg-foreground">
        <p className="font-medium text-black dark:text-white">{label}</p>
        <p className="text-sm text-black dark:text-white">
          <span className="font-medium text-primary dark:text-white">{payload[0].value}</span>{" "}
          {payload[0].value === 1 ? "cita" : "citas"}
        </p>
      </div>
    )
  }
  return null
}

const AppointmentsChart = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("year") // 'year', 'month', 'week'

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
        const response = await axios.get("https://gitbf.onrender.com/api/citas", { headers })
        const citas = response.data.citas || []

        // Procesar datos según el rango de tiempo seleccionado
        let processedData

        if (timeRange === "year") {
          processedData = processYearlyData(citas)
        } else if (timeRange === "month") {
          processedData = processMonthlyData(citas)
        } else {
          processedData = processWeeklyData(citas)
        }

        setData(processedData)
      } catch (error) {
        console.error("Error al obtener datos de citas:", error)
        setError("No se pudieron cargar los datos de citas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Procesar datos por año (mensualmente)
  const processYearlyData = (citas) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    // Inicializar array con todos los meses
    const monthlyData = months.map((month) => ({
      month,
      appointments: 0,
    }))

    // Contar citas por mes
    citas.forEach((cita) => {
      const date = new Date(cita.fechacita)
      const monthIndex = date.getMonth()
      monthlyData[monthIndex].appointments += 1
    })

    return monthlyData
  }

  // Procesar datos por mes (semanalmente)
  const processMonthlyData = (citas) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filtrar citas del mes actual
    const citasThisMonth = citas.filter((cita) => {
      const date = new Date(cita.fechacita)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    // Agrupar por semana del mes
    const weeklyData = [
      { week: "Semana 1", appointments: 0 },
      { week: "Semana 2", appointments: 0 },
      { week: "Semana 3", appointments: 0 },
      { week: "Semana 4", appointments: 0 },
      { week: "Semana 5", appointments: 0 },
    ]

    citasThisMonth.forEach((cita) => {
      const date = new Date(cita.fechacita)
      const dayOfMonth = date.getDate()

      // Asignar a la semana correspondiente (aproximado)
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 4)
      weeklyData[weekIndex].appointments += 1
    })

    return weeklyData
  }

  // Procesar datos por semana (diariamente)
  const processWeeklyData = (citas) => {
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
        day,
        date: date.toISOString().split("T")[0],
        appointments: 0,
      }
    })

    // Contar citas por día
    citas.forEach((cita) => {
      const citaDate = new Date(cita.fechacita)
      const citaDateStr = citaDate.toISOString().split("T")[0]

      const dayData = dailyData.find((d) => d.date === citaDateStr)
      if (dayData) {
        dayData.appointments += 1
      }
    })

    // Transformar para el gráfico
    return dailyData.map(({ day, appointments }) => ({
      month: day, // Reutilizamos el campo "month" para mantener compatibilidad
      appointments,
    }))
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

  console.log("Chart data:", data)
  if (data.length === 0 || data.every((item) => item.appointments === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">No hay citas en este período</div>
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
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === "month"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500 "
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => handleTimeRangeChange("year")}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === "year"
                ? "bg-pink-600 text-primary-foreground hover:bg-pink-500"
                
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
        className="h-[300px] w-full"
        style={{ minHeight: "300px" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 50, left: 20, bottom: 40 }} style={{ filter: "drop-shadow(0px 0px 10px hsl(330, 81%, 58%))" }}>
            <defs>
              <linearGradient id="appointmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F75EEFFF" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F40DA3FF" stopOpacity={0.2} />
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
              domain={[0, "dataMax + 5"]}
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
            <Area
              type="monotone"
              dataKey="appointments"
              name="Citas"
              
              stroke="#FC00CAFF" 
              strokeWidth={2}
              fill="url(#appointmentGradient)"
              dot={{
                stroke: "#FFFFFFFF",
                strokeWidth: 2,
                r: 4,
                fill: "white",
              }}
              activeDot={{
                stroke: "#F500C4FF",
                strokeWidth: 2,
                r: 6,
                fill: "white",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

export default AppointmentsChart

