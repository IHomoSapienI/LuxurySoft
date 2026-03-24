"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, Download } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

import DashboardStats from "./Charts/DashboardStats"
import AppointmentsChart from "./Charts/AppointmentsChart"
import SalesChart from "./Charts/SalesChart"
import ServicesChart from "./Charts/ServicesChart"
import AppointmentsTable from "./AppointmentsTable"
// import './Dashboard.css'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("charts")

  return (
    
    <div className="space-y-6">
      
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl dark:text-pink-600">¡Bienvenida de nuevo!</h2>
          <motion.div animate={{ rotate: [0, 10, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}>
            <Heart className="h-6 w-6 text-pink-600 dark:text-white" />
          </motion.div>
        </div>
        <p className="text-muted-foreground hover:text-pink-600">Aquí tienes un resumen del rendimiento de tu spa de uñas.</p>
      </motion.div>

      {/* Stats cards */}
      <DashboardStats />

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 rounded-lg bg-muted/50 p-1">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeTab === "charts" ? "bg-pink-600 text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveTab("charts")}
            >
              Gráficos
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                activeTab === "appointments" ? "bg-pink-600 text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
              onClick={() => setActiveTab("appointments")}
            >
              Citas del Día
            </button>
          </div>
          <div className="flex items-center gap-2 dark:bg-primary dark:hover:bg-pink-600">
            <Button size="sm" variant="outline" className="h-8 gap-1 border-fancy">
              <Download className="h-4 w-4 dark:text-white" />
              <span className="hidden sm:inline dark:text-white">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Charts content */}
        {activeTab === "charts" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              className="col-span-1 md:col-span-2 lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-lg card-gradient-2 hover-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 text-black dark:text-gradient-secondary">
                  <div className="flex flex-col space-y-1">
                    <CardTitle>Comportamiento de Citas</CardTitle>
                    <CardDescription>Tendencia de citas agendadas</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="rounded-lg border-fancy">
                      Datos en tiempo real
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[300px]">
                    <AppointmentsChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="overflow-hidden border-none shadow-lg card-gradient-2 hover-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 text-black dark:text-gradient-secondary">
                  <div className="flex flex-col space-y-1">
                    <CardTitle>Servicios por Empleado</CardTitle>
                    <CardDescription>Distribución de servicios realizados</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[300px]">
                    <ServicesChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="col-span-1 md:col-span-2 lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="overflow-hidden border-none shadow-lg hover-glow dark:card-gradient-1">
                <CardHeader className="flex flex-row items-center justify-between pb-3 text-black dark:text-gradient-secondary">
                  <div className="flex flex-col space-y-1">
                    <CardTitle>Ventas Mensuales</CardTitle>
                    <CardDescription>Ingresos del negocio</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="rounded-lg border-fancy">
                      Datos en tiempo real
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[300px]">
                    <SalesChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Appointments content */}
        {activeTab === "appointments" && (
          <Card className="overflow-hidden border-none shadow-lg card-gradient-1 hover-glow">
            <CardHeader>
              <CardTitle>Citas del Día</CardTitle>
              <CardDescription>Listado de citas programadas para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentsTable />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="border-fancy">
                Citas anteriores
              </Button>
              <Button className="bg-primary hover:bg-primary/90">Ver todas las citas</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Dashboard

