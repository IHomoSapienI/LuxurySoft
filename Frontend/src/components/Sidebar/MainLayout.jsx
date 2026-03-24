// // "use client"

// // import { useSidebar } from "./Sidebar"
// // import { useLayoutType } from "../../hooks/useLayoutType"
// // import DashboardNavbar from "../NavBars/DashboardNavbar"
// // import Footer from "../Footer/Footer"

// // const MainLayout = ({ children }) => {
// //   const { isCollapsed } = useSidebar()
// //   const { shouldShowSidebar } = useLayoutType()

// //   // Solo mostrar este layout si debe mostrar sidebar
// //   if (!shouldShowSidebar) {
// //     return null
// //   }

// //   return (
// //     <div className="main-layout">
// //       {/* Navbar administrativo */}
// //       <DashboardNavbar />

// //       {/* Contenido principal */}
// //       <div
// //         className={`main-content transition-all duration-300 ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}
// //         style={{
// //           marginLeft: isCollapsed ? "70px" : "280px",
// //           width: isCollapsed ? "calc(100% - 70px)" : "calc(100% - 280px)",
// //           paddingTop: "64px", // Espacio para el navbar fijo
// //           minHeight: "calc(100vh - 64px)", // Altura mínima menos el navbar
// //           display: "flex",
// //           flexDirection: "column",
// //         }}
// //       >
// //         {/* Contenido de la página */}
// //         <div className="content-wrapper flex-1 p-6">{children}</div>

// //         {/* Footer administrativo */}
// //         <Footer />
// //       </div>
// //     </div>
// //   )
// // }

// // export default MainLayout


// "use client"

// import { useSidebar } from "./Sidebar"
// import { useLayoutType } from "../../hooks/useLayoutType"
// import { cn } from "../../libs/util"
// import DashboardNavbar from "../NavBars/DashboardNavbar"
// import Footer from "../Footer/Footer"

// const MainLayout = ({ children }) => {
//   const { isCollapsed } = useSidebar()
//   const { shouldShowSidebar } = useLayoutType()

//   // Solo mostrar este layout si debe mostrar sidebar
//   if (!shouldShowSidebar) {
//     return null
//   }

//   return (
//     <div className="main-layout">
//       {/* Navbar administrativo */}
//       <DashboardNavbar />

//       {/* Contenido principal - EXACTAMENTE IGUAL QUE EL NAVBAR */}
//       <main
//         className={cn(
//           "main-content fixed top-16 flex flex-col transition-all duration-300 ease-in-out",
//           "min-h-[calc(100vh-4rem)]", // 100vh - navbar height (4rem = 64px)
//           isCollapsed ? "sidebar-collapsed" : "sidebar-expanded",
//         )}
//         style={{
//           // Aplicar los mismos estilos que el navbar
//           left: isCollapsed ? "70px" : "280px",
//           width: isCollapsed ? "calc(100% - 70px)" : "calc(100% - 280px)",
//         }}
//       >
//         {/* Contenido de la página */}
//         <div className="content-wrapper flex-1 p-6 overflow-auto">{children}</div>

//         {/* Footer administrativo */}
//         <Footer />
//       </main>

//       {/* Responsive: En móvil, resetear posición */}
//       <style jsx>{`
//         @media (max-width: 768px) {
//           .main-content {
//             left: 0 !important;
//             width: 100% !important;
//           }
//         }
//       `}</style>
//     </div>
//   )
// }

// export default MainLayout


"use client"

import { useState, useEffect } from "react"
import { useSidebar } from "../Sidebar/Sidebar"
import { useLayoutType } from "../../hooks/useLayoutType"
import DashboardNavbar from "../NavBars/DashboardNavbar"
import Footer from "../Footer/Footer"
import "./mainLayout.css"

const MainLayout = ({ children }) => {
  const { isCollapsed, isSidebarOpen } = useSidebar()
  const { shouldShowSidebar } = useLayoutType()
  const [sidebarState, setSidebarState] = useState(isCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => window.innerWidth < 768
    setIsMobile(checkIsMobile())

    const handleResize = () => {
      setIsMobile(checkIsMobile())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Escuchar cambios en el estado del sidebar
  useEffect(() => {
    setSidebarState(isCollapsed)
  }, [isCollapsed])

  // Escuchar eventos del sidebar (importante para sincronización)
  useEffect(() => {
    const handleSidebarStateChanged = (event) => {
      if (event.detail && event.detail.isCollapsed !== undefined) {
        setSidebarState(event.detail.isCollapsed)
      }
    }

    window.addEventListener("sidebarStateChanged", handleSidebarStateChanged)
    return () => window.removeEventListener("sidebarStateChanged", handleSidebarStateChanged)
  }, [])

  // Solo mostrar este layout si debe mostrar sidebar
  if (!shouldShowSidebar) {
    return null
  }

  const mainContentClass = sidebarState ? "sidebar-collapsed" : "sidebar-expanded"

  return (
    <div className="main-layout">
      {/* Navbar administrativo */}
      <DashboardNavbar />

      {/* Contenido principal */}
      <div
        className={`main-content ${mainContentClass}`}
        style={{
          // Aplicar estilos inline para asegurar que se apliquen correctamente
          marginLeft: isMobile ? "0" : sidebarState ? "70px" : "280px",
          width: isMobile ? "100%" : sidebarState ? "calc(100% - 70px)" : "calc(100% - 280px)",
          paddingTop: "64px", // Espacio para el navbar fijo
        }}
      >
        {/* Contenido de la página */}
        <div className="content-wrapper">{children}</div>

        {/* Footer administrativo */}
        <Footer />
      </div>
    </div>
  )
}

export default MainLayout
