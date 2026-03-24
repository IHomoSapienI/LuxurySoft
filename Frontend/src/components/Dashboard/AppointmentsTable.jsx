"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdownMenu"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { MoreHorizontal, ArrowUpDown, ChevronDown, Sparkles } from "lucide-react"
import { Input } from "../ui/input"
import { useNavigate } from "react-router-dom"

const AppointmentsTable = () => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("fechacita")
  const [sortDirection, setSortDirection] = useState("asc")
  const navigate = useNavigate()

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

        // Filtrar citas para hoy
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const citasHoy = citas.filter((cita) => {
          const citaDate = new Date(cita.fechacita)
          return citaDate >= today && citaDate < tomorrow
        })

        // Formatear datos para la tabla
        const formattedData = citasHoy.map((cita) => ({
          id: cita._id,
          client: cita.nombrecliente?.nombrecliente || "Cliente no disponible",
          time:
            cita.horacita || new Date(cita.fechacita).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          service: cita.servicios?.map((s) => s.nombreServicio).join(", ") || "Servicio no especificado",
          employee: cita.nombreempleado?.nombreempleado || "Empleado no asignado",
          status: cita.estadocita || "Pendiente",
          rawCita: cita,
        }))

        setData(formattedData)
      } catch (error) {
        console.error("Error al obtener citas del día:", error)
        setError("No se pudieron cargar las citas del día")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Actualizar cada 5 minutos
    const intervalId = setInterval(fetchData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const filteredData = data.filter(
    (appointment) =>
      appointment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.employee.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortBy] > b[sortBy] ? 1 : -1
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1
    }
  })

  const handleRowClick = (cita) => {
    navigate("/citas", { state: { citaSeleccionada: cita.rawCita } })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar cita..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-fancy"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8 gap-1 border-fancy">
              <span>Ordenar por</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSort("time")}>Hora</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("client")}>Cliente</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("service")}>Servicio</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("employee")}>Empleado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border border-fancy">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("client")}>
                  Cliente
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("time")}>
                  Hora
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("service")}>
                  Servicio
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("employee")}>
                  Empleado
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((appointment) => (
                <TableRow
                  key={appointment.id}
                  className="group cursor-pointer"
                  onClick={() => handleRowClick(appointment)}
                >
                  <TableCell className="font-medium">{appointment.client}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {appointment.time}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      {appointment.service}
                    </div>
                  </TableCell>
                  <TableCell>{appointment.employee}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appointment.status === "Completada"
                          ? "success"
                          : appointment.status === "Cancelada"
                            ? "destructive"
                            : appointment.status === "En Progreso"
                              ? "warning"
                              : "outline"
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(appointment)
                          }}
                        >
                          Ver detalles
                        </DropdownMenuItem>
                        {appointment.status === "Pendiente" || appointment.status === "Confirmada" ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate("/citas-en-progreso")
                            }}
                          >
                            Iniciar cita
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hay citas programadas para hoy.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default AppointmentsTable

